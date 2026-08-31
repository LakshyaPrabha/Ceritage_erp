const db = require("../config/db");

// Helper to format currency/numbers safely
const num = (v, def = 0) => {
  const n = parseFloat(v);
  return isNaN(n) ? def : n;
};

// ── GET /api/purchases/kpis ──────────────────────────────────────────────────
async function getKpis(req, res) {
  const branch_id = req.user?.branch_id || 1;
  try {
    const [[poStats]] = await db.query(
      `SELECT
         COUNT(*) AS total_orders,
         COALESCE(SUM(total), 0) AS total_order_value,
         COUNT(CASE WHEN status IN ('DRAFT','Pending') THEN 1 END) AS draft_orders,
         COUNT(CASE WHEN status IN ('CONFIRMED','Confirmed') THEN 1 END) AS confirmed_orders,
         COUNT(CASE WHEN status IN ('PARTIALLY_RECEIVED','Partial') THEN 1 END) AS partial_orders,
         COUNT(CASE WHEN status IN ('RECEIVED','Received') THEN 1 END) AS completed_orders
       FROM purchase_orders
       WHERE branch_id = ?`,
      [branch_id]
    );

    const [[grnStats]] = await db.query(
      `SELECT
         COUNT(*) AS total_grns,
         COALESCE(SUM(total_amount), 0) AS total_grn_value,
         COALESCE(SUM(total_weight), 0) AS total_grn_weight
       FROM grns
       WHERE branch_id = ?`,
      [branch_id]
    );

    const [[supplierStats]] = await db.query(
      `SELECT
         COALESCE(SUM(outstanding), 0) AS total_outstanding,
         COALESCE(SUM(total_purchased), 0) AS total_purchased
       FROM suppliers
       WHERE branch_id = ?`,
      [branch_id]
    );

    res.json({
      success: true,
      data: {
        total_orders: poStats.total_orders || 0,
        total_order_value: parseFloat(poStats.total_order_value || 0),
        draft_orders: poStats.draft_orders || 0,
        confirmed_orders: poStats.confirmed_orders || 0,
        partial_orders: poStats.partial_orders || 0,
        completed_orders: poStats.completed_orders || 0,
        total_grns: grnStats.total_grns || 0,
        total_grn_value: parseFloat(grnStats.total_grn_value || 0),
        total_grn_weight: parseFloat(grnStats.total_grn_weight || 0),
        total_outstanding: parseFloat(supplierStats.total_outstanding || 0),
        total_purchased: parseFloat(supplierStats.total_purchased || 0)
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// ── GET /api/purchases/orders (List POs) ──────────────────────────────────────
async function getAll(req, res) {
  const branch_id = req.user?.branch_id || 1;
  try {
    const { supplier_id, status, search, page = 1, limit = 50 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const conditions = ["po.branch_id = ?"];
    const params = [branch_id];

    if (supplier_id) {
      conditions.push("po.supplier_id = ?");
      params.push(supplier_id);
    }
    if (status && status !== "ALL") {
      conditions.push("po.status = ?");
      params.push(status);
    }
    if (search) {
      conditions.push("(po.po_no LIKE ? OR s.company_name LIKE ? OR po.item_description LIKE ?)");
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    const whereClause = "WHERE " + conditions.join(" AND ");

    const [rows] = await db.query(
      `SELECT po.*, s.company_name AS supplier_name, s.phone AS supplier_phone, s.city AS supplier_city,
              (SELECT COUNT(*) FROM purchase_order_items poi WHERE poi.po_id = po.id) AS items_count,
              (SELECT COALESCE(SUM(ordered_qty), 0) FROM purchase_order_items poi WHERE poi.po_id = po.id) AS total_ordered_qty,
              (SELECT COALESCE(SUM(received_qty), 0) FROM purchase_order_items poi WHERE poi.po_id = po.id) AS total_received_qty
       FROM purchase_orders po
       LEFT JOIN suppliers s ON po.supplier_id = s.id
       ${whereClause}
       ORDER BY po.purchase_date DESC, po.id DESC
       LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), parseInt(offset)]
    );

    const [[{ totalCount }]] = await db.query(
      `SELECT COUNT(*) AS totalCount FROM purchase_orders po
       LEFT JOIN suppliers s ON po.supplier_id = s.id
       ${whereClause}`,
      params
    );

    res.json({
      success: true,
      data: rows,
      pagination: {
        total: totalCount,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(totalCount / parseInt(limit))
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// ── GET /api/purchases/orders/:id (PO Detail with Items) ─────────────────────
async function getById(req, res) {
  const branch_id = req.user?.branch_id || 1;
  try {
    const [rows] = await db.query(
      `SELECT po.*, s.company_name AS supplier_name, s.contact_person, s.phone AS supplier_phone,
              s.email AS supplier_email, s.gstin AS supplier_gstin, s.city AS supplier_city, s.outstanding AS supplier_outstanding
       FROM purchase_orders po
       LEFT JOIN suppliers s ON po.supplier_id = s.id
       WHERE po.id = ? AND po.branch_id = ?`,
      [req.params.id, branch_id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: "Purchase Order not found" });
    }

    const po = rows[0];

    // Fetch PO Line Items
    const [items] = await db.query(
      `SELECT poi.*, p.sku, p.name AS product_name, p.stock_qty AS current_stock
       FROM purchase_order_items poi
       LEFT JOIN products p ON poi.product_id = p.id
       WHERE poi.po_id = ?
       ORDER BY poi.id ASC`,
      [po.id]
    );

    // Fetch Linked GRNs
    const [grns] = await db.query(
      `SELECT g.*,
              (SELECT COUNT(*) FROM grn_items gi WHERE gi.grn_id = g.id) AS items_count
       FROM grns g
       WHERE g.po_id = ?
       ORDER BY g.received_date DESC`,
      [po.id]
    );

    res.json({
      success: true,
      data: {
        ...po,
        items,
        grns
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// ── POST /api/purchases/orders (Create PO with Multi-Items) ──────────────────
async function create(req, res) {
  const branch_id = req.user?.branch_id || 1;
  const created_by = req.user?.username || "Admin";
  const {
    supplier_id, purchase_date, expected_delivery, payment_mode,
    remarks, items = []
  } = req.body;

  if (!supplier_id) {
    return res.status(400).json({ success: false, message: "Supplier is required." });
  }
  if (!items || items.length === 0) {
    return res.status(400).json({ success: false, message: "At least one item is required in the Purchase Order." });
  }

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    // Verify supplier exists
    const [supRows] = await conn.query("SELECT id, company_name FROM suppliers WHERE id = ?", [supplier_id]);
    if (supRows.length === 0) {
      await conn.rollback();
      return res.status(404).json({ success: false, message: "Selected supplier does not exist." });
    }

    // Generate Unique PO Code
    const [[{ count }]] = await conn.query(
      "SELECT COUNT(*) AS count FROM purchase_orders WHERE YEAR(created_at) = YEAR(CURDATE())"
    );
    const po_no = `PO-${new Date().getFullYear()}-${String(count + 1).padStart(4, "0")}`;

    // Calculate item aggregations
    let totalQty = 0;
    let subtotal = 0;
    let totalGst = 0;

    const validatedItems = items.map((item, idx) => {
      const ordered_qty = parseInt(item.ordered_qty || item.quantity || 1);
      const weight_g = num(item.weight_g || item.weight || 0);
      const rate = num(item.rate || 0);
      const making_charge = num(item.making_charge || 0);
      const gst_pct = num(item.gst_pct, 3.0);

      // Amount = (weight * rate) or (qty * rate) + making
      const baseAmt = weight_g > 0 ? (weight_g * rate + making_charge) : (ordered_qty * rate + making_charge);
      const gstAmt = baseAmt * (gst_pct / 100);
      const itemTotal = baseAmt + gstAmt;

      totalQty += ordered_qty;
      subtotal += baseAmt;
      totalGst += gstAmt;

      return {
        product_id: item.product_id || null,
        item_name: item.item_name || item.name || `PO Item #${idx + 1}`,
        category: item.category || item.jewellery_category || "Gold Jewellery",
        purity: item.purity || "22K (916)",
        ordered_qty,
        received_qty: 0,
        weight_g,
        rate,
        making_charge,
        gst_pct,
        amount: parseFloat(itemTotal.toFixed(2))
      };
    });

    const grandTotal = parseFloat((subtotal + totalGst).toFixed(2));
    const firstItemDesc = validatedItems.map(i => `${i.item_name} (${i.ordered_qty} pcs)`).join(", ");

    // Insert Purchase Order Header
    const [poResult] = await conn.query(
      `INSERT INTO purchase_orders
         (po_no, supplier_id, branch_id, purchase_date, material_type, item_description,
          purity, weight_qty, rate, amount, gst_pct, gst_amount, subtotal, total, total_qty,
          paid_amount, payment_mode, expected_delivery, status, remarks, created_by)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        po_no, supplier_id, branch_id, purchase_date || new Date().toISOString().split("T")[0],
        validatedItems[0]?.category || "Gold",
        firstItemDesc.substring(0, 255),
        validatedItems[0]?.purity || "22K",
        validatedItems.reduce((acc, i) => acc + i.weight_g, 0),
        validatedItems[0]?.rate || 0,
        subtotal,
        3.0,
        totalGst,
        subtotal,
        grandTotal,
        totalQty,
        0.00,
        payment_mode || "Credit",
        expected_delivery || null,
        "CONFIRMED",
        remarks || null,
        created_by
      ]
    );

    const poId = poResult.insertId;

    // Insert Purchase Order Line Items
    for (const item of validatedItems) {
      await conn.query(
        `INSERT INTO purchase_order_items
           (po_id, product_id, item_name, category, purity, ordered_qty, received_qty,
            weight_g, rate, making_charge, gst_pct, amount)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
        [
          poId, item.product_id, item.item_name, item.category, item.purity,
          item.ordered_qty, 0, item.weight_g, item.rate, item.making_charge,
          item.gst_pct, item.amount
        ]
      );
    }

    await conn.commit();
    res.status(201).json({
      success: true,
      message: `Purchase Order ${po_no} created successfully.`,
      data: { id: poId, po_no, total: grandTotal, total_qty: totalQty, status: "CONFIRMED" }
    });
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ success: false, message: err.message });
  } finally {
    conn.release();
  }
}

// ── PATCH /api/purchases/orders/:id/status (Update Status) ───────────────────
async function updateStatus(req, res) {
  const branch_id = req.user?.branch_id || 1;
  const { status } = req.body;
  const allowed = ["DRAFT", "CONFIRMED", "CANCELLED"];

  if (!allowed.includes(status)) {
    return res.status(400).json({ success: false, message: `Status must be one of: ${allowed.join(", ")}` });
  }

  try {
    const [result] = await db.query(
      "UPDATE purchase_orders SET status = ? WHERE id = ? AND branch_id = ?",
      [status, req.params.id, branch_id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: "Purchase Order not found" });
    }

    res.json({ success: true, message: `PO status updated to ${status}` });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// ── GET /api/purchases/orders/:id/pending-items ──────────────────────────────
async function getPendingItems(req, res) {
  const branch_id = req.user?.branch_id || 1;
  try {
    const [poRows] = await db.query(
      "SELECT * FROM purchase_orders WHERE id = ? AND branch_id = ?",
      [req.params.id, branch_id]
    );
    if (poRows.length === 0) {
      return res.status(404).json({ success: false, message: "Purchase Order not found" });
    }

    const [items] = await db.query(
      `SELECT poi.*, (poi.ordered_qty - poi.received_qty) AS pending_qty,
              p.sku, p.name AS product_name, p.stock_qty
       FROM purchase_order_items poi
       LEFT JOIN products p ON poi.product_id = p.id
       WHERE poi.po_id = ?
       HAVING pending_qty > 0`,
      [req.params.id]
    );

    res.json({
      success: true,
      data: {
        po: poRows[0],
        pending_items: items
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// ── POST /api/purchases/grn (Receive Goods Note — ATOMIC TRANSACTION) ─────────
async function createGRN(req, res) {
  const branch_id = req.user?.branch_id || 1;
  const received_by = req.user?.username || req.body.received_by || "Admin";
  const {
    po_id, supplier_id, received_date, invoice_ref,
    condition_status = "Good", notes, items = []
  } = req.body;

  if (!items || items.length === 0) {
    return res.status(400).json({ success: false, message: "At least one received item is required to generate GRN." });
  }

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    let targetPo = null;
    let targetSupplierId = supplier_id;

    // 1. Validate PO if specified
    if (po_id) {
      const [pos] = await conn.query(
        "SELECT * FROM purchase_orders WHERE id = ? AND branch_id = ? FOR UPDATE",
        [po_id, branch_id]
      );
      if (pos.length === 0) {
        await conn.rollback();
        return res.status(404).json({ success: false, message: "Purchase Order not found." });
      }
      targetPo = pos[0];
      targetSupplierId = targetPo.supplier_id;

      if (targetPo.status === "CANCELLED" || targetPo.status === "RECEIVED") {
        await conn.rollback();
        return res.status(400).json({
          success: false,
          message: `Cannot receive items against PO in status '${targetPo.status}'.`
        });
      }
    }

    if (!targetSupplierId) {
      await conn.rollback();
      return res.status(400).json({ success: false, message: "Supplier ID is required for GRN." });
    }

    // 2. Validate Supplier
    const [supRows] = await conn.query("SELECT id, company_name, outstanding, total_purchased FROM suppliers WHERE id = ? FOR UPDATE", [targetSupplierId]);
    if (supRows.length === 0) {
      await conn.rollback();
      return res.status(404).json({ success: false, message: "Supplier not found." });
    }
    const supplier = supRows[0];

    // 3. Generate Unique GRN Identifier
    const [[{ count }]] = await conn.query(
      "SELECT COUNT(*) AS count FROM grns WHERE YEAR(created_at) = YEAR(CURDATE())"
    );
    const grn_no = `GRN-${new Date().getFullYear()}-${String(count + 1).padStart(4, "0")}`;

    // 4. Process Line Items, Quantities & Stock Calculations
    let totalGrnWeight = 0;
    let totalGrnAmount = 0;
    let totalAcceptedItems = 0;

    const processedItems = [];

    for (const item of items) {
      const received_qty = parseInt(item.received_qty || 1);
      const accepted_qty = parseInt(item.accepted_qty !== undefined ? item.accepted_qty : received_qty);
      const rejected_qty = parseInt(item.rejected_qty || (received_qty - accepted_qty));
      const weight_g = num(item.weight_g || item.weight || 0);
      const rate = num(item.rate || 0);
      const making_charge = num(item.making_charge || 0);
      const gst_pct = num(item.gst_pct, 3.0);

      if (received_qty <= 0) {
        await conn.rollback();
        return res.status(400).json({ success: false, message: "Received quantity must be greater than zero." });
      }
      if (accepted_qty < 0 || rejected_qty < 0 || (accepted_qty + rejected_qty !== received_qty)) {
        await conn.rollback();
        return res.status(400).json({
          success: false,
          message: `Accepted (${accepted_qty}) + Rejected (${rejected_qty}) must equal Received quantity (${received_qty}).`
        });
      }

      // Calculate Amount for accepted goods
      const baseAmt = weight_g > 0 ? (weight_g * rate + making_charge) : (accepted_qty * rate + making_charge);
      const gstAmt = baseAmt * (gst_pct / 100);
      const itemTotal = baseAmt + gstAmt;

      totalGrnWeight += weight_g;
      totalGrnAmount += itemTotal;
      totalAcceptedItems += accepted_qty;

      processedItems.push({
        po_item_id: item.po_item_id || null,
        product_id: item.product_id || null,
        item_name: item.item_name || item.name || "Received Jewellery Item",
        ordered_qty: parseInt(item.ordered_qty || 0),
        received_qty,
        accepted_qty,
        rejected_qty,
        weight_g,
        rate,
        amount: parseFloat(itemTotal.toFixed(2)),
        rejection_reason: item.rejection_reason || null
      });
    }

    const grandGrnTotal = parseFloat(totalGrnAmount.toFixed(2));

    // 5. Insert GRN Header
    const [grnResult] = await conn.query(
      `INSERT INTO grns
         (grn_id, grn_no, po_id, supplier_id, branch_id, received_date, invoice_ref,
          item_description, weight_qty, total_items, total_weight, total_amount,
          received_by, condition_status, status, notes)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        grn_no,
        grn_no,
        po_id || null,
        targetSupplierId,
        branch_id,
        received_date || new Date().toISOString().split("T")[0],
        invoice_ref || null,
        processedItems.map(i => `${i.item_name} (Acc: ${i.accepted_qty})`).join(", ").substring(0, 255),
        totalGrnWeight,
        totalAcceptedItems,
        totalGrnWeight,
        grandGrnTotal,
        received_by,
        condition_status,
        "VERIFIED",
        notes || null
      ]
    );

    const grnId = grnResult.insertId;

    // 6. Insert GRN Items, Update PO item quantities, and Increment Inventory Stock
    for (const item of processedItems) {
      // Insert GRN Item
      await conn.query(
        `INSERT INTO grn_items
           (grn_id, po_item_id, product_id, item_name, ordered_qty, received_qty,
            accepted_qty, rejected_qty, weight_g, rate, amount, rejection_reason)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
        [
          grnId, item.po_item_id, item.product_id, item.item_name, item.ordered_qty,
          item.received_qty, item.accepted_qty, item.rejected_qty, item.weight_g,
          item.rate, item.amount, item.rejection_reason
        ]
      );

      // Update PO Line Item received quantity if linked
      if (item.po_item_id) {
        await conn.query(
          "UPDATE purchase_order_items SET received_qty = received_qty + ? WHERE id = ?",
          [item.accepted_qty, item.po_item_id]
        );
      }

      // Increment Inventory Stock if product_id is associated
      if (item.product_id && item.accepted_qty > 0) {
        const [[prod]] = await conn.query(
          "SELECT id, stock_qty, name FROM products WHERE id = ? FOR UPDATE",
          [item.product_id]
        );

        if (prod) {
          const stockBefore = prod.stock_qty || 0;
          const stockAfter = stockBefore + item.accepted_qty;

          // Update Product Stock
          await conn.query(
            "UPDATE products SET stock_qty = ?, stock_status = 'In Stock' WHERE id = ?",
            [stockAfter, prod.id]
          );

          // Create Auditable Stock Movement Record
          await conn.query(
            `INSERT INTO stock_movements
               (product_id, branch_id, movement_type, quantity_change, stock_before, stock_after, reference_type, reference_id, notes, performed_by)
             VALUES (?,?,?,?,?,?,?,?,?,?)`,
            [
              prod.id,
              branch_id,
              "PURCHASE_GRN",
              item.accepted_qty,
              stockBefore,
              stockAfter,
              "GRN",
              grn_no,
              `Goods received from supplier: ${supplier.company_name} (GRN: ${grn_no})`,
              received_by
            ]
          );
        }
      }
    }

    // 7. Update PO Status (PARTIALLY_RECEIVED vs RECEIVED) if linked
    if (po_id) {
      const [poItems] = await conn.query(
        "SELECT SUM(ordered_qty) AS total_ordered, SUM(received_qty) AS total_received FROM purchase_order_items WHERE po_id = ?",
        [po_id]
      );
      const totalOrdered = poItems[0]?.total_ordered || 0;
      const totalReceived = poItems[0]?.total_received || 0;

      let newStatus = "PARTIALLY_RECEIVED";
      if (totalReceived >= totalOrdered && totalOrdered > 0) {
        newStatus = "RECEIVED";
      }

      await conn.query(
        "UPDATE purchase_orders SET status = ? WHERE id = ?",
        [newStatus, po_id]
      );
    }

    // 8. Post DEBIT to Supplier Ledger & Update Supplier Outstanding (Double-Entry Payable)
    if (grandGrnTotal > 0) {
      const newOutstanding = parseFloat(((supplier.outstanding || 0) + grandGrnTotal).toFixed(2));
      const newTotalPurchased = parseFloat(((supplier.total_purchased || 0) + grandGrnTotal).toFixed(2));

      // Update Supplier Balance
      await conn.query(
        "UPDATE suppliers SET outstanding = ?, total_purchased = ? WHERE id = ?",
        [newOutstanding, newTotalPurchased, targetSupplierId]
      );

      // Record Supplier Ledger Debit
      await conn.query(
        `INSERT INTO supplier_ledger
           (supplier_id, branch_id, date, po_no, item, total, debit, credit, balance, reference)
         VALUES (?,?,?,?,?,?,?,?,?,?)`,
        [
          targetSupplierId,
          branch_id,
          received_date || new Date().toISOString().split("T")[0],
          targetPo?.po_no || grn_no,
          `GRN Goods Inward: ${grn_no}${invoice_ref ? ` | Inv Ref: ${invoice_ref}` : ""}`,
          grandGrnTotal,
          grandGrnTotal,
          0.00,
          newOutstanding,
          grn_no
        ]
      );
    }

    await conn.commit();
    res.status(201).json({
      success: true,
      message: `GRN ${grn_no} recorded successfully. Inventory incremented & supplier ledger updated.`,
      data: {
        id: grnId,
        grn_no,
        total_items: totalAcceptedItems,
        total_amount: grandGrnTotal,
        status: "VERIFIED"
      }
    });
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ success: false, message: err.message });
  } finally {
    conn.release();
  }
}

// ── GET /api/purchases/grn (List GRNs) ────────────────────────────────────────
async function getGRNs(req, res) {
  const branch_id = req.user?.branch_id || 1;
  try {
    const { supplier_id, search, page = 1, limit = 50 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const conditions = ["g.branch_id = ?"];
    const params = [branch_id];

    if (supplier_id) {
      conditions.push("g.supplier_id = ?");
      params.push(supplier_id);
    }
    if (search) {
      conditions.push("(g.grn_no LIKE ? OR g.grn_id LIKE ? OR s.company_name LIKE ? OR g.invoice_ref LIKE ?)");
      params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
    }

    const whereClause = "WHERE " + conditions.join(" AND ");

    const [rows] = await db.query(
      `SELECT g.*, COALESCE(g.grn_no, g.grn_id) AS grn_display_no,
              s.company_name AS supplier_name, s.phone AS supplier_phone, s.city AS supplier_city,
              po.po_no,
              (SELECT COUNT(*) FROM grn_items gi WHERE gi.grn_id = g.id) AS items_count
       FROM grns g
       LEFT JOIN suppliers s ON g.supplier_id = s.id
       LEFT JOIN purchase_orders po ON g.po_id = po.id
       ${whereClause}
       ORDER BY g.received_date DESC, g.id DESC
       LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), parseInt(offset)]
    );

    const [[{ totalCount }]] = await db.query(
      `SELECT COUNT(*) AS totalCount FROM grns g
       LEFT JOIN suppliers s ON g.supplier_id = s.id
       ${whereClause}`,
      params
    );

    res.json({
      success: true,
      data: rows,
      pagination: {
        total: totalCount,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(totalCount / parseInt(limit))
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// ── GET /api/purchases/grn/:id (GRN Detail) ──────────────────────────────────
async function getGRNById(req, res) {
  const branch_id = req.user?.branch_id || 1;
  try {
    const [rows] = await db.query(
      `SELECT g.*, COALESCE(g.grn_no, g.grn_id) AS grn_display_no,
              s.company_name AS supplier_name, s.contact_person, s.phone AS supplier_phone,
              s.email AS supplier_email, s.gstin AS supplier_gstin, s.city AS supplier_city,
              po.po_no, po.purchase_date AS po_date
       FROM grns g
       LEFT JOIN suppliers s ON g.supplier_id = s.id
       LEFT JOIN purchase_orders po ON g.po_id = po.id
       WHERE g.id = ? AND g.branch_id = ?`,
      [req.params.id, branch_id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: "GRN not found." });
    }

    const grn = rows[0];

    const [items] = await db.query(
      `SELECT gi.*, p.sku, p.name AS product_name, p.stock_qty AS current_stock
       FROM grn_items gi
       LEFT JOIN products p ON gi.product_id = p.id
       WHERE gi.grn_id = ?
       ORDER BY gi.id ASC`,
      [grn.id]
    );

    res.json({
      success: true,
      data: {
        ...grn,
        items
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// ── GET /api/purchases/outstanding (Supplier Payables) ───────────────────────
async function getOutstanding(req, res) {
  const branch_id = req.user?.branch_id || 1;
  try {
    const [rows] = await db.query(
      `SELECT s.id AS supplier_id, s.company_name, s.contact_person, s.phone, s.city,
              s.outstanding, s.total_purchased, s.credit_limit,
              (SELECT COUNT(*) FROM purchase_orders po WHERE po.supplier_id = s.id AND po.status IN ('CONFIRMED','PARTIALLY_RECEIVED')) AS active_pos_count,
              (SELECT MAX(date) FROM supplier_ledger sl WHERE sl.supplier_id = s.id) AS last_transaction_date
       FROM suppliers s
       WHERE s.branch_id = ? AND s.outstanding > 0
       ORDER BY s.outstanding DESC`,
      [branch_id]
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// ── Old Metal Purchases (Backward Compatibility) ──────────────────────────────
async function getOldMetalPurchases(req, res) {
  try {
    const [rows] = await db.query(
      `SELECT om.*, c.full_name AS customer_name FROM old_metal_purchases om
       LEFT JOIN customers c ON om.customer_id = c.id ORDER BY om.created_at DESC`
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

async function createOldMetalPurchase(req, res) {
  const { customer_id, metal_type, gross_weight, stone_deduction, purity, rate, payment_mode } = req.body;
  try {
    const net_weight = (gross_weight || 0) - (stone_deduction || 0);
    const fine_weight = net_weight * (parseFloat(purity) || 0.9167);
    const amount_paid = fine_weight * (rate || 0);
    const [result] = await db.query(
      `INSERT INTO old_metal_purchases (customer_id, metal_type, gross_weight, stone_deduction, net_weight, purity, fine_weight, rate, amount_paid, payment_mode)
       VALUES (?,?,?,?,?,?,?,?,?,?)`,
      [customer_id || null, metal_type, gross_weight || 0, stone_deduction || 0, net_weight, purity, fine_weight, rate || 0, amount_paid, payment_mode]
    );
    res.status(201).json({ success: true, data: { id: result.insertId, amount_paid } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

module.exports = {
  getKpis,
  getAll,
  getById,
  create,
  updateStatus,
  getPendingItems,
  createGRN,
  getGRNs,
  getGRNById,
  getOutstanding,
  getOldMetalPurchases,
  createOldMetalPurchase
};

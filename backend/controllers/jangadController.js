const db = require("../config/db");
const { branchFilter } = require("../utils/branchScope");

// ── 1. GET KPIS ─────────────────────────────────────────────────────────────
// GET /api/jangad/kpis
exports.getKpis = async (req, res) => {
  try {
    const bf = branchFilter(req);

    const [[kpi]] = await db.query(`
      SELECT 
        COUNT(CASE WHEN status IN ('ACTIVE', 'PARTIALLY_RETURNED') THEN 1 END) AS active_jangads,
        COALESCE(SUM(CASE WHEN status IN ('ACTIVE', 'PARTIALLY_RETURNED') THEN total_items ELSE 0 END), 0) AS total_items_out,
        COALESCE(SUM(CASE WHEN status IN ('ACTIVE', 'PARTIALLY_RETURNED') THEN total_estimated_value ELSE 0 END), 0) AS total_value_at_risk,
        COUNT(CASE WHEN status IN ('ACTIVE', 'PARTIALLY_RETURNED') AND due_date < CURDATE() THEN 1 END) AS overdue_count
      FROM jangads
      WHERE ${bf.sql}
    `, bf.params);

    return res.json({
      success: true,
      data: {
        active_jangads: Number(kpi.active_jangads || 0),
        total_items_out: Number(kpi.total_items_out || 0),
        total_value_at_risk: Number(kpi.total_value_at_risk || 0),
        overdue_count: Number(kpi.overdue_count || 0),
      }
    });
  } catch (err) {
    console.error("jangad.getKpis error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ── 2. GET ALL JANGAD CHALLANS ──────────────────────────────────────────────
// GET /api/jangad
exports.getAll = async (req, res) => {
  try {
    const { status, search, from_date, to_date } = req.query;
    const bf = branchFilter(req, "j.branch_id");

    const conditions = [bf.sql];
    const params = [...bf.params];

    if (status && status !== "ALL") {
      if (status === "OVERDUE") {
        conditions.push("j.status IN ('ACTIVE', 'PARTIALLY_RETURNED') AND j.due_date < CURDATE()");
      } else {
        conditions.push("j.status = ?");
        params.push(status);
      }
    }

    if (search) {
      conditions.push("(j.jangad_no LIKE ? OR j.customer_name LIKE ? OR j.customer_phone LIKE ? OR j.salesperson LIKE ?)");
      const s = `%${search}%`;
      params.push(s, s, s, s);
    }

    if (from_date && to_date) {
      conditions.push("j.issue_date BETWEEN ? AND ?");
      params.push(from_date, to_date);
    }

    const whereClause = "WHERE " + conditions.join(" AND ");

    const [rows] = await db.query(`
      SELECT 
        j.*,
        CASE 
          WHEN j.status IN ('ACTIVE', 'PARTIALLY_RETURNED') AND j.due_date < CURDATE() THEN 'OVERDUE'
          ELSE j.status 
        END AS live_status,
        DATEDIFF(CURDATE(), j.issue_date) AS days_out
      FROM jangads j
      ${whereClause}
      ORDER BY j.id DESC
    `, params);

    return res.json({ success: true, data: rows });
  } catch (err) {
    console.error("jangad.getAll error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ── 3. GET JANGAD BY ID (WITH ITEMIZED JEWELRY PIECES) ──────────────────────
// GET /api/jangad/:id
exports.getById = async (req, res) => {
  try {
    const { id } = req.params;

    const [[jangad]] = await db.query("SELECT * FROM jangads WHERE id = ?", [id]);
    if (!jangad) return res.status(404).json({ success: false, message: "Jangad record not found" });

    const [items] = await db.query("SELECT * FROM jangad_items WHERE jangad_id = ? ORDER BY id ASC", [id]);

    return res.json({
      success: true,
      data: {
        ...jangad,
        items,
      }
    });
  } catch (err) {
    console.error("jangad.getById error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ── 4. CREATE / ISSUE NEW JANGAD CHALLAN (STOCK ISOLATION) ───────────────────
// POST /api/jangad
exports.create = async (req, res) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const branchId = req.user?.branch_id || 1;
    const {
      customer_id,
      customer_name,
      customer_phone,
      customer_address,
      agent_name,
      salesperson,
      issue_date,
      due_date,
      security_deposit = 0,
      deposit_mode = "None",
      notes,
      items = [],
    } = req.body;

    if (!customer_name || !customer_phone) {
      await conn.rollback();
      return res.status(400).json({ success: false, message: "Customer name and phone number are required" });
    }

    if (!items || items.length === 0) {
      await conn.rollback();
      return res.status(400).json({ success: false, message: "Please select at least one jewelry item for approval" });
    }

    // Generate unique serial Jangad Number: JNG-YYYY-XXXX
    const [[{ count }]] = await conn.query("SELECT COUNT(*) AS count FROM jangads WHERE branch_id = ?", [branchId]);
    const year = new Date().getFullYear();
    const jangadNo = `JNG-${year}-${String(count + 1).padStart(4, "0")}`;

    let totalGrossWt = 0;
    let totalNetWt = 0;
    let totalEstimatedValue = 0;

    for (const it of items) {
      totalGrossWt += Number(it.gross_weight || 0);
      totalNetWt += Number(it.net_weight || 0);
      totalEstimatedValue += Number(it.estimated_value || 0);
    }

    // 1. Insert Jangad Master Header
    const [result] = await conn.query(`
      INSERT INTO jangads (
        branch_id, jangad_no, customer_id, customer_name, customer_phone, customer_address,
        agent_name, salesperson, issue_date, due_date, total_items, total_gross_weight,
        total_net_weight, total_estimated_value, security_deposit, deposit_mode,
        status, notes, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'ACTIVE', ?, ?)
    `, [
      branchId,
      jangadNo,
      customer_id || 0,
      customer_name,
      customer_phone,
      customer_address || null,
      agent_name || null,
      salesperson || req.user?.username || "Sales Staff",
      issue_date || new Date().toISOString().split("T")[0],
      due_date || new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0],
      items.length,
      totalGrossWt,
      totalNetWt,
      totalEstimatedValue,
      Number(security_deposit) || 0,
      deposit_mode || "None",
      notes || null,
      req.user?.username || "Admin",
    ]);

    const jangadId = result.insertId;

    // 2. Insert Jangad Items & Block Products in Inventory
    for (const it of items) {
      await conn.query(`
        INSERT INTO jangad_items (
          jangad_id, product_id, barcode, huid, item_name, metal_type, purity,
          gross_weight, net_weight, diamond_carat, estimated_rate, estimated_value, item_status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'ISSUED')
      `, [
        jangadId,
        it.product_id || null,
        it.barcode || null,
        it.huid || null,
        it.item_name || "Jewellery Item",
        it.metal_type || "Gold",
        it.purity || "22K",
        Number(it.gross_weight || 0),
        Number(it.net_weight || 0),
        Number(it.diamond_carat || 0),
        Number(it.estimated_rate || 0),
        Number(it.estimated_value || 0),
      ]);

      // Isolate stock in products table so it cannot be sold at counter POS
      if (it.product_id) {
        await conn.query("UPDATE products SET status = 'On Jangad' WHERE id = ?", [it.product_id]);
      }
    }

    await conn.commit();

    return res.status(201).json({
      success: true,
      message: `Jangad Approval Challan #${jangadNo} issued successfully for ${items.length} items. Stock isolated.`,
      data: {
        id: jangadId,
        jangad_no: jangadNo,
      }
    });
  } catch (err) {
    await conn.rollback();
    console.error("jangad.create error:", err);
    return res.status(500).json({ success: false, message: err.message });
  } finally {
    conn.release();
  }
};

// ── 5. RETURN ITEMS (PARTIAL OR FULL RETURN) ────────────────────────────────
// POST /api/jangad/:id/return
exports.returnItems = async (req, res) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    const { id } = req.params;
    const { returned_item_ids = [], return_notes } = req.body;

    const [[jangad]] = await conn.query("SELECT * FROM jangads WHERE id = ?", [id]);
    if (!jangad) {
      await conn.rollback();
      return res.status(404).json({ success: false, message: "Jangad record not found" });
    }

    if (!returned_item_ids || returned_item_ids.length === 0) {
      await conn.rollback();
      return res.status(400).json({ success: false, message: "Please select at least one item to return" });
    }

    // Process return for selected item IDs
    for (const itemId of returned_item_ids) {
      const [[item]] = await conn.query("SELECT * FROM jangad_items WHERE id = ? AND jangad_id = ?", [itemId, id]);
      if (item && item.item_status === "ISSUED") {
        await conn.query(`
          UPDATE jangad_items 
          SET item_status = 'RETURNED', returned_at = NOW() 
          WHERE id = ?
        `, [itemId]);

        // Release inventory back to active showroom stock
        if (item.product_id) {
          await conn.query("UPDATE products SET status = 'Active' WHERE id = ?", [item.product_id]);
        }
      }
    }

    // Check remaining issued items
    const [[{ remainingCount }]] = await conn.query(`
      SELECT COUNT(*) AS remainingCount 
      FROM jangad_items 
      WHERE jangad_id = ? AND item_status = 'ISSUED'
    `, [id]);

    const newStatus = remainingCount === 0 ? "RETURNED" : "PARTIALLY_RETURNED";

    await conn.query(`
      UPDATE jangads 
      SET status = ?, notes = CONCAT(COALESCE(notes, ''), ' | Returned on ', CURDATE())
      WHERE id = ?
    `, [newStatus, id]);

    await conn.commit();

    return res.json({
      success: true,
      message: `${returned_item_ids.length} item(s) returned to showroom inventory. Status updated to ${newStatus}.`,
    });
  } catch (err) {
    await conn.rollback();
    console.error("jangad.returnItems error:", err);
    return res.status(500).json({ success: false, message: err.message });
  } finally {
    conn.release();
  }
};

// ── 6. 1-CLICK CONVERT TO GST TAX INVOICE ────────────────────────────────────
// POST /api/jangad/:id/convert-to-invoice
exports.convertToInvoice = async (req, res) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    const { id } = req.params;
    const { payment_mode = "UPI", selected_item_ids = [] } = req.body;
    const branchId = req.user?.branch_id || 1;

    const [[jangad]] = await conn.query("SELECT * FROM jangads WHERE id = ?", [id]);
    if (!jangad) {
      await conn.rollback();
      return res.status(404).json({ success: false, message: "Jangad record not found" });
    }

    // Fetch items to be converted into sale
    let query = "SELECT * FROM jangad_items WHERE jangad_id = ? AND item_status = 'ISSUED'";
    const params = [id];
    if (selected_item_ids && selected_item_ids.length > 0) {
      query += ` AND id IN (${selected_item_ids.map(() => "?").join(",")})`;
      params.push(...selected_item_ids);
    }

    const [itemsToSell] = await conn.query(query, params);
    if (itemsToSell.length === 0) {
      await conn.rollback();
      return res.status(400).json({ success: false, message: "No active issued items available to convert to sale" });
    }

    // Generate Invoice Number: INV-YYYY-XXXX
    const [[{ invCount }]] = await conn.query("SELECT COUNT(*) AS invCount FROM invoices WHERE branch_id = ?", [branchId]);
    const year = new Date().getFullYear();
    const invoiceNo = `INV-${year}-${String(invCount + 1).padStart(4, "0")}`;

    let subtotal = 0;
    for (const it of itemsToSell) {
      subtotal += Number(it.estimated_value || 0);
    }

    // Calculate 3% Jewellery GST (1.5% CGST + 1.5% SGST)
    const cgst = Number((subtotal * 0.015).toFixed(2));
    const sgst = Number((subtotal * 0.015).toFixed(2));
    const totalTax = cgst + sgst;
    const grossTotal = subtotal + totalTax;

    // Adjust Security Deposit
    const depositAdjusted = Math.min(Number(jangad.security_deposit || 0), grossTotal);
    const finalPayable = Math.max(0, grossTotal - depositAdjusted);

    // 1. Create Invoice in Invoices table
    const [invResult] = await conn.query(`
      INSERT INTO invoices (
        invoice_no, invoice_type, customer_id, branch_id, payment_mode,
        discount_amt, cgst, sgst, igst, grand_total, paid_amount, status, created_at
      ) VALUES (?, 'Retail Invoice', ?, ?, ?, ?, ?, ?, 0, ?, ?, 'Paid', NOW())
    `, [
      invoiceNo,
      jangad.customer_id || null,
      branchId,
      payment_mode,
      depositAdjusted,
      cgst,
      sgst,
      grossTotal,
      finalPayable,
    ]);

    const newInvoiceId = invResult.insertId;

    // 2. Insert Invoice Items & Mark Stock Sold
    for (const it of itemsToSell) {
      await conn.query(`
        INSERT INTO invoice_items (
          invoice_id, product_id, item_name, gross_weight, net_weight,
          gold_rate, making_charges, total_price
        ) VALUES (?, ?, ?, ?, ?, ?, 0, ?)
      `, [
        newInvoiceId,
        it.product_id || null,
        it.item_name,
        it.gross_weight,
        it.net_weight,
        it.estimated_rate || 0,
        it.estimated_value,
      ]);

      // Mark item SOLD in jangad_items
      await conn.query(`
        UPDATE jangad_items 
        SET item_status = 'SOLD', sold_invoice_id = ? 
        WHERE id = ?
      `, [newInvoiceId, it.id]);

      // Mark product status 'Sold' in main inventory
      if (it.product_id) {
        await conn.query("UPDATE products SET status = 'Sold' WHERE id = ?", [it.product_id]);
      }
    }

    // 3. Update Jangad Master
    const [[{ pendingCount }]] = await conn.query(`
      SELECT COUNT(*) AS pendingCount FROM jangad_items WHERE jangad_id = ? AND item_status = 'ISSUED'
    `, [id]);

    const finalJangadStatus = pendingCount === 0 ? "CONVERTED_TO_SALE" : "PARTIALLY_RETURNED";

    await conn.query(`
      UPDATE jangads 
      SET status = ?, invoice_id = ?, invoice_no = ? 
      WHERE id = ?
    `, [finalJangadStatus, newInvoiceId, invoiceNo, id]);

    await conn.commit();

    return res.json({
      success: true,
      message: `Jangad successfully converted to Official GST Invoice #${invoiceNo}! Security Deposit of ₹${depositAdjusted} adjusted.`,
      data: {
        invoice_id: newInvoiceId,
        invoice_no: invoiceNo,
        grand_total: grossTotal,
        deposit_adjusted: depositAdjusted,
        paid_amount: finalPayable,
      }
    });
  } catch (err) {
    await conn.rollback();
    console.error("jangad.convertToInvoice error:", err);
    return res.status(500).json({ success: false, message: err.message });
  } finally {
    conn.release();
  }
};

// ── 7. GET STOCK ON JANGAD (INVENTORY ISOLATION VIEW) ─────────────────────────
// GET /api/jangad/stock-isolated
exports.getStockIsolated = async (req, res) => {
  try {
    const branchId = req.user?.branch_id || 1;

    const [rows] = await db.query(`
      SELECT 
        ji.*,
        j.jangad_no,
        j.customer_name,
        j.customer_phone,
        j.salesperson,
        j.issue_date,
        j.due_date,
        DATEDIFF(CURDATE(), j.issue_date) AS days_out
      FROM jangad_items ji
      JOIN jangads j ON ji.jangad_id = j.id
      WHERE j.branch_id = ? AND ji.item_status = 'ISSUED'
      ORDER BY j.due_date ASC
    `, [branchId]);

    return res.json({ success: true, data: rows });
  } catch (err) {
    console.error("jangad.getStockIsolated error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

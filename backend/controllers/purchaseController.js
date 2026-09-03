const db = require("../config/db");
const accounting = require("../services/accountingPostingService");

// â”€â”€â”€ KPIs â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
async function getKpis(req, res) {
  try {
    const bf = branchFilter(req);
    const [[kpis]] = await db.query(
      `SELECT
         COALESCE(SUM(total),0)                              AS total_purchase_value,
         COALESCE(SUM(total - COALESCE(paid_amount,0)),0)   AS pending_payments,
         COALESCE(SUM(total),0)                             AS purchase_amount,
         COUNT(*)                                           AS total_orders
       FROM purchase_orders
       WHERE ${bf.sql}`,
      bf.params
    );
    res.json({ success: true, data: kpis });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// â”€â”€â”€ PURCHASE ORDERS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
async function getAll(req, res) {
  try {
    const { supplier_id, status, search, page = 1, limit = 50 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const bf = branchFilter(req, "po.branch_id");
    const conditions = [bf.sql];
    const params = [...bf.params];

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
      `SELECT po.*, s.company_name AS supplier_name,
              COALESCE(b.name, 'Main Showroom') AS branch_name
       FROM purchase_orders po
       LEFT JOIN suppliers s ON po.supplier_id = s.id
       LEFT JOIN branches b ON po.branch_id = b.id
       ${whereClause} ORDER BY po.purchase_date DESC, po.id DESC
       LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), parseInt(offset)]
    );
    const [[{ total }]] = await db.query(
      `SELECT COUNT(*) AS total FROM purchase_orders po ${whereClause}`, params
    );
    res.json({ success: true, data: rows, total });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// â”€â”€ GET /api/purchases/orders/:id (PO Detail with Items) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
async function getById(req, res) {
  const branch_id = req.user?.branch_id || 1;
  try {
    const [[row]] = await db.query(
      `SELECT po.*, s.company_name AS supplier_name
       FROM purchase_orders po
       LEFT JOIN suppliers s ON po.supplier_id = s.id
       WHERE po.id = ?`,
      [req.params.id]
    );
    if (!row) return res.status(404).json({ success: false, message: "PO not found" });
    res.json({ success: true, data: row });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// â”€â”€ POST /api/purchases/orders (Create PO with Multi-Items) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
async function create(req, res) {
  const branch_id = req.user?.branch_id || 1;
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const {
      supplier_id, purchase_date, material_type, item_description,
      purity, weight_qty, rate, gst_pct = 3, payment_mode,
      expected_delivery, remarks,
    } = req.body;

    const [[{ count }]] = await conn.query("SELECT COUNT(*) AS count FROM purchase_orders");
    const year = new Date().getFullYear();
    const po_no = `PO-${year}-${String(count + 1).padStart(4, "0")}`;

    const amount     = (parseFloat(weight_qty) || 0) * (parseFloat(rate) || 0);
    const gst_amount = amount * (parseFloat(gst_pct) / 100);
    const total      = amount + gst_amount;

    if (supplier_id) {
      const [supRows] = await conn.query("SELECT id, branch_id FROM suppliers WHERE id = ? FOR UPDATE", [supplier_id]);
      if (!supRows.length) {
        await conn.rollback();
        return res.status(404).json({ success: false, message: "Supplier not found" });
      }
      if (req.user.role !== "admin" && Number(supRows[0].branch_id || 1) !== Number(req.user.branch_id || 1)) {
        await conn.rollback();
        return res.status(403).json({ success: false, message: "Cannot create purchase for another branch supplier" });
      }
    }

    const [result] = await conn.query(
      `INSERT INTO purchase_orders
         (po_no, supplier_id, purchase_date, material_type, item_description,
          purity, weight_qty, rate, amount, gst_pct, gst_amount, total,
          payment_mode, expected_delivery, remarks, branch_id)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [po_no, supplier_id || null,
       purchase_date || new Date().toISOString().slice(0, 10),
       material_type, item_description, purity || null,
       weight_qty || 0, rate || 0, amount, gst_pct, gst_amount, total,
       payment_mode, expected_delivery || null, remarks || null, branch_id]
    );

    // Update supplier outstanding
    if (supplier_id) {
      await conn.query(
        "UPDATE suppliers SET outstanding = COALESCE(outstanding,0) + ? WHERE id = ?",
        [total, supplier_id]
      );
      // Insert ledger entry
      await conn.query(
        `INSERT INTO supplier_ledger (supplier_id, date, po_no, item, total, paid, balance)
         VALUES (?,?,?,?,?,0,?)`,
        [supplier_id, purchase_date || new Date().toISOString().slice(0, 10),
         po_no, item_description, total, total]
      );
    }

    await accounting.postPurchaseAccrual(conn, {
      branch_id,
      taxable_amount: amount,
      gst_amount,
      total_amount: total,
      reference_no: po_no,
      source_id: result.insertId,
      entry_date: purchase_date || new Date().toISOString().slice(0, 10),
      created_by: req.user?.full_name || req.user?.username || "Admin",
      narration: `Purchase order ${po_no}`,
    });

    await conn.commit();
    res.status(201).json({ success: true, data: { id: result.insertId, po_no } });
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ success: false, message: err.message });
  } finally {
    conn.release();
  }
}

async function updatePO(req, res) {
  try {
    const { status, paid_amount } = req.body;
    const updates = [];
    const params = [];
    if (status)      { updates.push("status = ?");      params.push(status); }
    if (paid_amount !== undefined) { updates.push("paid_amount = ?"); params.push(paid_amount); }
    if (!updates.length) return res.status(400).json({ success: false, message: "Nothing to update" });

    params.push(req.params.id);
    await db.query(`UPDATE purchase_orders SET ${updates.join(", ")} WHERE id = ?`, params);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// â”€â”€â”€ GRNs â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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
      `SELECT g.*, s.company_name AS supplier_name, po.po_no
       FROM grns g
       LEFT JOIN suppliers s ON g.supplier_id = s.id
       LEFT JOIN purchase_orders po ON g.po_id = po.id
       ${whereClause}
       ORDER BY g.received_date DESC, g.created_at DESC
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

async function createGRN(req, res) {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const { po_id, supplier_id, received_date, item_description, weight_qty, received_by, condition, notes } = req.body;

    const [[{ count }]] = await conn.query("SELECT COUNT(*) AS count FROM grns");
    const grn_id = `GRN-${new Date().getFullYear()}-${String(count + 1).padStart(4, "0")}`;

    const [result] = await conn.query(
      `INSERT INTO grns
         (grn_id, po_id, supplier_id, received_date, item_description, weight_qty, received_by, condition_status, notes)
       VALUES (?,?,?,?,?,?,?,?,?)`,
      [grn_id, po_id || null, supplier_id || null,
       received_date || new Date().toISOString().slice(0, 10),
       item_description || null, weight_qty || 0,
       received_by || null, condition || "Good", notes || null]
    );

    // Update linked PO status to Received
    if (po_id) {
      await conn.query(
        "UPDATE purchase_orders SET status = 'Received' WHERE id = ? AND status = 'Pending'",
        [po_id]
      );
    }

    await conn.commit();
    res.status(201).json({ success: true, data: { id: result.insertId, grn_id } });
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ success: false, message: err.message });
  } finally {
    conn.release();
  }
}

// â”€â”€â”€ PURCHASE RETURNS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
async function getPurchaseReturns(req, res) {
  try {
    const [rows] = await db.query(
      `SELECT pr.*, s.company_name AS supplier_name
       FROM purchase_returns pr
       LEFT JOIN suppliers s ON pr.supplier_id = s.id
       ORDER BY pr.return_date DESC, pr.created_at DESC`
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

async function createPurchaseReturn(req, res) {
  try {
    const { po_ref, supplier_id, return_date, item_description, quantity, amount, reason, refund_mode, notes } = req.body;

    const [[{ count }]] = await db.query("SELECT COUNT(*) AS count FROM purchase_returns");
    const return_no = `PRTN-${new Date().getFullYear()}-${String(count + 1).padStart(4, "0")}`;

    const [result] = await db.query(
      `INSERT INTO purchase_returns
         (return_no, po_ref, supplier_id, return_date, item_description, quantity, amount, reason, refund_mode, notes)
       VALUES (?,?,?,?,?,?,?,?,?,?)`,
      [return_no, po_ref || null, supplier_id || null,
       return_date || new Date().toISOString().slice(0, 10),
       item_description, quantity || 0, amount || 0,
       reason, refund_mode || "NEFT", notes || null]
    );

    res.status(201).json({ success: true, data: { id: result.insertId, return_no } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// â”€â”€â”€ SUPPLIER PAYMENTS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
async function getSupplierPayments(req, res) {
  try {
    const { supplier_id } = req.query;
    let where = "WHERE 1=1";
    const params = [];
    if (supplier_id) { where += " AND sp.supplier_id = ?"; params.push(supplier_id); }

    const [rows] = await db.query(
      `SELECT sp.*, s.company_name AS supplier_name
       FROM supplier_payments sp
       LEFT JOIN suppliers s ON sp.supplier_id = s.id
       ${where} ORDER BY sp.created_at DESC`,
      params
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

async function createSupplierPayment(req, res) {
  const branch_id = req.user?.branch_id || 1;
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const { supplier_id, amount, payment_mode, reference, po_ref, remark, paid_date } = req.body;

    const [[{ count }]] = await conn.query("SELECT COUNT(*) AS count FROM supplier_payments");
    const pay_id = `PAY-${new Date().getFullYear()}-${String(count + 1).padStart(4, "0")}`;

    const [result] = await conn.query(
      `INSERT INTO supplier_payments
         (branch_id, pay_id, supplier_id, amount, payment_mode, reference, po_ref, remark)
       VALUES (?,?,?,?,?,?,?,?)`,
      [branch_id,
       pay_id, supplier_id || null, amount || 0, payment_mode,
       reference || null, po_ref || null, remark || null]
    );

    const journal = await accounting.postSupplierPayment(conn, {
      branch_id,
      amount,
      payment_mode,
      reference_no: pay_id,
      source_id: result.insertId,
      entry_date: paid_date || new Date().toISOString().slice(0, 10),
      created_by: req.user?.full_name || req.user?.username || "Admin",
      narration: `Supplier payment ${pay_id}`,
    });

    // Reduce supplier outstanding
    if (supplier_id) {
      const [supRows] = await conn.query("SELECT id, branch_id FROM suppliers WHERE id = ? FOR UPDATE", [supplier_id]);
      if (!supRows.length) {
        await conn.rollback();
        return res.status(404).json({ success: false, message: "Supplier not found" });
      }
      if (req.user.role !== "admin" && Number(supRows[0].branch_id || 1) !== Number(req.user.branch_id || 1)) {
        await conn.rollback();
        return res.status(403).json({ success: false, message: "Cannot pay supplier from another branch" });
      }
      await conn.query(
        "UPDATE suppliers SET outstanding = GREATEST(0, COALESCE(outstanding,0) - ?) WHERE id = ?",
        [amount || 0, supplier_id]
      );
      // Update ledger paid/balance for this PO
      if (po_ref) {
        await conn.query(
          `UPDATE supplier_ledger
           SET paid = paid + ?, balance = GREATEST(0, balance - ?)
           WHERE supplier_id = ? AND po_no = ?`,
          [amount, amount, supplier_id, po_ref]
        );
        await conn.query(
          "UPDATE purchase_orders SET paid_amount = COALESCE(paid_amount,0) + ? WHERE po_no = ?",
          [amount, po_ref]
        );
      }
    }

    await conn.commit();
    res.status(201).json({ success: true, data: { id: result.insertId, pay_id, journal_voucher_no: journal.voucher_no } });
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ success: false, message: err.message });
  } finally {
    conn.release();
  }
}

// â”€â”€â”€ SUPPLIER LEDGER â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
async function getSupplierLedger(req, res) {
  try {
    const { supplier_id } = req.params;
    const [rows] = await db.query(
      `SELECT * FROM supplier_ledger
       WHERE supplier_id = ?
       ORDER BY date DESC, created_at DESC`,
      [supplier_id]
    );
    const [[summary]] = await db.query(
      `SELECT COALESCE(SUM(total),0) AS total_billed,
              COALESCE(SUM(paid),0) AS total_paid,
              COALESCE(SUM(balance),0) AS total_balance
       FROM supplier_ledger WHERE supplier_id = ?`,
      [supplier_id]
    );
    res.json({ success: true, data: rows, summary });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// â”€â”€â”€ OLD METAL PURCHASES â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
async function getOldMetalPurchases(req, res) {
  try {
    const [rows] = await db.query(
      `SELECT om.*, c.full_name AS customer_name
       FROM old_metal_purchases om
       LEFT JOIN customers c ON om.customer_id = c.id
       ORDER BY om.created_at DESC`
    );
    const [[kpis]] = await db.query(
      `SELECT COUNT(*) AS total_entries,
              COALESCE(SUM(CASE WHEN metal_type='Gold' THEN fine_weight END),0)   AS fine_gold,
              COALESCE(SUM(CASE WHEN metal_type='Silver' THEN fine_weight END),0) AS fine_silver,
              COALESCE(SUM(amount_paid),0) AS total_paid
       FROM old_metal_purchases`
    );
    res.json({ success: true, data: rows, kpis });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

async function createOldMetalPurchase(req, res) {
  try {
    const { customer_id, metal_type = "Gold", gross_weight, stone_deduction, purity, rate, payment_mode = "Cash" } = req.body;

    const [[{ count }]] = await db.query("SELECT COUNT(*) AS count FROM old_metal_purchases");
    const purchase_no = `OMP-${new Date().getFullYear()}-${String(count + 1).padStart(4, "0")}`;

    const net_weight  = (parseFloat(gross_weight) || 0) - (parseFloat(stone_deduction) || 0);
    const purityValue = parseFloat(purity) || 0.9167;
    const fine_weight = net_weight * purityValue;
    const rateVal     = parseFloat(rate) || 0;
    const amount_paid = fine_weight * rateVal;

    const [result] = await db.query(
      `INSERT INTO old_metal_purchases
         (purchase_no, customer_id, metal_type, gross_weight, stone_deduction, net_weight, purity, fine_weight, rate, rate_per_gram, amount_paid, total_paid, payment_mode, purchase_date)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,CURRENT_DATE)`,
      [purchase_no, customer_id || null, metal_type, gross_weight || 0, stone_deduction || 0,
       net_weight, String(purity), fine_weight, rateVal, rateVal, amount_paid, amount_paid, payment_mode]
    );

    res.status(201).json({ success: true, data: { id: result.insertId, purchase_no, amount_paid: amount_paid.toFixed(2) } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// â”€â”€â”€ SUPPLIER LIST (for dropdowns) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
async function getSuppliersList(req, res) {
  try {
    const [rows] = await db.query(
      "SELECT id, company_name, outstanding FROM suppliers WHERE status='Active' ORDER BY company_name"
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

module.exports = {
  getKpis, getAll, getById, create, updatePO,
  getGRNs, createGRN,
  getPurchaseReturns, createPurchaseReturn,
  getSupplierPayments, createSupplierPayment,
  getSupplierLedger,
  getOldMetalPurchases, createOldMetalPurchase,
  getSuppliersList,
};

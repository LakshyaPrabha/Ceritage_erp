const db = require("../config/db");

// GET /api/billing — all invoices
async function getAll(req, res) {
  const branch_id = req.user.branch_id;
  try {
    const { search, type, status, payment_mode, page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;
    let where = "WHERE i.branch_id = ?";
    const params = [branch_id];

    if (search) {
      where += " AND (i.invoice_no LIKE ? OR c.full_name LIKE ?)";
      params.push(`%${search}%`, `%${search}%`);
    }
    if (type)         { where += " AND i.invoice_type = ?";   params.push(type); }
    if (status)       { where += " AND i.status = ?";         params.push(status); }
    if (payment_mode) { where += " AND i.payment_mode = ?";   params.push(payment_mode); }

    const [rows] = await db.query(
      `SELECT i.*, c.full_name AS customer_name, c.phone AS customer_phone
       FROM invoices i
       LEFT JOIN customers c ON i.customer_id = c.id
       ${where}
       ORDER BY i.invoice_date DESC
       LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), parseInt(offset)]
    );
    const [[{ total }]] = await db.query(
      `SELECT COUNT(*) AS total FROM invoices i
       LEFT JOIN customers c ON i.customer_id = c.id ${where}`, params
    );
    res.json({ success: true, data: rows, total });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// GET /api/billing/:id — single invoice with items
async function getById(req, res) {
  try {
    const [inv] = await db.query(
      `SELECT i.*, c.full_name AS customer_name, c.phone, c.pan, c.gst_number
       FROM invoices i
       LEFT JOIN customers c ON i.customer_id = c.id
       WHERE i.id = ?`,
      [req.params.id]
    );
    if (inv.length === 0) return res.status(404).json({ success: false, message: "Invoice not found" });

    const [items] = await db.query(
      "SELECT * FROM invoice_items WHERE invoice_id = ?", [req.params.id]
    );
    res.json({ success: true, data: { ...inv[0], items } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// POST /api/billing — create invoice
async function create(req, res) {
  const {
    invoice_type, customer_id, invoice_date, salesperson_id,
    hsn_code, payment_mode, discount_pct, discount_amt,
    coupon_code, gift_voucher, old_gold_exchange,
    cgst, sgst, igst, tcs, grand_total, paid_amount,
    notes, status, items = [],
  } = req.body;

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    // Generate invoice number — unique within branch
    const [[{ count }]] = await conn.query(
      "SELECT COUNT(*) AS count FROM invoices WHERE branch_id = ? AND YEAR(invoice_date) = YEAR(NOW())",
      [req.user.branch_id]
    );
    const invoice_no = `INV-${new Date().getFullYear()}-${String(count + 1).padStart(4, "0")}`;

    const [invResult] = await conn.query(
      `INSERT INTO invoices
       (branch_id, invoice_no, invoice_type, customer_id, invoice_date, salesperson_id,
        hsn_code, payment_mode, discount_pct, discount_amt, coupon_code,
        gift_voucher, old_gold_exchange, cgst, sgst, igst, tcs,
        grand_total, paid_amount, notes, status)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [req.user.branch_id, invoice_no, invoice_type || "Retail Invoice", customer_id, invoice_date,
       salesperson_id || null, hsn_code || "7113", payment_mode,
       discount_pct || 0, discount_amt || 0, coupon_code || null,
       gift_voucher || null, old_gold_exchange || 0,
       cgst || 0, sgst || 0, igst || 0, tcs || 0,
       grand_total, paid_amount || 0, notes || null,
       status || "Paid"]
    );

    const invoiceId = invResult.insertId;

    // Insert items
    for (const item of items) {
      await conn.query(
        `INSERT INTO invoice_items
         (invoice_id, item_description, hsn_code, purity, weight_g,
          rate_per_gram, making_charges, stone_charges, gst_pct,
          discount_pct, amount)
         VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
        [invoiceId, item.description, item.hsn || "7113", item.purity || null,
         item.weight || 0, item.rate || 0, item.making || 0, item.stone || 0,
         item.gst_pct || 3, item.discount_pct || 0, item.amount]
      );

      // Update product stock
      if (item.product_id) {
        await conn.query(
          "UPDATE products SET stock_qty = stock_qty - 1 WHERE id = ? AND stock_qty > 0",
          [item.product_id]
        );
      }
    }

    // Update customer balance
    if (payment_mode === "Credit") {
      await conn.query(
        "UPDATE customers SET balance_due = balance_due + ? WHERE id = ?",
        [grand_total, customer_id]
      );
    }

    await conn.commit();
    res.status(201).json({ success: true, message: "Invoice created", data: { id: invoiceId, invoice_no } });
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ success: false, message: err.message });
  } finally {
    conn.release();
  }
}

// GET /api/billing/kpis
async function getKpis(req, res) {
  const branch_id = req.user.branch_id;
  try {
    const today = new Date().toISOString().split("T")[0];
    const [[kpis]] = await db.query(
      `SELECT
         SUM(CASE WHEN DATE(invoice_date) = ? THEN grand_total ELSE 0 END) AS today_billing,
         SUM(CASE WHEN DATE(invoice_date) = ? THEN 1 ELSE 0 END) AS bills_today,
         SUM(CASE WHEN status='Partial' OR status='Credit' THEN grand_total - COALESCE(paid_amount,0) ELSE 0 END) AS pending_payments,
         SUM(CASE WHEN invoice_type='Return Invoice' AND DATE(invoice_date) = ? THEN 1 ELSE 0 END) AS returns_today
       FROM invoices
       WHERE branch_id = ?`,
      [today, today, today, branch_id]
    );
    res.json({ success: true, data: kpis });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// Credit/Debit notes
async function getCreditDebitNotes(req, res) {
  const branch_id = req.user.branch_id;
  try {
    const [rows] = await db.query(
      `SELECT n.*, c.full_name AS customer_name FROM credit_debit_notes n
       LEFT JOIN customers c ON n.customer_id = c.id
       WHERE n.branch_id = ?
       ORDER BY n.created_at DESC`,
      [branch_id]
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

async function createCreditDebitNote(req, res) {
  const branch_id = req.user.branch_id;
  const { note_type, customer_id, against_invoice, reason, amount, description } = req.body;
  try {
    const prefix = note_type === "Credit" ? "CN" : "DN";
    const [[{ count }]] = await db.query(
      "SELECT COUNT(*) AS count FROM credit_debit_notes WHERE note_type = ? AND branch_id = ?",
      [note_type, branch_id]
    );
    const note_no = `${prefix}-${new Date().getFullYear()}-${String(count + 1).padStart(4, "0")}`;

    const [result] = await db.query(
      `INSERT INTO credit_debit_notes (branch_id, note_no, note_type, customer_id, against_invoice, reason, amount, description)
       VALUES (?,?,?,?,?,?,?,?)`,
      [branch_id, note_no, note_type, customer_id, against_invoice || null, reason, amount, description || null]
    );
    res.status(201).json({ success: true, data: { id: result.insertId, note_no } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// Returns
async function getReturns(req, res) {
  const branch_id = req.user.branch_id;
  try {
    const [rows] = await db.query(
      `SELECT r.*, c.full_name AS customer_name FROM returns r
       LEFT JOIN customers c ON r.customer_id = c.id
       WHERE r.branch_id = ?
       ORDER BY r.return_date DESC`,
      [branch_id]
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

async function createReturn(req, res) {
  const branch_id = req.user.branch_id;
  const { customer_id, invoice_ref, item_description, reason, refund_amount, refund_mode, item_condition } = req.body;
  try {
    const [[{ count }]] = await db.query(
      "SELECT COUNT(*) AS count FROM returns WHERE branch_id = ?", [branch_id]
    );
    const return_no = `RET-${new Date().getFullYear()}-${String(count + 1).padStart(4, "0")}`;

    const [result] = await db.query(
      `INSERT INTO returns (branch_id, return_no, customer_id, invoice_ref, item_description, reason, refund_amount, refund_mode, item_condition)
       VALUES (?,?,?,?,?,?,?,?,?)`,
      [branch_id, return_no, customer_id, invoice_ref || null, item_description, reason, refund_amount, refund_mode, item_condition || null]
    );
    res.status(201).json({ success: true, data: { id: result.insertId, return_no } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

module.exports = { getAll, getById, create, getKpis, getCreditDebitNotes, createCreditDebitNote, getReturns, createReturn };

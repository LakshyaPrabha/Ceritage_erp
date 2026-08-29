const db = require("../config/db");

// ── GET /api/suppliers/kpis ───────────────────────────────────────────────────
async function getKpis(req, res) {
  const branch_id = req.user.branch_id;
  try {
    const [[kpis]] = await db.query(
      `SELECT
         COUNT(*)                                              AS total,
         SUM(CASE WHEN status='Active' THEN 1 ELSE 0 END)     AS active,
         SUM(outstanding)                                      AS total_outstanding,
         SUM(total_purchased)                                  AS total_purchases
       FROM suppliers
       WHERE branch_id = ?`,
      [branch_id]
    );
    res.json({ success: true, data: kpis });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// ── GET /api/suppliers ────────────────────────────────────────────────────────
async function getAll(req, res) {
  const branch_id = req.user.branch_id;
  try {
    const { search, type } = req.query;
    const where  = ["s.branch_id = ?"];
    const params = [branch_id];

    if (search) {
      where.push("(s.company_name LIKE ? OR s.city LIKE ? OR s.phone LIKE ?)");
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    if (type) { where.push("s.supply_type = ?"); params.push(type); }

    const whereClause = "WHERE " + where.join(" AND ");

    const [rows] = await db.query(
      `SELECT * FROM suppliers ${whereClause} ORDER BY created_at DESC`,
      params
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// ── POST /api/suppliers ───────────────────────────────────────────────────────
async function create(req, res) {
  const branch_id = req.user.branch_id;
  const {
    company_name, contact_person, phone, email,
    supply_type, city, gstin, pan,
    credit_limit, bank_account, ifsc,
  } = req.body;

  if (!company_name?.trim()) {
    return res.status(400).json({ success: false, message: "Company name is required." });
  }

  try {
    // Duplicate check within branch
    const [existing] = await db.query(
      "SELECT id FROM suppliers WHERE company_name = ? AND branch_id = ?",
      [company_name.trim(), branch_id]
    );
    if (existing.length > 0) {
      return res.status(409).json({ success: false, message: "Supplier with this name already exists." });
    }

    const [result] = await db.query(
      `INSERT INTO suppliers
         (branch_id, company_name, contact_person, phone, email,
          supply_type, city, gstin, pan,
          credit_limit, bank_account, ifsc, status)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        branch_id,
        company_name.trim(),
        contact_person || null,
        phone          || null,
        email          || null,
        supply_type    || null,
        city           || null,
        gstin          || null,
        pan            || null,
        parseFloat(credit_limit) || 0,
        bank_account   || null,
        ifsc           || null,
        "Active",
      ]
    );
    res.status(201).json({ success: true, message: "Supplier created.", data: { id: result.insertId } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// ── PUT /api/suppliers/:id ────────────────────────────────────────────────────
async function update(req, res) {
  const branch_id = req.user.branch_id;
  const {
    company_name, contact_person, phone, email,
    supply_type, city, gstin, pan,
    credit_limit, bank_account, ifsc, status, rating,
  } = req.body;

  try {
    await db.query(
      `UPDATE suppliers SET
         company_name=?, contact_person=?, phone=?, email=?,
         supply_type=?, city=?, gstin=?, pan=?,
         credit_limit=?, bank_account=?, ifsc=?,
         status=?, rating=?
       WHERE id=? AND branch_id=?`,
      [
        company_name, contact_person || null, phone || null, email || null,
        supply_type || null, city || null, gstin || null, pan || null,
        parseFloat(credit_limit) || 0, bank_account || null, ifsc || null,
        status || "Active", rating || 5,
        req.params.id, branch_id,
      ]
    );
    res.json({ success: true, message: "Supplier updated." });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// ── DELETE /api/suppliers/:id ─────────────────────────────────────────────────
async function remove(req, res) {
  const branch_id = req.user.branch_id;
  try {
    const [result] = await db.query(
      "DELETE FROM suppliers WHERE id = ? AND branch_id = ?",
      [req.params.id, branch_id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: "Supplier not found." });
    }
    res.json({ success: true, message: "Supplier deleted." });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// ── GET /api/suppliers/:id/ledger ─────────────────────────────────────────────
async function getLedger(req, res) {
  try {
    const [rows] = await db.query(
      "SELECT * FROM supplier_ledger WHERE supplier_id = ? ORDER BY date ASC, created_at ASC",
      [req.params.id]
    );
    // Running balance
    let balance = 0;
    const ledger = rows.map(row => {
      balance = balance + (parseFloat(row.credit) || 0) - (parseFloat(row.debit) || 0);
      return { ...row, running_balance: parseFloat(balance.toFixed(2)) };
    });
    res.json({ success: true, data: ledger });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// ── POST /api/suppliers/payment ───────────────────────────────────────────────
async function makePayment(req, res) {
  const branch_id = req.user.branch_id;
  const { supplier_id, amount, payment_mode, reference, po_ref, remark } = req.body;

  if (!supplier_id || !amount || parseFloat(amount) <= 0) {
    return res.status(400).json({ success: false, message: "Supplier and valid amount required." });
  }

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const [[{ count }]] = await conn.query(
      "SELECT COUNT(*) AS count FROM supplier_payments WHERE branch_id = ?", [branch_id]
    );
    const pay_id = `SP${new Date().getFullYear()}${String(count + 1).padStart(4, "0")}`;

    await conn.query(
      `INSERT INTO supplier_payments
         (branch_id, pay_id, supplier_id, amount, payment_mode, reference, po_ref, remark)
       VALUES (?,?,?,?,?,?,?,?)`,
      [branch_id, pay_id, supplier_id, parseFloat(amount), payment_mode, reference || null, po_ref || null, remark || null]
    );

    // Update supplier outstanding
    await conn.query(
      "UPDATE suppliers SET outstanding = GREATEST(0, outstanding - ?) WHERE id = ? AND branch_id = ?",
      [parseFloat(amount), supplier_id, branch_id]
    );

    // Add ledger entry
    const [[supplier]] = await conn.query(
      "SELECT outstanding FROM suppliers WHERE id = ?", [supplier_id]
    );
    await conn.query(
      `INSERT INTO supplier_ledger (supplier_id, date, particulars, debit, balance)
       VALUES (?, CURDATE(), ?, ?, ?)`,
      [supplier_id, `Payment — ${payment_mode}${reference ? ` | ${reference}` : ""}`,
       parseFloat(amount), supplier?.outstanding || 0]
    );

    await conn.commit();
    res.status(201).json({ success: true, message: `Payment ${pay_id} recorded.`, data: { pay_id } });
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ success: false, message: err.message });
  } finally {
    conn.release();
  }
}

// ── GET /api/suppliers/payments ───────────────────────────────────────────────
async function getPayments(req, res) {
  const branch_id = req.user.branch_id;
  try {
    const [rows] = await db.query(
      `SELECT sp.*, s.company_name AS supplier_name
       FROM supplier_payments sp
       LEFT JOIN suppliers s ON sp.supplier_id = s.id
       WHERE sp.branch_id = ?
       ORDER BY sp.created_at DESC`,
      [branch_id]
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

module.exports = { getKpis, getAll, create, update, remove, getLedger, makePayment, getPayments };

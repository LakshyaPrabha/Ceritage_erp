const db = require("../config/db");
const { branchFilter } = require("../utils/branchScope");

let tablesReady = false;

// ── GET /api/suppliers/kpis ───────────────────────────────────────────────────
async function getKpis(req, res) {
  try {
    await ensureTables();
    const bf = branchFilter(req);
    const [[kpis]] = await db.query(`
      SELECT
        COUNT(*) AS total,
        SUM(CASE WHEN status='Active' THEN 1 ELSE 0 END) AS active,
        COALESCE(SUM(outstanding), 0) AS total_outstanding,
        COALESCE(SUM(total_purchased), 0) AS total_purchases
      FROM suppliers
      WHERE ${bf.sql}
    `, bf.params);
    return res.json({ success: true, data: kpis });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

// ── GET /api/suppliers ────────────────────────────────────────────────────────
async function getAll(req, res) {
  try {
    await ensureTables();
    const { search, type, status } = req.query;
    const bf = branchFilter(req, "s.branch_id");
    const where = [bf.sql];
    const params = [...bf.params];

    if (search) {
      where.push("(s.company_name LIKE ? OR s.city LIKE ? OR s.phone LIKE ? OR s.contact_person LIKE ?)");
      params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
    }
    if (type && type !== "All") {
      where.push("s.supply_type = ?");
      params.push(type);
    }
    if (status && status !== "ALL") {
      where.push("s.status = ?");
      params.push(status);
    }

    const whereClause = "WHERE " + where.join(" AND ");

    const [rows] = await db.query(
      `SELECT s.*
       FROM suppliers s
       ${whereClause}
       ORDER BY s.id ASC`,
      params
    );
    return res.json({ success: true, data: rows });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

// ── GET /api/suppliers/:id (Single Supplier 360) ──────────────────────────────
async function getById(req, res) {
  try {
    await ensureTables();
    const [rows] = await db.query("SELECT * FROM suppliers WHERE id = ?", [req.params.id]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: "Supplier not found." });
    }

    const supplier = rows[0];

    const [recentPayments] = await db.query(
      "SELECT * FROM supplier_payments WHERE supplier_id = ? ORDER BY payment_date DESC LIMIT 10",
      [supplier.id]
    );

    const [ledger] = await db.query(
      "SELECT * FROM supplier_ledger WHERE supplier_id = ? ORDER BY entry_date DESC LIMIT 15",
      [supplier.id]
    );

    return res.json({
      success: true,
      data: {
        ...supplier,
        recentPayments,
        ledger,
      },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

// ── POST /api/suppliers ───────────────────────────────────────────────────────
async function create(req, res) {
  try {
    await ensureTables();
    const {
      company_name, contact_person, phone, email,
      supply_type, city, gstin, pan,
      credit_limit, bank_account, ifsc,
    } = req.body;

    if (!company_name?.trim()) {
      return res.status(400).json({ success: false, message: "Company name is required." });
    }

    const [result] = await db.query(
      `INSERT INTO suppliers
         (company_name, contact_person, phone, email,
          supply_type, city, gstin, pan,
          credit_limit, bank_account, ifsc, status)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        company_name.trim(),
        contact_person || null,
        phone          || null,
        email          || null,
        supply_type    || "Gold",
        city           || null,
        gstin          || null,
        pan            || null,
        parseFloat(credit_limit) || 0,
        bank_account   || null,
        ifsc           || null,
        "Active",
      ]
    );
    return res.status(201).json({ success: true, message: `Supplier "${company_name}" registered successfully.`, data: { id: result.insertId } });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

// ── PUT /api/suppliers/:id ────────────────────────────────────────────────────
async function update(req, res) {
  try {
    await ensureTables();
    const {
      company_name, contact_person, phone, email,
      supply_type, city, gstin, pan,
      credit_limit, bank_account, ifsc, status, rating,
    } = req.body;

    await db.query(
      `UPDATE suppliers SET
         company_name=?, contact_person=?, phone=?, email=?,
         supply_type=?, city=?, gstin=?, pan=?,
         credit_limit=?, bank_account=?, ifsc=?,
         status=?, rating=?
       WHERE id=?`,
      [
        company_name, contact_person || null, phone || null, email || null,
        supply_type || "Gold", city || null, gstin || null, pan || null,
        parseFloat(credit_limit) || 0, bank_account || null, ifsc || null,
        status || "Active", rating || 5,
        req.params.id,
      ]
    );
    return res.json({ success: true, message: "Supplier details updated successfully." });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

// ── DELETE /api/suppliers/:id ─────────────────────────────────────────────────
async function remove(req, res) {
  try {
    await ensureTables();
    await db.query("UPDATE suppliers SET status='Inactive' WHERE id = ?", [req.params.id]);
    return res.json({ success: true, message: "Supplier deactivated successfully." });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

// ── POST /api/suppliers/:id/payments ──────────────────────────────────────────
async function recordPayment(req, res) {
  try {
    await ensureTables();
    const supplier_id = req.params.id;
    const { amount, payment_mode, reference_no, payment_date, notes } = req.body;

    const amt = parseFloat(amount) || 0;
    if (amt <= 0) {
      return res.status(400).json({ success: false, message: "Valid payment amount is required." });
    }

    const payDate = payment_date || new Date().toISOString().split("T")[0];

    const [result] = await db.query(
      `INSERT INTO supplier_payments (supplier_id, amount, payment_mode, reference_no, payment_date, notes)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [supplier_id, amt, payment_mode || "RTGS / Bank Transfer", reference_no || null, payDate, notes || null]
    );

    // Update supplier outstanding
    await db.query(
      "UPDATE suppliers SET outstanding = GREATEST(0, outstanding - ?) WHERE id = ?",
      [amt, supplier_id]
    );

    // Record in ledger
    await db.query(
      `INSERT INTO supplier_ledger (supplier_id, entry_date, description, ref_no, debit, credit)
       VALUES (?, ?, 'Payment Settlement', ?, ?, 0)`,
      [supplier_id, payDate, reference_no || `PAY-${result.insertId}`, amt]
    );

    return res.status(201).json({
      success: true,
      message: `Payment of ₹${amt.toLocaleString("en-IN")} recorded successfully.`,
      data: { id: result.insertId },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

// ── GET /api/suppliers/:id/ledger ─────────────────────────────────────────────
async function getLedger(req, res) {
  try {
    await ensureTables();
    const supplier_id = req.params.id;
    const [rows] = await db.query(
      "SELECT * FROM supplier_ledger WHERE supplier_id = ? ORDER BY entry_date DESC, id DESC",
      [supplier_id]
    );
    return res.json({ success: true, data: rows });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

module.exports = {
  getKpis,
  getAll,
  getById,
  create,
  update,
  remove,
  recordPayment,
  getLedger,
};

const db = require("../config/db");

// ── GET /api/suppliers/kpis ───────────────────────────────────────────────────
async function getKpis(req, res) {
  const branch_id = req.user?.branch_id || 1;
  try {
    const [[kpis]] = await db.query(
      `SELECT
         COUNT(*)                                              AS total,
         SUM(CASE WHEN status='Active' THEN 1 ELSE 0 END)     AS active,
         COALESCE(SUM(outstanding), 0)                        AS total_outstanding,
         COALESCE(SUM(total_purchased), 0)                    AS total_purchases
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
  const branch_id = req.user?.branch_id || 1;
  try {
    const { search, type, status } = req.query;
    const where  = ["s.branch_id = ?"];
    const params = [branch_id];

    if (search) {
      where.push("(s.company_name LIKE ? OR s.city LIKE ? OR s.phone LIKE ? OR s.contact_person LIKE ?)");
      params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
    }
    if (type) {
      where.push("s.supply_type = ?");
      params.push(type);
    }
    if (status && status !== "ALL") {
      where.push("s.status = ?");
      params.push(status);
    }

    const whereClause = "WHERE " + where.join(" AND ");

    const [rows] = await db.query(
      `SELECT s.*,
              (SELECT COUNT(*) FROM purchase_orders po WHERE po.supplier_id = s.id) AS po_count,
              (SELECT COUNT(*) FROM grns g WHERE g.supplier_id = s.id) AS grn_count
       FROM suppliers s
       ${whereClause}
       ORDER BY s.created_at DESC`,
      params
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// ── GET /api/suppliers/:id (Single Supplier 360) ──────────────────────────────
async function getById(req, res) {
  const branch_id = req.user?.branch_id || 1;
  try {
    const [rows] = await db.query(
      "SELECT * FROM suppliers WHERE id = ? AND branch_id = ?",
      [req.params.id, branch_id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: "Supplier not found." });
    }

    const supplier = rows[0];

    // Fetch recent POs
    const [recentPos] = await db.query(
      "SELECT * FROM purchase_orders WHERE supplier_id = ? ORDER BY purchase_date DESC LIMIT 5",
      [supplier.id]
    );

    // Fetch recent GRNs
    const [recentGrns] = await db.query(
      "SELECT * FROM grns WHERE supplier_id = ? ORDER BY received_date DESC LIMIT 5",
      [supplier.id]
    );

    // Fetch recent Payments
    const [recentPayments] = await db.query(
      "SELECT * FROM supplier_payments WHERE supplier_id = ? ORDER BY created_at DESC LIMIT 5",
      [supplier.id]
    );

    res.json({
      success: true,
      data: {
        ...supplier,
        recentPos,
        recentGrns,
        recentPayments
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// ── POST /api/suppliers ───────────────────────────────────────────────────────
async function create(req, res) {
  const branch_id = req.user?.branch_id || 1;
  const {
    company_name, contact_person, phone, email,
    supply_type, city, gstin, pan,
    credit_limit, bank_account, ifsc,
  } = req.body;

  if (!company_name?.trim()) {
    return res.status(400).json({ success: false, message: "Company name is required." });
  }

  try {
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
  const branch_id = req.user?.branch_id || 1;
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
  const branch_id = req.user?.branch_id || 1;
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
  const branch_id = req.user?.branch_id || 1;
  try {
    const [rows] = await db.query(
      `SELECT * FROM supplier_ledger
       WHERE supplier_id = ?
       ORDER BY date ASC, id ASC`,
      [req.params.id]
    );

    // Calculate chronological running balance: Balance = Total Debits (Payables) - Total Credits (Payments)
    let runningBalance = 0;
    const ledger = rows.map(row => {
      const debitAmt = parseFloat(row.debit || row.total || 0);
      const creditAmt = parseFloat(row.credit || row.paid || 0);
      runningBalance = runningBalance + debitAmt - creditAmt;

      return {
        id: row.id,
        supplier_id: row.supplier_id,
        date: row.date,
        particulars: row.particulars || (debitAmt > 0 ? `Purchase Order ${row.po_no || ""}` : "Payment"),
        po_no: row.po_no,
        debit: debitAmt,
        credit: creditAmt,
        reference: row.reference || row.po_no,
        running_balance: parseFloat(runningBalance.toFixed(2)),
        created_at: row.created_at
      };
    });

    const [[supplier]] = await db.query("SELECT outstanding, total_purchased FROM suppliers WHERE id = ?", [req.params.id]);

    res.json({
      success: true,
      data: {
        outstanding: supplier?.outstanding || 0,
        total_purchased: supplier?.total_purchased || 0,
        entries: ledger
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// ── POST /api/suppliers/payment & /api/suppliers/:id/payments ─────────────────
async function makePayment(req, res) {
  const branch_id = req.user?.branch_id || 1;
  const supplier_id = req.params.id || req.body.supplier_id;
  const { amount, payment_mode = "Cash", reference, po_ref, remark } = req.body;

  const paymentAmt = parseFloat(amount);
  if (!supplier_id || isNaN(paymentAmt) || paymentAmt <= 0) {
    return res.status(400).json({ success: false, message: "Valid supplier and positive payment amount are required." });
  }

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const [supRows] = await conn.query(
      "SELECT id, company_name, outstanding FROM suppliers WHERE id = ? FOR UPDATE",
      [supplier_id]
    );
    if (supRows.length === 0) {
      await conn.rollback();
      return res.status(404).json({ success: false, message: "Supplier not found." });
    }
    const supplier = supRows[0];

    const [[{ count }]] = await conn.query(
      "SELECT COUNT(*) AS count FROM supplier_payments WHERE branch_id = ?", [branch_id]
    );
    const pay_id = `SP${new Date().getFullYear()}${String(count + 1).padStart(4, "0")}`;

    // 1. Insert Payment Record
    await conn.query(
      `INSERT INTO supplier_payments
         (branch_id, pay_id, supplier_id, amount, payment_mode, reference, po_ref, remark)
       VALUES (?,?,?,?,?,?,?,?)`,
      [branch_id, pay_id, supplier_id, paymentAmt, payment_mode, reference || null, po_ref || null, remark || null]
    );

    // 2. Update Supplier Outstanding
    const newOutstanding = Math.max(0, parseFloat(((supplier.outstanding || 0) - paymentAmt).toFixed(2)));
    await conn.query(
      "UPDATE suppliers SET outstanding = ? WHERE id = ?",
      [newOutstanding, supplier_id]
    );

    // 3. Post CREDIT to Supplier Ledger (Reduces Payable)
    await conn.query(
      `INSERT INTO supplier_ledger
         (supplier_id, branch_id, date, po_no, item, total, paid, debit, credit, balance, reference, particulars)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        supplier_id,
        branch_id,
        new Date().toISOString().split("T")[0],
        po_ref || null,
        `Payment — ${payment_mode}${reference ? ` | Ref: ${reference}` : ""}`,
        0.00,
        paymentAmt,
        0.00,
        paymentAmt,
        newOutstanding,
        pay_id,
        `Payment — ${payment_mode}${reference ? ` | Ref: ${reference}` : ""}`
      ]
    );

    await conn.commit();
    res.status(201).json({
      success: true,
      message: `Payment of ₹${paymentAmt.toLocaleString("en-IN")} (${pay_id}) recorded for ${supplier.company_name}.`,
      data: {
        pay_id,
        supplier_id,
        paid_amount: paymentAmt,
        new_outstanding: newOutstanding
      }
    });
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ success: false, message: err.message });
  } finally {
    conn.release();
  }
}

// ── GET /api/suppliers/payments ───────────────────────────────────────────────
async function getPayments(req, res) {
  const branch_id = req.user?.branch_id || 1;
  try {
    const { supplier_id, limit = 50 } = req.query;
    let where = "WHERE sp.branch_id = ?";
    const params = [branch_id];

    if (supplier_id) {
      where += " AND sp.supplier_id = ?";
      params.push(supplier_id);
    }

    const [rows] = await db.query(
      `SELECT sp.*, s.company_name AS supplier_name, s.phone AS supplier_phone, s.city AS supplier_city
       FROM supplier_payments sp
       LEFT JOIN suppliers s ON sp.supplier_id = s.id
       ${where}
       ORDER BY sp.created_at DESC
       LIMIT ?`,
      [...params, parseInt(limit)]
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

module.exports = {
  getKpis,
  getAll,
  getById,
  create,
  update,
  remove,
  getLedger,
  makePayment,
  getPayments
};

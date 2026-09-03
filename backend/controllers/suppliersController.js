const db = require("../config/db");
const accounting = require("../services/accountingPostingService");

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
      "SELECT id, company_name, branch_id, outstanding FROM suppliers WHERE id = ? FOR UPDATE",
      [supplier_id]
    );
    if (supRows.length === 0) {
      await conn.rollback();
      return res.status(404).json({ success: false, message: "Supplier not found." });
    }
    const supplier = supRows[0];
    if (req.user.role !== "admin" && Number(supplier.branch_id || 1) !== Number(req.user.branch_id || 1)) {
      await conn.rollback();
      return res.status(403).json({ success: false, message: "Cannot pay supplier from another branch" });
    }

    const payDate = payment_date || new Date().toISOString().split("T")[0];

    // 1. Insert Payment Record
    const [paymentResult] = await conn.query(
      `INSERT INTO supplier_payments
         (branch_id, pay_id, supplier_id, amount, payment_mode, reference, po_ref, remark)
       VALUES (?,?,?,?,?,?,?,?)`,
      [branch_id, pay_id, supplier_id, paymentAmt, payment_mode, reference || null, po_ref || null, remark || null]
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

    const performedBy = req.user?.full_name || req.user?.username || "Admin";
    const journal = await accounting.postSupplierPayment(conn, {
      branch_id,
      amount: paymentAmt,
      payment_mode,
      reference_no: pay_id,
      source_id: paymentResult.insertId,
      entry_date: new Date().toISOString().slice(0, 10),
      created_by: performedBy,
      narration: `Supplier payment ${pay_id} for ${supplier.company_name}`,
    });

    await conn.commit();
    res.status(201).json({
      success: true,
      message: `Payment of ₹${paymentAmt.toLocaleString("en-IN")} (${pay_id}) recorded for ${supplier.company_name}.`,
      data: {
        pay_id,
        supplier_id,
        paid_amount: paymentAmt,
        new_outstanding: newOutstanding,
        journal_voucher_no: journal.voucher_no
      }
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

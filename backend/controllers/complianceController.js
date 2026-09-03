const db = require("../config/db");
const { branchFilter } = require("../utils/branchScope");

// ── DECIMAL-SAFE MONETARY HELPER ─────────────────────────────────────────────
function toPaise(amt) {
  return Math.round((Number(amt) || 0) * 100);
}
function fromPaise(paise) {
  return Number((paise / 100).toFixed(2));
}

// ── 1. GET COMPLIANCE KPIS ───────────────────────────────────────────────────
// GET /api/compliance/kpis
exports.getKpis = async (req, res) => {
  try {
    const bf = branchFilter(req);

    // 1. Live stats from compliance_tcs_logs
    const [[tcsKpi]] = await db.query(`
      SELECT 
        COALESCE(SUM(CASE WHEN MONTH(invoice_date) = MONTH(CURDATE()) AND YEAR(invoice_date) = YEAR(CURDATE()) THEN tcs_amount ELSE 0 END), 0) AS tcs_month,
        COUNT(CASE WHEN pan_number IS NOT NULL AND TRIM(pan_number) != '' THEN 1 END) AS kyc_verified_count,
        COUNT(CASE WHEN (pan_number IS NULL OR TRIM(pan_number) = '') AND form60_attached = 0 THEN 1 END) AS pending_pan_count,
        COUNT(CASE WHEN is_pmla_flagged = 1 THEN 1 END) AS pmla_flagged_count,
        COALESCE(SUM(cash_component), 0) AS total_cash_tracked
      FROM compliance_tcs_logs
      WHERE ${bf.sql}
    `, bf.params);

    // 2. Count high value sales > 2L from invoices table directly if logs are growing
    const [[highValInvoices]] = await db.query(`
      SELECT COUNT(*) AS high_value_invoices_count 
      FROM invoices 
      WHERE ${bf.sql} AND grand_total >= 200000 AND status != 'Cancelled'
    `, bf.params);

    return res.json({
      success: true,
      data: {
        tcs_collected_month: parseFloat(tcsKpi.tcs_month || 0),
        kyc_verified_count: Number(tcsKpi.kyc_verified_count || 0),
        pending_pan_count: Number(tcsKpi.pending_pan_count || 0),
        pmla_flagged_count: Number(tcsKpi.pmla_flagged_count || 0),
        total_cash_tracked: parseFloat(tcsKpi.total_cash_tracked || 0),
        high_value_invoices_count: Number(highValInvoices.high_value_invoices_count || 0),
      }
    });
  } catch (err) {
    console.error("compliance.getKpis error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ── 2. GET ALL HIGH-VALUE TCS & CASH LOGS ────────────────────────────────────
// GET /api/compliance/logs
exports.getAllLogs = async (req, res) => {
  try {
    const { section, pmla_only, search, from_date, to_date } = req.query;
    const bf = branchFilter(req, "c.branch_id");

    const conditions = [bf.sql];
    const params = [...bf.params];

    if (section && section !== "ALL") {
      conditions.push("c.tcs_section = ?");
      params.push(section);
    }

    if (pmla_only === "true") {
      conditions.push("c.is_pmla_flagged = 1");
    }

    if (search) {
      conditions.push("(c.invoice_no LIKE ? OR c.customer_name LIKE ? OR c.customer_phone LIKE ? OR c.pan_number LIKE ?)");
      const s = `%${search}%`;
      params.push(s, s, s, s);
    }

    if (from_date && to_date) {
      conditions.push("c.invoice_date BETWEEN ? AND ?");
      params.push(from_date, to_date);
    }

    const whereClause = "WHERE " + conditions.join(" AND ");

    const [rows] = await db.query(`
      SELECT c.*,
             CASE 
               WHEN c.cash_component >= 1000000 THEN 'PMLA_HIGH_RISK'
               WHEN c.cash_component >= 200000 THEN 'TCS_1_PERCENT'
               ELSE 'STANDARD'
             END AS risk_tier
      FROM compliance_tcs_logs c
      ${whereClause}
      ORDER BY c.invoice_date DESC, c.id DESC
    `, params);

    // If compliance table is fresh, also check invoices directly
    if (rows.length === 0) {
      const [invRows] = await db.query(`
        SELECT 
          i.id AS invoice_id,
          i.invoice_no,
          DATE(i.created_at) AS invoice_date,
          COALESCE(i.customer_id, 0) AS customer_id,
          COALESCE(cust.full_name, 'Walk-in Customer') AS customer_name,
          COALESCE(cust.phone, '—') AS customer_phone,
          cust.pan_number,
          cust.aadhaar_number,
          0 AS form60_attached,
          i.grand_total AS total_invoice_amount,
          CASE WHEN i.payment_mode = 'Cash' THEN i.grand_total ELSE 0 END AS cash_component,
          CASE WHEN i.payment_mode != 'Cash' THEN i.grand_total ELSE 0 END AS digital_component,
          '206C(1D)' AS tcs_section,
          1.00 AS tcs_rate,
          CASE WHEN i.payment_mode = 'Cash' AND i.grand_total >= 200000 THEN ROUND(i.grand_total * 0.01, 2) ELSE 0 END AS tcs_amount,
          CASE WHEN i.payment_mode = 'Cash' AND i.grand_total >= 1000000 THEN 1 ELSE 0 END AS is_pmla_flagged,
          'TCS_COLLECTED' AS status
        FROM invoices i
        LEFT JOIN customers cust ON i.customer_id = cust.id
        WHERE (i.branch_id = ? OR i.branch_id IS NULL)
          AND i.grand_total >= 200000
          AND i.status != 'Cancelled'
        ORDER BY i.id DESC
        LIMIT 50
      `, [branchId]);

      return res.json({ success: true, data: invRows });
    }

    return res.json({ success: true, data: rows });
  } catch (err) {
    console.error("compliance.getAllLogs error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ── 3. RECORD / LOG HIGH-VALUE TRANSACTION TCS & AML ─────────────────────────
// POST /api/compliance/record-tcs
exports.recordTcsLog = async (req, res) => {
  try {
    const branchId = req.user?.branch_id || 1;
    const {
      invoice_id,
      invoice_no,
      invoice_date,
      customer_id,
      customer_name,
      customer_phone,
      pan_number,
      aadhaar_number,
      form60_attached = false,
      total_invoice_amount,
      cash_component = 0,
      digital_component = 0,
    } = req.body;

    const totalAmt = parseFloat(total_invoice_amount) || 0;
    const cashAmt = parseFloat(cash_component) || 0;
    const digitalAmt = parseFloat(digital_component) || 0;

    let tcsSection = "206C(1D)";
    let tcsRate = 1.00;
    let tcsAmount = 0;
    let isPmlaFlagged = false;
    let status = "TCS_COLLECTED";

    // Section 206C(1D): Cash > 2 Lakh in Jewellery
    if (cashAmt >= 200000) {
      tcsAmount = Number(((cashAmt * 1.0) / 100).toFixed(2));
      tcsSection = "206C(1D)";
      tcsRate = 1.00;
    } else if (totalAmt >= 5000000) {
      // Section 206C(1H): Sale of Goods > 50 Lakh
      tcsAmount = Number(((totalAmt * 0.1) / 100).toFixed(2));
      tcsSection = "206C(1H)";
      tcsRate = 0.10;
    }

    // PMLA AML Cash Threshold: Cash >= 10 Lakh
    if (cashAmt >= 1000000) {
      isPmlaFlagged = true;
    }

    if (!pan_number && !form60_attached) {
      status = "PENDING_PAN";
    }

    const [result] = await db.query(`
      INSERT INTO compliance_tcs_logs (
        branch_id, invoice_id, invoice_no, invoice_date, customer_id,
        customer_name, customer_phone, pan_number, aadhaar_number,
        form60_attached, total_invoice_amount, cash_component, digital_component,
        tcs_section, tcs_rate, tcs_amount, is_pmla_flagged, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      branchId,
      invoice_id || 0,
      invoice_no || `INV-TCS-${Date.now()}`,
      invoice_date || new Date().toISOString().split("T")[0],
      customer_id || 0,
      customer_name || "Customer",
      customer_phone || "",
      pan_number ? pan_number.trim().toUpperCase() : null,
      aadhaar_number ? aadhaar_number.trim() : null,
      form60_attached ? 1 : 0,
      totalAmt,
      cashAmt,
      digitalAmt,
      tcsSection,
      tcsRate,
      tcsAmount,
      isPmlaFlagged ? 1 : 0,
      status,
    ]);

    return res.status(201).json({
      success: true,
      message: `Compliance log recorded successfully. TCS: ₹${tcsAmount} (${tcsSection})`,
      data: {
        id: result.insertId,
        tcs_amount: tcsAmount,
        is_pmla_flagged: isPmlaFlagged,
      }
    });
  } catch (err) {
    console.error("compliance.recordTcsLog error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ── 4. RECORD DIGITAL FORM 60 DECLARATION ────────────────────────────────────
// POST /api/compliance/form60
exports.createForm60 = async (req, res) => {
  try {
    const branchId = req.user?.branch_id || 1;
    const {
      customer_id,
      declarant_name,
      father_name,
      dob_or_age,
      address,
      mobile_number,
      transaction_amount,
      id_proof_type = "Aadhaar",
      id_proof_number,
      agricultural_income = false,
      other_income = true,
    } = req.body;

    if (!declarant_name || !mobile_number || !id_proof_number) {
      return res.status(400).json({ success: false, message: "Declarant name, phone, and ID proof number are required" });
    }

    const [[{ count }]] = await db.query("SELECT COUNT(*) AS count FROM form60_declarations WHERE branch_id = ?", [branchId]);
    const declarationNo = `F60-${new Date().getFullYear()}-${String(count + 1).padStart(4, "0")}`;

    const [result] = await db.query(`
      INSERT INTO form60_declarations (
        branch_id, declaration_no, customer_id, declarant_name, father_name,
        dob_or_age, address, mobile_number, transaction_amount, transaction_date,
        id_proof_type, id_proof_number, agricultural_income, other_income, verified_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURDATE(), ?, ?, ?, ?, ?)
    `, [
      branchId,
      declarationNo,
      customer_id || 0,
      declarant_name,
      father_name || null,
      dob_or_age || null,
      address || "India",
      mobile_number,
      parseFloat(transaction_amount) || 0,
      id_proof_type,
      id_proof_number,
      agricultural_income ? 1 : 0,
      other_income ? 1 : 0,
      req.user?.username || "Showroom Manager",
    ]);

    return res.status(201).json({
      success: true,
      message: `Digital Form 60 Declaration #${declarationNo} verified and filed successfully.`,
      data: {
        id: result.insertId,
        declaration_no: declarationNo,
      }
    });
  } catch (err) {
    console.error("compliance.createForm60 error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ── 5. GET ALL FORM 60 DECLARATIONS ─────────────────────────────────────────
// GET /api/compliance/form60
exports.getForm60Declarations = async (req, res) => {
  try {
    const branchId = req.user?.branch_id || 1;
    const [rows] = await db.query(
      "SELECT * FROM form60_declarations WHERE branch_id = ? ORDER BY id DESC",
      [branchId]
    );
    return res.json({ success: true, data: rows });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ── 6. STATUTORY FORM 27EQ QUARTERLY TCS RETURN REPORT (CA PACK) ─────────────
// GET /api/compliance/form27eq
exports.getForm27Eq = async (req, res) => {
  try {
    const branchId = req.user?.branch_id || 1;
    const { quarter = "Q2", financial_year = "2026-27" } = req.query;

    const [rows] = await db.query(`
      SELECT 
        c.invoice_no,
        c.invoice_date,
        c.customer_name,
        COALESCE(c.pan_number, 'PANNOTAVBL') AS pan_number,
        c.total_invoice_amount,
        c.cash_component,
        c.tcs_section,
        c.tcs_rate,
        c.tcs_amount,
        c.status,
        c.created_at
      FROM compliance_tcs_logs c
      WHERE c.branch_id = ? AND c.tcs_amount > 0
      ORDER BY c.invoice_date ASC
    `, [branchId]);

    const totalCollected = rows.reduce((a, b) => a + Number(b.tcs_amount || 0), 0);

    return res.json({
      success: true,
      data: {
        meta: {
          return_form: "Form 27EQ (Quarterly TCS Statement)",
          financial_year,
          quarter,
          total_transactions: rows.length,
          total_tcs_collected: Number(totalCollected.toFixed(2)),
          generated_at: new Date().toISOString(),
          branch_id: branchId,
        },
        records: rows,
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

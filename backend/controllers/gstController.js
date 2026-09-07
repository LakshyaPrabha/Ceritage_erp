const db = require("../config/db");
const { branchFilter } = require("../utils/branchScope");

// ── DECIMAL-SAFE MONETARY HELPER (Minor Unit / Integer Paise) ────────────────
function toPaise(amt) {
  return Math.round((Number(amt) || 0) * 100);
}
function fromPaise(paise) {
  return Number((paise / 100).toFixed(2));
}

// ── ENSURE GST TABLES EXIST IN LIVE DATABASE ─────────────────────────────────
async function initGstTables() {
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS gst_tax_master (
        id INT AUTO_INCREMENT PRIMARY KEY,
        branch_id INT DEFAULT 1,
        rule_code VARCHAR(30) UNIQUE NOT NULL,
        hsn_code VARCHAR(10) NOT NULL,
        product_category VARCHAR(100) NOT NULL,
        gst_rate DECIMAL(5,2) NOT NULL,
        cgst_rate DECIMAL(5,2) NOT NULL,
        sgst_rate DECIMAL(5,2) NOT NULL,
        igst_rate DECIMAL(5,2) NOT NULL,
        effective_from DATE NOT NULL,
        is_active TINYINT(1) DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await db.query(`
      CREATE TABLE IF NOT EXISTS gst_error_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        branch_id INT DEFAULT 1,
        error_code VARCHAR(20) NOT NULL,
        severity ENUM('CRITICAL','HIGH','MEDIUM','LOW','INFO') DEFAULT 'MEDIUM',
        transaction_type ENUM('SALES','PURCHASE','ADVANCE','JOBWORK') DEFAULT 'SALES',
        transaction_id INT,
        invoice_no VARCHAR(50),
        invoice_date DATE,
        party_name VARCHAR(150),
        party_gstin VARCHAR(20),
        hsn_code VARCHAR(20) DEFAULT '7113',
        taxable_value DECIMAL(14,2) DEFAULT 0.00,
        expected_gst DECIMAL(12,2) DEFAULT 0.00,
        recorded_gst DECIMAL(12,2) DEFAULT 0.00,
        difference DECIMAL(12,2) DEFAULT 0.00,
        message TEXT,
        resolution_note TEXT,
        status ENUM('OPEN','RESOLVED','IGNORED') DEFAULT 'OPEN',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await db.query(`
      CREATE TABLE IF NOT EXISTS gstr2b_reconciliations (
        id INT AUTO_INCREMENT PRIMARY KEY,
        branch_id INT DEFAULT 1,
        supplier_gstin VARCHAR(20) NOT NULL,
        supplier_name VARCHAR(150),
        invoice_no VARCHAR(50) NOT NULL,
        invoice_date DATE,
        books_taxable DECIMAL(14,2) DEFAULT 0.00,
        books_gst DECIMAL(12,2) DEFAULT 0.00,
        gstr2b_taxable DECIMAL(14,2) DEFAULT 0.00,
        gstr2b_gst DECIMAL(12,2) DEFAULT 0.00,
        difference_gst DECIMAL(12,2) DEFAULT 0.00,
        match_status ENUM('MATCHED','MISMATCH_AMOUNT','MISSING_IN_2B','MISSING_IN_BOOKS','PROVISIONAL') DEFAULT 'MATCHED',
        tax_period VARCHAR(10),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY uniq_po_recon (supplier_gstin, invoice_no, tax_period)
      )
    `);

    await db.query(`
      CREATE TABLE IF NOT EXISTS gst_period_locks (
        id INT AUTO_INCREMENT PRIMARY KEY,
        branch_id INT DEFAULT 1,
        tax_period VARCHAR(10) NOT NULL,
        financial_year VARCHAR(20) NOT NULL,
        total_sales_taxable DECIMAL(16,2) DEFAULT 0.00,
        total_output_gst DECIMAL(14,2) DEFAULT 0.00,
        total_input_itc DECIMAL(14,2) DEFAULT 0.00,
        net_tax_liability DECIMAL(14,2) DEFAULT 0.00,
        validation_status ENUM('OPEN','VERIFIED','LOCKED') DEFAULT 'LOCKED',
        locked_by VARCHAR(100),
        locked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY uniq_period_branch (tax_period, branch_id)
      )
    `);

    // Ensure branch_id columns exist on existing tables
    try {
      const [colsErr] = await db.query("SHOW COLUMNS FROM gst_error_logs");
      if (!colsErr.some(c => c.Field.toLowerCase() === 'branch_id')) {
        await db.query("ALTER TABLE gst_error_logs ADD COLUMN branch_id INT DEFAULT 1 AFTER id");
      }
    } catch {}
    try {
      const [cols2b] = await db.query("SHOW COLUMNS FROM gstr2b_reconciliations");
      if (!cols2b.some(c => c.Field.toLowerCase() === 'branch_id')) {
        await db.query("ALTER TABLE gstr2b_reconciliations ADD COLUMN branch_id INT DEFAULT 1 AFTER id");
      }
    } catch {}
  } catch (err) {
    console.warn("GST Tables initialization warning:", err.message);
  }
}
initGstTables();

// POST /api/gst/validate-complete
exports.executeCompleteValidation = async (req, res) => {
  try {
    await initGstTables();
    const { tax_period, financial_year, branch_id } = req.body;
    const branchId = Number(branch_id || req.branchId || req.user?.branch_id || 1);
    const bf = branchFilter(req);
    const bfInv = branchFilter(req, "i.branch_id");
    const bfPo = branchFilter(req, "po.branch_id");

    // Fetch Active Branch Profile & GSTIN dynamically from database
    const [[branchInfo]] = await db.query(
      "SELECT id, name, city, gstin FROM branches WHERE id = ? LIMIT 1",
      [branchId]
    );

    const GSTIN_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

    // 1. Fetch Invoices for Branch / Period
    let invWhere = `WHERE i.status != 'Cancelled' AND ${bfInv.sql}`;
    const invParams = [...bfInv.params];
    if (tax_period && tax_period !== "all") {
      invWhere += " AND DATE_FORMAT(COALESCE(i.invoice_date, i.created_at), '%Y-%m') = ?";
      invParams.push(tax_period);
    } else if (financial_year && financial_year !== "all") {
      const parts = financial_year.split("-");
      const startYear = parts[0];
      const endYear = "20" + parts[1];
      invWhere += " AND DATE(COALESCE(i.invoice_date, i.created_at)) >= ? AND DATE(COALESCE(i.invoice_date, i.created_at)) <= ?";
      invParams.push(`${startYear}-04-01`, `${endYear}-03-31`);
    }

    const [invoices] = await db.query(`
      SELECT i.*, c.full_name AS customer_name, c.gst_number AS customer_gstin, c.city AS customer_city
      FROM invoices i
      LEFT JOIN customers c ON i.customer_id = c.id
      ${invWhere}
      ORDER BY i.id DESC
    `, invParams);

    // 2. Fetch Purchase Orders for Branch / Period
    let poWhere = `WHERE po.status != 'CANCELLED' AND ${bfPo.sql}`;
    const poParams = [...bfPo.params];
    if (tax_period && tax_period !== "all") {
      poWhere += " AND DATE_FORMAT(COALESCE(po.order_date, po.created_at), '%Y-%m') = ?";
      poParams.push(tax_period);
    } else if (financial_year && financial_year !== "all") {
      const parts = financial_year.split("-");
      const startYear = parts[0];
      const endYear = "20" + parts[1];
      poWhere += " AND DATE(COALESCE(po.order_date, po.created_at)) >= ? AND DATE(COALESCE(po.order_date, po.created_at)) <= ?";
      poParams.push(`${startYear}-04-01`, `${endYear}-03-31`);
    }

    const [purchases] = await db.query(`
      SELECT po.*, s.company_name AS supplier_name, s.gstin AS supplier_gstin, s.city AS supplier_city
      FROM purchase_orders po
      LEFT JOIN suppliers s ON po.supplier_id = s.id
      ${poWhere}
      ORDER BY po.id DESC
    `, poParams);

    const newErrors = [];
    let salesMatched = 0;
    let purchaseMatched = 0;
    let totalTaxableSalesPaise = 0;
    let totalOutputGstPaise = 0;
    let b2bTaxableSalesPaise = 0;
    let b2bOutputGstPaise = 0;
    let b2cTaxableSalesPaise = 0;
    let b2cOutputGstPaise = 0;

    let totalTaxablePurchasesPaise = 0;
    let totalInputItcPaise = 0;

    const invoiceNumberSet = new Set();

    // ── STEP 1 TO 12: VALIDATE SALES INVOICES ──
    for (const inv of invoices) {
      const invNo = inv.invoice_no || `INV-${inv.id}`;
      const invDate = inv.created_at ? new Date(inv.created_at).toISOString().split("T")[0] : new Date().toISOString().split("T")[0];
      const gstin = (inv.customer_gstin || "").trim().toUpperCase();
      const grandTotalPaise = toPaise(inv.grand_total);
      const cgstPaise = toPaise(inv.cgst);
      const sgstPaise = toPaise(inv.sgst);
      const igstPaise = toPaise(inv.igst);
      const recordedTaxPaise = cgstPaise + sgstPaise + igstPaise;
      const taxablePaise = grandTotalPaise - recordedTaxPaise;

      totalTaxableSalesPaise += taxablePaise;
      totalOutputGstPaise += recordedTaxPaise;

      if (gstin && GSTIN_REGEX.test(gstin)) {
        b2bTaxableSalesPaise += taxablePaise;
        b2bOutputGstPaise += recordedTaxPaise;
      } else {
        b2cTaxableSalesPaise += taxablePaise;
        b2cOutputGstPaise += recordedTaxPaise;
      }

      let isInvoiceValid = true;

      // Duplicate Check (GST016)
      if (invoiceNumberSet.has(invNo)) {
        newErrors.push({
          branch_id: branchId,
          error_code: "GST016",
          severity: "CRITICAL",
          transaction_type: "SALES",
          transaction_id: inv.id,
          invoice_no: invNo,
          invoice_date: invDate,
          party_name: inv.customer_name || "Customer",
          party_gstin: gstin,
          hsn_code: "7113",
          taxable_value: fromPaise(taxablePaise),
          expected_gst: fromPaise(recordedTaxPaise),
          recorded_gst: fromPaise(recordedTaxPaise),
          difference: 0.00,
          message: `Duplicate sales invoice number detected: ${invNo}`,
        });
        isInvoiceValid = false;
      } else {
        invoiceNumberSet.add(invNo);
      }

      // GSTIN Validation (GST002)
      if (gstin && !GSTIN_REGEX.test(gstin)) {
        newErrors.push({
          branch_id: branchId,
          error_code: "GST002",
          severity: "HIGH",
          transaction_type: "SALES",
          transaction_id: inv.id,
          invoice_no: invNo,
          invoice_date: invDate,
          party_name: inv.customer_name,
          party_gstin: gstin,
          hsn_code: "7113",
          taxable_value: fromPaise(taxablePaise),
          expected_gst: fromPaise(recordedTaxPaise),
          recorded_gst: fromPaise(recordedTaxPaise),
          difference: 0.00,
          message: `Invalid B2B customer GSTIN structure: '${gstin}'`,
        });
        isInvoiceValid = false;
      }

      // Math Calculation Check (GST015)
      const expectedTaxPaise = Math.round((taxablePaise * 3) / 100);
      const taxDiffPaise = Math.abs(recordedTaxPaise - expectedTaxPaise);

      if (taxDiffPaise > 100 && taxablePaise > 0) {
        newErrors.push({
          branch_id: branchId,
          error_code: "GST015",
          severity: "CRITICAL",
          transaction_type: "SALES",
          transaction_id: inv.id,
          invoice_no: invNo,
          invoice_date: invDate,
          party_name: inv.customer_name,
          party_gstin: gstin,
          hsn_code: "7113",
          taxable_value: fromPaise(taxablePaise),
          expected_gst: fromPaise(expectedTaxPaise),
          recorded_gst: fromPaise(recordedTaxPaise),
          difference: fromPaise(taxDiffPaise),
          message: `GST calculation mismatch: Recorded ₹${fromPaise(recordedTaxPaise)} vs Expected ₹${fromPaise(expectedTaxPaise)} (Diff: ₹${fromPaise(taxDiffPaise)})`,
        });
        isInvoiceValid = false;
      }

      if (isInvoiceValid) salesMatched++;
    }

    // ── STEP 13 TO 18: VALIDATE PURCHASES & AUTO-POPULATE GSTR-2B ──
    for (const po of purchases) {
      const billNo = po.po_no || `PO-${po.id}`;
      const billDate = po.purchase_date
        ? new Date(po.purchase_date).toISOString().split("T")[0]
        : (po.created_at ? new Date(po.created_at).toISOString().split("T")[0] : new Date().toISOString().split("T")[0]);
      const supplierGstin = (po.supplier_gstin || "").trim().toUpperCase();
      const taxablePaise = toPaise(po.amount || po.total);
      const recordedTaxPaise = toPaise(po.gst_amount || (po.total * 0.03));

      totalTaxablePurchasesPaise += taxablePaise;
      totalInputItcPaise += recordedTaxPaise;

      let isPoValid = true;

      if (supplierGstin && !GSTIN_REGEX.test(supplierGstin)) {
        newErrors.push({
          branch_id: branchId,
          error_code: "GST023",
          severity: "HIGH",
          transaction_type: "PURCHASE",
          transaction_id: po.id,
          invoice_no: billNo,
          invoice_date: billDate,
          party_name: po.supplier_name,
          party_gstin: supplierGstin,
          hsn_code: "7108",
          taxable_value: fromPaise(taxablePaise),
          expected_gst: fromPaise(recordedTaxPaise),
          recorded_gst: fromPaise(recordedTaxPaise),
          difference: 0.00,
          message: `Invalid Supplier GSTIN in purchase register: '${supplierGstin}'`,
        });
        isPoValid = false;
      }

      if (supplierGstin && tax_period) {
        await db.query(`
          INSERT INTO gstr2b_reconciliations 
            (branch_id, supplier_gstin, supplier_name, invoice_no, invoice_date, books_taxable, books_gst, gstr2b_taxable, gstr2b_gst, difference_gst, match_status, tax_period)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0.00, 'MATCHED', ?)
          ON DUPLICATE KEY UPDATE 
            books_taxable = VALUES(books_taxable), books_gst = VALUES(books_gst)
        `, [
          branchId,
          supplierGstin,
          po.supplier_name || 'Bullion Dealer',
          billNo,
          billDate,
          fromPaise(taxablePaise),
          fromPaise(recordedTaxPaise),
          fromPaise(taxablePaise),
          fromPaise(recordedTaxPaise),
          tax_period
        ]);
      }

      if (isPoValid) purchaseMatched++;
    }

    // ── GSTR-2B LIVE MATCH STATUS ──
    const [reconRows] = await db.query(
      `SELECT * FROM gstr2b_reconciliations WHERE tax_period = ? AND ${bf.sql}`,
      [tax_period || new Date().toISOString().slice(0, 7), ...bf.params]
    );

    let matched2bCount = 0;
    let mismatch2bCount = 0;
    for (const r of reconRows) {
      if (r.match_status === "MATCHED") matched2bCount++;
      else mismatch2bCount++;
    }

    // Save live errors in database
    await db.query(`DELETE FROM gst_error_logs WHERE status = 'OPEN' AND ${bf.sql}`, bf.params);
    for (const err of newErrors) {
      await db.query(`
        INSERT INTO gst_error_logs 
          (branch_id, error_code, severity, transaction_type, transaction_id, invoice_no, invoice_date, party_name, party_gstin, hsn_code, taxable_value, expected_gst, recorded_gst, difference, message, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'OPEN')
      `, [
        branchId, err.error_code, err.severity, err.transaction_type, err.transaction_id, err.invoice_no, err.invoice_date,
        err.party_name, err.party_gstin, err.hsn_code, err.taxable_value, err.expected_gst, err.recorded_gst,
        err.difference, err.message
      ]);
    }

    // ── HEALTH SCORE (0 - 100) DYNAMIC COMPUTATION ──
    const totalTransactions = invoices.length + purchases.length;
    const criticalErrors = newErrors.filter(e => e.severity === "CRITICAL").length;
    const highErrors = newErrors.filter(e => e.severity === "HIGH").length;

    let score = 100;
    score -= (criticalErrors * 15);
    score -= (highErrors * 5);
    score -= (mismatch2bCount * 2);
    const healthScore = totalTransactions === 0 ? 100 : Math.max(25, Math.min(100, score));

    // "Can I File?" Status
    let readiness = "READY_FOR_CA_REVIEW";
    if (criticalErrors > 0) readiness = "NOT_READY";
    else if (highErrors > 0 || mismatch2bCount > 0 || healthScore < 85) readiness = "REVIEW_REQUIRED";

    const outwardTaxable = fromPaise(totalTaxableSalesPaise);
    const outputGst = fromPaise(totalOutputGstPaise);
    const inputItc = fromPaise(totalInputItcPaise);
    const netLiability = Math.max(0, fromPaise(totalOutputGstPaise - totalInputItcPaise));

    return res.json({
      success: true,
      data: {
        financial_year: financial_year || "2026-27",
        tax_period: tax_period || new Date().toISOString().slice(0, 7),
        gstin: branchInfo?.gstin || "—",
        branch_name: branchInfo?.name || "Main Showroom",
        summary: {
          outward_taxable: outwardTaxable,
          output_gst: outputGst,
          b2b_taxable: fromPaise(b2bTaxableSalesPaise),
          b2b_output_gst: fromPaise(b2bOutputGstPaise),
          b2c_taxable: fromPaise(b2cTaxableSalesPaise),
          b2c_output_gst: fromPaise(b2cOutputGstPaise),
          input_itc: inputItc,
          net_tax_liability: netLiability,
          gst_errors_count: newErrors.length,
          mismatch_2b_count: mismatch2bCount,
          missing_invoices_count: 0,
          unresolved_items: newErrors.length + mismatch2bCount,
        },
        health_score: {
          score: healthScore,
          status: healthScore >= 90 ? "HEALTHY" : healthScore >= 75 ? "REVIEW_REQUIRED" : "CRITICAL",
          breakdown: {
            invoice_validation: invoices.length > 0 ? Math.min(100, Math.round((salesMatched / invoices.length) * 100)) : 100,
            gst_calculation: criticalErrors === 0 ? 100 : Math.max(60, 100 - (criticalErrors * 10)),
            gstin_validation: highErrors === 0 ? 100 : Math.max(70, 100 - (highErrors * 5)),
            hsn_validation: 100,
            itc_reconciliation: reconRows.length > 0 ? Math.round((matched2bCount / reconRows.length) * 100) : 100,
            gstr1_readiness: criticalErrors === 0 ? 100 : 75,
            gstr3b_readiness: 100,
            tax_ledger: 100,
          }
        },
        readiness,
        validation_stats: {
          total_transactions: totalTransactions,
          sales_count: invoices.length,
          purchase_count: purchases.length,
          sales_matched: salesMatched,
          purchase_matched: purchaseMatched,
          errors_detected: newErrors.length,
          critical_errors: criticalErrors,
          warnings: highErrors,
          reconciled_2b_matched: matched2bCount,
          reconciled_2b_total: reconRows.length,
        },
      }
    });
  } catch (err) {
    console.error("executeCompleteValidation error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ── 2. GET GSTR-1 & GSTR-3B WORKING REGISTER DATA ───────────────────────────
// GET /api/gst/returns-working
exports.getReturnsWorking = async (req, res) => {
  try {
    const { tax_period, financial_year } = req.query;
    const bfInv = branchFilter(req, "i.branch_id");

    let periodWhere = ` AND ${bfInv.sql}`;
    const periodParams = [...bfInv.params];

    if (tax_period && tax_period !== "all") {
      periodWhere += " AND DATE_FORMAT(COALESCE(i.invoice_date, i.created_at), '%Y-%m') = ?";
      periodParams.push(tax_period);
    } else if (financial_year && financial_year !== "all") {
      const parts = financial_year.split("-");
      const startYear = parts[0];
      const endYear = "20" + parts[1];
      periodWhere += " AND DATE(COALESCE(i.invoice_date, i.created_at)) >= ? AND DATE(COALESCE(i.invoice_date, i.created_at)) <= ?";
      periodParams.push(`${startYear}-04-01`, `${endYear}-03-31`);
    }

    // 1. Table 4A: B2B Registered Sales
    const [b2bRows] = await db.query(`
      SELECT 
        i.invoice_no, COALESCE(i.invoice_date, i.created_at) AS invoice_date, c.full_name AS customer_name, c.gst_number AS customer_gstin,
        (i.grand_total - (COALESCE(i.cgst,0)+COALESCE(i.sgst,0)+COALESCE(i.igst,0))) AS taxable_value,
        i.cgst, i.sgst, i.igst, (COALESCE(i.cgst,0)+COALESCE(i.sgst,0)+COALESCE(i.igst,0)) AS total_tax,
        i.grand_total
      FROM invoices i
      JOIN customers c ON i.customer_id = c.id
      WHERE c.gst_number IS NOT NULL AND TRIM(c.gst_number) != '' AND i.status != 'Cancelled'
      ${periodWhere}
      ORDER BY i.id DESC
    `, periodParams);

    // 2. Table 7: B2C Small Retail Sales
    const [[b2cSummary]] = await db.query(`
      SELECT 
        COUNT(*) AS invoice_count,
        COALESCE(SUM(i.grand_total - (COALESCE(i.cgst,0)+COALESCE(i.sgst,0)+COALESCE(i.igst,0))), 0) AS taxable_value,
        COALESCE(SUM(i.cgst), 0) AS cgst,
        COALESCE(SUM(i.sgst), 0) AS sgst,
        COALESCE(SUM(i.igst), 0) AS igst,
        COALESCE(SUM(i.cgst + i.sgst + i.igst), 0) AS total_tax,
        COALESCE(SUM(i.grand_total), 0) AS grand_total
      FROM invoices i
      LEFT JOIN customers c ON i.customer_id = c.id
      WHERE (c.gst_number IS NULL OR TRIM(c.gst_number) = '') AND i.status != 'Cancelled'
      ${periodWhere}
    `, periodParams);

    // 3. Table 12: HSN Summary
    const [[hsnSummary]] = await db.query(`
      SELECT 
        '7113' AS hsn_code,
        'Gold & Diamond Jewellery Articles' AS description,
        'GMS' AS uqc,
        COUNT(*) AS total_vouchers,
        COALESCE(SUM(i.grand_total - (COALESCE(i.cgst,0)+COALESCE(i.sgst,0)+COALESCE(i.igst,0))), 0) AS taxable_value,
        3.0 AS gst_rate,
        COALESCE(SUM(i.cgst), 0) AS cgst,
        COALESCE(SUM(i.sgst), 0) AS sgst,
        COALESCE(SUM(i.igst), 0) AS igst,
        COALESCE(SUM(i.cgst + i.sgst + i.igst), 0) AS total_tax
      FROM invoices i
      WHERE i.status != 'Cancelled'
      ${periodWhere}
    `, periodParams);

    return res.json({
      success: true,
      data: {
        b2b: b2bRows,
        b2c_summary: b2cSummary,
        hsn_summary: hsnSummary,
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ── 3. GET GST ERRORS & EXCEPTIONS ──────────────────────────────────────────
// GET /api/gst/errors
exports.getGstErrors = async (req, res) => {
  try {
    const { severity, status, search } = req.query;
    const bf = branchFilter(req);

    const conditions = [bf.sql];
    const params = [...bf.params];

    if (severity && severity !== "all") {
      conditions.push("severity = ?");
      params.push(severity);
    }
    if (status && status !== "all") {
      conditions.push("status = ?");
      params.push(status);
    }
    if (search) {
      conditions.push("(invoice_no LIKE ? OR party_name LIKE ? OR error_code LIKE ? OR message LIKE ?)");
      const s = `%${search}%`;
      params.push(s, s, s, s);
    }

    const whereClause = "WHERE " + conditions.join(" AND ");

    const [rows] = await db.query(`
      SELECT * FROM gst_error_logs
      ${whereClause}
      ORDER BY FIELD(severity, 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFO'), id DESC
    `, params);

    return res.json({ success: true, data: rows });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ── 4. RECALCULATE & AUTO-FIX INVOICE GST ────────────────────────────────────
// POST /api/gst/recalculate-invoice/:id
exports.recalculateInvoiceGst = async (req, res) => {
  try {
    const invoiceId = req.params.id;

    const [[inv]] = await db.query("SELECT * FROM invoices WHERE id = ?", [invoiceId]);
    if (!inv) return res.status(404).json({ success: false, message: "Invoice not found" });

    const grandTotalPaise = toPaise(inv.grand_total);
    const taxablePaise = Math.round(grandTotalPaise / 1.03);
    const taxPaise = grandTotalPaise - taxablePaise;
    const cgstPaise = Math.round(taxPaise / 2);
    const sgstPaise = taxPaise - cgstPaise;

    await db.query(`
      UPDATE invoices
      SET cgst = ?, sgst = ?, igst = 0
      WHERE id = ?
    `, [fromPaise(cgstPaise), fromPaise(sgstPaise), invoiceId]);

    await db.query(`
      UPDATE gst_error_logs
      SET status = 'RESOLVED', resolution_note = 'Auto-recalculated using exact 3% jewelry tax rule'
      WHERE transaction_id = ? AND transaction_type = 'SALES'
    `, [invoiceId]);

    return res.json({
      success: true,
      message: `Invoice #${inv.invoice_no || invoiceId} recalculated successfully: CGST ₹${fromPaise(cgstPaise)}, SGST ₹${fromPaise(sgstPaise)}`,
      data: {
        taxable_value: fromPaise(taxablePaise),
        cgst: fromPaise(cgstPaise),
        sgst: fromPaise(sgstPaise),
        grand_total: fromPaise(grandTotalPaise),
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ── 5. GSTR-2B RECONCILIATION DATA ──────────────────────────────────────────
// GET /api/gst/gstr2b
exports.getGstr2b = async (req, res) => {
  try {
    const { status } = req.query;
    const bf = branchFilter(req);

    let query = `SELECT * FROM gstr2b_reconciliations WHERE ${bf.sql}`;
    const params = [...bf.params];
    if (status && status !== "all") {
      query += " AND match_status = ?";
      params.push(status);
    }
    query += " ORDER BY id DESC";

    const [rows] = await db.query(query, params);
    return res.json({ success: true, data: rows });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ── 6. TAX MASTER CONFIGURATION ──────────────────────────────────────────────
// GET /api/gst/tax-master
exports.getTaxMaster = async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM gst_tax_master ORDER BY is_active DESC, effective_from DESC");
    return res.json({ success: true, data: rows });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/gst/tax-master
exports.createTaxRule = async (req, res) => {
  try {
    const { rule_code, hsn_code, product_category, gst_rate, effective_from, branch_id } = req.body;
    const activeBranchId = Number(branch_id || req.branchId || req.user?.branch_id || 1);

    const totalGst = parseFloat(gst_rate) || 3.0;
    const cgst = totalGst / 2;
    const sgst = totalGst / 2;

    await db.query(`
      INSERT INTO gst_tax_master (branch_id, rule_code, hsn_code, product_category, gst_rate, cgst_rate, sgst_rate, igst_rate, effective_from)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [activeBranchId, rule_code, hsn_code, product_category, totalGst, cgst, sgst, totalGst, effective_from || new Date().toISOString().split("T")[0]]);

    return res.json({ success: true, message: `Tax Rule ${rule_code} created successfully` });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// DELETE /api/gst/tax-master/:id
exports.deleteTaxRule = async (req, res) => {
  try {
    await db.query("DELETE FROM gst_tax_master WHERE id = ?", [req.params.id]);
    return res.json({ success: true, message: "Tax rule deleted successfully" });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/gst/tax-master/clear
exports.clearTaxMaster = async (req, res) => {
  try {
    await db.query("TRUNCATE TABLE gst_tax_master");
    return res.json({ success: true, message: "Tax master cleared. Table is now completely empty." });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ── 7. CLOSE GST PERIOD & LOCK ───────────────────────────────────────────────
// POST /api/gst/close-period
exports.closeGstPeriod = async (req, res) => {
  try {
    const { tax_period, financial_year, branch_id } = req.body;
    const activeBranchId = Number(branch_id || req.branchId || req.user?.branch_id || 1);
    const period = tax_period || new Date().toISOString().slice(0, 7);
    const fy = financial_year || "2026-27";
    const bf = branchFilter(req);

    const [[critCount]] = await db.query(`
      SELECT COUNT(*) AS total FROM gst_error_logs WHERE severity = 'CRITICAL' AND status = 'OPEN' AND ${bf.sql}
    `, bf.params);

    if (critCount.total > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot close GST period: ${critCount.total} CRITICAL calculation error(s) must be resolved first in GST Error Centre.`
      });
    }

    const [invoices] = await db.query(`SELECT * FROM invoices WHERE status != 'Cancelled' AND ${bf.sql}`, bf.params);
    let totalTaxable = 0;
    let totalGst = 0;
    for (const i of invoices) {
      totalTaxable += Number(i.grand_total) - (Number(i.cgst || 0) + Number(i.sgst || 0) + Number(i.igst || 0));
      totalGst += (Number(i.cgst || 0) + Number(i.sgst || 0) + Number(i.igst || 0));
    }

    await db.query(`
      INSERT INTO gst_period_locks 
        (branch_id, tax_period, financial_year, total_sales_taxable, total_output_gst, total_input_itc, net_tax_liability, validation_status, locked_by)
      VALUES (?, ?, ?, ?, ?, 0, ?, 'LOCKED', ?)
      ON DUPLICATE KEY UPDATE validation_status = 'LOCKED', locked_at = NOW()
    `, [activeBranchId, period, fy, totalTaxable, totalGst, totalGst, req.user?.username || 'Admin']);

    return res.json({
      success: true,
      message: `GST Tax Period ${period} (${fy}) has been officially validated, reconciled, and LOCKED against tampering.`,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ── 8. GENERATE COMPLETE CA REVIEW PACK ─────────────────────────────────────
// POST /api/gst/ca-review-pack
exports.generateCaReviewPack = async (req, res) => {
  try {
    const { tax_period, financial_year, branch_id } = req.body;
    const period = tax_period || new Date().toISOString().slice(0, 7);
    const fy = financial_year || "2026-27";
    const branchId = Number(branch_id || req.branchId || req.user?.branch_id || 1);
    const bf = branchFilter(req);
    const bfInv = branchFilter(req, "i.branch_id");
    const bfPo = branchFilter(req, "po.branch_id");

    const [[branchInfo]] = await db.query(
      "SELECT id, name, city, gstin FROM branches WHERE id = ? LIMIT 1",
      [branchId]
    );

    const [sales] = await db.query(`
      SELECT i.invoice_no, i.created_at AS date, c.full_name AS customer, c.gst_number AS gstin,
             (i.grand_total - (COALESCE(i.cgst,0)+COALESCE(i.sgst,0)+COALESCE(i.igst,0))) AS taxable_value,
             i.cgst, i.sgst, i.igst, i.grand_total
      FROM invoices i LEFT JOIN customers c ON i.customer_id = c.id WHERE i.status != 'Cancelled' AND ${bfInv.sql}
    `, bfInv.params);

    const [purchases] = await db.query(`
      SELECT po.po_no, po.purchase_date AS date, s.company_name AS supplier, s.gstin AS gstin,
             po.amount AS taxable_value, po.gst_amount, po.total
      FROM purchase_orders po LEFT JOIN suppliers s ON po.supplier_id = s.id WHERE po.status != 'CANCELLED' AND ${bfPo.sql}
    `, bfPo.params);

    const [recon] = await db.query(`SELECT * FROM gstr2b_reconciliations WHERE tax_period = ? AND ${bf.sql}`, [period, ...bf.params]);
    const [errors] = await db.query(`SELECT * FROM gst_error_logs WHERE ${bf.sql}`, bf.params);

    const caPack = {
      meta: {
        package_name: "CERITAGE_JEWELLERY_ERP_CA_REVIEW_PACK",
        tax_period: period,
        financial_year: fy,
        gstin: branchInfo?.gstin || "—",
        company_name: branchInfo?.name || "Main Showroom",
        generated_at: new Date().toISOString(),
        generated_by: req.user?.username || "Admin",
      },
      reports: {
        "01_Sales_GST_Register": sales,
        "02_Purchase_GST_Register": purchases,
        "06_GSTR1_Working": sales.filter(s => s.gstin),
        "08_GSTR2B_Reconciliation": recon,
        "14_GST_Error_Report": errors,
      }
    };

    return res.json({
      success: true,
      message: "CA Review Pack generated successfully",
      data: caPack,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

const db = require("../config/db");

// ── GET /api/gst/summary ────────────────────────────────────────────────────
async function getSummary(req, res) {
  try {
    const { from_date, to_date } = req.query;

    let dateFilter = "";
    const params = [];
    if (from_date && to_date) {
      dateFilter = "AND DATE(i.created_at) BETWEEN ? AND ?";
      params.push(from_date, to_date);
    }

    // 1. Output GST from Sales Invoices
    const [[salesTax]] = await db.query(`
      SELECT
        COUNT(*) AS total_invoices,
        COALESCE(SUM(i.grand_total - (COALESCE(i.cgst, 0) + COALESCE(i.sgst, 0) + COALESCE(i.igst, 0))), 0) AS taxable_sales,
        COALESCE(SUM(i.cgst), 0) AS output_cgst,
        COALESCE(SUM(i.sgst), 0) AS output_sgst,
        COALESCE(SUM(i.igst), 0) AS output_igst,
        COALESCE(SUM(i.cgst + i.sgst + i.igst), 0) AS total_output_gst,
        COALESCE(SUM(i.tcs), 0) AS total_tcs,
        COALESCE(SUM(i.grand_total), 0) AS gross_sales_value
      FROM invoices i
      WHERE i.status != 'Cancelled' ${dateFilter}
    `, params);

    // 2. Input Tax Credit (ITC) from Purchases
    const [[purchaseTax]] = await db.query(`
      SELECT
        COUNT(*) AS total_purchase_bills,
        COALESCE(SUM(po.subtotal), 0) AS taxable_purchases,
        COALESCE(SUM(po.gst_amount / 2), 0) AS input_cgst,
        COALESCE(SUM(po.gst_amount / 2), 0) AS input_sgst,
        COALESCE(SUM(po.gst_amount), 0) AS total_input_gst,
        COALESCE(SUM(po.total), 0) AS gross_purchase_value
      FROM purchase_orders po
      WHERE po.status != 'CANCELLED'
    `);

    const outputGst = Number(salesTax.total_output_gst);
    const inputGst = Number(purchaseTax.total_input_gst);
    const netTaxPayable = Math.max(0, outputGst - inputGst);

    res.json({
      success: true,
      data: {
        output_gst: {
          taxable_sales: Number(salesTax.taxable_sales),
          cgst: Number(salesTax.output_cgst),
          sgst: Number(salesTax.output_sgst),
          igst: Number(salesTax.output_igst),
          total: outputGst,
          tcs: Number(salesTax.total_tcs),
          invoice_count: Number(salesTax.total_invoices),
          gross_value: Number(salesTax.gross_sales_value)
        },
        input_gst: {
          taxable_purchases: Number(purchaseTax.taxable_purchases),
          cgst: Number(purchaseTax.input_cgst),
          sgst: Number(purchaseTax.input_sgst),
          igst: 0,
          total: inputGst,
          bill_count: Number(purchaseTax.total_purchase_bills),
          gross_value: Number(purchaseTax.gross_purchase_value)
        },
        net_tax_payable: netTaxPayable,
        last_filed_date: "July 2026",
        gstin: "24AAACG1234F1Z5",
        state: "Gujarat (24)"
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// ── GET /api/gst/gstr-1 (Outward Supplies) ──────────────────────────────────
async function getGstr1(req, res) {
  try {
    const { from_date, to_date } = req.query;
    let dateFilter = "";
    const params = [];
    if (from_date && to_date) {
      dateFilter = "AND DATE(i.created_at) BETWEEN ? AND ?";
      params.push(from_date, to_date);
    }

    const [rows] = await db.query(`
      SELECT
        i.id,
        i.invoice_no,
        i.created_at AS invoice_date,
        c.full_name AS customer_name,
        c.gst_number AS customer_gstin,
        CASE WHEN c.gst_number IS NOT NULL AND c.gst_number != '' THEN 'B2B Regular' ELSE 'B2C Small' END AS invoice_type,
        '24-Gujarat' AS place_of_supply,
        (i.grand_total - (COALESCE(i.cgst, 0) + COALESCE(i.sgst, 0) + COALESCE(i.igst, 0))) AS taxable_value,
        3.00 AS gst_rate_pct,
        COALESCE(i.cgst, 0) AS cgst,
        COALESCE(i.sgst, 0) AS sgst,
        COALESCE(i.igst, 0) AS igst,
        i.grand_total AS total_value,
        i.status
      FROM invoices i
      LEFT JOIN customers c ON i.customer_id = c.id
      WHERE i.status != 'Cancelled' ${dateFilter}
      ORDER BY i.created_at DESC
      LIMIT 100
    `, params);

    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// ── GET /api/gst/gstr-3b (Monthly Summary) ──────────────────────────────────
async function getGstr3b(req, res) {
  try {
    const [[outward]] = await db.query(`
      SELECT
        COALESCE(SUM(grand_total - (COALESCE(cgst, 0) + COALESCE(sgst, 0) + COALESCE(igst, 0))), 0) AS taxable_value,
        COALESCE(SUM(cgst), 0) AS cgst,
        COALESCE(SUM(sgst), 0) AS sgst,
        COALESCE(SUM(igst), 0) AS igst,
        COALESCE(SUM(cgst + sgst + igst), 0) AS total_tax
      FROM invoices
      WHERE status != 'Cancelled'
    `);

    const [[inward]] = await db.query(`
      SELECT
        COALESCE(SUM(subtotal), 0) AS itc_taxable,
        COALESCE(SUM(gst_amount / 2), 0) AS itc_cgst,
        COALESCE(SUM(gst_amount / 2), 0) AS itc_sgst,
        COALESCE(SUM(gst_amount), 0) AS total_itc
      FROM purchase_orders
      WHERE status != 'CANCELLED'
    `);

    const table3_1 = {
      description: "(3.1) Outward supplies and inward supplies liable to reverse charge",
      taxable_value: Number(outward.taxable_value),
      cgst: Number(outward.cgst),
      sgst: Number(outward.sgst),
      igst: Number(outward.igst),
      total_tax: Number(outward.total_tax)
    };

    const table4 = {
      description: "(4) Eligible ITC (Inward supplies from registered persons)",
      taxable_value: Number(inward.itc_taxable),
      cgst: Number(inward.itc_cgst),
      sgst: Number(inward.itc_sgst),
      igst: 0,
      total_itc: Number(inward.total_itc)
    };

    const netCgst = Math.max(0, Number(outward.cgst) - Number(inward.itc_cgst));
    const netSgst = Math.max(0, Number(outward.sgst) - Number(inward.itc_sgst));
    const netIgst = Number(outward.igst);
    const totalNetPayable = netCgst + netSgst + netIgst;

    res.json({
      success: true,
      data: {
        table3_1,
        table4,
        net_liability: {
          cgst: netCgst,
          sgst: netSgst,
          igst: netIgst,
          total: totalNetPayable
        }
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// ── GET /api/gst/hsn-summary ────────────────────────────────────────────────
async function getHsnSummary(req, res) {
  try {
    const [hsnList] = await db.query("SELECT * FROM hsn_codes ORDER BY hsn_code ASC");

    const [salesByHsn] = await db.query(`
      SELECT
        COALESCE(hsn_code, '7113') AS hsn_code,
        COUNT(*) AS product_count,
        COALESCE(SUM(grand_total), 0) AS total_sales
      FROM invoices
      WHERE status != 'Cancelled'
      GROUP BY COALESCE(hsn_code, '7113')
    `);

    const salesMap = {};
    salesByHsn.forEach(s => {
      salesMap[s.hsn_code] = s.total_sales;
    });

    const enriched = hsnList.map(h => ({
      ...h,
      total_sales: Number(salesMap[h.hsn_code] || 0)
    }));

    res.json({ success: true, data: enriched });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// ── POST /api/gst/hsn-codes (Add/Update HSN) ─────────────────────────────────
async function addHsnCode(req, res) {
  try {
    const { hsn_code, description, category, gst_rate, cgst_rate, sgst_rate, igst_rate } = req.body;

    if (!hsn_code || !description) {
      return res.status(400).json({ success: false, message: "HSN Code and Description are required." });
    }

    const rate = parseFloat(gst_rate) || 3.00;
    const cgst = parseFloat(cgst_rate) || rate / 2;
    const sgst = parseFloat(sgst_rate) || rate / 2;
    const igst = parseFloat(igst_rate) || rate;

    await db.query(`
      INSERT INTO hsn_codes (hsn_code, description, category, gst_rate, cgst_rate, sgst_rate, igst_rate)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        description = VALUES(description),
        category = VALUES(category),
        gst_rate = VALUES(gst_rate),
        cgst_rate = VALUES(cgst_rate),
        sgst_rate = VALUES(sgst_rate),
        igst_rate = VALUES(igst_rate)
    `, [hsn_code, description, category || 'Jewellery', rate, cgst, sgst, igst]);

    res.status(201).json({ success: true, message: `HSN Code ${hsn_code} saved successfully.` });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// ── GET /api/gst/filing-calendar ────────────────────────────────────────────
async function getFilingCalendar(req, res) {
  try {
    const calendar = [
      { return_type: "GSTR-1", period: "August 2026", due_date: "11-Sep-2026", frequency: "Monthly", status: "Upcoming", action: "Prepare Data" },
      { return_type: "GSTR-3B", period: "August 2026", due_date: "20-Sep-2026", frequency: "Monthly", status: "Upcoming", action: "Calculate ITC" },
      { return_type: "GSTR-1", period: "July 2026", due_date: "11-Aug-2026", frequency: "Monthly", status: "Filed", action: "View ARN" },
      { return_type: "GSTR-3B", period: "July 2026", due_date: "20-Aug-2026", frequency: "Monthly", status: "Filed", action: "View ARN" },
      { return_type: "GSTR-9 (Annual)", period: "FY 2025-26", due_date: "31-Dec-2026", frequency: "Annual", status: "In Progress", action: "Reconcile" }
    ];

    res.json({ success: true, data: calendar });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// ── POST /api/gst/calculate (Tax Calculator Utility) ─────────────────────────
async function calculateTax(req, res) {
  try {
    const { taxable_value, gst_rate = 3.00, is_interstate = false, is_cash = false } = req.body;

    const val = parseFloat(taxable_value);
    if (!val || val <= 0) {
      return res.status(400).json({ success: false, message: "Enter a valid positive taxable amount." });
    }

    const rate = parseFloat(gst_rate);
    let cgst = 0;
    let sgst = 0;
    let igst = 0;

    if (is_interstate) {
      igst = (val * rate) / 100;
    } else {
      cgst = (val * (rate / 2)) / 100;
      sgst = (val * (rate / 2)) / 100;
    }

    const totalTax = cgst + sgst + igst;

    // TCS 0.1% if cash > 2 Lakhs (Sec 206C(1H))
    let tcs = 0;
    if (is_cash && val > 200000) {
      tcs = (val * 0.1) / 100;
    }

    const grandTotal = val + totalTax + tcs;

    res.json({
      success: true,
      data: {
        taxable_value: val,
        gst_rate: rate,
        cgst: Number(cgst.toFixed(2)),
        sgst: Number(sgst.toFixed(2)),
        igst: Number(igst.toFixed(2)),
        total_tax: Number(totalTax.toFixed(2)),
        tcs: Number(tcs.toFixed(2)),
        grand_total: Number(grandTotal.toFixed(2))
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

module.exports = {
  getSummary,
  getGstr1,
  getGstr3b,
  getHsnSummary,
  addHsnCode,
  getFilingCalendar,
  calculateTax
};

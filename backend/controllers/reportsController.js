const db = require("../config/db");
const { branchFilter } = require("../utils/branchScope");

// ── GET /api/reports/kpis ─────────────────────────────────────────────────────
exports.getExecutiveKpis = async (req, res) => {
  try {
    const bf = branchFilter(req);

    const [[salesStats]] = await db.query(`
      SELECT 
        COUNT(*) AS total_bills,
        COALESCE(SUM(grand_total), 0) AS net_sales
      FROM invoices
      WHERE ${bf.sql}
    `, bf.params);

    const [[purchaseStats]] = await db.query(`
      SELECT 
        COUNT(*) AS total_pos,
        COALESCE(SUM(total), 0) AS total_purchases
      FROM purchase_orders
      WHERE ${bf.sql}
    `, bf.params);

    const [[invStats]] = await db.query(`
      SELECT 
        COUNT(*) AS total_items,
        COALESCE(SUM(gross_weight * GREATEST(1, stock_qty)), 0) AS total_weight_g,
        COALESCE(SUM(mrp * GREATEST(1, stock_qty)), 0) AS stock_valuation
      FROM products
      WHERE status = 'Active' AND ${bf.sql}
    `, bf.params);

    const [[custStats]] = await db.query(`
      SELECT 
        COUNT(*) AS total_customers,
        COALESCE(SUM(balance_due), 0) AS total_receivables
      FROM customers
      WHERE ${bf.sql}
    `, bf.params);

    const [[supStats]] = await db.query(`
      SELECT 
        COALESCE(SUM(outstanding), 0) AS total_payables
      FROM suppliers
      WHERE ${bf.sql}
    `, bf.params);

    return res.json({
      success: true,
      data: {
        total_bills: salesStats.total_bills || 0,
        net_sales: parseFloat(salesStats.net_sales || 0),
        total_purchases: parseFloat(purchaseStats.total_purchases || 0),
        total_items_in_stock: invStats.total_items || 0,
        total_gold_weight_g: parseFloat(invStats.total_weight_g || 0),
        stock_valuation: parseFloat(invStats.stock_valuation || 0),
        total_customers: custStats.total_customers || 0,
        total_receivables: parseFloat(custStats.total_receivables || 0),
        total_payables: parseFloat(supStats.total_payables || 0),
      },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ── GET /api/reports/sales ────────────────────────────────────────────────────
exports.getSalesReport = async (req, res) => {
  try {
    const { from_date, to_date } = req.query;
    const bf = branchFilter(req);
    let where = `WHERE ${bf.sql}`;
    const params = [...bf.params];

    if (from_date) {
      where += " AND DATE(invoice_date) >= ?";
      params.push(from_date);
    }
    if (to_date) {
      where += " AND DATE(invoice_date) <= ?";
      params.push(to_date);
    }

    const [rows] = await db.query(`
      SELECT 
        DATE(invoice_date) AS sale_date,
        COUNT(*) AS bill_count,
        COALESCE(SUM(grand_total + COALESCE(discount_amt, 0)), 0) AS gross_sales,
        COALESCE(SUM(discount_amt), 0) AS total_discount,
        COALESCE(SUM(cgst + sgst), 0) AS total_gst,
        COALESCE(SUM(grand_total), 0) AS net_sales,
        COALESCE(SUM(CASE WHEN payment_mode = 'Cash' THEN grand_total ELSE 0 END), 0) AS cash_sales,
        COALESCE(SUM(CASE WHEN payment_mode = 'UPI' THEN grand_total ELSE 0 END), 0) AS upi_sales,
        COALESCE(SUM(CASE WHEN payment_mode IN ('Card', 'Debit Card', 'Credit Card') THEN grand_total ELSE 0 END), 0) AS card_sales
      FROM invoices
      ${where}
      GROUP BY DATE(invoice_date)
      ORDER BY sale_date DESC
    `, params);

    return res.json({ success: true, data: rows });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ── GET /api/reports/purchase ─────────────────────────────────────────────────
exports.getPurchaseReport = async (req, res) => {
  try {
    const { from_date, to_date } = req.query;
    const bf = branchFilter(req, "po.branch_id");
    let where = `WHERE ${bf.sql}`;
    const params = [...bf.params];

    if (from_date) {
      where += " AND DATE(po.purchase_date) >= ?";
      params.push(from_date);
    }
    if (to_date) {
      where += " AND DATE(po.purchase_date) <= ?";
      params.push(to_date);
    }

    const [rows] = await db.query(`
      SELECT 
        po.*,
        po.po_no AS purchase_no,
        po.total AS total_amount,
        COALESCE(po.paid_amount, 0) AS paid_amount,
        (po.total - COALESCE(po.paid_amount, 0)) AS balance_amount,
        s.company_name AS supplier_name,
        s.city AS supplier_city
      FROM purchase_orders po
      LEFT JOIN suppliers s ON po.supplier_id = s.id
      ${where}
      ORDER BY po.purchase_date DESC
    `, params);

    return res.json({ success: true, data: rows });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ── GET /api/reports/inventory ────────────────────────────────────────────────
exports.getInventoryReport = async (req, res) => {
  try {
    const bf = branchFilter(req);
    const [rows] = await db.query(`
      SELECT 
        COALESCE(jewellery_category, product_category, 'Jewelry') AS category,
        COUNT(*) AS total_skus,
        COALESCE(SUM(gross_weight * GREATEST(1, stock_qty)), 0) AS total_weight_g,
        COALESCE(SUM(net_weight * GREATEST(1, stock_qty)), 0) AS total_net_weight_g,
        COALESCE(SUM(mrp * GREATEST(1, stock_qty)), 0) AS total_valuation,
        COUNT(CASE WHEN stock_qty > 0 THEN 1 END) AS in_stock_count,
        COUNT(CASE WHEN stock_qty <= min_stock_qty AND stock_qty > 0 THEN 1 END) AS low_stock_count
      FROM products
      WHERE status = 'Active' AND ${bf.sql}
      GROUP BY category
      ORDER BY total_valuation DESC
    `, bf.params);

    return res.json({ success: true, data: rows });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ── GET /api/reports/customers ────────────────────────────────────────────────
exports.getCustomerReport = async (req, res) => {
  try {
    const bf = branchFilter(req, "c.branch_id");
    const [rows] = await db.query(`
      SELECT 
        c.id,
        c.full_name,
        c.phone,
        c.city,
        c.tier,
        c.total_purchases,
        c.balance_due,
        c.loyalty_points,
        c.kyc_status,
        c.created_at
      FROM customers c
      WHERE ${bf.sql}
      ORDER BY c.total_purchases DESC
      LIMIT 100
    `, bf.params);

    return res.json({ success: true, data: rows });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ── GET /api/reports/suppliers ────────────────────────────────────────────────
exports.getSupplierReport = async (req, res) => {
  try {
    const bf = branchFilter(req, "s.branch_id");
    const [rows] = await db.query(`
      SELECT 
        s.id,
        s.company_name,
        s.contact_person,
        s.phone,
        s.supply_type,
        s.city,
        s.credit_limit,
        s.outstanding,
        s.total_purchased,
        s.status
      FROM suppliers s
      WHERE ${bf.sql}
      ORDER BY s.total_purchased DESC
    `, bf.params);

    return res.json({ success: true, data: rows });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ── GET /api/reports/profit ───────────────────────────────────────────────────
exports.getProfitReport = async (req, res) => {
  try {
    const bf = branchFilter(req);
    const [salesMonthly] = await db.query(`
      SELECT 
        DATE_FORMAT(invoice_date, '%Y-%m') AS month_key,
        COALESCE(SUM(grand_total), 0) AS revenue
      FROM invoices
      WHERE ${bf.sql}
      GROUP BY month_key
      ORDER BY month_key DESC
      LIMIT 12
    `, bf.params);

    const [purchaseMonthly] = await db.query(`
      SELECT 
        DATE_FORMAT(purchase_date, '%Y-%m') AS month_key,
        COALESCE(SUM(total), 0) AS cogs
      FROM purchase_orders
      WHERE ${bf.sql}
      GROUP BY month_key
      ORDER BY month_key DESC
      LIMIT 12
    `, bf.params);

    const purchaseMap = {};
    purchaseMonthly.forEach((p) => {
      purchaseMap[p.month_key] = parseFloat(p.cogs || 0);
    });

    const profitData = salesMonthly.map((s) => {
      const revenue = parseFloat(s.revenue || 0);
      const cogs = purchaseMap[s.month_key] || Math.round(revenue * 0.72);
      const opex = Math.round(revenue * 0.08);
      const grossProfit = revenue - cogs;
      const netProfit = grossProfit - opex;
      const margin = revenue > 0 ? ((netProfit / revenue) * 100).toFixed(1) : "0.0";

      return {
        month: s.month_key,
        revenue,
        cogs,
        opex,
        gross_profit: grossProfit,
        net_profit: netProfit,
        margin_pct: `${margin}%`,
      };
    });

    return res.json({ success: true, data: profitData });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ── GET /api/reports/gst ──────────────────────────────────────────────────────
exports.getGstReport = async (req, res) => {
  try {
    const bf = branchFilter(req);
    const [rows] = await db.query(`
      SELECT 
        DATE_FORMAT(invoice_date, '%Y-%m') AS tax_period,
        COUNT(*) AS total_invoices,
        COALESCE(SUM(grand_total - COALESCE(cgst,0) - COALESCE(sgst,0)), 0) AS taxable_turnover,
        COALESCE(SUM(cgst + sgst), 0) AS total_gst_collected,
        COALESCE(SUM(cgst), 0) AS cgst_1_5_pct,
        COALESCE(SUM(sgst), 0) AS sgst_1_5_pct
      FROM invoices
      WHERE ${bf.sql}
      GROUP BY tax_period
      ORDER BY tax_period DESC
      LIMIT 12
    `, bf.params);

    return res.json({ success: true, data: rows });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ── POST /api/reports/seed-demo-data ──────────────────────────────────────────
exports.seedDemoData = async (req, res) => {
  try {
    // 1. Seed Products if count < 5
    const [prodCount] = await db.query("SELECT COUNT(*) AS c FROM products");
    if (prodCount[0].c < 5) {
      const demoProducts = [
        ["PRD2600001", "Bridal Kundan Polki Choker Set", "NK-KUNDAN-22K-001", "Necklace", "Gold", "22K", 48.500, 0.000, 48.500, "Fixed", 12500.00, 385000.00, 2, "Active", 1],
        ["PRD2600002", "0.75ct Diamond Solitaire Ring", "RG-SOLITAIRE-18K-002", "Ring", "Diamond", "18K", 4.200, 0.750, 3.450, "Fixed", 8500.00, 125000.00, 4, "Active", 1],
        ["PRD2600003", "South Temple Antique Kada Pair", "BG-TEMPLE-22K-003", "Bangles", "Gold", "22K", 54.000, 0.000, 54.000, "Fixed", 15000.00, 420000.00, 2, "Active", 1],
        ["PRD2600004", "Heritage Royal Peacock Jhumkas", "ER-JHUMKA-22K-004", "Earrings", "Gold", "22K", 18.200, 0.000, 18.200, "Fixed", 6000.00, 145000.00, 3, "Active", 1],
        ["PRD2600005", "Handmade Dubai Hollow Rope Chain", "CH-ROPE-22K-005", "Chain", "Gold", "22K", 24.000, 0.000, 24.000, "Fixed", 5000.00, 188000.00, 5, "Active", 1],
        ["PRD2600006", "Traditional Floral Bridal Silver Payal", "SL-PAYAL-999-006", "Silver Articles", "Silver", "999", 120.000, 0.000, 120.000, "Fixed", 2500.00, 22500.00, 6, "Active", 1],
      ];

      for (const p of demoProducts) {
        await db.query(`
          INSERT INTO products 
            (product_code, name, sku, jewellery_category, metal_type, purity, gross_weight, stone_weight, net_weight, making_charges_type, making_charges, mrp, stock_qty, status, branch_id)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE mrp=VALUES(mrp)
        `, p);
      }
    }

    // 2. Seed Invoices if count < 3
    const [invCount] = await db.query("SELECT COUNT(*) AS c FROM invoices");
    if (invCount[0].c < 3) {
      const demoInvoices = [
        ["INV-2026-0001", "Retail Invoice", 1, 1, "2026-08-28", "UPI", 5000.00, 5700.00, 5700.00, 391400.00, 391400.00, "Paid"],
        ["INV-2026-0002", "Retail Invoice", 2, 1, "2026-08-29", "Card", 2000.00, 1845.00, 1845.00, 126690.00, 126690.00, "Paid"],
        ["INV-2026-0003", "Retail Invoice", 3, 1, "2026-08-30", "Cash", 10000.00, 6150.00, 6150.00, 422300.00, 422300.00, "Paid"],
        ["INV-2026-0004", "Retail Invoice", 1, 1, "2026-08-31", "UPI", 0.00, 2175.00, 2175.00, 149350.00, 149350.00, "Paid"],
        ["INV-2026-0005", "Retail Invoice", 2, 1, "2026-09-01", "Card", 3000.00, 2775.00, 2775.00, 190550.00, 190550.00, "Paid"],
      ];

      for (const inv of demoInvoices) {
        await db.query(`
          INSERT INTO invoices 
            (invoice_no, invoice_type, customer_id, branch_id, invoice_date, payment_mode, discount_amt, cgst, sgst, grand_total, paid_amount, status)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE grand_total=VALUES(grand_total)
        `, inv);
      }
    }

    // 3. Seed Purchase Orders if count < 2
    const [purCount] = await db.query("SELECT COUNT(*) AS c FROM purchase_orders");
    if (purCount[0].c < 2) {
      const demoPOs = [
        ["PO-2026-0001", 1, 1, "2026-08-15", "24K Bullion 999 150g Intake", 150.000, 1250000.00, 1000000.00, "PARTIAL"],
        ["PO-2026-0002", 2, 1, "2026-08-25", "Certified Cut Diamonds 12.5ct Lot", 12.500, 480000.00, 480000.00, "PAID"],
      ];

      for (const po of demoPOs) {
        await db.query(`
          INSERT INTO purchase_orders 
            (po_no, supplier_id, branch_id, purchase_date, item_description, weight, total, paid_amount, status)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE total=VALUES(total)
        `, po);
      }
    }

    return res.json({
      success: true,
      message: "Realistic showroom transactions, invoices, and stock valuation loaded successfully!",
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ── POST /api/reports/clear-demo-data ─────────────────────────────────────────
exports.clearDemoData = async (req, res) => {
  try {
    // Delete demo invoices
    await db.query("DELETE FROM invoices WHERE invoice_no LIKE 'INV-2026-000%'");

    // Delete demo purchase orders
    await db.query("DELETE FROM purchase_orders WHERE po_no LIKE 'PO-2026-000%'");

    // Delete demo products
    await db.query(`
      DELETE FROM products WHERE sku IN (
        'NK-KUNDAN-22K-001',
        'RG-SOLITAIRE-18K-002',
        'BG-TEMPLE-22K-003',
        'ER-JHUMKA-22K-004',
        'CH-ROPE-22K-005',
        'SL-PAYAL-999-006'
      )
    `);

    return res.json({
      success: true,
      message: "Demo test transactions, invoices, and products cleared successfully! Database is clean.",
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

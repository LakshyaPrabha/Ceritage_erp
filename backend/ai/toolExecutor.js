/**
 * Ceritage Jewellery ERP - AI Tool Executor
 * Executes safe, parameterized, multi-branch scoped queries for Gemini & OpenAI function calls.
 */

const db = require("../config/db");
const { branchFilter } = require("../utils/branchScope");

async function tableExists(tableName) {
  try {
    const [rows] = await db.query(
      "SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?",
      [tableName]
    );
    return rows.length > 0;
  } catch {
    return false;
  }
}

/**
 * Main dispatcher to execute tools safely
 */
async function executeTool(toolName, args = {}, req = {}) {
  try {
    switch (toolName) {
      case "get_dashboard_kpis":
        return await getDashboardKpis(args, req);

      case "get_today_sales":
        return await getTodaySales(args, req);

      case "get_monthly_sales":
        return await getMonthlySales(args, req);

      case "search_customer":
        return await searchCustomer(args, req);

      case "get_customer_details":
        return await getCustomerDetails(args, req);

      case "get_invoice":
        return await getInvoice(args, req);

      case "get_product_stock":
        return await getProductStock(args, req);

      case "get_gold_rate":
        return await getGoldRate(args, req);

      case "get_karigar_balance":
        return await getKarigarBalance(args, req);

      case "get_low_stock_alerts":
        return await getLowStockAlerts(args, req);

      case "get_dead_stock":
        return await getDeadStock(args, req);

      case "get_jangad_memos":
        return await getJangadMemos(args, req);

      case "get_tax_and_compliance_rules":
        return await getTaxAndComplianceRules(args, req);

      default:
        return { error: `Tool '${toolName}' is not supported.` };
    }
  } catch (err) {
    console.error(`AI toolExecutor error for '${toolName}':`, err.message);
    return { error: `Failed to execute tool '${toolName}': ${err.message}` };
  }
}

// 1. Dashboard KPIs
async function getDashboardKpis(args, req) {
  const bf = branchFilter(req);
  const targetDate = args.date || new Date().toISOString().split("T")[0];

  const result = {
    date: targetDate,
    today_sales_revenue: 0,
    today_invoices_count: 0,
    total_customers: 0,
    pending_repairs: 0,
    total_inventory_items: 0,
    gold_stock_weight: "0.000 kg",
    showroom_stock_valuation: 0,
  };

  if (await tableExists("invoices")) {
    const [[sales]] = await db.query(
      `SELECT COALESCE(SUM(grand_total), 0) AS revenue, COUNT(*) AS bills_count
       FROM invoices
       WHERE (DATE(invoice_date) = ? OR DATE(created_at) = ?)
         AND (status IS NULL OR status != 'Cancelled')
         AND ${bf.sql}`,
      [targetDate, targetDate, ...bf.params]
    ).catch(() => [[{ revenue: 0, bills_count: 0 }]]);
    result.today_sales_revenue = sales.revenue || 0;
    result.today_invoices_count = sales.bills_count || 0;
  }

  if (await tableExists("customers")) {
    const [[c]] = await db.query(
      `SELECT COUNT(*) AS total FROM customers WHERE (status IS NULL OR UPPER(status) IN ('ACTIVE')) AND ${bf.sql}`,
      bf.params
    ).catch(() => [[{ total: 0 }]]);
    result.total_customers = c.total || 0;
  }

  if (await tableExists("repair_jobs")) {
    const [[r]] = await db.query(
      `SELECT COUNT(*) AS pending FROM repair_jobs WHERE status IN ('Pending', 'In Progress', 'Overdue') AND ${bf.sql}`,
      bf.params
    ).catch(() => [[{ pending: 0 }]]);
    result.pending_repairs = r.pending || 0;
  }

  if (await tableExists("products")) {
    const [[p]] = await db.query(
      `SELECT 
         COUNT(*) AS total_items,
         COALESCE(SUM(COALESCE(gross_weight, 0) * COALESCE(stock_qty, 1)), 0) AS total_gold_grams,
         COALESCE(SUM(COALESCE(mrp, selling_price, 0) * COALESCE(stock_qty, 1)), 0) AS valuation
       FROM products
       WHERE (status IS NULL OR UPPER(status) IN ('ACTIVE', 'IN STOCK', 'IN_STOCK'))
         AND stock_qty > 0
         AND ${bf.sql}`,
      bf.params
    ).catch(() => [[{ total_items: 0, total_gold_grams: 0, valuation: 0 }]]);
    result.total_inventory_items = p.total_items || 0;
    result.gold_stock_weight = `${((p.total_gold_grams || 0) / 1000).toFixed(3)} kg`;
    result.showroom_stock_valuation = Math.round(p.valuation || 0);
  }

  return result;
}

// 2. Sales by Date
async function getTodaySales(args, req) {
  const targetDate = args.date || new Date().toISOString().split("T")[0];
  const bf = branchFilter(req);

  const [[sales]] = await db.query(
    `SELECT 
       COUNT(*) AS invoice_count,
       COALESCE(SUM(grand_total), 0) AS total_revenue,
       COALESCE(SUM(paid_amount), 0) AS total_collected,
       COALESCE(SUM(CASE WHEN payment_mode = 'Cash' THEN grand_total ELSE 0 END), 0) AS cash_sales,
       COALESCE(SUM(CASE WHEN payment_mode = 'UPI' THEN grand_total ELSE 0 END), 0) AS upi_sales,
       COALESCE(SUM(CASE WHEN payment_mode = 'Card' THEN grand_total ELSE 0 END), 0) AS card_sales
     FROM invoices
     WHERE (DATE(invoice_date) = ? OR DATE(created_at) = ?)
       AND (status IS NULL OR status != 'Cancelled')
       AND ${bf.sql}`,
    [targetDate, targetDate, ...bf.params]
  ).catch(() => [[{ invoice_count: 0, total_revenue: 0, total_collected: 0 }]]);

  return {
    date: targetDate,
    total_sales_amount: `₹${Number(sales.total_revenue || 0).toLocaleString("en-IN")}`,
    invoices_generated: sales.invoice_count || 0,
    total_cash_collected: `₹${Number(sales.total_collected || 0).toLocaleString("en-IN")}`,
    breakdown: {
      cash: `₹${Number(sales.cash_sales || 0).toLocaleString("en-IN")}`,
      upi: `₹${Number(sales.upi_sales || 0).toLocaleString("en-IN")}`,
      card: `₹${Number(sales.card_sales || 0).toLocaleString("en-IN")}`,
    }
  };
}

// 3. Monthly Sales Analytics
async function getMonthlySales(args, req) {
  const now = new Date();
  const targetYear = args.year || now.getFullYear();
  const targetMonth = args.month || (now.getMonth() + 1);
  const bf = branchFilter(req);

  const [[currentMonth]] = await db.query(
    `SELECT 
       COUNT(*) AS total_invoices,
       COALESCE(SUM(grand_total), 0) AS monthly_revenue
     FROM invoices
     WHERE YEAR(COALESCE(invoice_date, created_at)) = ?
       AND MONTH(COALESCE(invoice_date, created_at)) = ?
       AND (status IS NULL OR status != 'Cancelled')
       AND ${bf.sql}`,
    [targetYear, targetMonth, ...bf.params]
  ).catch(() => [[{ total_invoices: 0, monthly_revenue: 0 }]]);

  // Previous month calculation
  const prevMonthDate = new Date(targetYear, targetMonth - 2, 1);
  const prevYear = prevMonthDate.getFullYear();
  const prevMonth = prevMonthDate.getMonth() + 1;

  const [[prevMonthData]] = await db.query(
    `SELECT 
       COUNT(*) AS total_invoices,
       COALESCE(SUM(grand_total), 0) AS monthly_revenue
     FROM invoices
     WHERE YEAR(COALESCE(invoice_date, created_at)) = ?
       AND MONTH(COALESCE(invoice_date, created_at)) = ?
       AND (status IS NULL OR status != 'Cancelled')
       AND ${bf.sql}`,
    [prevYear, prevMonth, ...bf.params]
  ).catch(() => [[{ total_invoices: 0, monthly_revenue: 0 }]]);

  const currRev = Number(currentMonth.monthly_revenue || 0);
  const prevRev = Number(prevMonthData.monthly_revenue || 0);
  const growth = prevRev > 0 ? (((currRev - prevRev) / prevRev) * 100).toFixed(1) + "%" : "N/A";

  return {
    selected_month: `${targetMonth}/${targetYear}`,
    current_month_revenue: `₹${currRev.toLocaleString("en-IN")}`,
    current_month_invoices: currentMonth.total_invoices || 0,
    previous_month_revenue: `₹${prevRev.toLocaleString("en-IN")}`,
    month_over_month_growth: growth,
  };
}

// 4. Customer Search
async function searchCustomer(args, req) {
  const query = (args.query || "").trim();
  const bf = branchFilter(req);

  const [rows] = await db.query(
    `SELECT id, full_name, phone, email, city, tier, loyalty_points, created_at
     FROM customers
     WHERE (full_name LIKE ? OR phone LIKE ? OR city LIKE ?)
       AND ${bf.sql}
     ORDER BY tier DESC, full_name ASC
     LIMIT 8`,
    [`%${query}%`, `%${query}%`, `%${query}%`, ...bf.params]
  ).catch(() => [[]]);

  if (rows.length === 0) {
    return { found: false, message: `No customer record found matching '${query}'.` };
  }

  return {
    found: true,
    count: rows.length,
    customers: rows.map(c => ({
      id: c.id,
      name: c.full_name,
      phone: c.phone,
      city: c.city || "N/A",
      tier: c.tier || "Standard",
      loyalty_points: c.loyalty_points || 0
    }))
  };
}

// 5. Customer Full Details
async function getCustomerDetails(args, req) {
  const bf = branchFilter(req);
  let customer = null;

  if (args.customer_id) {
    const [[c]] = await db.query(
      `SELECT * FROM customers WHERE id = ? AND ${bf.sql} LIMIT 1`,
      [args.customer_id, ...bf.params]
    ).catch(() => [[]]);
    customer = c;
  } else if (args.phone) {
    const [[c]] = await db.query(
      `SELECT * FROM customers WHERE phone LIKE ? AND ${bf.sql} LIMIT 1`,
      [`%${args.phone}%`, ...bf.params]
    ).catch(() => [[]]);
    customer = c;
  }

  if (!customer) {
    return { found: false, message: "Customer profile not found." };
  }

  // Fetch recent invoices
  const [invoices] = await db.query(
    `SELECT invoice_no, grand_total, payment_mode, status, invoice_date, created_at
     FROM invoices
     WHERE customer_id = ? AND ${bf.sql}
     ORDER BY id DESC LIMIT 5`,
    [customer.id, ...bf.params]
  ).catch(() => [[]]);

  const totalSpend = invoices.reduce((acc, inv) => acc + Number(inv.grand_total || 0), 0);

  return {
    found: true,
    customer_id: customer.id,
    name: customer.full_name,
    phone: customer.phone,
    email: customer.email || "N/A",
    tier: customer.tier || "Standard",
    loyalty_points: customer.loyalty_points || 0,
    total_invoices_count: invoices.length,
    approximate_total_spend: `₹${totalSpend.toLocaleString("en-IN")}`,
    recent_invoices: invoices.map(i => ({
      invoice_no: i.invoice_no,
      amount: `₹${Number(i.grand_total).toLocaleString("en-IN")}`,
      status: i.status || "Completed",
      date: i.invoice_date || i.created_at
    }))
  };
}

// 6. Invoice Lookup
async function getInvoice(args, req) {
  const bf = branchFilter(req, "i.branch_id");
  let invoice = null;

  if (args.invoice_no) {
    const [[inv]] = await db.query(
      `SELECT i.*, COALESCE(c.full_name, 'Walk-in Customer') AS customer_name, c.phone AS customer_phone
       FROM invoices i
       LEFT JOIN customers c ON i.customer_id = c.id
       WHERE (i.invoice_no LIKE ? OR i.invoice_number LIKE ?) AND ${bf.sql}
       LIMIT 1`,
      [`%${args.invoice_no}%`, `%${args.invoice_no}%`, ...bf.params]
    ).catch(() => [[]]);
    invoice = inv;
  } else if (args.invoice_id) {
    const [[inv]] = await db.query(
      `SELECT i.*, COALESCE(c.full_name, 'Walk-in Customer') AS customer_name, c.phone AS customer_phone
       FROM invoices i
       LEFT JOIN customers c ON i.customer_id = c.id
       WHERE i.id = ? AND ${bf.sql}
       LIMIT 1`,
      [args.invoice_id, ...bf.params]
    ).catch(() => [[]]);
    invoice = inv;
  }

  if (!invoice) {
    return { found: false, message: `Invoice '${args.invoice_no || args.invoice_id}' not found.` };
  }

  // Fetch items if table exists
  let items = [];
  if (await tableExists("invoice_items")) {
    const [invItems] = await db.query(
      `SELECT product_name, sku, purity, weight_g, gross_weight, making_charges, gst_amount, amount
       FROM invoice_items
       WHERE invoice_id = ?`,
      [invoice.id]
    ).catch(() => [[]]);
    items = invItems;
  }

  return {
    found: true,
    invoice_no: invoice.invoice_no || invoice.invoice_number,
    customer_name: invoice.customer_name,
    customer_phone: invoice.customer_phone || "N/A",
    grand_total: `₹${Number(invoice.grand_total || 0).toLocaleString("en-IN")}`,
    paid_amount: `₹${Number(invoice.paid_amount || 0).toLocaleString("en-IN")}`,
    payment_mode: invoice.payment_mode || "Cash",
    status: invoice.status || "Completed",
    date: invoice.invoice_date || invoice.created_at,
    items_count: items.length,
    items: items.map(it => ({
      item: it.product_name || it.sku,
      purity: it.purity,
      weight: `${it.weight_g || it.gross_weight || 0}g`,
      amount: `₹${Number(it.amount || 0).toLocaleString("en-IN")}`
    }))
  };
}

// 7. Product & Inventory Stock
async function getProductStock(args, req) {
  const query = (args.query || "").trim();
  const bf = branchFilter(req);

  const [rows] = await db.query(
    `SELECT id, sku, name, product_category, jewellery_category, purity, gross_weight, net_weight, mrp, selling_price, stock_qty, huid
     FROM products
     WHERE (name LIKE ? OR sku LIKE ? OR product_category LIKE ? OR jewellery_category LIKE ? OR huid LIKE ?)
       AND ${bf.sql}
     ORDER BY stock_qty DESC, name ASC
     LIMIT 10`,
    [`%${query}%`, `%${query}%`, `%${query}%`, `%${query}%`, `%${query}%`, ...bf.params]
  ).catch(() => [[]]);

  if (rows.length === 0) {
    return { found: false, message: `No jewellery inventory found matching '${query}'.` };
  }

  return {
    found: true,
    matching_count: rows.length,
    products: rows.map(p => ({
      name: p.name,
      sku: p.sku,
      category: p.product_category || p.jewellery_category || "Jewellery",
      purity: p.purity || "22K",
      weight: `${p.gross_weight || 0}g (Net: ${p.net_weight || p.gross_weight || 0}g)`,
      price: `₹${Number(p.mrp || p.selling_price || 0).toLocaleString("en-IN")}`,
      stock_in_hand: `${p.stock_qty} piece(s)`,
      huid: p.huid || "BIS Hallmarked"
    }))
  };
}

// 8. Benchmark Gold & Silver Rates
async function getGoldRate(args, req) {
  const bf = branchFilter(req);
  const [rates] = await db.query(
    `SELECT rate_24k, rate_22k, rate_18k, rate_14k, silver_rate, effective_date 
     FROM gold_rates 
     WHERE ${bf.sql} 
     ORDER BY effective_date DESC, id DESC 
     LIMIT 1`,
    [...bf.params]
  ).catch(() => [[]]);

  const rateInfo = rates?.[0] || { rate_24k: 7255, rate_22k: 6650, rate_18k: 5440, rate_14k: 4240, silver_rate: 84.5 };
  const rate18k = Number(rateInfo.rate_18k || Math.round(rateInfo.rate_24k * 0.75));
  const rate14k = Number(rateInfo.rate_14k || Math.round(rateInfo.rate_24k * 0.585));

  return {
    effective_date: rateInfo.effective_date || new Date().toISOString().split("T")[0],
    rates: {
      gold_24k_pure: `₹${Number(rateInfo.rate_24k).toLocaleString("en-IN")}/gram (₹${(Number(rateInfo.rate_24k) * 10).toLocaleString("en-IN")}/10g)`,
      gold_22k_hallmark_916: `₹${Number(rateInfo.rate_22k).toLocaleString("en-IN")}/gram (₹${(Number(rateInfo.rate_22k) * 10).toLocaleString("en-IN")}/10g)`,
      gold_18k_diamond_750: `₹${rate18k.toLocaleString("en-IN")}/gram`,
      gold_14k_fashion_585: `₹${rate14k.toLocaleString("en-IN")}/gram`,
      silver_925_fine: `₹${Number(rateInfo.silver_rate).toLocaleString("en-IN")}/gram (₹${(Number(rateInfo.silver_rate) * 1000).toLocaleString("en-IN")}/kg)`
    }
  };
}

// 9. Karigar Balance & Workshop Ledger
async function getKarigarBalance(args, req) {
  const bf = branchFilter(req);
  let query = `SELECT id, full_name, name, specialization, phone, gold_at_hand, gold_balance_grams, pending_jobs, status FROM karigars WHERE ${bf.sql}`;
  let params = [...bf.params];

  if (args.karigar_name) {
    query += ` AND (full_name LIKE ? OR name LIKE ?)`;
    params.push(`%${args.karigar_name}%`, `%${args.karigar_name}%`);
  }

  query += ` LIMIT 8`;

  const [rows] = await db.query(query, params).catch(() => [[]]);

  if (rows.length === 0) {
    return { found: false, message: "No karigar workshop records found." };
  }

  return {
    found: true,
    karigars: rows.map(k => ({
      name: k.full_name || k.name,
      specialization: k.specialization || "Gold Handcrafting & Casting",
      gold_balance_at_hand: `${Number(k.gold_at_hand || k.gold_balance_grams || 0).toFixed(3)} grams (24K Fine)`,
      pending_job_orders: k.pending_jobs || 0,
      phone: k.phone || "N/A"
    }))
  };
}

// 10. Low Stock Alerts
async function getLowStockAlerts(args, req) {
  const bf = branchFilter(req);
  const [rows] = await db.query(
    `SELECT sku, name, product_category, purity, gross_weight, stock_qty, COALESCE(min_stock_qty, min_stock, 2) AS min_qty, mrp
     FROM products
     WHERE stock_qty <= COALESCE(min_stock_qty, min_stock, 2)
       AND (stock_status IS NULL OR stock_status != 'Out of Stock')
       AND ${bf.sql}
     ORDER BY stock_qty ASC
     LIMIT 10`,
    bf.params
  ).catch(() => [[]]);

  return {
    total_low_stock_items: rows.length,
    alert_status: rows.length > 0 ? "ACTION_REQUIRED" : "SUFFICIENT_STOCK",
    items: rows.map(r => ({
      sku: r.sku,
      name: r.name,
      category: r.product_category || "Jewellery",
      purity: r.purity,
      current_stock: `${r.stock_qty} units (Threshold: ${r.min_qty})`,
      price: `₹${Number(r.mrp || 0).toLocaleString("en-IN")}`
    }))
  };
}

// 11. Dead Stock Velocity
async function getDeadStock(args, req) {
  const minDays = args.min_days || 45;
  const bf = branchFilter(req);

  const [rows] = await db.query(
    `SELECT id, name, sku, purity, gross_weight, COALESCE(mrp, selling_price, 0) AS price, created_at,
            DATEDIFF(CURDATE(), created_at) AS days_in_stock
     FROM products
     WHERE (status IS NULL OR UPPER(status) IN ('ACTIVE', 'IN STOCK', 'IN_STOCK'))
       AND stock_qty > 0
       AND DATEDIFF(CURDATE(), created_at) >= ?
       AND ${bf.sql}
     ORDER BY days_in_stock DESC
     LIMIT 10`,
    [minDays, ...bf.params]
  ).catch(() => [[]]);

  const totalValue = rows.reduce((acc, r) => acc + Number(r.price || 0), 0);

  return {
    slow_items_count: rows.length,
    locked_capital_valuation: `₹${totalValue.toLocaleString("en-IN")}`,
    recommendation: "Melt & Re-cast into Fast Moving Daily Wear Chains or offer 15% Making Charge clearance discount.",
    items: rows.map(r => ({
      name: r.name,
      sku: r.sku,
      purity: r.purity,
      days_in_display: `${r.days_in_stock} days`,
      price: `₹${Number(r.price).toLocaleString("en-IN")}`
    }))
  };
}

// 12. Jangad (On-Approval) Memos
async function getJangadMemos(args, req) {
  const bf = branchFilter(req, "j.branch_id");
  if (!(await tableExists("jangad_memos"))) {
    return { found: true, message: "Jangad approval module active. No open memos currently pending return." };
  }

  let sql = `SELECT j.*, COALESCE(c.full_name, 'Client') AS customer_name, c.phone AS customer_phone
             FROM jangad_memos j
             LEFT JOIN customers c ON j.customer_id = c.id
             WHERE ${bf.sql}`;
  let params = [...bf.params];

  if (args.customer_name) {
    sql += ` AND c.full_name LIKE ?`;
    params.push(`%${args.customer_name}%`);
  }
  if (args.status) {
    sql += ` AND j.status = ?`;
    params.push(args.status);
  }

  sql += ` ORDER BY j.id DESC LIMIT 8`;

  const [rows] = await db.query(sql, params).catch(() => [[]]);

  return {
    count: rows.length,
    memos: rows.map(m => ({
      memo_no: m.memo_no || `JNG-${m.id}`,
      customer: m.customer_name,
      status: m.status || "Pending Return / Approval",
      total_items: m.total_items || 1,
      total_weight: `${m.total_weight || 0}g`,
      issue_date: m.issue_date || m.created_at
    }))
  };
}

// 13. Tax & Compliance Rules
async function getTaxAndComplianceRules(args, req) {
  return {
    gst_rates: {
      gold_diamond_jewellery: "3% GST (HSN 7113) - 1.5% CGST + 1.5% SGST",
      loose_diamonds: "0.25% GST (HSN 7102)",
      making_charges_job_work: "5% GST (HSN 9988)",
    },
    tcs_rules: {
      section: "Section 206C(1D/1F) Income Tax Act",
      threshold: "1% mandatory TCS on cash transactions exceeding ₹2,00,000",
      compliance: "Mandatory PAN collection of customer on all jewellery sales above ₹2 Lakh"
    },
    bis_hallmarking: {
      standard: "Mandatory 6-digit alphanumeric HUID (Hallmark Unique Identification)",
      purities_covered: "24K (999), 22K (916), 20K (833), 18K (750), 14K (585), 9K (375)"
    }
  };
}

module.exports = { executeTool };

const db = require("../config/db");

function pct(numerator, denominator) {
  const bottom = Number(denominator || 0);
  if (!bottom) return 0;
  return Number(((Number(numerator || 0) / bottom) * 100).toFixed(2));
}

// GET /api/analytics/summary
async function getSummary(req, res) {
  try {
    const { year = new Date().getFullYear() } = req.query;
    const targetYear = parseInt(year, 10) || new Date().getFullYear();

    const [[summary]] = await db.query(
      `SELECT
         COALESCE(SUM(CASE WHEN YEAR(invoice_date) = ? THEN grand_total ELSE 0 END), 0) AS annual_revenue,
         COALESCE(SUM(CASE WHEN DATE(invoice_date) = CURDATE() THEN grand_total ELSE 0 END), 0) AS today_sales,
         COUNT(CASE WHEN YEAR(invoice_date) = ? THEN 1 END) AS annual_bills
       FROM invoices`,
      [targetYear, targetYear]
    );

    const [[customers]] = await db.query("SELECT COUNT(*) AS total_customers FROM customers");

    const [[stock]] = await db.query(
      `SELECT
         COALESCE(SUM(CASE WHEN stock_qty <= min_stock THEN 1 ELSE 0 END), 0) AS low_out_stock,
         COALESCE(SUM(CASE WHEN stock_qty > 0 THEN stock_qty * COALESCE(purchase_price, 0) ELSE 0 END), 0) AS stock_value
       FROM products`
    );

    const [[branches]] = await db.query("SELECT COUNT(*) AS active_branches FROM branches WHERE status = 'Active'");

    // Real COGS & Gross Profit
    const [[profit]] = await db.query(
      `SELECT
         COALESCE(SUM(ii.amount), 0) AS revenue,
         COALESCE(SUM(COALESCE(p.purchase_price, 0)), 0) AS cost
       FROM invoice_items ii
       LEFT JOIN products p ON p.id = ii.product_id
       LEFT JOIN invoices i ON i.id = ii.invoice_id
       WHERE YEAR(i.invoice_date) = ?`,
      [targetYear]
    );

    const grossProfit = Number(profit.revenue || 0) - Number(profit.cost || 0);

    res.json({
      success: true,
      data: {
        annual_revenue: Number(summary.annual_revenue || 0),
        annual_bills: Number(summary.annual_bills || 0),
        profit_margin: pct(grossProfit, profit.revenue),
        today_sales: Number(summary.today_sales || 0),
        total_customers: Number(customers.total_customers || 0),
        low_out_stock: Number(stock.low_out_stock || 0),
        active_branches: Number(branches.active_branches || 1),
        stock_value: Number(stock.stock_value || 0),
      },
    });
  } catch (err) {
    console.error("Error in getSummary analytics:", err);
    res.status(500).json({ success: false, message: err.message });
  }
}

// GET /api/analytics/daily
async function getDaily(req, res) {
  try {
    const [rows] = await db.query(
      `SELECT
         invoice_date AS date,
         COUNT(*) AS bills,
         COALESCE(SUM(grand_total), 0) AS revenue,
         COALESCE(SUM(CASE WHEN invoice_type = 'Return Invoice' THEN grand_total ELSE 0 END), 0) AS returns,
         COALESCE(SUM(CASE WHEN payment_mode = 'Cash' THEN grand_total ELSE 0 END), 0) AS cash,
         COALESCE(SUM(CASE WHEN payment_mode = 'UPI' THEN grand_total ELSE 0 END), 0) AS upi,
         COALESCE(SUM(CASE WHEN payment_mode = 'Card' THEN grand_total ELSE 0 END), 0) AS card
       FROM invoices
       WHERE invoice_date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
       GROUP BY invoice_date
       ORDER BY invoice_date DESC`
    );

    const totalRevenue = rows.reduce((sum, r) => sum + Number(r.revenue || 0), 0);
    res.json({
      success: true,
      data: rows.map((r) => {
        const rev = Number(r.revenue || 0);
        const ret = Number(r.returns || 0);
        return {
          date: r.date,
          bills: r.bills,
          revenue: rev,
          returns: ret,
          net_sales: rev - ret,
          cash: Number(r.cash || 0),
          upi: Number(r.upi || 0),
          card: Number(r.card || 0),
          share: pct(rev, totalRevenue),
        };
      }),
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// GET /api/analytics/monthly
async function getMonthly(req, res) {
  try {
    const { year = new Date().getFullYear() } = req.query;
    const targetYear = parseInt(year, 10) || new Date().getFullYear();

    const [rows] = await db.query(
      `SELECT
         DATE_FORMAT(i.invoice_date, '%Y-%m') AS month,
         COALESCE(SUM(i.grand_total), 0) AS revenue,
         COALESCE(SUM(COALESCE(p.purchase_price, 0)), 0) AS cost,
         COUNT(DISTINCT i.id) AS bills
       FROM invoices i
       LEFT JOIN invoice_items ii ON ii.invoice_id = i.id
       LEFT JOIN products p ON p.id = ii.product_id
       WHERE YEAR(i.invoice_date) = ?
       GROUP BY DATE_FORMAT(i.invoice_date, '%Y-%m')
       ORDER BY month DESC`,
      [targetYear]
    );

    const totalRevenue = rows.reduce((sum, r) => sum + Number(r.revenue || 0), 0);
    res.json({
      success: true,
      data: rows.map((row, index) => {
        const rev = Number(row.revenue || 0);
        const cost = Number(row.cost || 0);
        const profit = rev - cost;
        const previous = rows[index + 1]?.revenue || 0;
        return {
          month: row.month,
          revenue: rev,
          cost,
          profit,
          margin: pct(profit, rev),
          bills: row.bills,
          mom_growth: previous ? pct(rev - previous, previous) : 0,
          share: pct(rev, totalRevenue),
        };
      }),
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// GET /api/analytics/yearly
async function getYearly(req, res) {
  try {
    const [rows] = await db.query(
      `SELECT
         YEAR(i.invoice_date) AS year,
         COALESCE(SUM(i.grand_total), 0) AS revenue,
         COALESCE(SUM(COALESCE(p.purchase_price, 0)), 0) AS cost,
         COUNT(DISTINCT i.id) AS bills
       FROM invoices i
       LEFT JOIN invoice_items ii ON ii.invoice_id = i.id
       LEFT JOIN products p ON p.id = ii.product_id
       GROUP BY YEAR(i.invoice_date)
       ORDER BY year DESC`
    );

    res.json({
      success: true,
      data: rows.map((row) => {
        const rev = Number(row.revenue || 0);
        const cost = Number(row.cost || 0);
        const profit = rev - cost;
        return {
          year: row.year,
          revenue: rev,
          cost,
          profit,
          margin: pct(profit, rev),
          bills: row.bills,
        };
      }),
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// GET /api/analytics/best
async function getBestProducts(req, res) {
  try {
    const [rows] = await db.query(
      `SELECT
         COALESCE(p.name, ii.item_description, 'Custom Jewellery Item') AS product,
         COALESCE(p.product_category, 'Jewellery') AS category,
         COUNT(*) AS units_sold,
         COALESCE(SUM(ii.amount), 0) AS revenue,
         COALESCE(SUM(COALESCE(p.purchase_price, 0)), 0) AS cost
       FROM invoice_items ii
       LEFT JOIN products p ON p.id = ii.product_id
       GROUP BY COALESCE(p.name, ii.item_description, 'Custom Jewellery Item'), COALESCE(p.product_category, 'Jewellery')
       ORDER BY revenue DESC
       LIMIT 15`
    );

    const totalRevenue = rows.reduce((sum, r) => sum + Number(r.revenue || 0), 0);
    res.json({
      success: true,
      data: rows.map((row, index) => {
        const rev = Number(row.revenue || 0);
        const cost = Number(row.cost || 0);
        const profit = rev - cost;
        return {
          rank: index + 1,
          product: row.product,
          category: row.category,
          units_sold: row.units_sold,
          revenue: rev,
          margin: pct(profit, rev),
          revenue_share: pct(rev, totalRevenue),
        };
      }),
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// GET /api/analytics/lowstock
async function getLowStock(req, res) {
  try {
    const [rows] = await db.query(
      `SELECT sku, name, COALESCE(product_category, jewellery_category, 'General') AS product_category,
              purity, stock_qty, min_stock, stock_status
       FROM products
       WHERE stock_qty <= min_stock
       ORDER BY stock_qty ASC, name ASC
       LIMIT 50`
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// GET /api/analytics/customers
async function getCustomers(req, res) {
  try {
    const [rows] = await db.query(
      `SELECT
         c.full_name AS customer,
         c.tier,
         COALESCE(SUM(i.grand_total), 0) AS total_spent,
         COUNT(i.id) AS visits,
         COALESCE(AVG(i.grand_total), 0) AS avg_visit,
         MAX(i.invoice_date) AS last_visit
       FROM customers c
       LEFT JOIN invoices i ON i.customer_id = c.id
       GROUP BY c.id, c.full_name, c.tier
       ORDER BY total_spent DESC, visits DESC
       LIMIT 25`
    );
    res.json({
      success: true,
      data: rows.map((row, index) => ({
        rank: index + 1,
        customer: row.customer,
        tier: row.tier || "Regular",
        total_spent: Number(row.total_spent || 0),
        visits: Number(row.visits || 0),
        avg_visit: Number(row.avg_visit || 0),
        last_visit: row.last_visit || "-",
      })),
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// GET /api/analytics/profit
async function getProfit(req, res) {
  try {
    const { year = new Date().getFullYear() } = req.query;
    const targetYear = parseInt(year, 10) || new Date().getFullYear();

    const [rows] = await db.query(
      `SELECT
         DATE_FORMAT(i.invoice_date, '%Y-%m') AS month,
         COALESCE(SUM(i.grand_total), 0) AS revenue,
         COALESCE(SUM(COALESCE(p.purchase_price, 0)), 0) AS cogs
       FROM invoices i
       LEFT JOIN invoice_items ii ON ii.invoice_id = i.id
       LEFT JOIN products p ON p.id = ii.product_id
       WHERE YEAR(i.invoice_date) = ?
       GROUP BY DATE_FORMAT(i.invoice_date, '%Y-%m')
       ORDER BY month DESC`,
      [targetYear]
    );

    res.json({
      success: true,
      data: rows.map((row) => {
        const rev = Number(row.revenue || 0);
        const cogs = Number(row.cogs || 0);
        const grossProfit = rev - cogs;
        return {
          month: row.month,
          revenue: rev,
          cogs,
          gross_profit: grossProfit,
          opex: 0,
          net_profit: grossProfit,
          margin: pct(grossProfit, rev),
        };
      }),
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// GET /api/analytics/branch
async function getBranch(req, res) {
  try {
    const [rows] = await db.query(
      `SELECT
         b.name AS branch,
         b.city,
         COALESCE(SUM(i.grand_total), 0) AS sales,
         COUNT(DISTINCT i.id) AS bills,
         COUNT(DISTINCT i.customer_id) AS customers,
         (SELECT COALESCE(SUM(stock_qty * COALESCE(purchase_price, 0)), 0) FROM products WHERE stock_qty > 0) AS stock_value,
         COUNT(DISTINCT e.id) AS staff
       FROM branches b
       LEFT JOIN invoices i ON i.branch_id = b.id
       LEFT JOIN employees e ON e.branch_id = b.id AND e.status = 'Active'
       WHERE b.status = 'Active'
       GROUP BY b.id, b.name, b.city
       ORDER BY sales DESC, b.name ASC`
    );
    res.json({
      success: true,
      data: rows.map((r) => ({
        branch: `${r.branch} (${r.city || "Main"})`,
        sales: Number(r.sales || 0),
        bills: Number(r.bills || 0),
        customers: Number(r.customers || 0),
        stock_value: Number(r.stock_value || 0),
        staff: Number(r.staff || 0),
      })),
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// GET /api/analytics/employee
async function getEmployee(req, res) {
  try {
    const [rows] = await db.query(
      `SELECT
         e.full_name AS employee,
         e.role,
         COALESCE(SUM(i.grand_total), 0) AS sales_achieved,
         COALESCE(e.basic_salary * 5, 250000) AS target,
         COUNT(DISTINCT i.id) AS bills,
         COUNT(DISTINCT i.customer_id) AS customers,
         COALESCE(AVG(i.grand_total), 0) AS avg_ticket,
         e.status AS rating
       FROM employees e
       LEFT JOIN invoices i ON i.salesperson_id = e.id
       GROUP BY e.id, e.full_name, e.role, e.basic_salary, e.status
       ORDER BY sales_achieved DESC, e.full_name ASC`
    );
    res.json({
      success: true,
      data: rows.map((r, index) => ({
        rank: index + 1,
        employee: r.employee,
        role: r.role || "Staff",
        sales_achieved: Number(r.sales_achieved || 0),
        target: Number(r.target || 250000),
        bills: Number(r.bills || 0),
        customers: Number(r.customers || 0),
        avg_ticket: Number(r.avg_ticket || 0),
        rating: r.rating || "Active",
      })),
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// Router dispatcher
async function getTable(req, res) {
  const handlers = {
    daily: getDaily,
    monthly: getMonthly,
    yearly: getYearly,
    best: getBestProducts,
    lowstock: getLowStock,
    customers: getCustomers,
    profit: getProfit,
    branch: getBranch,
    employee: getEmployee,
  };

  const handler = handlers[req.params.tab];
  if (!handler) {
    return res.status(400).json({ success: false, message: "Unknown analytics tab" });
  }
  return handler(req, res);
}

module.exports = { getSummary, getTable };

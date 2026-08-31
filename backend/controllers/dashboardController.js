const db = require("../config/db");

// Helper — check if table exists
async function tableExists(tableName) {
  const [rows] = await db.query(
    "SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?",
    [tableName]
  );
  return rows.length > 0;
}

// GET /api/dashboard/kpis
async function getKpis(req, res) {
  const branch_id = req.user.branch_id;
  try {
    const today = new Date().toISOString().split("T")[0];
    const result = {
      today_sales:     0,
      bills_today:     0,
      total_customers: 0,
      pending_repairs: 0,
      stock_items:     0,
      gold_in_stock:   "0.000 kg",
    };

    if (await tableExists("customers")) {
      const [[c]] = await db.query(
        "SELECT COUNT(*) AS total_customers FROM customers WHERE status IN ('Active','ACTIVE')"
      );
      result.total_customers = c.total_customers || 0;
    }

    if (await tableExists("invoices")) {
      const [[sales]] = await db.query(
        `SELECT COALESCE(SUM(grand_total),0) AS today_sales, COUNT(*) AS bills_today
         FROM invoices WHERE DATE(invoice_date) = ?`,
        [today]
      );
      result.today_sales = sales.today_sales || 0;
      result.bills_today  = sales.bills_today  || 0;
    }

    if (await tableExists("repair_jobs")) {
      const [[repairs]] = await db.query(
        "SELECT COUNT(*) AS pending_repairs FROM repair_jobs WHERE status IN ('Pending','In Progress','Overdue')"
      );
      result.pending_repairs = repairs.pending_repairs || 0;
    }

    if (await tableExists("products")) {
      const [[stock]] = await db.query(
        `SELECT COUNT(*) AS stock_items, COALESCE(SUM(gross_weight * stock_qty),0) AS gold_weight
         FROM products WHERE stock_qty > 0`
      );
      result.stock_items   = stock.stock_items || 0;
      result.gold_in_stock = `${(parseFloat(stock.gold_weight || 0) / 1000).toFixed(3)} kg`;
    }

    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// GET /api/dashboard/recent-bills
async function getRecentBills(req, res) {
  const branch_id = req.user.branch_id;
  try {
    if (!(await tableExists("invoices"))) {
      return res.json({ success: true, data: [] });
    }
    const [rows] = await db.query(
      `SELECT i.invoice_no, COALESCE(c.full_name,'Walk-in') AS customer,
              i.grand_total AS amount, i.payment_mode, i.status
       FROM invoices i
       LEFT JOIN customers c ON i.customer_id = c.id
       ORDER BY i.created_at DESC LIMIT 10`
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// GET /api/dashboard/alerts
async function getAlerts(req, res) {
  try {
    const alerts = [];

    // Low stock alerts
    if (await tableExists("products")) {
      const [lowStock] = await db.query(
        `SELECT name, sku, stock_qty
         FROM products
         WHERE stock_qty <= min_stock AND stock_qty >= 0
         LIMIT 5`
      );
      lowStock.forEach(p => alerts.push({
        type:  "low_stock",
        title: "Low Stock Alert",
        meta:  `${p.name} (${p.sku}) — only ${p.stock_qty} unit(s) left`,
        color: "#e74c3c",
      }));
    }

    // Repair overdue
    if (await tableExists("repair_jobs")) {
      const [overdue] = await db.query(
        `SELECT rj.job_id, COALESCE(c.full_name, 'Customer') AS full_name
         FROM repair_jobs rj
         LEFT JOIN customers c ON rj.customer_id = c.id
         WHERE rj.promised_date < CURDATE()
           AND rj.status NOT IN ('Delivered')
         LIMIT 3`
      );
      overdue.forEach(r => alerts.push({
        type:  "repair_overdue",
        title: "Repair Overdue",
        meta:  `${r.job_id} — ${r.full_name}`,
        color: "#f39c12",
      }));
    }

    // EMI due today
    if (await tableExists("emi_plans")) {
      const [emiDue] = await db.query(
        `SELECT ep.plan_id, COALESCE(c.full_name, 'Customer') AS full_name, ep.emi_amount
         FROM emi_plans ep
         LEFT JOIN customers c ON ep.customer_id = c.id
         WHERE DATE(ep.next_due_date) = CURDATE()
           AND ep.status = 'Active'
         LIMIT 3`
      );
      emiDue.forEach(e => alerts.push({
        type:  "emi_due",
        title: "EMI Due Today",
        meta:  `${e.full_name} — ₹${e.emi_amount} due today`,
        color: "#3498db",
      }));
    }

    res.json({ success: true, data: alerts });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

module.exports = { getKpis, getRecentBills, getAlerts };

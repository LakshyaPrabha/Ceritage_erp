const db = require("../config/db");

async function getKpis(req, res) {
  try {
    const today = new Date().toISOString().split("T")[0];

    const [[sales]]     = await db.query(
      "SELECT COALESCE(SUM(grand_total),0) AS today_sales, COUNT(*) AS bills_today FROM invoices WHERE DATE(invoice_date) = ?", [today]
    );
    const [[customers]] = await db.query("SELECT COUNT(*) AS total_customers FROM customers");
    const [[repairs]]   = await db.query("SELECT COUNT(*) AS pending_repairs FROM repair_jobs WHERE status IN ('Pending','In Progress','Overdue')");
    const [[stock]]     = await db.query("SELECT COUNT(*) AS stock_items, COALESCE(SUM(gross_weight * stock_qty),0) AS gold_weight FROM products");

    res.json({
      success: true,
      data: {
        today_sales:      sales.today_sales,
        bills_today:      sales.bills_today,
        total_customers:  customers.total_customers,
        pending_repairs:  repairs.pending_repairs,
        stock_items:      stock.stock_items,
        gold_in_stock:    `${(stock.gold_weight / 1000).toFixed(2)} kg`,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

async function getRecentBills(req, res) {
  try {
    const [rows] = await db.query(
      `SELECT i.invoice_no, c.full_name AS customer, i.grand_total AS amount,
              i.payment_mode, i.status
       FROM invoices i
       LEFT JOIN customers c ON i.customer_id = c.id
       ORDER BY i.created_at DESC LIMIT 10`
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

async function getAlerts(req, res) {
  try {
    const alerts = [];

    // Low stock
    const [lowStock] = await db.query(
      "SELECT name, sku, stock_qty FROM products WHERE stock_qty <= min_stock AND stock_qty > 0 LIMIT 5"
    );
    lowStock.forEach(p => alerts.push({ type:"low_stock", title:"Low Stock Alert", meta:`${p.name} (${p.sku}) — only ${p.stock_qty} pcs left`, color:"#e74c3c" }));

    // Repair overdue
    const [overdue] = await db.query(
      `SELECT rj.job_id, c.full_name FROM repair_jobs rj
       LEFT JOIN customers c ON rj.customer_id = c.id
       WHERE rj.promised_date < CURDATE() AND rj.status NOT IN ('Delivered') LIMIT 3`
    );
    overdue.forEach(r => alerts.push({ type:"repair_overdue", title:"Repair Overdue", meta:`${r.job_id} — ${r.full_name}`, color:"#f39c12" }));

    // EMI due today
    const [emiDue] = await db.query(
      `SELECT ep.plan_id, c.full_name, ep.emi_amount FROM emi_plans ep
       LEFT JOIN customers c ON ep.customer_id = c.id
       WHERE DATE(ep.next_due_date) = CURDATE() AND ep.status = 'Active' LIMIT 3`
    );
    emiDue.forEach(e => alerts.push({ type:"emi_due", title:"EMI Due", meta:`${e.full_name} — ₹${e.emi_amount} due today`, color:"#3498db" }));

    res.json({ success: true, data: alerts });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

module.exports = { getKpis, getRecentBills, getAlerts };

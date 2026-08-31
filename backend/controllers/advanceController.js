const db = require("../config/db");

// Ensure rate_locks table exists
async function ensureTable() {
  await db.query(
    `CREATE TABLE IF NOT EXISTS rate_locks (
      id              INT AUTO_INCREMENT PRIMARY KEY,
      order_id        VARCHAR(30),
      customer_id     INT,
      customer_name   VARCHAR(150),
      item_description VARCHAR(255),
      locked_rate     DECIMAL(10,2) NOT NULL,
      lock_date       DATE NOT NULL,
      valid_till      DATE,
      advance_paid    DECIMAL(12,2) DEFAULT 0,
      weight_g        DECIMAL(10,3) DEFAULT 0,
      locked_value    DECIMAL(14,2) DEFAULT 0,
      status          ENUM('Active','Expired','Redeemed','Cancelled') DEFAULT 'Active',
      notes           TEXT,
      created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL
    )`
  );
}

// ─── KPIs ─────────────────────────────────────────────────────────────────────
async function getKpis(req, res) {
  try {
    await ensureTable();
    const [[kpis]] = await db.query(
      `SELECT
         COUNT(CASE WHEN status='Active' THEN 1 END)         AS active_locks,
         COUNT(*)                                            AS total_orders,
         COALESCE(SUM(CASE WHEN status='Active' THEN locked_value END), 0) AS locked_value,
         COALESCE(SUM(CASE WHEN status='Active' THEN advance_paid END), 0) AS advance_collected
       FROM rate_locks`
    );

    // Current 22K rate
    const [[rateRow]] = await db.query(
      `SELECT price_per_gram AS rate_22k
       FROM metal_benchmark_rates
       WHERE metal = 'GOLD' AND purity = '916'
       ORDER BY fetched_at DESC LIMIT 1`
    ).catch(() => [[{ rate_22k: null }]]);

    res.json({ success: true, data: { ...kpis, current_rate_22k: rateRow?.rate_22k || null } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// ─── LIST RATE LOCKS ──────────────────────────────────────────────────────────
async function getAll(req, res) {
  try {
    await ensureTable();
    const { status } = req.query;
    let where = "WHERE 1=1";
    const params = [];
    if (status) { where += " AND rl.status = ?"; params.push(status); }

    // Auto-expire past valid_till
    await db.query(
      "UPDATE rate_locks SET status='Expired' WHERE valid_till < CURDATE() AND status='Active'"
    );

    // Get current 22K rate for P&L calculation
    const [[rateRow]] = await db.query(
      `SELECT price_per_gram AS rate_22k FROM metal_benchmark_rates
       WHERE metal='GOLD' AND purity='916' ORDER BY fetched_at DESC LIMIT 1`
    ).catch(() => [[{ rate_22k: 0 }]]);

    const currentRate = parseFloat(rateRow?.rate_22k || 0);

    const [rows] = await db.query(
      `SELECT rl.*, c.full_name AS customer_full_name
       FROM rate_locks rl
       LEFT JOIN customers c ON rl.customer_id = c.id
       ${where} ORDER BY rl.created_at DESC`,
      params
    );

    // Add P&L for shop
    const enriched = rows.map(r => ({
      ...r,
      current_rate: currentRate,
      pl_per_gram: currentRate ? (currentRate - parseFloat(r.locked_rate)).toFixed(2) : "—",
      pl_total: currentRate && r.weight_g
        ? ((currentRate - parseFloat(r.locked_rate)) * parseFloat(r.weight_g)).toFixed(2)
        : "—",
    }));

    res.json({ success: true, data: enriched });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// ─── CREATE RATE LOCK ─────────────────────────────────────────────────────────
async function create(req, res) {
  try {
    await ensureTable();
    const {
      order_id, customer_id, customer_name, item_description,
      locked_rate, lock_date, valid_till, advance_paid, weight_g, notes,
    } = req.body;

    const locked_value = (parseFloat(weight_g) || 0) * (parseFloat(locked_rate) || 0);

    const [result] = await db.query(
      `INSERT INTO rate_locks
         (order_id, customer_id, customer_name, item_description,
          locked_rate, lock_date, valid_till, advance_paid, weight_g, locked_value, notes)
       VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
      [order_id || null, customer_id || null, customer_name || null,
       item_description || null, locked_rate, lock_date || new Date().toISOString().slice(0, 10),
       valid_till || null, advance_paid || 0, weight_g || 0, locked_value, notes || null]
    );

    res.status(201).json({ success: true, data: { id: result.insertId } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// ─── UPDATE STATUS ────────────────────────────────────────────────────────────
async function updateStatus(req, res) {
  try {
    const { status } = req.body;
    await db.query("UPDATE rate_locks SET status = ? WHERE id = ?", [status, req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

module.exports = { getKpis, getAll, create, updateStatus };

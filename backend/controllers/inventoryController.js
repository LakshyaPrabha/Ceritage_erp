const db = require("../config/db");

// stock_status computed from stock_qty and min_stock
const STOCK_STATUS_EXPR = `
  CASE
    WHEN stock_qty <= 0 THEN 'Out of Stock'
    WHEN stock_qty <= min_stock_qty THEN 'Low Stock'
    ELSE 'In Stock'
  END
`;

// ─── KPIs ─────────────────────────────────────────────────────────────────────
async function getKpis(req, res) {
  try {
    const [[kpis]] = await db.query(
  `SELECT
     COUNT(*) AS total_items,
     COALESCE(SUM(mrp * stock_qty), 0) AS stock_valuation,
     SUM(
       CASE
         WHEN stock_qty > 0 AND stock_qty <= min_stock_qty
         THEN 1 ELSE 0
       END
     ) AS low_stock,
     SUM(
       CASE
         WHEN stock_qty <= 0
         THEN 1 ELSE 0
       END
     ) AS out_of_stock
   FROM products`
);
    res.json({ success: true, data: kpis });
  } catch (err) {
    console.error("inventoryController.getKpis ERROR:", err.message);
    res.status(500).json({ success: false, message: err.message });
  }
}

// ─── LIVE STOCK ───────────────────────────────────────────────────────────────
async function getLiveStock(req, res) {
  try {
    const { search, category, status, page = 1, limit = 200 } = req.query;
    const offset = (page - 1) * limit;
    let where = "WHERE 1=1";
    const params = [];
    if (search) {
      where += " AND (sku LIKE ? OR name LIKE ?)";
      params.push(`%${search}%`, `%${search}%`);
    }
    if (category) {
      where += " AND jewellery_category = ?";
      params.push(category);
    }
    if (status === "In Stock") {
  where += " AND stock_qty > min_stock_qty";
} else if (status === "Low Stock") {
  where += " AND stock_qty > 0 AND stock_qty <= min_stock_qty";
} else if (status === "Out of Stock") {
  where += " AND stock_qty <= 0";
}

    const [rows] = await db.query(
      `SELECT
  id,
  sku,
  name,
  jewellery_category,
  product_category,
  purity,
  gross_weight,
  net_weight,
  stock_qty,
  min_stock_qty AS min_stock,
  mrp AS selling_price,
  mrp,
  huid,
  COALESCE(mrp * stock_qty, 0) AS stock_value,
  ${STOCK_STATUS_EXPR} AS stock_status
       FROM products
       ${where}
       ORDER BY
         CASE WHEN stock_qty <= 0 THEN 0
              WHEN stock_qty <= min_stock_qty THEN 1
              ELSE 2 END ASC,
         name ASC
       LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), parseInt(offset)]
    );

    const [[{ total }]] = await db.query(
      `SELECT COUNT(*) AS total FROM products ${where}`, params
    );

    res.json({ success: true, data: rows, total });
  } catch (err) {
    console.error("inventoryController.getLiveStock ERROR:", err.message);
    res.status(500).json({ success: false, message: err.message });
  }
}

// ─── ADJUSTMENTS ──────────────────────────────────────────────────────────────
async function getAdjustments(req, res) {
  try {
    // Ensure table exists
    await db.query(
      `CREATE TABLE IF NOT EXISTS stock_adjustments (
        id          INT AUTO_INCREMENT PRIMARY KEY,
        product_id  INT,
        adj_type    ENUM('Add','Remove','Damage','Loss','Correction') DEFAULT 'Add',
        qty_change  INT NOT NULL,
        reason      VARCHAR(255),
        adjusted_by VARCHAR(100),
        created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL
      )`
    );

    const [rows] = await db.query(
      `SELECT sa.*, p.name AS product_name, p.sku
       FROM stock_adjustments sa
       LEFT JOIN products p ON sa.product_id = p.id
       ORDER BY sa.created_at DESC LIMIT 200`
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

async function createAdjustment(req, res) {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const { product_id, adj_type, qty_change, reason, adjusted_by } = req.body;

    if (!product_id || !qty_change) {
      return res.status(400).json({ success: false, message: "product_id and qty_change required" });
    }

    await conn.query(
      `CREATE TABLE IF NOT EXISTS stock_adjustments (
        id          INT AUTO_INCREMENT PRIMARY KEY,
        product_id  INT,
        adj_type    ENUM('Add','Remove','Damage','Loss','Correction') DEFAULT 'Add',
        qty_change  INT NOT NULL,
        reason      VARCHAR(255),
        adjusted_by VARCHAR(100),
        created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL
      )`
    );

    const [result] = await conn.query(
      `INSERT INTO stock_adjustments (product_id, adj_type, qty_change, reason, adjusted_by)
       VALUES (?, ?, ?, ?, ?)`,
      [product_id, adj_type || "Add", qty_change, reason || null, adjusted_by || "Admin"]
    );

    // +/- stock based on type
    const isDeduction = ["Remove", "Damage", "Loss"].includes(adj_type);
    const change = isDeduction ? -Math.abs(parseInt(qty_change)) : Math.abs(parseInt(qty_change));

    await conn.query(
      `UPDATE products
       SET stock_qty = GREATEST(0, stock_qty + ?)
       WHERE id = ?`,
      [change, product_id]
    );

    await conn.commit();
    res.status(201).json({ success: true, data: { id: result.insertId } });
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ success: false, message: err.message });
  } finally {
    conn.release();
  }
}

// ─── MOVEMENT LOG ─────────────────────────────────────────────────────────────
async function getMovementLog(req, res) {
  try {
    const { type } = req.query;

    // Sales movements
    const [sales] = await db.query(
      `SELECT
         i.invoice_date  AS date,
         p.sku, p.name   AS item,
         'Sale'          AS move_type,
         -1              AS qty_change,
         'Counter'       AS from_loc,
         'Customer'      AS to_loc,
         i.invoice_no    AS reference,
         'System'        AS by_user
       FROM invoice_items ii
       JOIN invoices i ON ii.invoice_id = i.id
       LEFT JOIN products p ON ii.product_id = p.id
       WHERE ii.product_id IS NOT NULL
       ORDER BY i.invoice_date DESC
       LIMIT 50`
    );

    // Stock adjustments
    let adjs = [];
    try {
      const [adjRows] = await db.query(
        `SELECT
           sa.created_at   AS date,
           p.sku, p.name   AS item,
           sa.adj_type     AS move_type,
           sa.qty_change,
           'Stock'         AS from_loc,
           'Adjustment'    AS to_loc,
           CONCAT('ADJ-', sa.id) AS reference,
           sa.adjusted_by  AS by_user
         FROM stock_adjustments sa
         LEFT JOIN products p ON sa.product_id = p.id
         ORDER BY sa.created_at DESC
         LIMIT 50`
      );
      adjs = adjRows;
    } catch { /* table might not exist yet */ }

    let rows = [...sales, ...adjs];
    rows.sort((a, b) => new Date(b.date) - new Date(a.date));

    if (type) rows = rows.filter(r => r.move_type === type);

    res.json({ success: true, data: rows.slice(0, 100) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// ─── LOW STOCK ────────────────────────────────────────────────────────────────
async function getLowStock(req, res) {
  try {
    const [rows] = await db.query(
      `SELECT
         id, sku, name, jewellery_category,
         stock_qty,min_stock_qty AS min_stock,mrp AS selling_price,
         ${STOCK_STATUS_EXPR} AS stock_status
       FROM products
       WHERE stock_qty <= min_stock_qty
       ORDER BY stock_qty ASC`
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// ─── DAMAGED STOCK ────────────────────────────────────────────────────────────
async function getDamagedStock(req, res) {
  try {
    let rows = [];
    try {
      const [result] = await db.query(
        `SELECT
           sa.*,
           p.name          AS product_name,
           p.sku,
           p.mrp AS selling_price,
           (p.mrp * ABS(sa.qty_change)) AS value_lost
         FROM stock_adjustments sa
         LEFT JOIN products p ON sa.product_id = p.id
         WHERE sa.adj_type IN ('Damage','Loss')
         ORDER BY sa.created_at DESC`
      );
      rows = result;
    } catch { /* table not yet created */ }
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

module.exports = {
  getKpis,
  getLiveStock,
  getAdjustments,
  createAdjustment,
  getMovementLog,
  getLowStock,
  getDamagedStock,
};

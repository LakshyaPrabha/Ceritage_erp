const db = require("../config/db");

async function getAll(req, res) {
  try {
    const { search, category, purity, status, page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;
    let where = "WHERE 1=1";
    const params = [];

    if (search) {
      where += " AND (p.name LIKE ? OR p.sku LIKE ? OR p.huid LIKE ?)";
      const s = `%${search}%`;
      params.push(s, s, s);
    }
    if (category) { where += " AND p.product_category = ?"; params.push(category); }
    if (purity)   { where += " AND p.purity = ?";           params.push(purity); }
    if (status)   { where += " AND p.stock_status = ?";     params.push(status); }

    const [rows] = await db.query(
      `SELECT * FROM products ${where} ORDER BY p.created_at DESC LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), parseInt(offset)]
    );
    const [[{ total }]] = await db.query(
      `SELECT COUNT(*) AS total FROM products p ${where}`, params
    );
    res.json({ success: true, data: rows, total });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

async function getById(req, res) {
  try {
    const [rows] = await db.query("SELECT * FROM products WHERE id = ?", [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ success: false, message: "Product not found" });
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

async function create(req, res) {
  const {
    name, sku, product_code, jewellery_category, product_category,
    purity, gross_weight, stone_weight, net_weight, wastage_pct,
    making_per_gram, making_fixed, purchase_price, selling_price,
    mrp, discount_pct, huid, hallmark, hsn_code, supplier_id,
    stock_qty = 1, min_stock = 2, description,
  } = req.body;

  if (!name || !sku || !purity) {
    return res.status(400).json({ success: false, message: "name, sku, purity required" });
  }

  try {
    const [result] = await db.query(
      `INSERT INTO products
       (name, sku, product_code, jewellery_category, product_category, purity,
        gross_weight, stone_weight, net_weight, wastage_pct, making_per_gram,
        making_fixed, purchase_price, selling_price, mrp, discount_pct,
        huid, hallmark, hsn_code, supplier_id, stock_qty, min_stock, description)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [name, sku, product_code || null, jewellery_category, product_category,
       purity, gross_weight, stone_weight || 0, net_weight, wastage_pct || 0,
       making_per_gram || 0, making_fixed || 0, purchase_price || 0,
       selling_price || 0, mrp || 0, discount_pct || 0, huid || null,
       hallmark || "Hallmarked (BIS)", hsn_code || "7113",
       supplier_id || null, stock_qty, min_stock, description || null]
    );
    res.status(201).json({ success: true, message: "Product created", data: { id: result.insertId } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

async function update(req, res) {
  const fields = req.body;
  const keys = Object.keys(fields).map(k => `${k} = ?`).join(", ");
  const values = [...Object.values(fields), req.params.id];
  try {
    await db.query(`UPDATE products SET ${keys} WHERE id = ?`, values);
    res.json({ success: true, message: "Product updated" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

async function remove(req, res) {
  try {
    await db.query("DELETE FROM products WHERE id = ?", [req.params.id]);
    res.json({ success: true, message: "Product deleted" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

async function getKpis(req, res) {
  try {
    const [[kpis]] = await db.query(
      `SELECT
         COUNT(*) AS total_products,
         SUM(CASE WHEN stock_qty > 0 THEN 1 ELSE 0 END) AS in_stock,
         SUM(CASE WHEN stock_qty <= min_stock AND stock_qty > 0 THEN 1 ELSE 0 END) AS low_stock,
         SUM(CASE WHEN stock_qty = 0 THEN 1 ELSE 0 END) AS out_of_stock,
         SUM(gross_weight * stock_qty) AS total_gold_weight
       FROM products`
    );
    res.json({ success: true, data: kpis });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// Stones
async function getStones(req, res) {
  try {
    const [rows] = await db.query("SELECT * FROM stones ORDER BY created_at DESC");
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

async function createStone(req, res) {
  const { name, stone_type, color, shape, size, clarity, cut, ratti, carat,
          weight_g, pieces, purchase_price, selling_price, certificate_no,
          supplier_id, origin } = req.body;
  try {
    const [result] = await db.query(
      `INSERT INTO stones (name, stone_type, color, shape, size, clarity, cut, ratti, carat,
       weight_g, pieces, purchase_price, selling_price, certificate_no, supplier_id, origin)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [name, stone_type, color||null, shape||null, size||null, clarity||null, cut||null,
       ratti||0, carat||0, weight_g||0, pieces||0, purchase_price||0,
       selling_price||0, certificate_no||null, supplier_id||null, origin||null]
    );
    res.status(201).json({ success: true, data: { id: result.insertId } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

module.exports = { getAll, getById, create, update, remove, getKpis, getStones, createStone };

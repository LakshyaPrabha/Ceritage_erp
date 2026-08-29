const db = require("../config/db");

// Generate unique product code
async function generateProductCode() {
  const [[{ count }]] = await db.query("SELECT COUNT(*) AS count FROM products");
  const year = new Date().getFullYear().toString().slice(-2);
  const num  = String(count + 1).padStart(5, "0");
  return `PRD${year}${num}`;
}

// GET /api/products/kpis
async function getKpis(req, res) {
  const branch_id = req.user.branch_id;
  try {
    const [[kpis]] = await db.query(`
      SELECT
        COUNT(*)                                                       AS total_products,
        SUM(CASE WHEN stock_qty > 0 THEN 1 ELSE 0 END)               AS in_stock,
        SUM(CASE WHEN stock_qty <= min_stock_qty AND stock_qty > 0 THEN 1 ELSE 0 END) AS low_stock,
        SUM(CASE WHEN stock_qty = 0 THEN 1 ELSE 0 END)               AS out_of_stock,
        SUM(gross_weight * stock_qty)                                 AS total_gold_weight,
        SUM(mrp * stock_qty)                                          AS total_stock_value
      FROM products
      WHERE status = 'Active' AND branch_id = ?
    `, [branch_id]);
    res.json({ success: true, data: kpis });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// GET /api/products
async function getAll(req, res) {
  const branch_id = req.user.branch_id;
  try {
    const {
      search, category, jewellery_category,
      metal_type, purity, status,
      page = 1, limit = 100,
    } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);
    const conditions = ["p.branch_id = ?"];
    const params = [branch_id];

    if (search) {
      conditions.push("(p.name LIKE ? OR p.sku LIKE ? OR p.product_code LIKE ? OR p.huid LIKE ?)");
      const s = `%${search}%`;
      params.push(s, s, s, s);
    }
    if (category)           { conditions.push("p.product_category = ?");    params.push(category); }
    if (jewellery_category) { conditions.push("p.jewellery_category = ?");  params.push(jewellery_category); }
    if (metal_type)         { conditions.push("p.metal_type = ?");          params.push(metal_type); }
    if (purity)             { conditions.push("p.purity = ?");              params.push(purity); }
    if (status)             { conditions.push("p.status = ?");              params.push(status); }
    else                    { conditions.push("p.status = 'Active'"); }

    const whereClause = conditions.length > 0
      ? "WHERE " + conditions.join(" AND ")
      : "";

    const [rows] = await db.query(
      `SELECT
         p.id, p.product_code, p.name, p.sku,
         p.jewellery_category, p.product_category, p.metal_type, p.purity,
         p.gross_weight, p.stone_weight, p.net_weight,
         p.making_charges_type, p.making_charges, p.stone_charges,
         p.purchase_price, p.mrp, p.hsn_code,
         p.huid, p.hallmark_status, p.barcode,
         p.stock_qty, p.min_stock_qty, p.location,
         p.description, p.status, p.created_at,
         CASE
           WHEN p.stock_qty = 0              THEN 'Out of Stock'
           WHEN p.stock_qty <= p.min_stock_qty THEN 'Low Stock'
           ELSE 'In Stock'
         END AS stock_status
       FROM products p
       ${whereClause}
       ORDER BY p.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), offset]
    );

    const [[{ total }]] = await db.query(
      `SELECT COUNT(*) AS total FROM products p ${whereClause}`,
      params
    );

    res.json({
      success: true,
      data:    rows,
      total,
      page:    parseInt(page),
      limit:   parseInt(limit),
      pages:   Math.ceil(total / parseInt(limit)),
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// GET /api/products/:id
async function getById(req, res) {
  const branch_id = req.user.branch_id;
  try {
    const [rows] = await db.query(
      "SELECT * FROM products WHERE id = ? AND branch_id = ?",
      [req.params.id, branch_id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    // Fetch attached stones
    const [stones] = await db.query(
      "SELECT * FROM product_stones WHERE product_id = ?",
      [req.params.id]
    );

    res.json({ success: true, data: { ...rows[0], stones } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// POST /api/products
async function create(req, res) {
  const {
    name, sku, jewellery_category, product_category, metal_type, purity,
    gross_weight, stone_weight, net_weight,
    making_charges_type, making_charges, stone_charges,
    purchase_price, mrp, hsn_code, huid, hallmark_status,
    barcode, stock_qty, min_stock_qty, location,
    supplier_id, description, stones = [],
  } = req.body;

  // Required field checks
  if (!name || !name.trim()) {
    return res.status(400).json({ success: false, message: "Product name is required." });
  }
  if (!sku || !sku.trim()) {
    return res.status(400).json({ success: false, message: "SKU is required." });
  }
  if (!jewellery_category) {
    return res.status(400).json({ success: false, message: "Jewellery category is required." });
  }
  if (!product_category) {
    return res.status(400).json({ success: false, message: "Product category is required." });
  }
  if (!metal_type) {
    return res.status(400).json({ success: false, message: "Metal type is required." });
  }
  if (!purity) {
    return res.status(400).json({ success: false, message: "Purity is required." });
  }
  if (!gross_weight || parseFloat(gross_weight) <= 0) {
    return res.status(400).json({ success: false, message: "Gross weight must be greater than 0." });
  }
  if (!mrp || parseFloat(mrp) <= 0) {
    return res.status(400).json({ success: false, message: "MRP must be greater than 0." });
  }

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    // Check duplicate SKU — only within same branch
    const [existing] = await conn.query(
      "SELECT id FROM products WHERE sku = ? AND branch_id = ?",
      [sku.trim().toUpperCase(), req.user.branch_id]
    );
    if (existing.length > 0) {
      await conn.rollback();
      return res.status(409).json({ success: false, message: "A product with this SKU already exists." });
    }

    const product_code = await generateProductCode();
    const calcNetWeight = parseFloat(gross_weight) - parseFloat(stone_weight || 0);

    const [result] = await conn.query(
      `INSERT INTO products
         (branch_id, product_code, name, sku, jewellery_category, product_category,
          metal_type, purity, gross_weight, stone_weight, net_weight,
          making_charges_type, making_charges, stone_charges,
          purchase_price, mrp, hsn_code, huid, hallmark_status,
          barcode, stock_qty, min_stock_qty, location,
          supplier_id, description, created_by)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        req.user.branch_id,
        product_code,
        name.trim(),
        sku.trim().toUpperCase(),
        jewellery_category,
        product_category,
        metal_type,
        purity,
        parseFloat(gross_weight) || 0,
        parseFloat(stone_weight) || 0,
        calcNetWeight > 0 ? calcNetWeight : 0,
        making_charges_type || "per_gram",
        parseFloat(making_charges) || 0,
        parseFloat(stone_charges) || 0,
        parseFloat(purchase_price) || 0,
        parseFloat(mrp),
        hsn_code || "7113",
        huid ? huid.trim().toUpperCase() : null,
        hallmark_status || "Not Hallmarked",
        barcode || null,
        parseInt(stock_qty) || 1,
        parseInt(min_stock_qty) || 1,
        location || null,
        supplier_id || null,
        description || null,
        req.user?.id || null,
      ]
    );

    const productId = result.insertId;

    // Insert stones if provided
    if (stones.length > 0) {
      for (const stone of stones) {
        await conn.query(
          `INSERT INTO product_stones
             (product_id, stone_type, stone_name, pieces, weight_ct, quality, color, shape, rate, total_value)
           VALUES (?,?,?,?,?,?,?,?,?,?)`,
          [
            productId,
            stone.stone_type,
            stone.stone_name || null,
            parseInt(stone.pieces) || 1,
            parseFloat(stone.weight_ct) || 0,
            stone.quality || null,
            stone.color || null,
            stone.shape || null,
            parseFloat(stone.rate) || 0,
            parseFloat(stone.total_value) || 0,
          ]
        );
      }
    }

    await conn.commit();
    res.status(201).json({
      success: true,
      message: "Product created successfully.",
      data: { id: productId, product_code, sku: sku.trim().toUpperCase() },
    });
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ success: false, message: err.message });
  } finally {
    conn.release();
  }
}

// PUT /api/products/:id
async function update(req, res) {
  const branch_id = req.user.branch_id;
  const {
    name, sku, jewellery_category, product_category, metal_type, purity,
    gross_weight, stone_weight, net_weight,
    making_charges_type, making_charges, stone_charges,
    purchase_price, mrp, hsn_code, huid, hallmark_status,
    barcode, stock_qty, min_stock_qty, location,
    supplier_id, description, status,
  } = req.body;

  try {
    // Check duplicate SKU within same branch (exclude self)
    if (sku) {
      const [existing] = await db.query(
        "SELECT id FROM products WHERE sku = ? AND id != ? AND branch_id = ?",
        [sku.trim().toUpperCase(), req.params.id, branch_id]
      );
      if (existing.length > 0) {
        return res.status(409).json({ success: false, message: "Another product with this SKU already exists." });
      }
    }

    const calcNetWeight = parseFloat(gross_weight) - parseFloat(stone_weight || 0);

    await db.query(
      `UPDATE products SET
         name = ?, sku = ?, jewellery_category = ?, product_category = ?,
         metal_type = ?, purity = ?, gross_weight = ?, stone_weight = ?,
         net_weight = ?, making_charges_type = ?, making_charges = ?,
         stone_charges = ?, purchase_price = ?, mrp = ?, hsn_code = ?,
         huid = ?, hallmark_status = ?, barcode = ?,
         stock_qty = ?, min_stock_qty = ?, location = ?,
         supplier_id = ?, description = ?, status = ?,
         updated_at = NOW()
       WHERE id = ? AND branch_id = ?`,
      [
        name?.trim(),
        sku?.trim().toUpperCase(),
        jewellery_category,
        product_category,
        metal_type,
        purity,
        parseFloat(gross_weight) || 0,
        parseFloat(stone_weight) || 0,
        calcNetWeight > 0 ? calcNetWeight : 0,
        making_charges_type || "per_gram",
        parseFloat(making_charges) || 0,
        parseFloat(stone_charges) || 0,
        parseFloat(purchase_price) || 0,
        parseFloat(mrp),
        hsn_code || "7113",
        huid ? huid.trim().toUpperCase() : null,
        hallmark_status || "Not Hallmarked",
        barcode || null,
        parseInt(stock_qty) || 1,
        parseInt(min_stock_qty) || 1,
        location || null,
        supplier_id || null,
        description || null,
        status || "Active",
        req.params.id,
        branch_id,
      ]
    );

    res.json({ success: true, message: "Product updated successfully." });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// DELETE /api/products/:id
async function remove(req, res) {
  const branch_id = req.user.branch_id;
  try {
    const [result] = await db.query(
      "DELETE FROM products WHERE id = ? AND branch_id = ?",
      [req.params.id, branch_id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: "Product not found." });
    }
    res.json({ success: true, message: "Product deleted successfully." });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// GET /api/products/search?q=   (for billing dropdown)
async function search(req, res) {
  const branch_id = req.user.branch_id;
  try {
    const { q } = req.query;
    if (!q || q.length < 2) {
      return res.json({ success: true, data: [] });
    }
    const s = `%${q}%`;
    const [rows] = await db.query(
      `SELECT id, product_code, name, sku, purity, gross_weight, net_weight,
              making_charges_type, making_charges, mrp, stock_qty, huid
       FROM products
       WHERE status = 'Active' AND stock_qty > 0 AND branch_id = ?
         AND (name LIKE ? OR sku LIKE ? OR product_code LIKE ?)
       LIMIT 10`,
      [branch_id, s, s, s]
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// PATCH /api/products/:id/stock  (adjust stock quantity)
async function adjustStock(req, res) {
  const branch_id = req.user.branch_id;
  const { adjustment, reason } = req.body;
  if (!adjustment || isNaN(adjustment)) {
    return res.status(400).json({ success: false, message: "Adjustment value is required." });
  }
  try {
    await db.query(
      "UPDATE products SET stock_qty = GREATEST(0, stock_qty + ?), updated_at = NOW() WHERE id = ? AND branch_id = ?",
      [parseInt(adjustment), req.params.id, branch_id]
    );
    res.json({ success: true, message: `Stock adjusted by ${adjustment}.` });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

module.exports = {
  getKpis,
  getAll,
  getById,
  create,
  update,
  remove,
  search,
  adjustStock,
};

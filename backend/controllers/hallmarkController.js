const db = require("../config/db");

// ─────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────

const STOCK_STATUS_SQL = `
  CASE
    WHEN p.stock_qty <= 0 THEN 'Out of Stock'
    WHEN p.stock_qty <= p.min_stock_qty THEN 'Low Stock'
    ELSE 'In Stock'
  END
`;

// ─────────────────────────────────────────────────────────────
// KPIs
// ─────────────────────────────────────────────────────────────

async function getKpis(req, res) {
  try {
    const [[kpis]] = await db.query(`
      SELECT
        COUNT(*) AS total_products,

        COUNT(
          CASE
            WHEN huid IS NOT NULL AND TRIM(huid) != ''
            THEN 1
          END
        ) AS registered,

        COUNT(
          CASE
            WHEN huid IS NULL OR TRIM(huid) = ''
            THEN 1
          END
        ) AS pending_huid,

        COUNT(
          CASE
            WHEN hallmark_status = 'Hallmarked'
            THEN 1
          END
        ) AS hallmarked

      FROM products
    `);

    res.json({
      success: true,
      data: kpis,
    });

  } catch (err) {
    console.error("hallmarkController.getKpis:", err);

    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
}

// ─────────────────────────────────────────────────────────────
// HALLMARK LIST
// ─────────────────────────────────────────────────────────────

async function getHallmarkList(req, res) {
  try {
    const {
      search,
      status,
      purity,
    } = req.query;

    let where = "WHERE 1=1";
    const params = [];

    if (search) {
      where += `
        AND (
          p.huid LIKE ?
          OR p.sku LIKE ?
          OR p.name LIKE ?
        )
      `;

      const value = `%${search}%`;

      params.push(value, value, value);
    }

    if (purity) {
      where += " AND p.purity = ?";
      params.push(purity);
    }

    if (status === "Registered") {
      where += `
        AND p.huid IS NOT NULL
        AND TRIM(p.huid) != ''
      `;
    }

    if (status === "Pending") {
      where += `
        AND (
          p.huid IS NULL
          OR TRIM(p.huid) = ''
        )
      `;
    }

    if (status === "Hallmarked") {
      where += `
        AND p.hallmark_status = 'Hallmarked'
      `;
    }

    if (status === "Not Hallmarked") {
      where += `
        AND (
          p.hallmark_status = 'Not Hallmarked'
          OR p.hallmark_status IS NULL
        )
      `;
    }

    const [rows] = await db.query(
      `
      SELECT
        p.id,
        p.sku,
        p.name,
        p.purity,
        p.gross_weight,
        p.net_weight,
        p.huid,
        p.hallmark_status,

        ${STOCK_STATUS_SQL} AS stock_status,

        p.created_at

      FROM products p

      ${where}

      ORDER BY p.created_at DESC

      LIMIT 200
      `,
      params
    );

    res.json({
      success: true,
      data: rows,
    });

  } catch (err) {
    console.error("hallmarkController.getHallmarkList:", err);

    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
}

// ─────────────────────────────────────────────────────────────
// REGISTER HUID
// ─────────────────────────────────────────────────────────────

async function registerHuid(req, res) {
  try {

    const {
      product_id,
      huid,
      hallmark_date,
      bis_centre,
      centre_code,
      centre_address,
      purity_mark,
      assessor_name,
      assessor_id,
    } = req.body;

    // Basic validation
    if (!product_id) {
      return res.status(400).json({
        success: false,
        message: "Product is required",
      });
    }

    if (!huid || !huid.trim()) {
      return res.status(400).json({
        success: false,
        message: "HUID is required",
      });
    }

    const cleanHuid = huid.trim().toUpperCase();

    // ───────────────────────────────────────
    // Check product
    // ───────────────────────────────────────

    const [[product]] = await db.query(
      `
      SELECT
        id,
        sku,
        name,
        purity,
        huid,
        hallmark_status
      FROM products
      WHERE id = ?
      `,
      [product_id]
    );

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    // ───────────────────────────────────────
    // Check duplicate HUID
    // ───────────────────────────────────────

    const [[existing]] = await db.query(
      `
      SELECT
        id,
        sku,
        name
      FROM products
      WHERE UPPER(huid) = ?
        AND id != ?
      LIMIT 1
      `,
      [cleanHuid, product_id]
    );

    if (existing) {
      return res.status(409).json({
        success: false,
        message: `HUID already assigned to SKU ${existing.sku}`,
      });
    }

    // ───────────────────────────────────────
    // Save HUID
    // ───────────────────────────────────────

    await db.query(
      `
      UPDATE products
      SET
        huid = ?,
        hallmark_status = 'Hallmarked'
      WHERE id = ?
      `,
      [cleanHuid, product_id]
    );

    res.json({
      success: true,
      message: "HUID registered successfully",

      data: {
        product_id,
        sku: product.sku,
        huid: cleanHuid,
        hallmark_status: "Hallmarked",
        hallmark_date: hallmark_date || null,
        bis_centre: bis_centre || null,
        centre_code: centre_code || null,
        centre_address: centre_address || null,
        purity_mark: purity_mark || null,
        assessor_name: assessor_name || null,
        assessor_id: assessor_id || null,
      },
    });

  } catch (err) {
    console.error("hallmarkController.registerHuid:", err);

    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
}

// ─────────────────────────────────────────────────────────────
// VERIFY HUID
// ─────────────────────────────────────────────────────────────

async function verifyHuid(req, res) {
  try {

    const { huid } = req.params;

    if (!huid || !huid.trim()) {
      return res.status(400).json({
        success: false,
        message: "HUID required",
      });
    }

    const cleanHuid = huid.trim().toUpperCase();

    const [[product]] = await db.query(
      `
      SELECT
        p.id,
        p.sku,
        p.name,
        p.purity,
        p.gross_weight,
        p.net_weight,
        p.huid,
        p.hallmark_status,

        ${STOCK_STATUS_SQL} AS stock_status,

        p.created_at,

        s.company_name AS supplier_name

      FROM products p

      LEFT JOIN suppliers s
        ON p.supplier_id = s.id

      WHERE UPPER(p.huid) = ?

      LIMIT 1
      `,
      [cleanHuid]
    );

    if (!product) {
      return res.json({
        success: true,
        verified: false,
        message:
          "HUID not found in Ceritage registry",
      });
    }

    res.json({
      success: true,
      verified: true,
      message:
        "HUID found and verified in Ceritage registry",
      data: product,
    });

  } catch (err) {
    console.error("hallmarkController.verifyHuid:", err);

    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
}

// ─────────────────────────────────────────────────────────────
// HUID TRACKING
// ─────────────────────────────────────────────────────────────

async function getHuidTracking(req, res) {
  try {

    const [rows] = await db.query(`
      SELECT
        p.id,
        p.sku,
        p.name,
        p.purity,
        p.net_weight,

        p.huid,
        p.hallmark_status,

        ${STOCK_STATUS_SQL} AS stock_status,

        p.created_at AS hallmark_date,

        i.invoice_no AS sale_invoice,
        i.invoice_date AS sale_date,

        c.full_name AS sold_to

      FROM products p

      LEFT JOIN invoice_items ii
        ON p.id = ii.product_id

      LEFT JOIN invoices i
        ON ii.invoice_id = i.id

      LEFT JOIN customers c
        ON i.customer_id = c.id

      WHERE
        p.huid IS NOT NULL
        AND TRIM(p.huid) != ''

      ORDER BY p.created_at DESC
    `);

    res.json({
      success: true,
      data: rows,
    });

  } catch (err) {
    console.error("hallmarkController.getHuidTracking:", err);

    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
}

module.exports = {
  getKpis,
  getHallmarkList,
  registerHuid,
  verifyHuid,
  getHuidTracking,
};
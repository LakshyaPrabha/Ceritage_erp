const db = require("../config/db");

// ─── KPIs ────────────────────────────────────────────────────────────────────
async function getKpis(req, res) {
  try {
    const [[kpis]] = await db.query(
      `SELECT
         COALESCE(SUM(grand_total),0)   AS total_net_sales,
         COUNT(*)                       AS total_bills,
         COALESCE(AVG(grand_total),0)   AS avg_bill_value
       FROM invoices
       WHERE invoice_type IN ('Retail Invoice','Wholesale Invoice','Tax Invoice','Online Invoice')`
    );
    const [[ret]] = await db.query(
      "SELECT COALESCE(SUM(refund_amount),0) AS returns_value FROM returns"
    );
    res.json({ success: true, data: { ...kpis, returns_value: ret.returns_value } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// ─── LIST SALES ───────────────────────────────────────────────────────────────
async function getAll(req, res) {
  try {
    const { search, status, type, page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;

    const typeMap = {
      retail:    "Retail Invoice",
      wholesale: "Wholesale Invoice",
      online:    "Online Invoice",
    };

    let where = "WHERE i.invoice_type IN ('Retail Invoice','Wholesale Invoice','Tax Invoice','Online Invoice','Exchange Billing')";
    const params = [];

    if (type && typeMap[type]) {
      where += " AND i.invoice_type = ?";
      params.push(typeMap[type]);
    }
    if (search) {
      where += " AND (i.invoice_no LIKE ? OR c.full_name LIKE ?)";
      params.push(`%${search}%`, `%${search}%`);
    }
    if (status) {
      where += " AND i.status = ?";
      params.push(status);
    }

    const [rows] = await db.query(
      `SELECT i.id, i.invoice_no, i.invoice_date, i.invoice_type,
              i.payment_mode, i.grand_total, i.paid_amount,
              i.discount_amt, i.cgst, i.sgst, i.igst, i.status,
              c.full_name AS customer_name
       FROM invoices i
       LEFT JOIN customers c ON i.customer_id = c.id
       ${where} ORDER BY i.invoice_date DESC, i.id DESC
       LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), parseInt(offset)]
    );

    const [[{ total }]] = await db.query(
      `SELECT COUNT(*) AS total FROM invoices i
       LEFT JOIN customers c ON i.customer_id = c.id ${where}`,
      params
    );

    res.json({ success: true, data: rows, total });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// ─── GET SINGLE SALE ──────────────────────────────────────────────────────────
async function getById(req, res) {
  try {
    const [[inv]] = await db.query(
      `SELECT i.*, c.full_name AS customer_name, c.phone AS customer_phone
       FROM invoices i LEFT JOIN customers c ON i.customer_id = c.id
       WHERE i.id = ?`,
      [req.params.id]
    );
    if (!inv) return res.status(404).json({ success: false, message: "Invoice not found" });

    const [items] = await db.query(
      `SELECT ii.*, p.name AS product_name, p.sku
       FROM invoice_items ii
       LEFT JOIN products p ON ii.product_id = p.id
       WHERE ii.invoice_id = ?`,
      [req.params.id]
    );
    res.json({ success: true, data: { ...inv, items } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// ─── CREATE SALE ──────────────────────────────────────────────────────────────
async function createSale(req, res) {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const {
      invoice_type = "Retail Invoice",
      customer_id,
      invoice_date,
      salesperson_id,
      payment_mode,
      discount_pct = 0,
      discount_amt = 0,
      old_gold_exchange = 0,
      cgst = 0, sgst = 0, igst = 0,
      grand_total,
      paid_amount = 0,
      status = "Paid",
      notes,
      items = [],           // [{product_id, item_description, purity, weight_g, rate_per_gram, making_charges, stone_charges, gst_pct, discount_pct, amount}]
      coupon_code,
      gift_voucher,
    } = req.body;

    // Generate invoice number
    const [[{ count }]] = await conn.query("SELECT COUNT(*) AS count FROM invoices");
    const year = new Date().getFullYear();
    const invoice_no = `INV-${year}-${String(count + 1).padStart(5, "0")}`;

    const [invResult] = await conn.query(
      `INSERT INTO invoices
         (invoice_no, invoice_type, customer_id, invoice_date, salesperson_id,
          payment_mode, discount_pct, discount_amt, coupon_code, gift_voucher,
          old_gold_exchange, cgst, sgst, igst, grand_total, paid_amount, status, notes)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [invoice_no, invoice_type, customer_id || null, invoice_date || new Date().toISOString().slice(0, 10),
       salesperson_id || null, payment_mode, discount_pct, discount_amt,
       coupon_code || null, gift_voucher || null, old_gold_exchange,
       cgst, sgst, igst, grand_total, paid_amount, status, notes || null]
    );

    const invoice_id = invResult.insertId;

    // Insert line items and decrement stock
    for (const item of items) {
      await conn.query(
        `INSERT INTO invoice_items
           (invoice_id, product_id, item_description, purity, weight_g,
            rate_per_gram, making_charges, stone_charges, gst_pct, discount_pct, amount)
         VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
        [invoice_id, item.product_id || null, item.item_description || null,
         item.purity || null, item.weight_g || 0, item.rate_per_gram || 0,
         item.making_charges || 0, item.stone_charges || 0,
         item.gst_pct || 3, item.discount_pct || 0, item.amount || 0]
      );

      // Decrement stock if product_id present
      if (item.product_id) {
        await conn.query(
          `UPDATE products SET stock_qty = GREATEST(0, stock_qty - 1),
           stock_status = CASE
             WHEN stock_qty - 1 <= 0 THEN 'Out of Stock'
             WHEN stock_qty - 1 <= min_stock THEN 'Low Stock'
             ELSE 'In Stock'
           END WHERE id = ?`,
          [item.product_id]
        );
      }
    }

    // Update customer wallet/loyalty (total_purchased column exists in some versions)
    // Using balance_due for credit tracking — skip if column doesn't exist
    if (customer_id && status === "Credit") {
      await conn.query(
        "UPDATE customers SET balance_due = COALESCE(balance_due,0) + ? WHERE id = ?",
        [grand_total - (paid_amount || 0), customer_id]
      ).catch(() => {}); // silent if column mismatch
    }

    await conn.commit();
    res.status(201).json({ success: true, data: { id: invoice_id, invoice_no } });
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ success: false, message: err.message });
  } finally {
    conn.release();
  }
}

// ─── PENDING ORDERS ───────────────────────────────────────────────────────────
async function getPendingOrders(req, res) {
  try {
    const { status } = req.query;
    let where = "WHERE o.status NOT IN ('Delivered')";
    const params = [];
    if (status) { where += " AND o.status = ?"; params.push(status); }

    const [rows] = await db.query(
      `SELECT o.*, c.full_name AS customer_name, c.phone AS customer_phone
       FROM orders o
       LEFT JOIN customers c ON o.customer_id = c.id
       ${where} ORDER BY o.delivery_date ASC, o.created_at DESC`,
      params
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

async function getAdvanceOrders(req, res) {
  try {
    const [rows] = await db.query(
      `SELECT o.*, c.full_name AS customer_name, c.phone AS customer_phone
       FROM orders o
       LEFT JOIN customers c ON o.customer_id = c.id
       WHERE o.order_type = 'Advance'
       ORDER BY o.delivery_date ASC`
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// ─── SALES RETURNS ────────────────────────────────────────────────────────────
async function getSalesReturns(req, res) {
  try {
    const [rows] = await db.query(
      `SELECT r.*, c.full_name AS customer_name
       FROM returns r
       LEFT JOIN customers c ON r.customer_id = c.id
       ORDER BY r.return_date DESC, r.created_at DESC`
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

async function createSalesReturn(req, res) {
  try {
    const { customer_id, invoice_ref, item_description, reason, refund_amount, refund_mode, return_date } = req.body;

    const [[{ count }]] = await db.query("SELECT COUNT(*) AS count FROM returns");
    const return_no = `RTN-${new Date().getFullYear()}-${String(count + 1).padStart(4, "0")}`;

    const [result] = await db.query(
      `INSERT INTO returns (return_no, customer_id, invoice_ref, item_description, reason, refund_amount, refund_mode, return_date)
       VALUES (?,?,?,?,?,?,?,?)`,
      [return_no, customer_id || null, invoice_ref || null, item_description,
       reason, refund_amount || 0, refund_mode,
       return_date || new Date().toISOString().slice(0, 10)]
    );

    // Update invoice status if ref provided
    if (invoice_ref) {
      await db.query(
        "UPDATE invoices SET status = 'Returned' WHERE invoice_no = ?",
        [invoice_ref]
      );
    }

    res.status(201).json({ success: true, data: { id: result.insertId, return_no } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// ─── DELIVERY CHALLANS ────────────────────────────────────────────────────────
async function getChallans(req, res) {
  try {
    const [rows] = await db.query(
      "SELECT * FROM delivery_challans ORDER BY created_at DESC"
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

async function createChallan(req, res) {
  try {
    const { invoice_ref, customer_id, customer_name, phone, delivery_address, items_description, quantity, delivery_mode, delivered_by } = req.body;

    const [[{ count }]] = await db.query("SELECT COUNT(*) AS count FROM delivery_challans");
    const dc_no = `DC-${new Date().getFullYear()}-${String(count + 1).padStart(4, "0")}`;

    const [result] = await db.query(
      `INSERT INTO delivery_challans
         (dc_no, invoice_ref, customer_id, customer_name, phone, delivery_address, items_description, quantity, delivery_mode, delivered_by)
       VALUES (?,?,?,?,?,?,?,?,?,?)`,
      [dc_no, invoice_ref || null, customer_id || null, customer_name,
       phone || null, delivery_address, items_description, quantity || 1,
       delivery_mode, delivered_by || null]
    );
    res.status(201).json({ success: true, data: { id: result.insertId, dc_no } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

async function updateChallanStatus(req, res) {
  try {
    const { status } = req.body;
    await db.query(
      "UPDATE delivery_challans SET status = ? WHERE id = ?",
      [status, req.params.id]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

module.exports = {
  getKpis, getAll, getById, createSale,
  getPendingOrders, getAdvanceOrders,
  getSalesReturns, createSalesReturn,
  getChallans, createChallan, updateChallanStatus,
};

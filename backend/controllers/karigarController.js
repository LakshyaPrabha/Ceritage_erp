const db = require("../config/db");

// GET /api/karigar/kpis
async function getKpis(req, res) {
  try {
    const [[stats]] = await db.query(`
      SELECT
        COUNT(*) AS total_karigars,
        COUNT(CASE WHEN status = 'ACTIVE' THEN 1 END) AS active_karigars,
        COALESCE(SUM(gold_balance_grams), 0) AS total_gold_at_hand,
        COALESCE(SUM(silver_balance_grams), 0) AS total_silver_at_hand,
        COALESCE(SUM(making_charges_due), 0) AS total_charges_payable
      FROM karigars
    `);

    const [[woStats]] = await db.query(`
      SELECT
        COUNT(*) AS total_work_orders,
        COUNT(CASE WHEN status IN ('ISSUED', 'IN_PROGRESS') THEN 1 END) AS active_jobs,
        COUNT(CASE WHEN status = 'COMPLETED' THEN 1 END) AS completed_jobs
      FROM work_orders
    `);

    res.json({
      success: true,
      data: {
        total_karigars: stats.total_karigars || 0,
        active_karigars: stats.active_karigars || 0,
        gold_at_karigar: parseFloat(stats.total_gold_at_hand || 0),
        silver_at_karigar: parseFloat(stats.total_silver_at_hand || 0),
        pending_payments: parseFloat(stats.total_charges_payable || 0),
        active_jobs: woStats.active_jobs || 0,
        total_work_orders: woStats.total_work_orders || 0,
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// GET /api/karigar — list all karigars
async function getAll(req, res) {
  try {
    const { status, search } = req.query;
    let where = "WHERE 1=1";
    const params = [];

    if (status && status !== "ALL") {
      where += " AND status = ?";
      params.push(status);
    }
    if (search) {
      where += " AND (name LIKE ? OR phone LIKE ? OR karigar_code LIKE ?)";
      const s = `%${search}%`;
      params.push(s, s, s);
    }

    const [rows] = await db.query(
      `SELECT id, karigar_code, name, name AS full_name, phone, specialization,
              gold_balance_grams, silver_balance_grams, making_charges_due,
              branch_id, status, created_at
       FROM karigars
       ${where}
       ORDER BY created_at DESC`,
      params
    );

    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// POST /api/karigar — create a new karigar
async function create(req, res) {
  const { name, full_name, phone, specialization, branch_id = 1 } = req.body;
  const karigarName = name || full_name;

  if (!karigarName || !phone) {
    return res.status(400).json({ success: false, message: "Karigar name and phone are required" });
  }

  try {
    const [[{ maxId }]] = await db.query("SELECT COALESCE(MAX(id), 0) + 1 AS maxId FROM karigars");
    const code = `KG-${new Date().getFullYear()}-${String(maxId).padStart(4, "0")}`;

    const [result] = await db.query(
      `INSERT INTO karigars (karigar_code, name, phone, specialization, gold_balance_grams, silver_balance_grams, making_charges_due, branch_id, status)
       VALUES (?, ?, ?, ?, 0.000, 0.000, 0.00, ?, 'ACTIVE')`,
      [code, karigarName.trim(), phone.trim(), specialization || "General Goldsmith", branch_id]
    );

    res.status(201).json({
      success: true,
      message: "Karigar added successfully",
      data: { id: result.insertId, karigar_code: code }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// GET /api/karigar/work-orders
async function getWorkOrders(req, res) {
  try {
    const { karigar_id, status } = req.query;
    let where = "WHERE 1=1";
    const params = [];

    if (karigar_id) {
      where += " AND wo.karigar_id = ?";
      params.push(karigar_id);
    }
    if (status && status !== "ALL") {
      where += " AND wo.status = ?";
      params.push(status);
    }

    const [rows] = await db.query(
      `SELECT wo.*, k.name AS karigar_name, k.karigar_code
       FROM work_orders wo
       LEFT JOIN karigars k ON wo.karigar_id = k.id
       ${where}
       ORDER BY wo.created_at DESC`,
      params
    );

    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// POST /api/karigar/work-orders
async function createWorkOrder(req, res) {
  const { karigar_id, item_type, metal_purity, target_weight, target_date, making_charge_agreed } = req.body;

  if (!karigar_id || !item_type || !target_weight) {
    return res.status(400).json({ success: false, message: "Karigar, item description, and target weight are required" });
  }

  try {
    const [[{ maxId }]] = await db.query("SELECT COALESCE(MAX(id), 0) + 1 AS maxId FROM work_orders");
    const orderNo = `WO-${new Date().getFullYear()}-${String(maxId).padStart(4, "0")}`;

    const [result] = await db.query(
      `INSERT INTO work_orders (order_no, karigar_id, item_type, metal_purity, target_weight, target_date, making_charge_agreed, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'ISSUED')`,
      [orderNo, karigar_id, item_type, metal_purity || "22K", Number(target_weight), target_date || null, Number(making_charge_agreed || 0)]
    );

    res.status(201).json({
      success: true,
      message: "Work order created successfully",
      data: { id: result.insertId, order_no: orderNo }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// POST /api/karigar/gold-issue — Issue raw metal to Karigar (ACID Transaction)
async function issueGold(req, res) {
  const { karigar_id, metal_type = "Gold", purity = "22K", gross_weight, net_weight, work_order_ref, notes } = req.body;

  if (!karigar_id || !gross_weight || Number(gross_weight) <= 0) {
    return res.status(400).json({ success: false, message: "Karigar and valid weight are required" });
  }

  const weight = Number(gross_weight);
  const conn = await db.getConnection();

  try {
    await conn.beginTransaction();

    const [[{ maxId }]] = await conn.query("SELECT COALESCE(MAX(id), 0) + 1 AS maxId FROM gold_issues");
    const issueNo = `GI-${new Date().getFullYear()}-${String(maxId).padStart(4, "0")}`;

    const [result] = await conn.query(
      `INSERT INTO gold_issues (issue_no, karigar_id, metal_type, purity, gross_weight, net_weight, issue_date, work_order_ref, notes)
       VALUES (?, ?, ?, ?, ?, ?, CURDATE(), ?, ?)`,
      [issueNo, karigar_id, metal_type, purity, weight, Number(net_weight || weight), work_order_ref || null, notes || null]
    );

    // Increment karigar's metal balance
    if (metal_type === "Silver") {
      await conn.query("UPDATE karigars SET silver_balance_grams = silver_balance_grams + ? WHERE id = ?", [weight, karigar_id]);
    } else {
      await conn.query("UPDATE karigars SET gold_balance_grams = gold_balance_grams + ? WHERE id = ?", [weight, karigar_id]);
    }

    await conn.commit();

    res.status(201).json({
      success: true,
      message: `${weight}g metal issued to Karigar successfully`,
      data: { id: result.insertId, issue_no: issueNo }
    });
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ success: false, message: err.message });
  } finally {
    conn.release();
  }
}

// POST /api/karigar/gold-receive — Receive finished ornament from Karigar (ACID Transaction)
async function receiveGold(req, res) {
  const {
    karigar_id, metal_type = "Gold", purity = "22K", gross_weight, net_weight,
    wastage_reported = 0, making_charges = 0, item_name, work_order_id
  } = req.body;

  if (!karigar_id || !gross_weight || Number(gross_weight) <= 0) {
    return res.status(400).json({ success: false, message: "Karigar and valid received weight are required" });
  }

  const grossWt = Number(gross_weight);
  const netWt = Number(net_weight || grossWt);
  const wastage = Number(wastage_reported || 0);
  const totalAccounted = grossWt + wastage;
  const makingCharges = Number(making_charges || 0);

  const conn = await db.getConnection();

  try {
    await conn.beginTransaction();

    const [[{ maxId }]] = await conn.query("SELECT COALESCE(MAX(id), 0) + 1 AS maxId FROM gold_receives");
    const receiveNo = `GR-${new Date().getFullYear()}-${String(maxId).padStart(4, "0")}`;

    const [result] = await conn.query(
      `INSERT INTO gold_receives (receive_no, karigar_id, metal_type, purity, gross_weight, net_weight, wastage_reported, making_charges, receive_date, item_name)
       VALUES (?, ?, ?, ?, ?, ?, CURDATE(), ?, ?)`,
      [receiveNo, karigar_id, metal_type, purity, grossWt, netWt, wastage, makingCharges, item_name || "Finished Ornament"]
    );

    // Deduct metal balance & add making charges due
    if (metal_type === "Silver") {
      await conn.query(
        `UPDATE karigars
         SET silver_balance_grams = GREATEST(0, silver_balance_grams - ?),
             making_charges_due = making_charges_due + ?
         WHERE id = ?`,
        [totalAccounted, makingCharges, karigar_id]
      );
    } else {
      await conn.query(
        `UPDATE karigars
         SET gold_balance_grams = GREATEST(0, gold_balance_grams - ?),
             making_charges_due = making_charges_due + ?
         WHERE id = ?`,
        [totalAccounted, makingCharges, karigar_id]
      );
    }

    // If linked to work order, update status to COMPLETED
    if (work_order_id) {
      await conn.query("UPDATE work_orders SET status = 'COMPLETED' WHERE id = ? OR order_no = ?", [work_order_id, work_order_id]);
    }

    await conn.commit();

    res.status(201).json({
      success: true,
      message: `Received ${grossWt}g finished jewellery. Making charge ₹${makingCharges.toLocaleString("en-IN")} credited.`,
      data: { id: result.insertId, receive_no: receiveNo }
    });
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ success: false, message: err.message });
  } finally {
    conn.release();
  }
}

// POST /api/karigar/payment — Pay labour charges to Karigar (ACID Transaction)
async function makePayment(req, res) {
  const { karigar_id, amount, payment_mode = "Bank Transfer", reference_no, notes } = req.body;

  if (!karigar_id || !amount || Number(amount) <= 0) {
    return res.status(400).json({ success: false, message: "Karigar and valid payment amount are required" });
  }

  const payAmount = Number(amount);
  const conn = await db.getConnection();

  try {
    await conn.beginTransaction();

    const [[{ maxId }]] = await conn.query("SELECT COALESCE(MAX(id), 0) + 1 AS maxId FROM karigar_payments");
    const receiptNo = `KP-${new Date().getFullYear()}-${String(maxId).padStart(4, "0")}`;

    const [result] = await conn.query(
      `INSERT INTO karigar_payments (receipt_no, karigar_id, amount, payment_date, payment_mode, reference_no, notes)
       VALUES (?, ?, ?, CURDATE(), ?, ?, ?)`,
      [receiptNo, karigar_id, payAmount, payment_mode, reference_no || null, notes || null]
    );

    // Reduce making charges due
    await conn.query(
      "UPDATE karigars SET making_charges_due = GREATEST(0, making_charges_due - ?) WHERE id = ?",
      [payAmount, karigar_id]
    );

    await conn.commit();

    res.status(201).json({
      success: true,
      message: `Payment of ₹${payAmount.toLocaleString("en-IN")} recorded successfully`,
      data: { id: result.insertId, receipt_no: receiptNo }
    });
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ success: false, message: err.message });
  } finally {
    conn.release();
  }
}

// GET /api/karigar/issues
async function getIssues(req, res) {
  try {
    const { karigar_id } = req.query;
    let where = "WHERE 1=1";
    const params = [];
    if (karigar_id) { where += " AND gi.karigar_id = ?"; params.push(karigar_id); }

    const [rows] = await db.query(
      `SELECT gi.*, k.name AS karigar_name, k.karigar_code
       FROM gold_issues gi
       LEFT JOIN karigars k ON gi.karigar_id = k.id
       ${where}
       ORDER BY gi.created_at DESC`,
      params
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// GET /api/karigar/receives
async function getReceives(req, res) {
  try {
    const { karigar_id } = req.query;
    let where = "WHERE 1=1";
    const params = [];
    if (karigar_id) { where += " AND gr.karigar_id = ?"; params.push(karigar_id); }

    const [rows] = await db.query(
      `SELECT gr.*, k.name AS karigar_name, k.karigar_code
       FROM gold_receives gr
       LEFT JOIN karigars k ON gr.karigar_id = k.id
       ${where}
       ORDER BY gr.created_at DESC`,
      params
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// GET /api/karigar/payments
async function getPayments(req, res) {
  try {
    const { karigar_id } = req.query;
    let where = "WHERE 1=1";
    const params = [];
    if (karigar_id) { where += " AND kp.karigar_id = ?"; params.push(karigar_id); }

    const [rows] = await db.query(
      `SELECT kp.*, k.name AS karigar_name, k.karigar_code
       FROM karigar_payments kp
       LEFT JOIN karigars k ON kp.karigar_id = k.id
       ${where}
       ORDER BY kp.created_at DESC`,
      params
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

module.exports = {
  getKpis,
  getAll,
  create,
  getWorkOrders,
  createWorkOrder,
  issueGold,
  receiveGold,
  makePayment,
  getIssues,
  getReceives,
  getPayments,
};

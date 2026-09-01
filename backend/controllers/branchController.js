const db = require("../config/db");

async function getAll(req, res) {
  try {
    const [rows] = await db.query(
      `SELECT b.*, u.full_name AS manager_name FROM branches b
       LEFT JOIN users u ON b.manager_id = u.id ORDER BY b.created_at DESC`
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

async function create(req, res) {
  const { name, city, address, manager_id, phone, gstin, status = "Active" } = req.body;
  try {
    const [result] = await db.query(
      `INSERT INTO branches (name, city, address, manager_id, phone, gstin, status)
       VALUES (?,?,?,?,?,?,?)`,
      [name, city || null, address || null, manager_id || null, phone || null, gstin || null, status]
    );
    res.status(201).json({ success: true, data: { id: result.insertId } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

async function getTransfers(req, res) {
  try {
    const [rows] = await db.query(
      `SELECT t.*,
              COALESCE(t.transfer_id, t.transfer_no) AS transfer_id,
              b1.name AS from_branch,
              b2.name AS to_branch
       FROM stock_transfers t
       LEFT JOIN branches b1 ON COALESCE(t.from_branch_id, t.source_branch_id) = b1.id
       LEFT JOIN branches b2 ON COALESCE(t.to_branch_id, t.dest_branch_id) = b2.id
       ORDER BY t.created_at DESC`
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

async function createTransfer(req, res) {
  const { from_branch_id, to_branch_id, sku, quantity = 1, transport_mode, dispatch_date, notes } = req.body;
  try {
    const [[{ count }]] = await db.query("SELECT COUNT(*) AS count FROM stock_transfers");
    const transfer_id = `TRF${String(count + 1).padStart(3, "0")}`;
    const [result] = await db.query(
      `INSERT INTO stock_transfers
        (transfer_no, transfer_id, source_branch_id, from_branch_id, dest_branch_id, to_branch_id, sku, quantity, qty, transport_mode, dispatch_date, transfer_date, notes, status, created_by)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        transfer_id, transfer_id, from_branch_id, from_branch_id, to_branch_id, to_branch_id,
        sku, quantity || 1, quantity || 1, transport_mode || "Own Vehicle",
        dispatch_date || null, dispatch_date || new Date().toISOString().split('T')[0],
        notes || null, "IN_TRANSIT", req.user?.full_name || req.user?.username || "Admin"
      ]
    );
    res.status(201).json({ success: true, data: { id: result.insertId, transfer_id } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

module.exports = { getAll, create, getTransfers, createTransfer };

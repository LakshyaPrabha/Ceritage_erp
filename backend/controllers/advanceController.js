const db = require("../config/db");
const accounting = require("../services/accountingPostingService");

let tablesReady = false;

// ── Ensure rate lock & advance tables exist ────────────────────
async function ensureTables() {
  if (tablesReady) return;
  try {
    // 1. Rate Locks Master
    await db.query(`
      CREATE TABLE IF NOT EXISTS rate_locks (
        id INT AUTO_INCREMENT PRIMARY KEY,
        order_id VARCHAR(50) NULL,
        customer_id INT NULL,
        customer_name VARCHAR(150) NULL,
        item_description VARCHAR(255) NOT NULL,
        locked_rate DECIMAL(10,2) NOT NULL,
        weight_g DECIMAL(10,3) NOT NULL DEFAULT 0.000,
        locked_value DECIMAL(14,2) NOT NULL DEFAULT 0.00,
        advance_paid DECIMAL(12,2) NOT NULL DEFAULT 0.00,
        lock_date DATE NOT NULL,
        valid_till DATE NULL,
        status ENUM('Active', 'Redeemed', 'Expired', 'Cancelled') DEFAULT 'Active',
        notes TEXT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Helper to add column if it doesn't exist in rate_locks
    const addCol = async (colName, colDef) => {
      try {
        const [cols] = await db.query(
          "SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'rate_locks' AND COLUMN_NAME = ?",
          [colName]
        );
        if (cols.length === 0) {
          await db.query(`ALTER TABLE rate_locks ADD COLUMN ${colName} ${colDef}`);
        }
      } catch (e) {
        console.error(`Error adding column ${colName}:`, e.message);
      }
    };

    await addCol("lock_no", "VARCHAR(30) NULL AFTER id");
    await addCol("customer_phone", "VARCHAR(20) NULL");
    await addCol("metal_type", "VARCHAR(30) DEFAULT 'Gold'");
    await addCol("purity", "VARCHAR(30) DEFAULT '22K (916)'");
    await addCol("payment_mode", "VARCHAR(50) DEFAULT 'Cash'");
    await addCol("payment_ref", "VARCHAR(100) NULL");
    await addCol("invoice_ref", "VARCHAR(50) NULL");
    await addCol("redeemed_at", "TIMESTAMP NULL");

    // Populate lock_no for existing rows
    try {
      await db.query("UPDATE rate_locks SET lock_no = CONCAT('RL-2026-', LPAD(id, 4, '0')) WHERE lock_no IS NULL OR lock_no = ''");
    } catch { /* silent */ }

    // 2. Rate Lock Advances / Top-up Payments
    await db.query(`
      CREATE TABLE IF NOT EXISTS rate_lock_advances (
        id INT AUTO_INCREMENT PRIMARY KEY,
        rate_lock_id INT NOT NULL,
        amount DECIMAL(12,2) NOT NULL,
        payment_mode VARCHAR(50) DEFAULT 'Cash',
        payment_ref VARCHAR(100) NULL,
        payment_date DATE NOT NULL,
        collected_by VARCHAR(100) DEFAULT 'Staff',
        notes VARCHAR(255) NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (rate_lock_id) REFERENCES rate_locks(id) ON DELETE CASCADE
      )
    `);

    tablesReady = true;
  } catch (err) {
    console.error("Rate locks table init error:", err.message);
  }
}

// ── GET /api/advance/kpis ─────────────────────────────────────────────────────
exports.getKpis = async (req, res) => {
  try {
    await ensureTables();

    const [[stats]] = await db.query(`
      SELECT
        COUNT(CASE WHEN status='Active' THEN 1 END) AS active_locks,
        COUNT(CASE WHEN status='Redeemed' THEN 1 END) AS redeemed_locks,
        COUNT(CASE WHEN status='Expired' THEN 1 END) AS expired_locks,
        COUNT(*) AS total_locks,
        COALESCE(SUM(CASE WHEN status='Active' THEN locked_value END), 0) AS active_locked_value,
        COALESCE(SUM(CASE WHEN status='Active' THEN advance_paid END), 0) AS active_advance_collected,
        COALESCE(SUM(advance_paid), 0) AS total_advance_collected,
        COALESCE(SUM(CASE WHEN status='Active' THEN weight_g END), 0) AS active_weight_g
      FROM rate_locks
    `);

    // Fetch Live Benchmark Rates for calculation
    const [rates] = await db.query(`
      SELECT metal, purity, price_per_gram 
      FROM metal_benchmark_rates 
      ORDER BY fetched_at DESC LIMIT 10
    `).catch(() => [[]]);

    let rate24k = 0, rate22k = 0, rate18k = 0, rateSilver = 0;
    for (const r of rates) {
      if (r.metal === "GOLD" && r.purity === "999" && !rate24k) rate24k = parseFloat(r.price_per_gram);
      if (r.metal === "GOLD" && r.purity === "916" && !rate22k) rate22k = parseFloat(r.price_per_gram);
      if (r.metal === "GOLD" && r.purity === "750" && !rate18k) rate18k = parseFloat(r.price_per_gram);
      if (r.metal === "SILVER" && !rateSilver) rateSilver = parseFloat(r.price_per_gram);
    }

    return res.json({
      success: true,
      data: {
        ...stats,
        live_rates: {
          rate_24k: rate24k || 7750,
          rate_22k: rate22k || 7100,
          rate_18k: rate18k || 5800,
          rate_silver: rateSilver || 92,
        },
      },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ── GET /api/advance ──────────────────────────────────────────────────────────
exports.getAll = async (req, res) => {
  try {
    await ensureTables();
    const { status, search } = req.query;

    // Auto-expire active rate locks whose valid_till has passed
    await db.query(
      "UPDATE rate_locks SET status='Expired' WHERE valid_till < CURDATE() AND status='Active'"
    );

    let where = "WHERE 1=1";
    const params = [];

    if (status && status !== "All") {
      where += " AND rl.status = ?";
      params.push(status);
    }

    if (search) {
      where += " AND (rl.lock_no LIKE ? OR rl.customer_name LIKE ? OR rl.customer_phone LIKE ? OR rl.order_id LIKE ?)";
      const term = `%${search}%`;
      params.push(term, term, term, term);
    }

    // Get latest benchmark rates for P&L computation
    const [rateRows] = await db.query(`
      SELECT metal, purity, price_per_gram 
      FROM metal_benchmark_rates 
      ORDER BY fetched_at DESC LIMIT 10
    `).catch(() => [[]]);

    const liveRateMap = {
      "24K (999)": 7750,
      "22K (916)": 7100,
      "18K (750)": 5800,
      "Silver 999": 92,
      "Platinum 950": 3400,
    };

    for (const r of rateRows) {
      if (r.metal === "GOLD" && r.purity === "999") liveRateMap["24K (999)"] = parseFloat(r.price_per_gram);
      if (r.metal === "GOLD" && r.purity === "916") liveRateMap["22K (916)"] = parseFloat(r.price_per_gram);
      if (r.metal === "GOLD" && r.purity === "750") liveRateMap["18K (750)"] = parseFloat(r.price_per_gram);
      if (r.metal === "SILVER") liveRateMap["Silver 999"] = parseFloat(r.price_per_gram);
    }

    const [rows] = await db.query(`
      SELECT 
        rl.*,
        c.full_name AS customer_full_name,
        c.phone AS customer_registered_phone,
        c.email AS customer_email,
        (SELECT COUNT(*) FROM rate_lock_advances rla WHERE rla.rate_lock_id = rl.id) AS advance_installments_count
      FROM rate_locks rl
      LEFT JOIN customers c ON rl.customer_id = c.id
      ${where}
      ORDER BY rl.id DESC
    `, params);

    // Compute live P&L and customer savings
    const enriched = rows.map((r) => {
      const liveRate = liveRateMap[r.purity] || liveRateMap["22K (916)"] || 7100;
      const lockedRate = parseFloat(r.locked_rate || 0);
      const weight = parseFloat(r.weight_g || 0);

      const diffPerGram = liveRate - lockedRate;
      const totalSavings = diffPerGram * weight;
      const advancePct = r.locked_value > 0 ? ((r.advance_paid / r.locked_value) * 100).toFixed(1) : "0";

      return {
        ...r,
        current_live_rate: liveRate,
        pl_diff_per_gram: diffPerGram.toFixed(2),
        customer_total_savings: totalSavings.toFixed(2),
        advance_percentage: advancePct,
      };
    });

    return res.json({ success: true, data: enriched });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ── GET /api/advance/:id ──────────────────────────────────────────────────────
exports.getById = async (req, res) => {
  try {
    await ensureTables();
    const { id } = req.params;

    const [rows] = await db.query(`
      SELECT 
        rl.*,
        c.full_name AS customer_full_name,
        c.phone AS customer_registered_phone,
        c.city AS customer_city,
        c.pan AS customer_pan
      FROM rate_locks rl
      LEFT JOIN customers c ON rl.customer_id = c.id
      WHERE rl.id = ?
    `, [id]);

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: "Rate lock not found" });
    }

    const [advances] = await db.query(`
      SELECT * FROM rate_lock_advances WHERE rate_lock_id = ? ORDER BY id ASC
    `, [id]);

    return res.json({
      success: true,
      data: {
        ...rows[0],
        payments: advances,
      },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ── POST /api/advance ─────────────────────────────────────────────────────────
exports.create = async (req, res) => {
  let conn;
  try {
    await ensureTables();
    const {
      order_id,
      customer_id,
      customer_name,
      customer_phone,
      metal_type = "Gold",
      purity = "22K (916)",
      item_description,
      locked_rate,
      weight_g,
      advance_paid = 0,
      payment_mode = "Cash",
      payment_ref = "",
      lock_date,
      valid_till,
      notes = "",
    } = req.body;

    if (!locked_rate || !item_description || !weight_g) {
      return res.status(400).json({
        success: false,
        message: "Item description, rate to lock, and weight are required",
      });
    }

    const weightNum = parseFloat(weight_g) || 0;
    const rateNum = parseFloat(locked_rate) || 0;
    const lockedValue = weightNum * rateNum;
    const advanceNum = parseFloat(advance_paid) || 0;
    const activeBranchId = Number(req.branchId || req.user?.branch_id || 1);
    const lockNo = `RL-${new Date().getFullYear()}-${Date.now().toString().slice(-4)}`;
    const lockDateVal = lock_date || new Date().toISOString().slice(0, 10);

    let validTillVal = valid_till;
    if (!validTillVal) {
      const d = new Date(lockDateVal);
      d.setDate(d.getDate() + 30);
      validTillVal = d.toISOString().slice(0, 10);
    }

    conn = await db.getConnection();
    await conn.beginTransaction();

    let resolvedCustName = customer_name;
    let resolvedCustPhone = customer_phone;
    if (customer_id && (!resolvedCustName || !resolvedCustPhone)) {
      const [cust] = await conn.query("SELECT full_name, phone, branch_id FROM customers WHERE id = ? FOR UPDATE", [customer_id]);
      if (cust.length > 0) {
        if (req.user.role !== "admin" && Number(cust[0].branch_id || 1) !== Number(req.user.branch_id || 1)) {
          throw new Error("Cannot create advance for another branch");
        }
        resolvedCustName = cust[0].full_name;
        resolvedCustPhone = cust[0].phone;
      }
    }

    const [result] = await conn.query(`
      INSERT INTO rate_locks 
        (lock_no, order_id, customer_id, customer_name, customer_phone, metal_type, purity, item_description, locked_rate, weight_g, locked_value, advance_paid, payment_mode, payment_ref, lock_date, valid_till, status, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Active', ?)
    `, [
      lockNo,
      order_id || null,
      customer_id || null,
      resolvedCustName || "Walk-in Customer",
      resolvedCustPhone || null,
      metal_type,
      purity,
      item_description,
      rateNum,
      weightNum,
      lockedValue,
      advanceNum,
      payment_mode,
      payment_ref || null,
      lockDateVal,
      validTillVal,
      notes || null,
    ]);

    const lockId = result.insertId;
    let journal = null;

    if (advanceNum > 0) {
      await conn.query(`
        INSERT INTO rate_lock_advances 
          (rate_lock_id, amount, payment_mode, payment_ref, payment_date, collected_by, notes)
        VALUES (?, ?, ?, ?, ?, ?, 'Initial Booking Advance')
      `, [
        lockId,
        advanceNum,
        payment_mode,
        payment_ref || null,
        lockDateVal,
        req.user?.username || "Staff",
      ]);
      journal = await accounting.postAdvanceReceipt(conn, {
        branch_id: activeBranchId,
        amount: advanceNum,
        payment_mode,
        reference_no: payment_ref || lockNo,
        source_id: lockId,
        entry_date: lockDateVal,
        created_by: req.user?.full_name || req.user?.username || "Staff",
        narration: `Advance receipt for ${lockNo}`,
      });
    }

    await conn.commit();
    return res.status(201).json({
      success: true,
      message: `Gold rate locked at INR ${rateNum}/g for ${weightNum}g (Lock #${lockNo})`,
      data: { id: lockId, lock_no: lockNo, journal_voucher_no: journal?.voucher_no || null },
    });
  } catch (err) {
    if (conn) await conn.rollback();
    return res.status(500).json({ success: false, message: err.message });
  } finally {
    if (conn) conn.release();
  }
};

exports.addAdvancePayment = async (req, res) => {
  let conn;
  try {
    await ensureTables();
    const { id } = req.params;
    const { amount, payment_mode = "Cash", payment_ref = "", payment_date, notes = "" } = req.body;

    const amt = parseFloat(amount);
    if (!amt || amt <= 0) {
      return res.status(400).json({ success: false, message: "Valid advance amount is required" });
    }

    conn = await db.getConnection();
    await conn.beginTransaction();

    const [locks] = await conn.query("SELECT * FROM rate_locks WHERE id = ? FOR UPDATE", [id]);
    if (locks.length === 0) {
      await conn.rollback();
      return res.status(404).json({ success: false, message: "Rate lock not found" });
    }
    const lock = locks[0];
    const activeBranchId = Number(req.branchId || req.user?.branch_id || 1);
    if (req.user.role !== "admin" && lock.customer_id) {
      const [cust] = await conn.query("SELECT branch_id FROM customers WHERE id = ?", [lock.customer_id]);
      if (cust.length > 0 && Number(cust[0].branch_id || 1) !== Number(req.user.branch_id || 1)) {
        throw new Error("Cannot add advance for another branch");
      }
    }

    const payDate = payment_date || new Date().toISOString().slice(0, 10);

    await conn.query(`
      INSERT INTO rate_lock_advances (rate_lock_id, amount, payment_mode, payment_ref, payment_date, collected_by, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [id, amt, payment_mode, payment_ref, payDate, req.user?.username || "Staff", notes || "Top-up Advance"]);

    await conn.query(`
      UPDATE rate_locks 
      SET advance_paid = advance_paid + ?
      WHERE id = ?
    `, [amt, id]);

    const journal = await accounting.postAdvanceReceipt(conn, {
      branch_id: activeBranchId,
      amount: amt,
      payment_mode,
      reference_no: payment_ref || lock.lock_no,
      source_id: id,
      entry_date: payDate,
      created_by: req.user?.full_name || req.user?.username || "Staff",
      narration: `Advance top-up for ${lock.lock_no}`,
    });

    await conn.commit();
    return res.json({
      success: true,
      message: `INR ${amt.toLocaleString("en-IN")} advance recorded for Lock #${lock.lock_no}`,
      data: { journal_voucher_no: journal.voucher_no },
    });
  } catch (err) {
    if (conn) await conn.rollback();
    return res.status(500).json({ success: false, message: err.message });
  } finally {
    if (conn) conn.release();
  }
};

exports.redeemLock = async (req, res) => {
  try {
    await ensureTables();
    const { id } = req.params;
    const { invoice_ref, notes } = req.body;

    const [locks] = await db.query("SELECT * FROM rate_locks WHERE id = ?", [id]);
    if (locks.length === 0) {
      return res.status(404).json({ success: false, message: "Rate lock not found" });
    }

    await db.query(`
      UPDATE rate_locks 
      SET status = 'Redeemed', invoice_ref = ?, redeemed_at = CURRENT_TIMESTAMP, notes = CONCAT(COALESCE(notes, ''), ' | Redeemed against Bill: ', ?)
      WHERE id = ?
    `, [invoice_ref || "REDEEMED", invoice_ref || "Direct Purchase", id]);

    return res.json({
      success: true,
      message: `Rate Lock #${locks[0].lock_no} successfully redeemed against invoice ${invoice_ref || ""}`,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ── PUT /api/advance/:id/extend-validity ───────────────────────────────────────
exports.extendValidity = async (req, res) => {
  try {
    await ensureTables();
    const { id } = req.params;
    const { new_valid_till, notes } = req.body;

    if (!new_valid_till) {
      return res.status(400).json({ success: false, message: "New validity date is required" });
    }

    await db.query(`
      UPDATE rate_locks 
      SET valid_till = ?, status = 'Active', notes = CONCAT(COALESCE(notes, ''), ' | Extended to: ', ?)
      WHERE id = ?
    `, [new_valid_till, new_valid_till, id]);

    return res.json({ success: true, message: `Validity extended to ${new_valid_till}` });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ── PUT /api/advance/:id/status ───────────────────────────────────────────────
exports.updateStatus = async (req, res) => {
  try {
    await ensureTables();
    const { id } = req.params;
    const { status, notes } = req.body;

    await db.query(`
      UPDATE rate_locks SET status = ?, notes = COALESCE(?, notes) WHERE id = ?
    `, [status, notes || null, id]);

    return res.json({ success: true, message: `Status updated to ${status}` });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ── DELETE /api/advance/:id ───────────────────────────────────────────────────
exports.deleteLock = async (req, res) => {
  try {
    await ensureTables();
    const { id } = req.params;

    await db.query("DELETE FROM rate_locks WHERE id = ?", [id]);
    return res.json({ success: true, message: "Rate lock deleted successfully" });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

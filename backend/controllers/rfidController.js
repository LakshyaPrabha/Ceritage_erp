const db = require("../config/db");
const { branchFilter } = require("../utils/branchScope");

let tablesInitialized = false;

// ── Auto-initialize RFID & Tray Audit tables if not existing ──
async function ensureTables() {
  if (tablesInitialized) return;
  try {
    // 1. Showcase Trays
    await db.query(`
      CREATE TABLE IF NOT EXISTS showcase_trays (
        id INT AUTO_INCREMENT PRIMARY KEY,
        branch_id INT DEFAULT 1,
        tray_code VARCHAR(30) UNIQUE NOT NULL,
        name VARCHAR(100) NOT NULL,
        category VARCHAR(100) NOT NULL,
        counter VARCHAR(100) NOT NULL DEFAULT 'Counter 1',
        capacity INT NOT NULL DEFAULT 24,
        rfid_tag_id VARCHAR(50) NULL,
        status ENUM('In Showcase', 'In Vault', 'Under Audit', 'Maintenance') DEFAULT 'In Showcase',
        notes TEXT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_tray_counter (counter, status),
        INDEX idx_tray_cat (category)
      )
    `);

    // 2. Tray Items
    await db.query(`
      CREATE TABLE IF NOT EXISTS tray_items (
        id INT AUTO_INCREMENT PRIMARY KEY,
        tray_id INT NOT NULL,
        product_id INT NOT NULL,
        slot_no INT NOT NULL DEFAULT 1,
        assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        assigned_by VARCHAR(100) DEFAULT 'Staff',
        status ENUM('IN_TRAY', 'REMOVED_FOR_TRIAL', 'TRANSFERRED', 'MISSING') DEFAULT 'IN_TRAY',
        FOREIGN KEY (tray_id) REFERENCES showcase_trays(id) ON DELETE CASCADE,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
        UNIQUE KEY uq_tray_product (tray_id, product_id),
        INDEX idx_tray_items (tray_id, status)
      )
    `);

    // 3. RFID Tags
    await db.query(`
      CREATE TABLE IF NOT EXISTS rfid_tags (
        id INT AUTO_INCREMENT PRIMARY KEY,
        rfid_epc VARCHAR(100) UNIQUE NOT NULL,
        product_id INT NULL,
        tag_type ENUM('JEWELRY_TAG', 'TRAY_TAG', 'STAFF_BADGE') DEFAULT 'JEWELRY_TAG',
        status ENUM('ACTIVE', 'INACTIVE', 'DECOMMISSIONED') DEFAULT 'ACTIVE',
        paired_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_scanned_at TIMESTAMP NULL,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL,
        INDEX idx_rfid_epc (rfid_epc)
      )
    `);

    // 4. RFID Audit Sessions
    await db.query(`
      CREATE TABLE IF NOT EXISTS rfid_audit_sessions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        session_no VARCHAR(30) UNIQUE NOT NULL,
        tray_id INT NULL,
        branch_id INT DEFAULT 1,
        counter VARCHAR(100) NULL,
        audit_type ENUM('SINGLE_TRAY', 'FULL_COUNTER', 'VAULT_AUDIT', 'STORE_CLOSING') DEFAULT 'SINGLE_TRAY',
        total_expected INT NOT NULL DEFAULT 0,
        total_scanned INT NOT NULL DEFAULT 0,
        matched_count INT NOT NULL DEFAULT 0,
        missing_count INT NOT NULL DEFAULT 0,
        misplaced_count INT NOT NULL DEFAULT 0,
        unknown_count INT NOT NULL DEFAULT 0,
        status ENUM('IN_PROGRESS', 'COMPLETED', 'DISCREPANCY_ALERT') DEFAULT 'COMPLETED',
        notes TEXT NULL,
        audited_by VARCHAR(100) DEFAULT 'Staff',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (tray_id) REFERENCES showcase_trays(id) ON DELETE SET NULL
      )
    `);

    // 5. RFID Audit Items
    await db.query(`
      CREATE TABLE IF NOT EXISTS rfid_audit_items (
        id INT AUTO_INCREMENT PRIMARY KEY,
        audit_session_id INT NOT NULL,
        product_id INT NULL,
        sku VARCHAR(50) NULL,
        rfid_epc VARCHAR(100) NULL,
        huid VARCHAR(20) NULL,
        item_name VARCHAR(200) NULL,
        category VARCHAR(100) NULL,
        purity VARCHAR(30) NULL,
        gross_weight DECIMAL(10,3) DEFAULT 0.000,
        mrp DECIMAL(12,2) DEFAULT 0.00,
        expected_tray_id INT NULL,
        detected_in_tray_id INT NULL,
        result ENUM('MATCHED', 'MISSING', 'MISPLACED_FOREIGN', 'UNKNOWN_TAG') NOT NULL,
        scanned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (audit_session_id) REFERENCES rfid_audit_sessions(id) ON DELETE CASCADE,
        INDEX idx_audit_result (audit_session_id, result)
      )
    `);

    // Seed default trays if empty
    const [existingTrays] = await db.query("SELECT COUNT(*) AS c FROM showcase_trays");
    if (existingTrays[0].c === 0) {
      const defaultTrays = [
        ["TRAY-A1", "Tray A1 - Bridal Gold Necklaces", "Gold Jewellery", "Counter 1", 18, "EPC-TRAY-A1", "In Showcase", "Main Entrance Display"],
        ["TRAY-A2", "Tray A2 - 22K Gold Bangles & Kadas", "Gold Jewellery", "Counter 1", 24, "EPC-TRAY-A2", "In Showcase", "Counter 1 Showcase"],
        ["TRAY-B1", "Tray B1 - Solitaire Diamond Rings", "Diamond Jewellery", "Counter 2", 24, "EPC-TRAY-B1", "In Showcase", "Diamond Island 1"],
        ["TRAY-B2", "Tray B2 - Diamond Earrings & Sets", "Diamond Jewellery", "Counter 2", 20, "EPC-TRAY-B2", "In Showcase", "Diamond Island 2"],
        ["TRAY-C1", "Tray C1 - Sterling Silver Articles", "Silver Jewellery", "Counter 3", 16, "EPC-TRAY-C1", "In Showcase", "Silver Showcase"],
        ["TRAY-C2", "Tray C2 - Silver Payal & Accessories", "Silver Jewellery", "Counter 3", 30, "EPC-TRAY-C2", "In Showcase", "Silver Counter 3"],
        ["VAULT-01", "Vault 1 - High Value Bullion & Bars", "Gold Jewellery", "Vault", 40, "EPC-VAULT-01", "In Vault", "Strongroom Vault Shelf A"],
        ["VAULT-02", "Vault 2 - Unmounted Gemstones & Platinum", "Gemstone Jewellery", "Vault", 30, "EPC-VAULT-02", "In Vault", "Strongroom Vault Shelf B"],
      ];

      for (const t of defaultTrays) {
        await db.query(
          "INSERT INTO showcase_trays (tray_code, name, category, counter, capacity, rfid_tag_id, status, notes) VALUES (?,?,?,?,?,?,?,?)",
          t
        );
      }

      // Auto-assign existing products matching category to initial trays
      const [allProducts] = await db.query("SELECT id, sku, huid, jewellery_category FROM products WHERE stock_qty > 0 LIMIT 50");
      for (const p of allProducts) {
        const [tray] = await db.query("SELECT id FROM showcase_trays WHERE category = ? LIMIT 1", [p.jewellery_category]);
        if (tray.length > 0) {
          const trayId = tray[0].id;
          await db.query(
            "INSERT IGNORE INTO tray_items (tray_id, product_id, slot_no, assigned_by) VALUES (?, ?, 1, 'Auto-Seed')",
            [trayId, p.id]
          );

          // Generate simulated EPC tag for product if none exists
          const epc = `EPC-${p.sku ? p.sku.replace(/[^A-Za-z0-9]/g, '') : 'PRD'}-${p.id}`.toUpperCase();
          await db.query(
            "INSERT IGNORE INTO rfid_tags (rfid_epc, product_id, status, paired_at) VALUES (?, ?, 'ACTIVE', NOW())",
            [epc, p.id]
          );
        }
      }
    }

    tablesInitialized = true;
  } catch (err) {
    console.error("RFID tables initialization error:", err.message);
  }
}

// ── GET /api/rfid/kpis ────────────────────────────────────────────────────────
exports.getKpis = async (req, res) => {
  try {
    await ensureTables();
    const bf = branchFilter(req);

    // 1. Total Trays & Showcase vs Vault
    const [trayStats] = await db.query(`
      SELECT 
        COUNT(*) AS total_trays,
        SUM(CASE WHEN status = 'In Showcase' THEN 1 ELSE 0 END) AS showcase_trays,
        SUM(CASE WHEN status = 'In Vault' THEN 1 ELSE 0 END) AS vault_trays
      FROM showcase_trays
      WHERE ${bf.sql}
    `, bf.params);

    // 2. Total RFID Tags paired
    const [tagStats] = await db.query(`
      SELECT COUNT(*) AS total_tagged
      FROM rfid_tags r
      LEFT JOIN products p ON r.product_id = p.id
      WHERE r.status = 'ACTIVE' AND (${branchFilter(req, 'p.branch_id').sql} OR p.id IS NULL)
    `, branchFilter(req, 'p.branch_id').params);

    // 3. Total Items & Untagged
    const [prodStats] = await db.query(`
      SELECT 
        COUNT(*) AS total_products,
        SUM(CASE WHEN r.id IS NULL THEN 1 ELSE 0 END) AS untagged_count,
        COALESCE(SUM(p.mrp * p.stock_qty), 0) AS total_valuation,
        COALESCE(SUM(p.gross_weight * p.stock_qty), 0) AS total_weight_g
      FROM products p
      LEFT JOIN rfid_tags r ON p.id = r.product_id AND r.status = 'ACTIVE'
      WHERE p.stock_qty > 0 AND ${branchFilter(req, 'p.branch_id').sql}
    `, branchFilter(req, 'p.branch_id').params);

    // 4. Audits Conducted Today & Discrepancies
    const [auditStats] = await db.query(`
      SELECT 
        COUNT(*) AS audits_today,
        COALESCE(SUM(missing_count), 0) AS missing_items_today,
        COALESCE(SUM(misplaced_count), 0) AS misplaced_items_today,
        MAX(created_at) AS last_audit_time
      FROM rfid_audit_sessions
      WHERE DATE(created_at) = CURRENT_DATE() AND ${bf.sql}
    `, bf.params);

    return res.json({
      success: true,
      data: {
        total_tagged: tagStats[0].total_tagged || 0,
        active_trays: trayStats[0].total_trays || 0,
        showcase_trays: trayStats[0].showcase_trays || 0,
        vault_trays: trayStats[0].vault_trays || 0,
        untagged_count: prodStats[0].untagged_count || 0,
        total_products: prodStats[0].total_products || 0,
        total_valuation: prodStats[0].total_valuation || 0,
        total_weight_g: prodStats[0].total_weight_g || 0,
        audits_today: auditStats[0].audits_today || 0,
        missing_items_today: auditStats[0].missing_items_today || 0,
        misplaced_items_today: auditStats[0].misplaced_items_today || 0,
        last_audit_time: auditStats[0].last_audit_time || null,
      },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ── GET /api/rfid/trays ───────────────────────────────────────────────────────
exports.getTrays = async (req, res) => {
  try {
    await ensureTables();
    const bf = branchFilter(req, "t.branch_id");

    const { counter, status } = req.query;
    let whereSql = `WHERE ${bf.sql}`;
    const params = [...bf.params];

    if (counter && counter !== "All") {
      whereSql += " AND t.counter = ?";
      params.push(counter);
    }
    if (status) {
      whereSql += " AND t.status = ?";
      params.push(status);
    }

    const [trays] = await db.query(`
      SELECT 
        t.*,
        COUNT(ti.id) AS current_items,
        COALESCE(SUM(p.gross_weight), 0) AS total_weight_g,
        COALESCE(SUM(p.mrp), 0) AS total_valuation,
        SUM(CASE WHEN p.stock_qty <= p.min_stock_qty THEN 1 ELSE 0 END) AS low_stock_count,
        (SELECT MAX(created_at) FROM rfid_audit_sessions s WHERE s.tray_id = t.id) AS last_audit_time,
        (SELECT status FROM rfid_audit_sessions s WHERE s.tray_id = t.id ORDER BY s.id DESC LIMIT 1) AS last_audit_status
      FROM showcase_trays t
      LEFT JOIN tray_items ti ON t.id = ti.tray_id AND ti.status = 'IN_TRAY'
      LEFT JOIN products p ON ti.product_id = p.id
      ${whereSql}
      GROUP BY t.id
      ORDER BY t.counter ASC, t.tray_code ASC
    `, params);

    return res.json({ success: true, data: trays });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ── GET /api/rfid/trays/:id ───────────────────────────────────────────────────
exports.getTrayById = async (req, res) => {
  try {
    await ensureTables();
    const { id } = req.params;

    const [trays] = await db.query("SELECT * FROM showcase_trays WHERE id = ?", [id]);
    if (trays.length === 0) {
      return res.status(404).json({ success: false, message: "Tray not found" });
    }

    const [items] = await db.query(`
      SELECT 
        ti.id AS tray_item_id,
        ti.slot_no,
        ti.assigned_at,
        ti.status AS tray_item_status,
        p.id AS product_id,
        p.name,
        p.sku,
        p.product_code,
        p.jewellery_category,
        p.product_category,
        p.metal_type,
        p.purity,
        p.gross_weight,
        p.net_weight,
        p.stone_weight,
        p.huid,
        p.mrp,
        p.stock_qty,
        r.rfid_epc,
        r.status AS rfid_status
      FROM tray_items ti
      JOIN products p ON ti.product_id = p.id
      LEFT JOIN rfid_tags r ON p.id = r.product_id AND r.status = 'ACTIVE'
      WHERE ti.tray_id = ? AND ti.status = 'IN_TRAY'
      ORDER BY ti.slot_no ASC, p.id DESC
    `, [id]);

    return res.json({
      success: true,
      data: {
        tray: trays[0],
        items,
      },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ── POST /api/rfid/trays ──────────────────────────────────────────────────────
exports.createTray = async (req, res) => {
  try {
    await ensureTables();
    const { tray_code, name, category, counter, capacity, rfid_tag_id, status, notes } = req.body;

    if (!tray_code || !name || !category) {
      return res.status(400).json({ success: false, message: "Tray code, name, and category are required" });
    }

    const [result] = await db.query(
      "INSERT INTO showcase_trays (tray_code, name, category, counter, capacity, rfid_tag_id, status, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      [tray_code.toUpperCase(), name, category, counter || "Counter 1", capacity || 24, rfid_tag_id || null, status || "In Showcase", notes || null]
    );

    return res.json({ success: true, message: "Tray created successfully", tray_id: result.insertId });
  } catch (err) {
    if (err.code === "ER_DUP_ENTRY") {
      return res.status(400).json({ success: false, message: "Tray code already exists" });
    }
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ── PUT /api/rfid/trays/:id ───────────────────────────────────────────────────
exports.updateTray = async (req, res) => {
  try {
    await ensureTables();
    const { id } = req.params;
    const { name, category, counter, capacity, rfid_tag_id, status, notes } = req.body;

    await db.query(
      "UPDATE showcase_trays SET name=?, category=?, counter=?, capacity=?, rfid_tag_id=?, status=?, notes=? WHERE id=?",
      [name, category, counter, capacity, rfid_tag_id, status, notes, id]
    );

    return res.json({ success: true, message: "Tray updated successfully" });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ── DELETE /api/rfid/trays/:id ────────────────────────────────────────────────
exports.deleteTray = async (req, res) => {
  try {
    await ensureTables();
    const { id } = req.params;

    const [items] = await db.query("SELECT COUNT(*) AS c FROM tray_items WHERE tray_id = ? AND status = 'IN_TRAY'", [id]);
    if (items[0].c > 0) {
      return res.status(400).json({ success: false, message: "Cannot delete tray with active items. Remove items first." });
    }

    await db.query("DELETE FROM showcase_trays WHERE id = ?", [id]);
    return res.json({ success: true, message: "Tray deleted successfully" });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ── POST /api/rfid/trays/:id/assign ───────────────────────────────────────────
exports.assignProductsToTray = async (req, res) => {
  try {
    await ensureTables();
    const { id } = req.params;
    const { product_ids, slot_start = 1 } = req.body;

    if (!Array.isArray(product_ids) || product_ids.length === 0) {
      return res.status(400).json({ success: false, message: "product_ids array is required" });
    }

    const [tray] = await db.query("SELECT * FROM showcase_trays WHERE id = ?", [id]);
    if (tray.length === 0) {
      return res.status(404).json({ success: false, message: "Tray not found" });
    }

    let currentSlot = Number(slot_start) || 1;
    for (const pid of product_ids) {
      // Remove from previous tray if present
      await db.query("DELETE FROM tray_items WHERE product_id = ?", [pid]);

      // Assign to new tray
      await db.query(
        "INSERT INTO tray_items (tray_id, product_id, slot_no, assigned_by) VALUES (?, ?, ?, ?)",
        [id, pid, currentSlot, req.user?.username || "Staff"]
      );

      // Auto-ensure RFID EPC tag exists for product
      const [existingTag] = await db.query("SELECT id FROM rfid_tags WHERE product_id = ?", [pid]);
      if (existingTag.length === 0) {
        const [prod] = await db.query("SELECT sku, huid FROM products WHERE id = ?", [pid]);
        if (prod.length > 0) {
          const epc = `EPC-${prod[0].sku ? prod[0].sku.replace(/[^A-Za-z0-9]/g, '') : 'PRD'}-${pid}`.toUpperCase();
          await db.query(
            "INSERT IGNORE INTO rfid_tags (rfid_epc, product_id, sku, huid, tag_type, paired_by) VALUES (?, ?, ?, ?, 'JEWELRY_TAG', ?)",
            [epc, pid, prod[0].sku, prod[0].huid, req.user?.username || "Staff"]
          );
        }
      }
      currentSlot++;
    }

    return res.json({ success: true, message: `${product_ids.length} product(s) assigned to ${tray[0].name}` });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ── POST /api/rfid/trays/:id/remove ───────────────────────────────────────────
exports.removeProductFromTray = async (req, res) => {
  try {
    await ensureTables();
    const { id } = req.params;
    const { product_id } = req.body;

    await db.query("DELETE FROM tray_items WHERE tray_id = ? AND product_id = ?", [id, product_id]);
    return res.json({ success: true, message: "Item removed from tray" });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ── POST /api/rfid/trays/transfer-location ────────────────────────────────────
exports.transferTraysLocation = async (req, res) => {
  try {
    await ensureTables();
    const { target_status, tray_ids } = req.body; // 'In Vault' (Day Closing) or 'In Showcase' (Day Opening)

    if (!["In Showcase", "In Vault"].includes(target_status)) {
      return res.status(400).json({ success: false, message: "Invalid target status" });
    }

    let sql = "UPDATE showcase_trays SET status = ?";
    const params = [target_status];

    if (Array.isArray(tray_ids) && tray_ids.length > 0) {
      sql += ` WHERE id IN (${tray_ids.map(() => "?").join(",")})`;
      params.push(...tray_ids);
    }

    await db.query(sql, params);

    // Record audit session for bulk transfer
    const sessionNo = `AUD-TRF-${Date.now().toString().slice(-6)}`;
    await db.query(
      "INSERT INTO rfid_audit_sessions (session_no, audit_type, auditor_name, remarks, status) VALUES (?, ?, ?, ?, 'COMPLETED')",
      [
        sessionNo,
        target_status === "In Vault" ? "DAY_CLOSING" : "DAY_OPENING",
        req.user?.username || "Admin",
        `Bulk location transfer of trays to ${target_status}`,
      ]
    );

    return res.json({
      success: true,
      message: `Trays successfully updated to "${target_status}"`,
      session_no: sessionNo,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ── POST /api/rfid/pair-tag ───────────────────────────────────────────────────
exports.pairRfidTag = async (req, res) => {
  try {
    await ensureTables();
    const { rfid_epc, product_id, sku, huid, tag_type = "JEWELRY_TAG" } = req.body;

    if (!rfid_epc || (!product_id && !sku)) {
      return res.status(400).json({ success: false, message: "RFID EPC and Product ID or SKU are required" });
    }

    let prodId = product_id;
    let prodSku = sku;
    let prodHuid = huid;

    if (prodId && (!prodSku || !prodHuid)) {
      const [prod] = await db.query("SELECT sku, huid FROM products WHERE id = ?", [prodId]);
      if (prod.length > 0) {
        prodSku = prod[0].sku;
        prodHuid = prod[0].huid;
      }
    } else if (prodSku && !prodId) {
      const [prod] = await db.query("SELECT id, huid FROM products WHERE sku = ?", [prodSku]);
      if (prod.length > 0) {
        prodId = prod[0].id;
        prodHuid = prod[0].huid;
      }
    }

    await db.query(
      `INSERT INTO rfid_tags (rfid_epc, product_id, sku, huid, tag_type, status, paired_by) 
       VALUES (?, ?, ?, ?, ?, 'ACTIVE', ?)
       ON DUPLICATE KEY UPDATE product_id=VALUES(product_id), sku=VALUES(sku), huid=VALUES(huid), status='ACTIVE'`,
      [rfid_epc.toUpperCase().trim(), prodId, prodSku, prodHuid, tag_type, req.user?.username || "Admin"]
    );

    return res.json({ success: true, message: `RFID EPC Tag ${rfid_epc} paired with SKU ${prodSku || prodId}` });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ── GET /api/rfid/lookup/:query ───────────────────────────────────────────────
exports.lookupTagOrSku = async (req, res) => {
  try {
    await ensureTables();
    const q = req.params.query.trim();

    const [rows] = await db.query(`
      SELECT 
        p.*,
        r.rfid_epc,
        r.tag_type,
        r.status AS rfid_status,
        t.id AS tray_id,
        t.tray_code,
        t.name AS tray_name,
        t.counter AS tray_counter,
        t.status AS tray_status,
        ti.slot_no
      FROM products p
      LEFT JOIN rfid_tags r ON p.id = r.product_id
      LEFT JOIN tray_items ti ON p.id = ti.product_id AND ti.status = 'IN_TRAY'
      LEFT JOIN showcase_trays t ON ti.tray_id = t.id
      WHERE r.rfid_epc = ? OR p.sku = ? OR p.huid = ? OR p.barcode = ?
      LIMIT 1
    `, [q, q, q, q]);

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: `No jewelry item found for tag / code "${q}"` });
    }

    return res.json({ success: true, data: rows[0] });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ── POST /api/rfid/audit/process-scan ─────────────────────────────────────────
// The Core Real-Time Tray & Showcase Audit Reconciliation Engine
exports.processAuditScan = async (req, res) => {
  try {
    await ensureTables();
    const {
      tray_id,
      scanned_epcs = [],
      scanned_skus = [],
      audit_type = "TRAY_AUDIT",
      auditor_name = req.user?.full_name || "Showroom Auditor",
      remarks = "",
    } = req.body;

    if (!tray_id) {
      return res.status(400).json({ success: false, message: "tray_id is required for tray audit" });
    }

    // 1. Get Target Tray details
    const [trays] = await db.query("SELECT * FROM showcase_trays WHERE id = ?", [tray_id]);
    if (trays.length === 0) {
      return res.status(404).json({ success: false, message: "Target tray not found" });
    }
    const targetTray = trays[0];

    // 2. Fetch Expected items in this tray
    const [expectedItems] = await db.query(`
      SELECT 
        p.id AS product_id,
        p.sku,
        p.name,
        p.jewellery_category,
        p.purity,
        p.gross_weight,
        p.mrp,
        p.huid,
        r.rfid_epc
      FROM tray_items ti
      JOIN products p ON ti.product_id = p.id
      LEFT JOIN rfid_tags r ON p.id = r.product_id AND r.status = 'ACTIVE'
      WHERE ti.tray_id = ? AND ti.status = 'IN_TRAY'
    `, [tray_id]);

    // Normalize scanned inputs (both EPCs and SKUs)
    const scannedSet = new Set(
      [...scanned_epcs, ...scanned_skus]
        .map((s) => String(s || "").trim().toUpperCase())
        .filter(Boolean)
    );

    // 3. Resolve all scanned tags in the DB across all products
    let detectedProducts = [];
    if (scannedSet.size > 0) {
      const tagList = Array.from(scannedSet);
      const placeholders = tagList.map(() => "?").join(",");
      const [found] = await db.query(`
        SELECT 
          p.id AS product_id,
          p.sku,
          p.name,
          p.jewellery_category,
          p.purity,
          p.gross_weight,
          p.mrp,
          p.huid,
          r.rfid_epc,
          ti.tray_id AS current_assigned_tray_id,
          st.name AS current_assigned_tray_name,
          st.counter AS current_assigned_counter
        FROM products p
        LEFT JOIN rfid_tags r ON p.id = r.product_id
        LEFT JOIN tray_items ti ON p.id = ti.product_id AND ti.status = 'IN_TRAY'
        LEFT JOIN showcase_trays st ON ti.tray_id = st.id
        WHERE r.rfid_epc IN (${placeholders}) OR p.sku IN (${placeholders}) OR p.huid IN (${placeholders})
      `, [...tagList, ...tagList, ...tagList]);
      detectedProducts = found;
    }

    const detectedProductIds = new Set(detectedProducts.map((p) => p.product_id));
    const expectedProductIds = new Set(expectedItems.map((p) => p.product_id));

    const matchedItems = [];
    const missingItems = [];
    const misplacedForeignItems = [];

    // Check Expected items -> Matched or Missing
    for (const exp of expectedItems) {
      const isDetected = detectedProductIds.has(exp.product_id) ||
        (exp.rfid_epc && scannedSet.has(exp.rfid_epc.toUpperCase())) ||
        (exp.sku && scannedSet.has(exp.sku.toUpperCase()));

      if (isDetected) {
        matchedItems.push({
          ...exp,
          result: "MATCHED",
          status_label: "✓ Verified in Tray",
        });
      } else {
        missingItems.push({
          ...exp,
          result: "MISSING",
          status_label: "⚠ Missing from Tray",
        });
      }
    }

    // Check Detected items that DO NOT belong to this tray (Misplaced / Foreign)
    for (const det of detectedProducts) {
      if (!expectedProductIds.has(det.product_id)) {
        misplacedForeignItems.push({
          ...det,
          result: "MISPLACED_FOREIGN",
          expected_tray_name: det.current_assigned_tray_name || "Unassigned / Vault",
          expected_counter: det.current_assigned_counter || "Unknown",
          status_label: `⚠ Misplaced (Belongs to ${det.current_assigned_tray_name || "Another Tray"})`,
        });
      }
    }

    const expectedCount = expectedItems.length;
    const scannedCount = detectedProducts.length;
    const matchedCount = matchedItems.length;
    const missingCount = missingItems.length;
    const misplacedCount = misplacedForeignItems.length;

    const totalWeightG = matchedItems.reduce((acc, i) => acc + parseFloat(i.gross_weight || 0), 0);
    const totalValuation = matchedItems.reduce((acc, i) => acc + parseFloat(i.mrp || 0), 0);
    const missingValuation = missingItems.reduce((acc, i) => acc + parseFloat(i.mrp || 0), 0);

    const isSuccess = missingCount === 0 && misplacedCount === 0;
    const sessionStatus = isSuccess ? "COMPLETED" : "DISCREPANCY_FLAGGED";

    // 4. Save Audit Session to DB
    const sessionNo = `AUD-${Date.now().toString().slice(-6)}`;
    const [auditSession] = await db.query(
      `INSERT INTO rfid_audit_sessions 
       (session_no, tray_id, tray_code, audit_type, auditor_name, expected_count, scanned_count, matched_count, missing_count, misplaced_count, total_weight_g, total_valuation, status, remarks)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        sessionNo,
        targetTray.id,
        targetTray.tray_code,
        audit_type,
        auditor_name,
        expectedCount,
        scannedCount,
        matchedCount,
        missingCount,
        misplacedCount,
        totalWeightG,
        totalValuation,
        sessionStatus,
        remarks,
      ]
    );
    const sessionId = auditSession.insertId;

    // 5. Save Item Details
    const allAuditItems = [
      ...matchedItems.map((m) => [sessionId, m.product_id, m.sku, m.rfid_epc, m.huid, m.name, m.jewellery_category, m.purity, m.gross_weight, m.mrp, targetTray.id, targetTray.id, "MATCHED"]),
      ...missingItems.map((m) => [sessionId, m.product_id, m.sku, m.rfid_epc, m.huid, m.name, m.jewellery_category, m.purity, m.gross_weight, m.mrp, targetTray.id, null, "MISSING"]),
      ...misplacedForeignItems.map((m) => [sessionId, m.product_id, m.sku, m.rfid_epc, m.huid, m.name, m.jewellery_category, m.purity, m.gross_weight, m.mrp, m.current_assigned_tray_id || null, targetTray.id, "MISPLACED_FOREIGN"]),
    ];

    if (allAuditItems.length > 0) {
      await db.query(
        `INSERT INTO rfid_audit_items 
         (audit_session_id, product_id, sku, rfid_epc, huid, item_name, category, purity, gross_weight, mrp, expected_tray_id, detected_in_tray_id, result)
         VALUES ?`,
        [allAuditItems]
      );
    }

    return res.json({
      success: true,
      message: isSuccess ? "Tray Audit Passed: 100% Match" : `Discrepancy Detected: ${missingCount} Missing, ${misplacedCount} Misplaced`,
      data: {
        session_id: sessionId,
        session_no: sessionNo,
        tray: targetTray,
        status: sessionStatus,
        is_clean_audit: isSuccess,
        summary: {
          expected: expectedCount,
          scanned: scannedCount,
          matched: matchedCount,
          missing: missingCount,
          misplaced: misplacedCount,
          matched_weight_g: totalWeightG,
          matched_valuation: totalValuation,
          missing_valuation: missingValuation,
        },
        matched_items: matchedItems,
        missing_items: missingItems,
        misplaced_items: misplacedForeignItems,
      },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ── GET /api/rfid/audit/history ───────────────────────────────────────────────
exports.getAuditHistory = async (req, res) => {
  try {
    await ensureTables();
    const { tray_id, limit = 50 } = req.query;

    let sql = `
      SELECT 
        s.*,
        t.name AS tray_name,
        t.counter AS tray_counter
      FROM rfid_audit_sessions s
      LEFT JOIN showcase_trays t ON s.tray_id = t.id
      WHERE 1=1
    `;
    const params = [];

    if (tray_id) {
      sql += " AND s.tray_id = ?";
      params.push(tray_id);
    }

    sql += " ORDER BY s.id DESC LIMIT ?";
    params.push(Number(limit) || 50);

    const [sessions] = await db.query(sql, params);
    return res.json({ success: true, data: sessions });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ── GET /api/rfid/audit/:id ───────────────────────────────────────────────────
exports.getAuditSessionDetails = async (req, res) => {
  try {
    await ensureTables();
    const { id } = req.params;

    const [sessions] = await db.query(`
      SELECT 
        s.*,
        t.name AS tray_name,
        t.counter AS tray_counter,
        t.category AS tray_category
      FROM rfid_audit_sessions s
      LEFT JOIN showcase_trays t ON s.tray_id = t.id
      WHERE s.id = ?
    `, [id]);

    if (sessions.length === 0) {
      return res.status(404).json({ success: false, message: "Audit session not found" });
    }

    const [items] = await db.query(`
      SELECT 
        ai.*,
        et.name AS expected_tray_name,
        dt.name AS detected_tray_name
      FROM rfid_audit_items ai
      LEFT JOIN showcase_trays et ON ai.expected_tray_id = et.id
      LEFT JOIN showcase_trays dt ON ai.detected_in_tray_id = dt.id
      WHERE ai.audit_session_id = ?
      ORDER BY ai.result ASC, ai.id ASC
    `, [id]);

    return res.json({
      success: true,
      data: {
        session: sessions[0],
        items,
      },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

const db = require("../config/db");

async function ensureTables() {
  try {
    // 1. Branches Table (Stores Main/Root Headquarters & branches)
    await db.query(`
      CREATE TABLE IF NOT EXISTS branches (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(150) NOT NULL,
        city VARCHAR(100) NULL,
        address VARCHAR(255) NULL,
        manager_id INT NULL,
        phone VARCHAR(30) NULL,
        gstin VARCHAR(30) NULL,
        parent_branch_id INT NULL,
        created_by INT NULL,
        status ENUM('Active', 'Inactive') DEFAULT 'Active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    // Ensure columns exist on existing table
    try {
      const [cols] = await db.query("SHOW COLUMNS FROM branches");
      const existingCols = new Set(cols.map((c) => c.Field.toLowerCase()));

      if (!existingCols.has("parent_branch_id")) {
        await db.query("ALTER TABLE branches ADD COLUMN parent_branch_id INT NULL");
      }
      if (!existingCols.has("created_by")) {
        await db.query("ALTER TABLE branches ADD COLUMN created_by INT NULL");
      }

      // Link any existing sub-branches created under main store (id: 1)
      await db.query(`
        UPDATE branches 
        SET parent_branch_id = 1 
        WHERE parent_branch_id IS NULL 
          AND id > 1 
          AND (name LIKE '%Krishna%' OR name LIKE '%Singarghar%' OR created_by = 1)
      `);
    } catch (e) {
      console.warn("Branch column check warning:", e.message);
    }

    // 2. Sub Branches Table (Explicit table linking main_branch_id with sub_branches)
    await db.query(`
      CREATE TABLE IF NOT EXISTS sub_branches (
        id INT AUTO_INCREMENT PRIMARY KEY,
        branch_id INT NULL,
        main_branch_id INT NOT NULL,
        name VARCHAR(150) NOT NULL,
        city VARCHAR(100) NULL,
        address VARCHAR(255) NULL,
        manager_id INT NULL,
        phone VARCHAR(30) NULL,
        gstin VARCHAR(30) NULL,
        status ENUM('Active', 'Inactive') DEFAULT 'Active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (main_branch_id) REFERENCES branches(id) ON DELETE CASCADE
      )
    `);

    // Ensure existing sub-branches are synced to sub_branches table
    try {
      await db.query(`
        INSERT IGNORE INTO sub_branches (branch_id, main_branch_id, name, city, address, phone, gstin, status)
        SELECT id, parent_branch_id, name, city, address, phone, gstin, status
        FROM branches
        WHERE parent_branch_id IS NOT NULL AND parent_branch_id > 0
          AND id NOT IN (SELECT branch_id FROM sub_branches WHERE branch_id IS NOT NULL)
      `);
    } catch { /* silent */ }

    // 3. Stock Transfers Table
    await db.query(`
      CREATE TABLE IF NOT EXISTS stock_transfers (
        id INT AUTO_INCREMENT PRIMARY KEY,
        transfer_no VARCHAR(30) UNIQUE NOT NULL,
        transfer_id VARCHAR(30) NULL,
        from_branch_id INT NOT NULL,
        to_branch_id INT NOT NULL,
        source_branch_id INT NULL,
        dest_branch_id INT NULL,
        sku VARCHAR(100) NOT NULL,
        quantity DECIMAL(10,3) NOT NULL DEFAULT 1.000,
        qty DECIMAL(10,3) NOT NULL DEFAULT 1.000,
        transport_mode VARCHAR(100) DEFAULT 'Armored Van - Secure Logistics',
        dispatch_date DATE NULL,
        transfer_date DATE NULL,
        received_date DATE NULL,
        status ENUM('IN_TRANSIT', 'RECEIVED', 'CANCELLED') DEFAULT 'IN_TRANSIT',
        notes VARCHAR(255) NULL,
        created_by VARCHAR(100) DEFAULT 'Admin',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (from_branch_id) REFERENCES branches(id) ON DELETE CASCADE,
        FOREIGN KEY (to_branch_id) REFERENCES branches(id) ON DELETE CASCADE
      )
    `);
  } catch (err) {
    console.error("Branch table init error:", err.message);
  }
}

// Helper: Resolve Root Main Branch ID for any given branch
async function getRootBranchId(branchId) {
  if (!branchId) return 1;
  try {
    const [[b]] = await db.query("SELECT id, parent_branch_id FROM branches WHERE id = ?", [branchId]);
    if (b && b.parent_branch_id) {
      return b.parent_branch_id; // Sub-branch points to root main branch
    }
    return b ? b.id : 1;
  } catch {
    return branchId || 1;
  }
}

// ── GET /api/branch/kpis ──────────────────────────────────────────────────────
exports.getKpis = async (req, res) => {
  try {
    await ensureTables();
    const userBranchId = req.user?.branch_id || 1;
    const rootBranchId = await getRootBranchId(userBranchId);

    const [[branchStats]] = await db.query(`
      SELECT
        COUNT(*) AS total_branches,
        COUNT(CASE WHEN status='Active' THEN 1 END) AS active_branches
      FROM branches
      WHERE (id = ? OR parent_branch_id = ?)
    `, [rootBranchId, rootBranchId]);

    const [[subBranchStats]] = await db.query(`
      SELECT
        COUNT(*) AS total_sub_branches,
        COUNT(CASE WHEN status='Active' THEN 1 END) AS active_sub_branches
      FROM sub_branches
      WHERE main_branch_id = ?
    `, [rootBranchId]);

    const [[userBranch]] = await db.query(`
      SELECT id, name, city, parent_branch_id FROM branches WHERE id = ?
    `, [userBranchId]);

    const [[mainBranch]] = await db.query(`
      SELECT id, name, city, phone, gstin, address FROM branches WHERE id = ?
    `, [rootBranchId]);

    const [[transferStats]] = await db.query(`
      SELECT
        COUNT(CASE WHEN status='IN_TRANSIT' THEN 1 END) AS in_transit,
        COUNT(CASE WHEN status='RECEIVED' THEN 1 END) AS total_received,
        COUNT(CASE WHEN from_branch_id = ? AND status='IN_TRANSIT' THEN 1 END) AS my_outgoing_transfers,
        COUNT(CASE WHEN to_branch_id = ? AND status='IN_TRANSIT' THEN 1 END) AS my_incoming_transfers,
        COALESCE(SUM(quantity), 0) AS total_qty_transferred
      FROM stock_transfers
      WHERE (
        from_branch_id IN (SELECT id FROM branches WHERE id = ? OR parent_branch_id = ?)
        OR to_branch_id IN (SELECT id FROM branches WHERE id = ? OR parent_branch_id = ?)
      )
    `, [userBranchId, userBranchId, rootBranchId, rootBranchId, rootBranchId, rootBranchId]);

    return res.json({
      success: true,
      data: {
        total_branches: branchStats.total_branches || 1,
        active_branches: branchStats.active_branches || 1,
        total_sub_branches: subBranchStats?.total_sub_branches || 0,
        active_sub_branches: subBranchStats?.active_sub_branches || 0,
        user_branch_id: userBranchId,
        root_branch_id: rootBranchId,
        is_main_branch: !userBranch?.parent_branch_id,
        user_branch_name: userBranch ? `${userBranch.name} (${userBranch.city || "Main"})` : `Branch #${userBranchId}`,
        main_branch_details: mainBranch || null,
        in_transit: transferStats.in_transit || 0,
        total_received: transferStats.total_received || 0,
        my_outgoing_transfers: transferStats.my_outgoing_transfers || 0,
        my_incoming_transfers: transferStats.my_incoming_transfers || 0,
        total_transferred_qty: parseFloat(transferStats.total_qty_transferred || 0),
      },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ── GET /api/branch ───────────────────────────────────────────────────────────
exports.getAll = async (req, res) => {
  try {
    await ensureTables();
    const userBranchId = req.user?.branch_id || 1;
    const rootBranchId = await getRootBranchId(userBranchId);

    // Fetch all branches in this business network (Root Main Store + all its Sub-Branches)
    const [rows] = await db.query(`
      SELECT b.*, u.full_name AS manager_name
      FROM branches b
      LEFT JOIN users u ON b.manager_id = u.id
      WHERE (b.id = ? OR b.parent_branch_id = ?)
      ORDER BY (b.parent_branch_id IS NULL) DESC, (b.id = ?) DESC, b.id ASC
    `, [rootBranchId, rootBranchId, userBranchId]);

    const enrichedRows = rows.map((b) => ({
      ...b,
      is_user_branch: b.id === userBranchId,
      is_main_branch: !b.parent_branch_id,
    }));

    return res.json({
      success: true,
      data: enrichedRows,
      user_branch_id: userBranchId,
      root_branch_id: rootBranchId,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ── GET /api/branch/sub-branches ──────────────────────────────────────────────
exports.getSubBranches = async (req, res) => {
  try {
    await ensureTables();
    const userBranchId = req.user?.branch_id || 1;
    const rootBranchId = await getRootBranchId(userBranchId);

    const [rows] = await db.query(`
      SELECT 
        sb.*,
        b.name AS main_branch_name,
        b.city AS main_branch_city,
        u.full_name AS manager_name
      FROM sub_branches sb
      LEFT JOIN branches b ON sb.main_branch_id = b.id
      LEFT JOIN users u ON sb.manager_id = u.id
      WHERE sb.main_branch_id = ?
      ORDER BY sb.id DESC
    `, [rootBranchId]);

    return res.json({
      success: true,
      data: rows,
      main_branch_id: rootBranchId,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ── POST /api/branch/sub-branches ─────────────────────────────────────────────
exports.createSubBranch = async (req, res) => {
  try {
    await ensureTables();
    const userBranchId = req.user?.branch_id || 1;
    const userId = req.user?.id || 1;
    const rootBranchId = await getRootBranchId(userBranchId);
    const { name, city, address, manager_id, phone, gstin, status = "Active" } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, message: "Sub-Branch name is required" });
    }

    // 1. Create entry in branches table
    const [result] = await db.query(
      `INSERT INTO branches (name, city, address, manager_id, phone, gstin, parent_branch_id, created_by, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        name.trim(),
        city ? city.trim() : null,
        address ? address.trim() : null,
        manager_id || null,
        phone ? phone.trim() : null,
        gstin ? gstin.trim().toUpperCase() : null,
        rootBranchId,
        userId,
        status,
      ]
    );

    const branchId = result.insertId;

    // 2. Create entry in sub_branches table
    const [subResult] = await db.query(
      `INSERT INTO sub_branches (branch_id, main_branch_id, name, city, address, manager_id, phone, gstin, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        branchId,
        rootBranchId,
        name.trim(),
        city ? city.trim() : null,
        address ? address.trim() : null,
        manager_id || null,
        phone ? phone.trim() : null,
        gstin ? gstin.trim().toUpperCase() : null,
        status,
      ]
    );

    return res.status(201).json({
      success: true,
      message: `Sub-Branch "${name}" linked to Main Store (#${rootBranchId}) successfully`,
      data: { id: subResult.insertId, branch_id: branchId, main_branch_id: rootBranchId },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ── PUT /api/branch/sub-branches/:id ──────────────────────────────────────────
exports.updateSubBranch = async (req, res) => {
  try {
    await ensureTables();
    const userBranchId = req.user?.branch_id || 1;
    const rootBranchId = await getRootBranchId(userBranchId);
    const { name, city, address, manager_id, phone, gstin, status } = req.body;

    const [sub] = await db.query(
      "SELECT * FROM sub_branches WHERE id = ? AND main_branch_id = ?",
      [req.params.id, rootBranchId]
    );

    if (sub.length === 0) {
      return res.status(404).json({ success: false, message: "Sub-Branch not found or unauthorized" });
    }

    const subItem = sub[0];

    // Update in sub_branches
    await db.query(
      `UPDATE sub_branches
       SET name=?, city=?, address=?, manager_id=?, phone=?, gstin=?, status=?
       WHERE id=?`,
      [
        name.trim(),
        city ? city.trim() : null,
        address ? address.trim() : null,
        manager_id || null,
        phone ? phone.trim() : null,
        gstin ? gstin.trim().toUpperCase() : null,
        status || "Active",
        req.params.id,
      ]
    );

    // Also update in branches if linked
    if (subItem.branch_id) {
      await db.query(
        `UPDATE branches
         SET name=?, city=?, address=?, manager_id=?, phone=?, gstin=?, status=?
         WHERE id=?`,
        [
          name.trim(),
          city ? city.trim() : null,
          address ? address.trim() : null,
          manager_id || null,
          phone ? phone.trim() : null,
          gstin ? gstin.trim().toUpperCase() : null,
          status || "Active",
          subItem.branch_id,
        ]
      );
    }

    return res.json({ success: true, message: "Sub-Branch updated successfully" });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ── DELETE /api/branch/sub-branches/:id ───────────────────────────────────────
exports.deleteSubBranch = async (req, res) => {
  try {
    await ensureTables();
    const userBranchId = req.user?.branch_id || 1;
    const rootBranchId = await getRootBranchId(userBranchId);

    const [sub] = await db.query(
      "SELECT * FROM sub_branches WHERE id = ? AND main_branch_id = ?",
      [req.params.id, rootBranchId]
    );

    if (sub.length === 0) {
      return res.status(404).json({ success: false, message: "Sub-Branch not found" });
    }

    const subItem = sub[0];

    await db.query("DELETE FROM sub_branches WHERE id = ?", [req.params.id]);

    if (subItem.branch_id) {
      await db.query("UPDATE branches SET status = 'Inactive' WHERE id = ?", [subItem.branch_id]);
    }

    return res.json({ success: true, message: "Sub-Branch archived successfully" });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ── POST /api/branch (Generic) ────────────────────────────────────────────────
exports.create = async (req, res) => {
  return exports.createSubBranch(req, res);
};

// ── PUT /api/branch/:id (Generic) ─────────────────────────────────────────────
exports.update = async (req, res) => {
  try {
    await ensureTables();
    const userBranchId = req.user?.branch_id || 1;
    const rootBranchId = await getRootBranchId(userBranchId);
    const { name, city, address, manager_id, phone, gstin, status } = req.body;

    const [check] = await db.query(
      "SELECT id FROM branches WHERE id = ? AND (id = ? OR parent_branch_id = ?)",
      [req.params.id, rootBranchId, rootBranchId]
    );

    if (check.length === 0) {
      return res.status(403).json({ success: false, message: "Unauthorized to edit this branch" });
    }

    await db.query(
      `UPDATE branches
       SET name=?, city=?, address=?, manager_id=?, phone=?, gstin=?, status=?
       WHERE id=?`,
      [name, city || null, address || null, manager_id || null, phone || null, gstin || null, status || "Active", req.params.id]
    );

    try {
      await db.query(
        `UPDATE sub_branches
         SET name=?, city=?, address=?, manager_id=?, phone=?, gstin=?, status=?
         WHERE branch_id=?`,
        [name, city || null, address || null, manager_id || null, phone || null, gstin || null, status || "Active", req.params.id]
      );
    } catch { /* silent */ }

    return res.json({ success: true, message: "Branch details updated successfully" });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ── GET /api/branch/transfers ─────────────────────────────────────────────────
exports.getTransfers = async (req, res) => {
  try {
    await ensureTables();
    const userBranchId = req.user?.branch_id || 1;
    const rootBranchId = await getRootBranchId(userBranchId);

    const [rows] = await db.query(`
      SELECT 
        t.*,
        COALESCE(t.transfer_id, t.transfer_no) AS transfer_id,
        b1.name AS from_branch,
        b1.city AS from_city,
        b2.name AS to_branch,
        b2.city AS to_city
      FROM stock_transfers t
      LEFT JOIN branches b1 ON t.from_branch_id = b1.id
      LEFT JOIN branches b2 ON t.to_branch_id = b2.id
      WHERE (
        t.from_branch_id IN (SELECT id FROM branches WHERE id = ? OR parent_branch_id = ?)
        OR t.to_branch_id IN (SELECT id FROM branches WHERE id = ? OR parent_branch_id = ?)
      )
      ORDER BY t.id DESC
    `, [rootBranchId, rootBranchId, rootBranchId, rootBranchId]);

    const enriched = rows.map((tr) => ({
      ...tr,
      is_outgoing: tr.from_branch_id === userBranchId,
      is_incoming: tr.to_branch_id === userBranchId,
    }));

    return res.json({
      success: true,
      data: enriched,
      user_branch_id: userBranchId,
      root_branch_id: rootBranchId,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ── POST /api/branch/transfers ────────────────────────────────────────────────
exports.createTransfer = async (req, res) => {
  try {
    await ensureTables();
    const userBranchId = req.user?.branch_id || 1;
    const {
      from_branch_id,
      to_branch_id,
      sku,
      quantity = 1,
      transport_mode = "Armored Van - Secure Logistics",
      dispatch_date,
      notes = "",
    } = req.body;

    const sourceBranch = from_branch_id || userBranchId;

    if (!sourceBranch || !to_branch_id || !sku) {
      return res.status(400).json({
        success: false,
        message: "Source Branch, Destination Branch, and Product SKU are required",
      });
    }

    if (String(sourceBranch) === String(to_branch_id)) {
      return res.status(400).json({
        success: false,
        message: "Source and Destination branch cannot be the same",
      });
    }

    const transferNo = `TRF-${new Date().getFullYear()}-${Date.now().toString().slice(-4)}`;
    const dateVal = dispatch_date || new Date().toISOString().split("T")[0];

    const [result] = await db.query(`
      INSERT INTO stock_transfers
        (transfer_no, transfer_id, from_branch_id, to_branch_id, source_branch_id, dest_branch_id, sku, quantity, qty, transport_mode, dispatch_date, transfer_date, notes, status, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'IN_TRANSIT', ?)
    `, [
      transferNo,
      transferNo,
      sourceBranch,
      to_branch_id,
      sourceBranch,
      to_branch_id,
      sku.trim(),
      parseFloat(quantity) || 1,
      parseFloat(quantity) || 1,
      transport_mode,
      dateVal,
      dateVal,
      notes || null,
      req.user?.full_name || req.user?.username || "Admin",
    ]);

    return res.status(201).json({
      success: true,
      message: `Stock Transfer Memo ${transferNo} generated successfully`,
      data: { id: result.insertId, transfer_id: transferNo },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ── PATCH /api/branch/transfers/:id/status ───────────────────────────────────
exports.updateTransferStatus = async (req, res) => {
  try {
    await ensureTables();
    const { status } = req.body;

    if (!["RECEIVED", "CANCELLED", "IN_TRANSIT"].includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid transfer status" });
    }

    const receivedDate = status === "RECEIVED" ? new Date().toISOString().split("T")[0] : null;

    await db.query(`
      UPDATE stock_transfers
      SET status = ?, received_date = ?
      WHERE id = ? OR transfer_no = ?
    `, [status, receivedDate, req.params.id, req.params.id]);

    return res.json({
      success: true,
      message: `Stock transfer status updated to "${status}"`,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

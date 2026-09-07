const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const db = require("../config/db");


let authTablesChecked = false;

async function addCol(table, col, def) {
  try {
    const [cols] = await db.query(`SHOW COLUMNS FROM \`${table}\` LIKE ?`, [col]);
    if (cols.length === 0) {
      await db.query(`ALTER TABLE \`${table}\` ADD COLUMN \`${col}\` ${def}`);
    }
  } catch (err) {
    console.warn(`Notice adding column ${col} to ${table}:`, err.message);
  }
}

async function ensureAuthTables() {
  if (authTablesChecked) return;
  try {
    // 1. branches columns
    await addCol("branches", "parent_branch_id", "INT NULL");
    await addCol("branches", "is_main", "TINYINT(1) DEFAULT 1");
    await addCol("branches", "branch_type", "VARCHAR(50) DEFAULT 'MAIN_HQ'");
    await addCol("branches", "created_by", "INT NULL");

    // 2. sub_branches table & columns
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
        is_primary_hq TINYINT(1) DEFAULT 0,
        status VARCHAR(50) DEFAULT 'Active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (main_branch_id) REFERENCES branches(id) ON DELETE CASCADE
      )
    `);

    await addCol("sub_branches", "branch_id", "INT NULL");
    await addCol("sub_branches", "main_branch_id", "INT NOT NULL");
    await addCol("sub_branches", "is_primary_hq", "TINYINT(1) DEFAULT 0");
    await addCol("sub_branches", "gstin", "VARCHAR(30) NULL");
    await addCol("sub_branches", "phone", "VARCHAR(30) NULL");
    await addCol("sub_branches", "address", "VARCHAR(255) NULL");
    await addCol("sub_branches", "city", "VARCHAR(100) NULL");
    await addCol("sub_branches", "status", "VARCHAR(50) DEFAULT 'Active'");

    // 3. users columns
    await addCol("users", "sub_branch_id", "INT NULL");
    await addCol("users", "branch_id", "INT DEFAULT 1");

    // 4. customers columns
    await addCol("customers", "branch_id", "INT DEFAULT 1");
    await addCol("customers", "sub_branch_id", "INT NULL");
    await addCol("customers", "customer_id", "VARCHAR(50) NULL");
    await addCol("customers", "customer_code", "VARCHAR(50) NULL");

    authTablesChecked = true;
  } catch (e) {
    console.warn("Auth table check notice:", e.message);
  }
}

async function register(req, res) {
  const { full_name, username, email, password, business_name, phone, city } = req.body;

  if (!full_name || !username || !password || !business_name || !phone) {
    return res.status(400).json({
      success: false,
      message: "full_name, username, password, business_name and phone are required",
    });
  }

  if (password.length < 6) {
    return res.status(400).json({ success: false, message: "Password must be at least 6 characters" });
  }

  try {
    await ensureAuthTables();

    // Check if username already exists
    const [existing] = await db.query(
      "SELECT id FROM users WHERE username = ?",
      [username.toLowerCase()]
    );
    if (existing.length > 0) {
      return res.status(409).json({ success: false, message: "Username already taken. Please choose another." });
    }

    // 1. Create the Main Branch (HQ) for this Jeweler Business in branches table
    const [branchResult] = await db.query(
      "INSERT INTO branches (name, city, phone, parent_branch_id, is_main, branch_type, status) VALUES (?, ?, ?, NULL, 1, 'MAIN_HQ', 'Active')",
      [business_name.trim(), city ? city.trim() : null, phone ? phone.trim() : null]
    );
    const main_branch_id = branchResult.insertId;

    // 2. Create the Primary Sub-Branch / Showroom entry in sub_branches table
    const [subBranchResult] = await db.query(
      "INSERT INTO sub_branches (branch_id, main_branch_id, name, city, phone, is_primary_hq, status) VALUES (?, ?, ?, ?, ?, 1, 'Active')",
      [
        main_branch_id,
        main_branch_id,
        `${business_name.trim()} (Main Showroom)`,
        city ? city.trim() : null,
        phone ? phone.trim() : null,
      ]
    );
    const sub_branch_id = subBranchResult.insertId;

    // 3. Hash password
    const password_hash = await bcrypt.hash(password, 12);

    // 4. Create admin user linked to this Main Branch & Sub-Branch
    const [userResult] = await db.query(
      `INSERT INTO users (username, password_hash, full_name, role, branch_id, sub_branch_id, status)
       VALUES (?, ?, ?, 'admin', ?, ?, 'active')`,
      [username.toLowerCase(), password_hash, full_name.trim(), main_branch_id, sub_branch_id]
    );

    res.status(201).json({
      success: true,
      message: "Account created successfully. You can now log in.",
      data: {
        id:            userResult.insertId,
        username:      username.toLowerCase(),
        full_name,
        role:          "admin",
        branch_id:     main_branch_id,
        sub_branch_id: sub_branch_id,
      },
    });
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ success: false, message: "Server error", error: err.message });
  }
}

// POST /api/auth/login
async function login(req, res) {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ success: false, message: "Username and password required" });
  }

  try {
    await ensureAuthTables();

    const [rows] = await db.query(
      `SELECT u.*,
              b.name AS branch_name, b.city AS branch_city, b.parent_branch_id,
              sb.name AS sub_branch_name, sb.city AS sub_branch_city
       FROM users u
       LEFT JOIN branches b ON u.branch_id = b.id
       LEFT JOIN sub_branches sb ON u.sub_branch_id = sb.id
       WHERE u.username = ? AND u.status = 'active'`,
      [username.trim().toLowerCase()]
    );

    if (rows.length === 0) {
      return res.status(401).json({ success: false, message: "Invalid username or password" });
    }

    const user = rows[0];
    console.log("User found:", user.username, "| Hash:", user.password_hash?.substring(0,20));
    const passwordMatch = await bcrypt.compare(password, user.password_hash);

    if (!passwordMatch) {
      return res.status(401).json({ success: false, message: "Invalid username or password" });
    }

    // Fetch permissions for this user's role
    const [permRows] = await db.query(
      `SELECT module, can_view, can_edit, can_delete
       FROM role_permissions
       WHERE role = ?`,
      [user.role]
    );

    const DEFAULT_PERMISSIONS = {
      admin: {
        dashboard: { view: true, edit: true, delete: true },
        analytics: { view: true, edit: true, delete: true },
        customers: { view: true, edit: true, delete: true },
        products: { view: true, edit: true, delete: true },
        billing: { view: true, edit: true, delete: true },
        sales: { view: true, edit: true, delete: true },
        purchase: { view: true, edit: true, delete: true },
        "gold-exchange": { view: true, edit: true, delete: true },
        repair: { view: true, edit: true, delete: true },
        orders: { view: true, edit: true, delete: true },
        karigar: { view: true, edit: true, delete: true },
        jangad: { view: true, edit: true, delete: true },
        accounting: { view: true, edit: true, delete: true },
        payments: { view: true, edit: true, delete: true },
        emi: { view: true, edit: true, delete: true },
        gst: { view: true, edit: true, delete: true },
        tunch: { view: true, edit: true, delete: true },
        compliance: { view: true, edit: true, delete: true },
        inventory: { view: true, edit: true, delete: true },
        hallmark: { view: true, edit: true, delete: true },
        rates: { view: true, edit: true, delete: true },
        rfid: { view: true, edit: true, delete: true },
        advance: { view: true, edit: true, delete: true },
        employees: { view: true, edit: true, delete: true },
        suppliers: { view: true, edit: true, delete: true },
        branch: { view: true, edit: true, delete: true },
        reports: { view: true, edit: true, delete: true },
        users: { view: true, edit: true, delete: true },
        security: { view: true, edit: true, delete: true },
        ai: { view: true, edit: true, delete: true },
        communication: { view: true, edit: true, delete: true },
      },
      sales: {
        dashboard: { view: true, edit: true, delete: false },
        customers: { view: true, edit: true, delete: false },
        products: { view: true, edit: false, delete: false },
        billing: { view: true, edit: true, delete: false },
        sales: { view: true, edit: true, delete: false },
        "gold-exchange": { view: true, edit: true, delete: false },
        repair: { view: true, edit: true, delete: false },
        orders: { view: true, edit: true, delete: false },
        rates: { view: true, edit: false, delete: false },
        advance: { view: true, edit: true, delete: false },
        jangad: { view: true, edit: true, delete: false },
        inventory: { view: true, edit: false, delete: false },
      },
      cashier: {
        dashboard: { view: true, edit: false, delete: false },
        billing: { view: true, edit: true, delete: false },
        sales: { view: true, edit: true, delete: false },
        payments: { view: true, edit: true, delete: false },
        emi: { view: true, edit: true, delete: false },
        advance: { view: true, edit: true, delete: false },
        "gold-exchange": { view: true, edit: true, delete: false },
      },
      accountant: {
        dashboard: { view: true, edit: true, delete: false },
        accounting: { view: true, edit: true, delete: false },
        billing: { view: true, edit: true, delete: false },
        sales: { view: true, edit: true, delete: false },
        purchase: { view: true, edit: true, delete: false },
        suppliers: { view: true, edit: true, delete: false },
        gst: { view: true, edit: true, delete: false },
        tunch: { view: true, edit: true, delete: false },
        compliance: { view: true, edit: true, delete: false },
        reports: { view: true, edit: true, delete: false },
        payments: { view: true, edit: true, delete: false },
      },
      branch_manager: {
        dashboard: { view: true, edit: true, delete: true },
        analytics: { view: true, edit: true, delete: true },
        customers: { view: true, edit: true, delete: true },
        products: { view: true, edit: true, delete: true },
        billing: { view: true, edit: true, delete: true },
        sales: { view: true, edit: true, delete: true },
        purchase: { view: true, edit: true, delete: true },
        "gold-exchange": { view: true, edit: true, delete: true },
        repair: { view: true, edit: true, delete: true },
        orders: { view: true, edit: true, delete: true },
        karigar: { view: true, edit: true, delete: true },
        jangad: { view: true, edit: true, delete: true },
        accounting: { view: true, edit: true, delete: false },
        payments: { view: true, edit: true, delete: true },
        emi: { view: true, edit: true, delete: true },
        gst: { view: true, edit: true, delete: false },
        tunch: { view: true, edit: true, delete: true },
        compliance: { view: true, edit: true, delete: false },
        inventory: { view: true, edit: true, delete: true },
        hallmark: { view: true, edit: true, delete: true },
        rates: { view: true, edit: true, delete: true },
        rfid: { view: true, edit: true, delete: true },
        advance: { view: true, edit: true, delete: true },
        employees: { view: true, edit: true, delete: true },
        suppliers: { view: true, edit: true, delete: true },
        branch: { view: true, edit: true, delete: false },
        reports: { view: true, edit: true, delete: false },
      }
    };

    let permissions = {};
    if (permRows.length > 0) {
      permRows.forEach((p) => {
        permissions[p.module] = {
          view:   !!p.can_view,
          edit:   !!p.can_edit,
          delete: !!p.can_delete,
        };
      });
    } else {
      permissions = DEFAULT_PERMISSIONS[user.role] || DEFAULT_PERMISSIONS.sales;
    }

    // Update last_login
    await db.query("UPDATE users SET last_login = NOW() WHERE id = ?", [user.id]);

    // Record live session & audit log for Security module
    try {
      const sessionId = `sess-${Date.now().toString(36)}`;
      await db.query(`
        INSERT INTO user_sessions (user_id, username, token_id, device_name, browser, ip_address, status)
        VALUES (?, ?, ?, 'POS Counter Terminal', 'Chrome Desktop', ?, 'ACTIVE')
      `, [user.id, user.username, sessionId, req.ip || '127.0.0.1']);

      await db.query(`
        INSERT INTO audit_logs (user_id, username, action, module, description, ip_address, severity, branch_id)
        VALUES (?, ?, 'LOGIN_SUCCESS', 'AUTH', 'User authenticated into showroom session', ?, 'INFO', ?)
      `, [user.id, user.username, req.ip || '127.0.0.1', user.branch_id || 1]);
    } catch (logErr) {
      console.warn("Audit log insert warning:", logErr.message);
    }

    const rootBranchId = user.parent_branch_id || user.branch_id || 1;
    const token = jwt.sign(
      {
        id:             user.id,
        username:       user.username,
        role:           user.role,
        branch_id:      user.branch_id,
        sub_branch_id:  user.sub_branch_id,
        root_branch_id: rootBranchId,
        branch_name:    user.branch_name,
        sub_branch_name:user.sub_branch_name,
        full_name:      user.full_name,
        permissions,
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || "8h" }
    );

    res.json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id:             user.id,
        username:       user.username,
        full_name:      user.full_name,
        role:           user.role,
        branch_id:      user.branch_id,
        sub_branch_id:  user.sub_branch_id,
        root_branch_id: rootBranchId,
        branch_name:    user.branch_name,
        sub_branch_name:user.sub_branch_name,
        permissions,
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ success: false, message: "Server error", error: err.message });
  }
}

// POST /api/auth/logout  (client just deletes token, but we log it)
async function logout(req, res) {
  res.json({ success: true, message: "Logged out successfully" });
}

// GET /api/auth/me — get current user info from token
async function getMe(req, res) {
  try {
    const [rows] = await db.query(
      `SELECT u.id, u.username, u.full_name, u.role, u.branch_id,
              u.last_login, b.name AS branch_name
       FROM users u
       LEFT JOIN branches b ON u.branch_id = b.id
       WHERE u.id = ?`,
      [req.user.id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    res.json({ success: true, user: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

module.exports = { register, login, logout, getMe };

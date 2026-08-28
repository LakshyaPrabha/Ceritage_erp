const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const db = require("../config/db");

// POST /api/auth/register — create first admin account
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
    // Check if username already exists
    const [existing] = await db.query(
      "SELECT id FROM users WHERE username = ?",
      [username.toLowerCase()]
    );
    if (existing.length > 0) {
      return res.status(409).json({ success: false, message: "Username already taken. Please choose another." });
    }

    // Create the branch for this business
    const [branchResult] = await db.query(
      "INSERT INTO branches (name, city, status) VALUES (?, ?, 'Active')",
      [business_name, city || null]
    );
    const branch_id = branchResult.insertId;

    // Hash password
    const password_hash = await bcrypt.hash(password, 12);

    // Create admin user
    const [userResult] = await db.query(
      `INSERT INTO users (username, password_hash, full_name, role, branch_id, status)
       VALUES (?, ?, ?, 'admin', ?, 'active')`,
      [username.toLowerCase(), password_hash, full_name, branch_id]
    );

    res.status(201).json({
      success: true,
      message: "Account created successfully. You can now log in.",
      data: {
        id:       userResult.insertId,
        username: username.toLowerCase(),
        full_name,
        role:     "admin",
        branch_id,
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
    const [rows] = await db.query(
      `SELECT u.*, b.name AS branch_name
       FROM users u
       LEFT JOIN branches b ON u.branch_id = b.id
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

    const permissions = {};
    permRows.forEach((p) => {
      permissions[p.module] = {
        view:   !!p.can_view,
        edit:   !!p.can_edit,
        delete: !!p.can_delete,
      };
    });

    // Update last_login
    await db.query("UPDATE users SET last_login = NOW() WHERE id = ?", [user.id]);

    const token = jwt.sign(
      {
        id:          user.id,
        username:    user.username,
        role:        user.role,
        branch_id:   user.branch_id,
        branch_name: user.branch_name,
        full_name:   user.full_name,
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
        id:          user.id,
        username:    user.username,
        full_name:   user.full_name,
        role:        user.role,
        branch_id:   user.branch_id,
        branch_name: user.branch_name,
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

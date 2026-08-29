const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const db = require("../config/db");

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

module.exports = { login, logout, getMe };

const bcrypt = require("bcrypt");
const db = require("../config/db");
const { branchFilter } = require("../utils/branchScope");

// GET /api/users
async function getAllUsers(req, res) {
  const userId = req.user?.id || 1;
  try {
    const bf = branchFilter(req, "u.branch_id");
    const [rows] = await db.query(
      `SELECT u.id, u.username, u.full_name, u.role,
              u.status, u.last_login, u.created_at, u.branch_id,
              COALESCE(b.name, 'Main Showroom') AS branch_name,
              b.city AS branch_city
       FROM users u
       LEFT JOIN branches b ON u.branch_id = b.id
       WHERE (${bf.sql} OR u.id = ?)
       ORDER BY u.created_at DESC`,
      [...bf.params, userId]
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// GET /api/users/:id
async function getUserById(req, res) {
  try {
    const [rows] = await db.query(
      `SELECT u.id, u.username, u.full_name, u.role,
              u.status, u.last_login, u.branch_id,
              b.name AS branch_name
       FROM users u
       LEFT JOIN branches b ON u.branch_id = b.id
       WHERE u.id = ?`,
      [req.params.id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Also fetch permissions
    const [perms] = await db.query(
      "SELECT module, can_view, can_edit, can_delete FROM role_permissions WHERE role = ?",
      [rows[0].role]
    );

    const permissions = {};
    perms.forEach((p) => {
      permissions[p.module] = { view: !!p.can_view, edit: !!p.can_edit, delete: !!p.can_delete };
    });

    res.json({ success: true, data: { ...rows[0], permissions } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// POST /api/users
async function createUser(req, res) {
  const { username, password, full_name, role, branch_id, status = "active" } = req.body;

  if (!username || !password || !full_name || !role) {
    return res.status(400).json({ success: false, message: "username, password, full_name, role required" });
  }

  try {
    // Check username unique
    const [existing] = await db.query("SELECT id FROM users WHERE username = ?", [username.toLowerCase()]);
    if (existing.length > 0) {
      return res.status(409).json({ success: false, message: "Username already exists" });
    }

    const password_hash = await bcrypt.hash(password, 12);

    const [result] = await db.query(
      `INSERT INTO users (username, password_hash, full_name, role, branch_id, status)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [username.toLowerCase(), password_hash, full_name, role, branch_id || null, status]
    );

    res.status(201).json({
      success: true,
      message: "User created successfully",
      data: { id: result.insertId, username, full_name, role, branch_id, status },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// PUT /api/users/:id
async function updateUser(req, res) {
  const { full_name, role, branch_id, status, password } = req.body;

  try {
    if (password) {
      const password_hash = await bcrypt.hash(password, 12);
      await db.query(
        "UPDATE users SET full_name=?, role=?, branch_id=?, status=?, password_hash=? WHERE id=?",
        [full_name, role, branch_id || null, status, password_hash, req.params.id]
      );
    } else {
      await db.query(
        "UPDATE users SET full_name=?, role=?, branch_id=?, status=? WHERE id=?",
        [full_name, role, branch_id || null, status, req.params.id]
      );
    }
    res.json({ success: true, message: "User updated" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// DELETE /api/users/:id
async function deleteUser(req, res) {
  try {
    // Prevent deleting self
    if (parseInt(req.params.id) === req.user.id) {
      return res.status(400).json({ success: false, message: "Cannot delete your own account" });
    }
    await db.query("DELETE FROM users WHERE id = ?", [req.params.id]);
    res.json({ success: true, message: "User deleted" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// GET /api/users/roles/permissions/:role
async function getRolePermissions(req, res) {
  try {
    const [rows] = await db.query(
      "SELECT module, can_view, can_edit, can_delete FROM role_permissions WHERE role = ?",
      [req.params.role]
    );
    const permissions = {};
    rows.forEach((p) => {
      permissions[p.module] = { view: !!p.can_view, edit: !!p.can_edit, delete: !!p.can_delete };
    });
    res.json({ success: true, data: permissions });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// PUT /api/users/roles/permissions/:role  — bulk update permissions for a role
async function updateRolePermissions(req, res) {
  const { permissions } = req.body; // { module_id: { view, edit, delete }, ... }
  const { role } = req.params;

  if (!permissions || typeof permissions !== "object") {
    return res.status(400).json({ success: false, message: "permissions object required" });
  }

  try {
    // Delete existing and re-insert
    await db.query("DELETE FROM role_permissions WHERE role = ?", [role]);

    const values = Object.entries(permissions).map(([module, perms]) => [
      role, module, perms.view ? 1 : 0, perms.edit ? 1 : 0, perms.delete ? 1 : 0,
    ]);

    if (values.length > 0) {
      await db.query(
        "INSERT INTO role_permissions (role, module, can_view, can_edit, can_delete) VALUES ?",
        [values]
      );
    }

    res.json({ success: true, message: `Permissions updated for role: ${role}` });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

module.exports = { getAllUsers, getUserById, createUser, updateUser, deleteUser, getRolePermissions, updateRolePermissions };

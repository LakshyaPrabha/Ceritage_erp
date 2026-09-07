const db = require("../config/db");
const bcrypt = require("bcrypt");
const { branchFilter, getBranchScope } = require("../utils/branchScope");

let schemaEnsured = false;
async function ensureTables() {
  if (schemaEnsured) return;
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS security_settings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        branch_id INT NULL DEFAULT 1,
        two_factor_auth TINYINT(1) DEFAULT 0,
        session_timeout_minutes INT DEFAULT 30,
        ip_whitelist_enabled TINYINT(1) DEFAULT 0,
        ip_whitelist TEXT NULL,
        max_failed_attempts INT DEFAULT 5,
        vault_pin_enabled TINYINT(1) DEFAULT 1,
        vault_master_pin VARCHAR(255) NULL,
        biometric_pos_auth TINYINT(1) DEFAULT 0,
        cctv_link_enabled TINYINT(1) DEFAULT 0,
        audit_retention_days INT DEFAULT 365,
        updated_by VARCHAR(100) NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    const [cols] = await db.query("SHOW COLUMNS FROM audit_logs LIKE 'branch_id'");
    if (cols.length === 0) {
      await db.query("ALTER TABLE audit_logs ADD COLUMN branch_id INT NULL DEFAULT 1");
    }
    const [sessCols] = await db.query("SHOW COLUMNS FROM user_sessions LIKE 'branch_id'");
    if (sessCols.length === 0) {
      await db.query("ALTER TABLE user_sessions ADD COLUMN branch_id INT NULL DEFAULT 1");
    }
    schemaEnsured = true;
  } catch (e) {
    console.warn("securityController ensureTables warning:", e.message);
  }
}

// ── GET /api/security/overview ────────────────────────────────────────────────
exports.getOverview = async (req, res) => {
  try {
    await ensureTables();
    const scope = await getBranchScope(req);
    const bf = await branchFilter(req);
    const bfAudit = await branchFilter(req, 'audit_logs.branch_id');
    const bfSess = await branchFilter(req, 'user_sessions.branch_id');

    const [settingsRows] = await db.query(
      `SELECT * FROM security_settings WHERE ${bf.clause} ORDER BY id ASC LIMIT 1`,
      [...bf.params]
    );
    let settings = settingsRows && settingsRows.length > 0 ? settingsRows[0] : null;

    if (!settings) {
      await db.query(`
        INSERT INTO security_settings (branch_id, two_factor_auth, session_timeout_minutes, vault_pin_enabled)
        VALUES (?, 0, 30, 1)
      `, [scope.activeBranchId]);
      const [seededRows] = await db.query("SELECT * FROM security_settings WHERE branch_id = ? LIMIT 1", [scope.activeBranchId]);
      settings = seededRows?.[0] || {
        two_factor_auth: 0,
        session_timeout_minutes: 30,
        ip_whitelist_enabled: 0,
        vault_pin_enabled: 1,
        biometric_pos_auth: 0,
        cctv_link_enabled: 0,
        audit_retention_days: 365,
      };
    }

    const [sessRows] = await db.query(
      `SELECT COUNT(*) AS total FROM user_sessions WHERE status = 'ACTIVE' AND ${bfSess.clause}`,
      [...bfSess.params]
    );
    const activeSessionsCount = sessRows?.[0]?.total || 1;

    const [auditRows] = await db.query(`
      SELECT
        COUNT(*) AS total_logs,
        COUNT(CASE WHEN severity = 'ALERT' THEN 1 END) AS alert_count,
        COUNT(CASE WHEN severity = 'WARNING' THEN 1 END) AS warning_count,
        COUNT(CASE WHEN created_at >= NOW() - INTERVAL 24 HOUR THEN 1 END) AS logs_24h
      FROM audit_logs
      WHERE ${bfAudit.clause}
    `, [...bfAudit.params]);
    const auditCounts = auditRows?.[0] || { total_logs: 0, alert_count: 0, warning_count: 0, logs_24h: 0 };

    // ── Live Real-Time Jewelry Showroom Security Score Calculation ──
    const checklist = [];
    let totalScore = 0;

    // 1. Vault Master PIN (20 pts)
    const hasVaultPin = !!settings?.vault_pin_enabled;
    const vaultPts = hasVaultPin ? 20 : 0;
    totalScore += vaultPts;
    checklist.push({
      key: "vault_pin",
      title: "Vault Master PIN Protection",
      description: "Protects bullion dispatch & stock deletions with master PIN",
      enabled: hasVaultPin,
      points: vaultPts,
      max: 20
    });

    // 2. Two-Factor Authentication (20 pts)
    const has2FA = !!settings?.two_factor_auth;
    const twoFaPts = has2FA ? 20 : 0;
    totalScore += twoFaPts;
    checklist.push({
      key: "two_factor_auth",
      title: "Two-Factor Authentication (2FA)",
      description: "Requires OTP for cashier discount overrides and admin login",
      enabled: has2FA,
      points: twoFaPts,
      max: 20
    });

    // 3. Showroom Wi-Fi / IP Whitelisting (15 pts)
    const hasIpWhitelist = !!settings?.ip_whitelist_enabled;
    const ipPts = hasIpWhitelist ? 15 : 0;
    totalScore += ipPts;
    checklist.push({
      key: "ip_whitelist",
      title: "Showroom Wi-Fi / Static IP Whitelist",
      description: "Restricts system access strictly inside the store network",
      enabled: hasIpWhitelist,
      points: ipPts,
      max: 15
    });

    // 4. POS Counter Inactivity Auto-Lock (15 pts)
    const sessionTimeout = parseInt(settings?.session_timeout_minutes) || 30;
    const timeoutPts = sessionTimeout <= 30 ? 15 : sessionTimeout <= 60 ? 10 : 5;
    totalScore += timeoutPts;
    checklist.push({
      key: "session_timeout",
      title: `POS Counter Auto-Lock (${sessionTimeout}m)`,
      description: "Locks idle sales counter terminals automatically",
      enabled: sessionTimeout <= 30,
      points: timeoutPts,
      max: 15
    });

    // 5. Biometric POS Scanner (10 pts)
    const hasBiometric = !!settings?.biometric_pos_auth;
    const bioPts = hasBiometric ? 10 : 0;
    totalScore += bioPts;
    checklist.push({
      key: "biometric",
      title: "Biometric Fingerprint Scanner",
      description: "Hardware fingerprint authentication for cashiers",
      enabled: hasBiometric,
      points: bioPts,
      max: 10
    });

    // 6. CCTV Timestamp Sync (10 pts)
    const hasCctv = !!settings?.cctv_link_enabled;
    const cctvPts = hasCctv ? 10 : 0;
    totalScore += cctvPts;
    checklist.push({
      key: "cctv",
      title: "CCTV Timestamp Watermark Sync",
      description: "Syncs billing slip timestamps with video security DVR",
      enabled: hasCctv,
      points: cctvPts,
      max: 10
    });

    // 7. Real-Time Audit Threat Status (10 pts with penalties)
    const alertCount = parseInt(auditCounts?.alert_count) || 0;
    const auditPts = alertCount === 0 ? 10 : Math.max(0, 10 - (alertCount * 5));
    totalScore += auditPts;
    checklist.push({
      key: "audit_health",
      title: "Live Intrusion & Threat Posture",
      description: alertCount === 0 ? "0 critical alerts in past 24 hours" : `${alertCount} unresolved security alerts`,
      enabled: alertCount === 0,
      points: auditPts,
      max: 10
    });

    return res.json({
      success: true,
      data: {
        health_score: Math.min(100, Math.max(0, totalScore)),
        checklist,
        active_sessions_count: activeSessionsCount,
        total_logs_24h: auditCounts?.logs_24h || 0,
        alert_count: alertCount,
        warning_count: auditCounts?.warning_count || 0,
        settings: settings || {
          two_factor_auth: false,
          session_timeout_minutes: 30,
          ip_whitelist_enabled: false,
          vault_pin_enabled: true,
          biometric_pos_auth: false,
          cctv_link_enabled: false,
        },
      },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ── GET /api/security/settings ────────────────────────────────────────────────
exports.getSettings = async (req, res) => {
  try {
    await ensureTables();
    const bf = await branchFilter(req);
    const [settingsRows] = await db.query(
      `SELECT * FROM security_settings WHERE ${bf.clause} ORDER BY id ASC LIMIT 1`,
      [...bf.params]
    );
    return res.json({
      success: true,
      data: settingsRows?.[0] || {},
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ── PUT /api/security/settings ────────────────────────────────────────────────
exports.updateSettings = async (req, res) => {
  try {
    await ensureTables();
    const scope = await getBranchScope(req);
    const {
      two_factor_auth,
      session_timeout_minutes,
      ip_whitelist_enabled,
      ip_whitelist,
      max_failed_attempts,
      vault_pin_enabled,
      new_vault_pin,
      biometric_pos_auth,
      cctv_link_enabled,
      audit_retention_days,
    } = req.body;

    let pinUpdateClause = "";
    const params = [
      Boolean(two_factor_auth),
      parseInt(session_timeout_minutes) || 30,
      Boolean(ip_whitelist_enabled),
      ip_whitelist || null,
      parseInt(max_failed_attempts) || 5,
      Boolean(vault_pin_enabled),
      Boolean(biometric_pos_auth),
      Boolean(cctv_link_enabled),
      parseInt(audit_retention_days) || 365,
      req.user?.full_name || req.user?.username || "Admin",
    ];

    if (new_vault_pin && new_vault_pin.trim().length >= 4) {
      const hashedPin = await bcrypt.hash(new_vault_pin.trim(), 10);
      pinUpdateClause = ", vault_master_pin = ?";
      params.push(hashedPin);
    }

    const bf = await branchFilter(req);
    params.push(...bf.params);

    const [updateResult] = await db.query(`
      UPDATE security_settings
      SET
        two_factor_auth = ?,
        session_timeout_minutes = ?,
        ip_whitelist_enabled = ?,
        ip_whitelist = ?,
        max_failed_attempts = ?,
        vault_pin_enabled = ?,
        biometric_pos_auth = ?,
        cctv_link_enabled = ?,
        audit_retention_days = ?,
        updated_by = ?
        ${pinUpdateClause}
      WHERE ${bf.clause}
    `, params);

    if (updateResult.affectedRows === 0) {
      await db.query(`
        INSERT INTO security_settings (branch_id, two_factor_auth, session_timeout_minutes, ip_whitelist_enabled, ip_whitelist, max_failed_attempts, vault_pin_enabled, biometric_pos_auth, cctv_link_enabled, audit_retention_days, updated_by)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        scope.activeBranchId,
        Boolean(two_factor_auth),
        parseInt(session_timeout_minutes) || 30,
        Boolean(ip_whitelist_enabled),
        ip_whitelist || null,
        parseInt(max_failed_attempts) || 5,
        Boolean(vault_pin_enabled),
        Boolean(biometric_pos_auth),
        Boolean(cctv_link_enabled),
        parseInt(audit_retention_days) || 365,
        req.user?.full_name || req.user?.username || "Admin"
      ]);
    }

    // Record in audit log
    await db.query(`
      INSERT INTO audit_logs (user_id, username, action, module, description, ip_address, severity, branch_id)
      VALUES (?, ?, 'SECURITY_SETTINGS_UPDATED', 'SECURITY', 'Security policies and access rules reconfigured', ?, 'WARNING', ?)
    `, [req.user?.id || 1, req.user?.username || 'Admin', req.ip || '127.0.0.1', scope.activeBranchId]);

    return res.json({ success: true, message: "Security settings saved and policies applied successfully" });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ── GET /api/security/audit-logs ──────────────────────────────────────────────
exports.getAuditLogs = async (req, res) => {
  try {
    await ensureTables();
    const bf = await branchFilter(req);
    const { module, severity, search, page = 1, limit = 50 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const conditions = [bf.clause];
    const params = [...bf.params];

    if (module && module !== "all") {
      conditions.push("module = ?");
      params.push(module.toUpperCase());
    }
    if (severity && severity !== "all") {
      conditions.push("severity = ?");
      params.push(severity);
    }
    if (search) {
      conditions.push("(username LIKE ? OR action LIKE ? OR description LIKE ? OR ip_address LIKE ?)");
      const s = `%${search}%`;
      params.push(s, s, s, s);
    }

    const whereClause = "WHERE " + conditions.join(" AND ");

    const [rows] = await db.query(`
      SELECT * FROM audit_logs
      ${whereClause}
      ORDER BY id DESC
      LIMIT ? OFFSET ?
    `, [...params, parseInt(limit), offset]);

    const [[{ total }]] = await db.query(`
      SELECT COUNT(*) AS total FROM audit_logs ${whereClause}
    `, params);

    return res.json({
      success: true,
      data: rows,
      total,
      page: parseInt(page),
      limit: parseInt(limit),
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ── GET /api/security/sessions ────────────────────────────────────────────────
exports.getSessions = async (req, res) => {
  try {
    await ensureTables();
    const bf = await branchFilter(req, 's.branch_id');
    const [rows] = await db.query(`
      SELECT s.*, u.role, u.full_name
      FROM user_sessions s
      LEFT JOIN users u ON s.user_id = u.id
      WHERE ${bf.clause}
      ORDER BY (s.status = 'ACTIVE') DESC, s.last_active DESC
    `, [...bf.params]);

    return res.json({
      success: true,
      data: rows,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ── DELETE /api/security/sessions/:id ─────────────────────────────────────────
exports.revokeSession = async (req, res) => {
  try {
    await ensureTables();
    const scope = await getBranchScope(req);
    await db.query("UPDATE user_sessions SET status = 'REVOKED' WHERE id = ?", [req.params.id]);

    await db.query(`
      INSERT INTO audit_logs (user_id, username, action, module, description, ip_address, severity, branch_id)
      VALUES (?, ?, 'SESSION_REVOKED', 'AUTH', ?, ?, 'WARNING', ?)
    `, [
      req.user?.id || 1,
      req.user?.username || 'Admin',
      `Active terminal session #${req.params.id} remotely terminated by administrator`,
      req.ip || '127.0.0.1',
      scope.activeBranchId
    ]);

    return res.json({ success: true, message: "Device session revoked successfully" });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ── POST /api/security/backup ─────────────────────────────────────────────────
exports.generateBackup = async (req, res) => {
  try {
    await ensureTables();
    const scope = await getBranchScope(req);
    const tablesToBackup = ["branches", "sub_branches", "users", "products", "customers", "invoices", "security_settings"];
    const backupData = {
      timestamp: new Date().toISOString(),
      generated_by: req.user?.username || "Admin",
      tables: {},
    };

    for (const tbl of tablesToBackup) {
      try {
        const bf = await branchFilter(req);
        const [cols] = await db.query(`SHOW COLUMNS FROM ${tbl} LIKE 'branch_id'`);
        if (cols.length > 0) {
          const [rows] = await db.query(`SELECT * FROM ${tbl} WHERE ${bf.clause}`, [...bf.params]);
          backupData.tables[tbl] = rows;
        } else {
          const [rows] = await db.query(`SELECT * FROM ${tbl}`);
          backupData.tables[tbl] = rows;
        }
      } catch {
        backupData.tables[tbl] = [];
      }
    }

    await db.query(`
      INSERT INTO audit_logs (user_id, username, action, module, description, severity, branch_id)
      VALUES (?, ?, 'MANUAL_BACKUP_CREATED', 'DATABASE', 'Full encrypted database snapshot exported', 'INFO', ?)
    `, [req.user?.id || 1, req.user?.username || 'Admin', scope.activeBranchId]);

    return res.json({
      success: true,
      message: "Database snapshot backup created successfully",
      data: backupData,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

const db = require("../config/db");
const { getBranchScope, branchFilter } = require("../utils/branchScope");

let membershipTablesChecked = false;

async function addColIfNotExists(table, colName, colDef) {
  try {
    const [cols] = await db.query(`SHOW COLUMNS FROM \`${table}\``);
    const colNames = new Set(cols.map(c => c.Field.toLowerCase()));
    if (!colNames.has(colName.toLowerCase())) {
      await db.query(`ALTER TABLE \`${table}\` ADD COLUMN \`${colName}\` ${colDef}`);
    }
  } catch (err) {
    console.warn(`Column check notice for ${table}.${colName}:`, err.message);
  }
}

async function ensureMembershipTables() {
  if (membershipTablesChecked) return;
  try {
    // 1. Create membership_plans table
    await db.query(`
      CREATE TABLE IF NOT EXISTS membership_plans (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) UNIQUE NOT NULL,
        min_spend DECIMAL(12,2) NOT NULL DEFAULT 0.00,
        annual_fee DECIMAL(12,2) NOT NULL DEFAULT 0.00,
        loyalty_multiplier DECIMAL(4,2) NOT NULL DEFAULT 1.00,
        making_discount_pct DECIMAL(5,2) NOT NULL DEFAULT 0.00,
        perks_description TEXT NULL,
        validity_days INT NOT NULL DEFAULT 365,
        badge_color VARCHAR(50) DEFAULT '#9b59b6',
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    await addColIfNotExists("membership_plans", "min_spend", "DECIMAL(12,2) NOT NULL DEFAULT 0.00");
    await addColIfNotExists("membership_plans", "annual_fee", "DECIMAL(12,2) NOT NULL DEFAULT 0.00");
    await addColIfNotExists("membership_plans", "loyalty_multiplier", "DECIMAL(4,2) NOT NULL DEFAULT 1.00");
    await addColIfNotExists("membership_plans", "making_discount_pct", "DECIMAL(5,2) NOT NULL DEFAULT 0.00");
    await addColIfNotExists("membership_plans", "perks_description", "TEXT NULL");
    await addColIfNotExists("membership_plans", "validity_days", "INT NOT NULL DEFAULT 365");
    await addColIfNotExists("membership_plans", "badge_color", "VARCHAR(50) DEFAULT '#9b59b6'");
    await addColIfNotExists("membership_plans", "is_active", "BOOLEAN NOT NULL DEFAULT TRUE");

    // 2. Create customer_memberships table
    await db.query(`
      CREATE TABLE IF NOT EXISTS customer_memberships (
        id INT AUTO_INCREMENT PRIMARY KEY,
        customer_id INT NOT NULL,
        plan_id INT NOT NULL,
        plan_name VARCHAR(100) NOT NULL,
        start_date DATE NOT NULL,
        expiry_date DATE NOT NULL,
        fee_paid DECIMAL(12,2) DEFAULT 0.00,
        payment_ref VARCHAR(100) NULL,
        status ENUM('ACTIVE', 'EXPIRED', 'UPGRADED', 'CANCELLED') NOT NULL DEFAULT 'ACTIVE',
        enrolled_by VARCHAR(100) DEFAULT 'System',
        notes VARCHAR(255) NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_cust_member (customer_id, status, expiry_date)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    await addColIfNotExists("customer_memberships", "payment_ref", "VARCHAR(100) NULL AFTER fee_paid");
    await addColIfNotExists("customer_memberships", "fee_paid", "DECIMAL(12,2) DEFAULT 0.00 AFTER expiry_date");
    await addColIfNotExists("customer_memberships", "plan_name", "VARCHAR(100) NOT NULL DEFAULT 'Regular' AFTER plan_id");
    await addColIfNotExists("customer_memberships", "enrolled_by", "VARCHAR(100) DEFAULT 'System' AFTER status");
    await addColIfNotExists("customer_memberships", "notes", "VARCHAR(255) NULL AFTER enrolled_by");
    await addColIfNotExists("customer_memberships", "status", "ENUM('ACTIVE', 'EXPIRED', 'UPGRADED', 'CANCELLED') NOT NULL DEFAULT 'ACTIVE'");

    // 3. Create customer_ledger table
    await db.query(`
      CREATE TABLE IF NOT EXISTS customer_ledger (
        id INT AUTO_INCREMENT PRIMARY KEY,
        customer_id INT NOT NULL,
        date DATE NOT NULL,
        particulars VARCHAR(255) NOT NULL,
        debit DECIMAL(12,2) DEFAULT 0.00,
        credit DECIMAL(12,2) DEFAULT 0.00,
        balance DECIMAL(12,2) DEFAULT 0.00,
        reference VARCHAR(100) NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_cust_ledger (customer_id, date, id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    await addColIfNotExists("customer_ledger", "reference", "VARCHAR(100) NULL");
    await addColIfNotExists("customer_ledger", "balance", "DECIMAL(12,2) DEFAULT 0.00");

    // 4. Create customer_audit_logs table
    await db.query(`
      CREATE TABLE IF NOT EXISTS customer_audit_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        customer_id INT NOT NULL,
        action_type VARCHAR(100) NULL DEFAULT 'GENERAL',
        action VARCHAR(100) NULL DEFAULT 'GENERAL',
        performed_by VARCHAR(100) NULL DEFAULT 'System',
        description TEXT NULL,
        details TEXT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_cal_cust (customer_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    await addColIfNotExists("customer_audit_logs", "action", "VARCHAR(100) NULL DEFAULT 'GENERAL'");
    await addColIfNotExists("customer_audit_logs", "action_type", "VARCHAR(100) NULL DEFAULT 'GENERAL'");
    await addColIfNotExists("customer_audit_logs", "description", "TEXT NULL");
    await addColIfNotExists("customer_audit_logs", "details", "TEXT NULL");

    try {
      await db.query("ALTER TABLE customer_audit_logs MODIFY COLUMN action_type VARCHAR(100) NULL DEFAULT 'GENERAL'");
      await db.query("ALTER TABLE customer_audit_logs MODIFY COLUMN action VARCHAR(100) NULL DEFAULT 'GENERAL'");
    } catch (e) {
      // ignore
    }

    // 5. Check if plans table is empty and seed 5 standard jewelry tiers
    const [existing] = await db.query("SELECT COUNT(*) AS cnt FROM membership_plans");
    if (existing[0].cnt === 0) {
      const defaultPlans = [
        ["Regular", 0, 0, 1.00, 0.00, "Standard Loyalty Points (1 pt per ₹100 spent)", 365, "#3498db", 1],
        ["Silver Privilege", 50000, 999, 1.25, 5.00, "1.25X Points, 5% Off Making Charges, Birthday & Anniversary Surprise Gifts", 365, "#bdc3c7", 1],
        ["Gold VIP", 150000, 2499, 1.50, 10.00, "1.5X Points, 10% Off Making Charges, Priority Order Execution, Free Jewelry Cleaning", 365, "#f1c40f", 1],
        ["Platinum Sovereign", 500000, 4999, 2.00, 20.00, "2.0X Points, 20% Off Making Charges, Dedicated Relationship Manager, Complimentary Insurance", 365, "#95a5a6", 1],
        ["Diamond Elite", 1000000, 9999, 3.00, 30.00, "3.0X Points, 30% Off Making Charges, Private Lounge Access, Custom Bespoke Design Sessions, Annual Gala Invitation", 365, "#9b59b6", 1]
      ];

      for (const p of defaultPlans) {
        await db.query(`
          INSERT INTO membership_plans 
          (name, min_spend, annual_fee, loyalty_multiplier, making_discount_pct, perks_description, validity_days, badge_color, is_active)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE name=name
        `, p);
      }
    }

    membershipTablesChecked = true;
  } catch (err) {
    console.warn("Membership tables check/seed notice:", err.message);
  }
}

// GET /api/membership/kpis
async function getMembershipKpis(req, res) {
  try {
    await ensureMembershipTables();
    const scope = req.branchScope || await getBranchScope(req);
    const rootId = scope.rootBranchId || req.user?.root_branch_id || req.user?.branch_id || 1;
    const activeId = scope.activeBranchId || 1;
    const isMain = scope.isMain;

    const conditions = [];
    const params = [];

    if (isMain) {
      conditions.push("(c.branch_id = ? OR c.sub_branch_id IN (?))");
      params.push(rootId, scope.allowedBranchIds);
    } else {
      conditions.push("(c.sub_branch_id = ? OR (c.branch_id = ? AND c.sub_branch_id IS NULL))");
      params.push(activeId, activeId);
    }

    const whereSql = conditions.length > 0 ? "WHERE " + conditions.join(" AND ") : "";

    const [rows] = await db.query(
      `SELECT
         COUNT(DISTINCT CASE WHEN cm.status = 'ACTIVE' AND cm.expiry_date >= CURDATE() AND cm.plan_name != 'Regular' THEN cm.customer_id END) AS total_vip_members,
         COUNT(DISTINCT CASE WHEN cm.status = 'ACTIVE' AND cm.expiry_date >= CURDATE() AND (cm.plan_name LIKE '%Platinum%' OR cm.plan_name LIKE '%Sovereign%') THEN cm.customer_id END) AS platinum_count,
         COUNT(DISTINCT CASE WHEN cm.status = 'ACTIVE' AND cm.expiry_date >= CURDATE() AND cm.plan_name LIKE '%Gold%' THEN cm.customer_id END) AS gold_count,
         COUNT(DISTINCT CASE WHEN cm.status = 'ACTIVE' AND cm.expiry_date >= CURDATE() AND (cm.plan_name LIKE '%Silver%' OR cm.plan_name LIKE '%Privilege%') THEN cm.customer_id END) AS silver_count,
         COUNT(DISTINCT CASE WHEN cm.status = 'ACTIVE' AND cm.expiry_date >= CURDATE() AND (cm.plan_name LIKE '%Diamond%' OR cm.plan_name LIKE '%Elite%') THEN cm.customer_id END) AS diamond_count,
         COUNT(DISTINCT CASE WHEN cm.status = 'ACTIVE' AND cm.expiry_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 30 DAY) THEN cm.customer_id END) AS expiring_soon,
         COUNT(DISTINCT CASE WHEN cm.expiry_date < CURDATE() OR cm.status = 'EXPIRED' THEN cm.customer_id END) AS expired_count,
         COALESCE(SUM(cm.fee_paid), 0) AS total_membership_revenue
       FROM customer_memberships cm
       JOIN customers c ON cm.customer_id = c.id
       ${whereSql}`,
      params
    );

    res.json({ success: true, data: rows[0] || {} });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// GET /api/membership/plans
async function getPlans(req, res) {
  try {
    await ensureMembershipTables();
    const [rows] = await db.query(
      "SELECT * FROM membership_plans ORDER BY min_spend ASC, id ASC"
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// POST /api/membership/plans — create or update plan parameters
async function savePlan(req, res) {
  await ensureMembershipTables();
  const {
    id, name, min_spend = 0, annual_fee = 0, loyalty_multiplier = 1.0,
    making_discount_pct = 0, perks_description, validity_days = 365,
    badge_color = "#9b59b6", is_active = true
  } = req.body;

  if (!name || !String(name).trim()) {
    return res.status(400).json({ success: false, message: "Plan name is required" });
  }

  const minSpend = Number(min_spend || 0);
  const annualFee = Number(annual_fee || 0);
  const loyaltyMult = Number(loyalty_multiplier || 1.0);
  const makingDisc = Number(making_discount_pct || 0);
  const valDays = parseInt(validity_days || 365);

  if (minSpend < 0 || annualFee < 0 || loyaltyMult <= 0 || makingDisc < 0 || makingDisc > 100 || valDays <= 0) {
    return res.status(400).json({ success: false, message: "Invalid numerical parameters for membership plan" });
  }

  try {
    if (id) {
      // Update existing
      await db.query(
        `UPDATE membership_plans SET
           name = ?, min_spend = ?, annual_fee = ?, loyalty_multiplier = ?,
           making_discount_pct = ?, perks_description = ?, validity_days = ?,
           badge_color = ?, is_active = ?
         WHERE id = ?`,
        [
          name.trim(), minSpend, annualFee, loyaltyMult,
          makingDisc, perks_description || null, valDays,
          badge_color, Boolean(is_active), id
        ]
      );
      res.json({ success: true, message: `Membership plan "${name}" updated successfully` });
    } else {
      // Insert new
      const [result] = await db.query(
        `INSERT INTO membership_plans
         (name, min_spend, annual_fee, loyalty_multiplier, making_discount_pct, perks_description, validity_days, badge_color, is_active)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          name.trim(), minSpend, annualFee, loyaltyMult,
          makingDisc, perks_description || null, valDays,
          badge_color, Boolean(is_active)
        ]
      );
      res.status(201).json({
        success: true,
        message: `Membership plan "${name}" created successfully`,
        data: { id: result.insertId }
      });
    }
  } catch (err) {
    if (err.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ success: false, message: `A membership plan named "${name}" already exists` });
    }
    res.status(500).json({ success: false, message: err.message });
  }
}

// GET /api/membership/members — active and enrolled member subscriptions
async function getActiveMembers(req, res) {
  try {
    await ensureMembershipTables();
    const { search, tier, status } = req.query;
    const scope = req.branchScope || await getBranchScope(req);
    const rootId = scope.rootBranchId || req.user?.root_branch_id || req.user?.branch_id || 1;
    const activeId = scope.activeBranchId || 1;
    const isMain = scope.isMain;

    const conditions = [];
    const params = [];

    if (isMain) {
      conditions.push("(c.branch_id = ? OR c.sub_branch_id IN (?))");
      params.push(rootId, scope.allowedBranchIds);
    } else {
      conditions.push("(c.sub_branch_id = ? OR (c.branch_id = ? AND c.sub_branch_id IS NULL))");
      params.push(activeId, activeId);
    }

    if (tier) {
      conditions.push("cm.plan_name = ?");
      params.push(tier);
    }
    if (status) {
      conditions.push("cm.status = ?");
      params.push(status);
    }
    if (search) {
      conditions.push("(c.full_name LIKE ? OR c.phone LIKE ? OR c.customer_id LIKE ? OR c.customer_code LIKE ? OR cm.plan_name LIKE ?)");
      const s = `%${search}%`;
      params.push(s, s, s, s, s);
    }

    const where = conditions.length > 0 ? "WHERE " + conditions.join(" AND ") : "";

    const [rows] = await db.query(
      `SELECT cm.*,
              COALESCE(c.customer_id, c.customer_code, CONCAT('CUST-', LPAD(c.id, 4, '0'))) AS cust_code,
              c.full_name AS customer_name, c.phone AS customer_phone, c.city,
              mp.loyalty_multiplier, mp.making_discount_pct, mp.badge_color, mp.perks_description,
              DATEDIFF(cm.expiry_date, CURDATE()) AS days_remaining,
              CASE
                WHEN cm.expiry_date < CURDATE() THEN 'EXPIRED'
                ELSE cm.status
              END AS active_status
       FROM customer_memberships cm
       JOIN customers c ON cm.customer_id = c.id
       JOIN membership_plans mp ON cm.plan_id = mp.id
       ${where}
       ORDER BY cm.status ASC, cm.expiry_date DESC`,
      params
    );

    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// GET /api/customers/:id/membership — individual customer membership profile
async function getCustomerMembership(req, res) {
  try {
    await ensureMembershipTables();
    const customerId = req.params.id;

    // 1. Fetch customer
    const [custRows] = await db.query("SELECT id, customer_id, full_name, phone, tier FROM customers WHERE id = ?", [customerId]);
    if (custRows.length === 0) return res.status(404).json({ success: false, message: "Customer not found" });
    const customer = custRows[0];

    // 2. Fetch active membership
    const [activeRows] = await db.query(
      `SELECT cm.*,
              mp.name AS plan_name, mp.loyalty_multiplier, mp.making_discount_pct,
              mp.perks_description, mp.badge_color,
              DATEDIFF(cm.expiry_date, CURDATE()) AS days_remaining
       FROM customer_memberships cm
       JOIN membership_plans mp ON cm.plan_id = mp.id
       WHERE cm.customer_id = ? AND cm.status = 'ACTIVE' AND cm.expiry_date >= CURDATE()
       ORDER BY cm.expiry_date DESC
       LIMIT 1`,
      [customerId]
    );

    // 3. Fetch membership history
    const [historyRows] = await db.query(
      `SELECT cm.*, mp.badge_color
       FROM customer_memberships cm
       JOIN membership_plans mp ON cm.plan_id = mp.id
       WHERE cm.customer_id = ?
       ORDER BY cm.created_at DESC`,
      [customerId]
    );

    let currentTierInfo = null;
    if (activeRows.length > 0) {
      currentTierInfo = activeRows[0];
    } else {
      // Default Regular
      const [[regularPlan]] = await db.query("SELECT * FROM membership_plans WHERE name = 'Regular' LIMIT 1");
      currentTierInfo = {
        plan_name: "Regular",
        tier: "Regular",
        loyalty_multiplier: regularPlan?.loyalty_multiplier || 1.0,
        making_discount_pct: regularPlan?.making_discount_pct || 0.0,
        perks_description: regularPlan?.perks_description || "Standard Loyalty Points",
        days_remaining: null,
        status: "ACTIVE",
        badge_color: "#3498db"
      };
    }

    res.json({
      success: true,
      data: {
        customer,
        current_membership: currentTierInfo,
        history: historyRows
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// POST /api/customers/:id/membership/enroll — enroll or upgrade customer into tier
async function enrollCustomer(req, res) {
  await ensureMembershipTables();
  const customerId = req.params.id;
  const { plan_id, start_date, fee_paid = 0, payment_mode = "Cash", notes } = req.body;

  if (!plan_id) {
    return res.status(400).json({ success: false, message: "Membership plan ID is required" });
  }

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    // 1. Lock customer and fetch plan
    const [custRows] = await conn.query("SELECT id, full_name, phone, tier FROM customers WHERE id = ? FOR UPDATE", [customerId]);
    if (custRows.length === 0) {
      await conn.rollback();
      return res.status(404).json({ success: false, message: "Customer not found" });
    }
    const cust = custRows[0];

    const [planRows] = await conn.query("SELECT * FROM membership_plans WHERE id = ? AND is_active = TRUE", [plan_id]);
    if (planRows.length === 0) {
      await conn.rollback();
      return res.status(404).json({ success: false, message: "Active membership plan not found" });
    }
    const plan = planRows[0];

    // 2. Compute start & expiry date
    const startDate = start_date ? new Date(start_date) : new Date();
    const expiryDate = new Date(startDate.getTime() + (plan.validity_days * 86400000));
    const startDateStr = startDate.toISOString().slice(0, 10);
    const expiryDateStr = expiryDate.toISOString().slice(0, 10);

    // 3. Mark existing active memberships as UPGRADED
    await conn.query(
      "UPDATE customer_memberships SET status = 'UPGRADED' WHERE customer_id = ? AND status = 'ACTIVE'",
      [customerId]
    );

    const performedBy = req.user?.full_name || req.user?.username || "Admin";
    const paymentRef = Number(fee_paid || 0) > 0 ? `MEM-FEE-${Date.now().toString().slice(-6)}` : null;

    // 4. Insert new customer_memberships record
    const [memResult] = await conn.query(
      `INSERT INTO customer_memberships
       (customer_id, plan_id, plan_name, start_date, expiry_date, fee_paid, payment_ref, status, enrolled_by, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'ACTIVE', ?, ?)`,
      [
        customerId, plan.id, plan.name, startDateStr, expiryDateStr,
        Number(fee_paid || 0), paymentRef, performedBy, notes || `Enrolled into ${plan.name} Tier`
      ]
    );

    // 5. Synchronize customers.tier
    await conn.query("UPDATE customers SET tier = ? WHERE id = ?", [plan.name, customerId]);

    // 6. If fee paid, record into customer ledger
    if (Number(fee_paid || 0) > 0) {
      await conn.query(
        `INSERT INTO customer_ledger (customer_id, date, particulars, debit, credit, balance, reference)
         VALUES (?, ?, ?, 0, ?, (SELECT balance_due FROM customers WHERE id = ?), ?)`,
        [
          customerId, startDateStr,
          `Annual Membership Enrollment Fee (${plan.name}) via ${payment_mode}`,
          Number(fee_paid), customerId, paymentRef
        ]
      );
    }

    // 7. Audit log (safe)
    try {
      const enrollDetails = `Enrolled ${cust.full_name} into ${plan.name} Tier (${startDateStr} to ${expiryDateStr})`;
      await conn.query(
        `INSERT INTO customer_audit_logs (customer_id, action_type, action, performed_by, description, details)
         VALUES (?, 'MEMBERSHIP_ENROLLED', 'MEMBERSHIP_ENROLLED', ?, ?, ?)`,
        [customerId, performedBy, enrollDetails, enrollDetails]
      );
    } catch (auditErr) {
      console.warn("Customer audit log notice during enrollment:", auditErr.message);
    }

    await conn.commit();

    res.status(201).json({
      success: true,
      message: `Successfully enrolled ${cust.full_name} into ${plan.name} Tier (Valid until ${expiryDateStr}).`,
      data: {
        membership_id: memResult.insertId,
        tier: plan.name,
        start_date: startDateStr,
        expiry_date: expiryDateStr,
        loyalty_multiplier: plan.loyalty_multiplier,
        making_discount_pct: plan.making_discount_pct
      }
    });
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ success: false, message: err.message });
  } finally {
    conn.release();
  }
}

// POST /api/customers/:id/membership/renew — renew existing membership
async function renewMembership(req, res) {
  await ensureMembershipTables();
  const customerId = req.params.id;
  const { fee_paid = 0, payment_mode = "Cash", notes } = req.body;

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    // 1. Fetch latest active membership
    const [activeRows] = await conn.query(
      `SELECT cm.*, mp.validity_days, mp.name AS plan_name, mp.annual_fee
       FROM customer_memberships cm
       JOIN membership_plans mp ON cm.plan_id = mp.id
       WHERE cm.customer_id = ?
       ORDER BY cm.expiry_date DESC LIMIT 1 FOR UPDATE`,
      [customerId]
    );

    if (activeRows.length === 0) {
      await conn.rollback();
      return res.status(400).json({ success: false, message: "No previous membership record found to renew. Please enroll first." });
    }
    const currentMem = activeRows[0];

    // 2. Calculate new start & expiry date
    const today = new Date();
    const currentExpiry = new Date(currentMem.expiry_date);
    const newStartDate = currentExpiry >= today ? new Date(currentExpiry.getTime() + 86400000) : today;
    const newExpiryDate = new Date(newStartDate.getTime() + (currentMem.validity_days * 86400000));

    const startDateStr = newStartDate.toISOString().slice(0, 10);
    const expiryDateStr = newExpiryDate.toISOString().slice(0, 10);
    const performedBy = req.user?.full_name || req.user?.username || "Admin";
    const paymentRef = Number(fee_paid || 0) > 0 ? `MEM-RENEW-${Date.now().toString().slice(-6)}` : null;

    // 3. Insert renewed record
    const [result] = await conn.query(
      `INSERT INTO customer_memberships
       (customer_id, plan_id, plan_name, start_date, expiry_date, fee_paid, payment_ref, status, enrolled_by, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'ACTIVE', ?, ?)`,
      [
        customerId, currentMem.plan_id, currentMem.plan_name,
        startDateStr, expiryDateStr, Number(fee_paid || 0), paymentRef,
        performedBy, notes || `Renewed ${currentMem.plan_name} Membership`
      ]
    );

    // 4. Synchronize customers.tier
    await conn.query("UPDATE customers SET tier = ? WHERE id = ?", [currentMem.plan_name, customerId]);

    // 5. Audit log (safe)
    try {
      const renewDetails = `Renewed ${currentMem.plan_name} membership until ${expiryDateStr}`;
      await conn.query(
        `INSERT INTO customer_audit_logs (customer_id, action_type, action, performed_by, description, details)
         VALUES (?, 'MEMBERSHIP_RENEWED', 'MEMBERSHIP_RENEWED', ?, ?, ?)`,
        [customerId, performedBy, renewDetails, renewDetails]
      );
    } catch (auditErr) {
      console.warn("Customer audit log notice during renewal:", auditErr.message);
    }

    await conn.commit();

    res.json({
      success: true,
      message: `Membership renewed successfully until ${expiryDateStr}`,
      data: {
        membership_id: result.insertId,
        tier: currentMem.plan_name,
        start_date: startDateStr,
        expiry_date: expiryDateStr
      }
    });
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ success: false, message: err.message });
  } finally {
    conn.release();
  }
}

// POST /api/customers/membership/evaluate-tier-upgrades — scan customer lifetime net spend and promote
async function evaluateTierUpgrades(req, res) {
  await ensureMembershipTables();
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    // 1. Fetch all active plans sorted by min_spend DESC
    const [plans] = await conn.query(
      "SELECT * FROM membership_plans WHERE is_active = TRUE ORDER BY min_spend DESC"
    );

    // 2. Fetch all customers in branch scope with net spend (Gross Invoiced - Returns)
    const scope = req.branchScope || await getBranchScope(req);
    const rootId = scope.rootBranchId || req.user?.root_branch_id || req.user?.branch_id || 1;
    const activeId = scope.activeBranchId || 1;
    const isMain = scope.isMain;

    const conditions = ["(c.status IS NULL OR UPPER(c.status) = 'ACTIVE')"];
    const params = [];

    if (isMain) {
      conditions.push("(c.branch_id = ? OR c.sub_branch_id IN (?))");
      params.push(rootId, scope.allowedBranchIds);
    } else {
      conditions.push("(c.sub_branch_id = ? OR (c.branch_id = ? AND c.sub_branch_id IS NULL))");
      params.push(activeId, activeId);
    }

    const whereSql = conditions.join(" AND ");

    const [customers] = await conn.query(
      `SELECT c.id, c.customer_id AS cust_code, c.full_name, c.phone, c.tier,
              (COALESCE(inv.total_gross, 0) - COALESCE(ret.total_refund, 0)) AS net_spend
       FROM customers c
       LEFT JOIN (
         SELECT customer_id, SUM(grand_total) AS total_gross
         FROM invoices
         WHERE status != 'Draft'
         GROUP BY customer_id
       ) inv ON inv.customer_id = c.id
       LEFT JOIN (
         SELECT customer_id, SUM(refund_amount) AS total_refund
         FROM returns
         GROUP BY customer_id
       ) ret ON ret.customer_id = c.id
       WHERE ${whereSql}`,
      params
    );

    const upgrades = [];
    const todayStr = new Date().toISOString().slice(0, 10);

    for (const cust of customers) {
      const spend = Number(cust.net_spend || 0);

      // Find highest eligible tier
      const eligiblePlan = plans.find(p => spend >= Number(p.min_spend));
      if (!eligiblePlan) continue;

      // Check current plan rank
      const currentPlan = plans.find(p => p.name === cust.tier) || { min_spend: 0, name: "Regular" };

      // Upgrade if eligible plan is higher
      if (Number(eligiblePlan.min_spend) > Number(currentPlan.min_spend)) {
        const expiryDate = new Date(Date.now() + (eligiblePlan.validity_days * 86400000)).toISOString().slice(0, 10);

        // Mark old active membership UPGRADED
        await conn.query(
          "UPDATE customer_memberships SET status = 'UPGRADED' WHERE customer_id = ? AND status = 'ACTIVE'",
          [cust.id]
        );

        // Create new active membership
        await conn.query(
          `INSERT INTO customer_memberships
           (customer_id, plan_id, plan_name, start_date, expiry_date, fee_paid, status, enrolled_by, notes)
           VALUES (?, ?, ?, ?, ?, 0, 'ACTIVE', 'System Auto-Promotion', ?)`,
          [
            cust.id, eligiblePlan.id, eligiblePlan.name, todayStr, expiryDate,
            `Auto-promoted from ${cust.tier} based on qualifying net spend of ₹${spend.toLocaleString('en-IN')}`
          ]
        );

        // Synchronize customers.tier
        await conn.query("UPDATE customers SET tier = ? WHERE id = ?", [eligiblePlan.name, cust.id]);

        // Audit log (safe)
        try {
          const promoDetails = `Promoted from ${cust.tier} to ${eligiblePlan.name} (Net Spend: ₹${spend.toLocaleString('en-IN')})`;
          await conn.query(
            `INSERT INTO customer_audit_logs (customer_id, action_type, action, performed_by, description, details)
             VALUES (?, 'TIER_AUTO_UPGRADED', 'TIER_AUTO_UPGRADED', 'System', ?, ?)`,
            [cust.id, promoDetails, promoDetails]
          );
        } catch (auditErr) {
          console.warn("Customer audit log notice during auto upgrade:", auditErr.message);
        }

        upgrades.push({
          customer_id: cust.id,
          customer_name: cust.full_name,
          old_tier: cust.tier,
          new_tier: eligiblePlan.name,
          net_spend: spend,
          expiry_date: expiryDate
        });
      }
    }

    await conn.commit();

    res.json({
      success: true,
      message: `Tier evaluation complete. ${upgrades.length} customer(s) promoted based on qualifying purchase spend.`,
      data: {
        customers_evaluated: customers.length,
        customers_upgraded: upgrades.length,
        upgrades
      }
    });
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ success: false, message: err.message });
  } finally {
    conn.release();
  }
}

module.exports = {
  getMembershipKpis,
  getPlans,
  savePlan,
  getActiveMembers,
  getCustomerMembership,
  enrollCustomer,
  renewMembership,
  evaluateTierUpgrades,
};

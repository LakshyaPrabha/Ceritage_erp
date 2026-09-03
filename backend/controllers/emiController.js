const db = require("../config/db");
const accounting = require("../services/accountingPostingService");

// GET /api/emi/kpis
async function getKpis(req, res) {
  try {
    const branchId = req.branchId || null;
    const planBranchSql = branchId ? "WHERE branch_id = ?" : "";
    const planBranchParams = branchId ? [branchId] : [];
    const instBranchSql = branchId ? "WHERE branch_id = ?" : "";
    const instBranchParams = branchId ? [branchId] : [];
    const invBranchSql = branchId ? "AND i.branch_id = ?" : "";
    const invBranchParams = branchId ? [branchId] : [];
    const [[plans]] = await db.query(
      `SELECT
         COUNT(CASE WHEN status = 'Active' THEN 1 END) AS active_plans,
         COALESCE(SUM(CASE WHEN status = 'Active' THEN remaining_amount ELSE 0 END), 0) AS total_emi_outstanding
       FROM emi_plans
       ${planBranchSql}`,
      planBranchParams
    );

    const [[installments]] = await db.query(
      `SELECT
         COALESCE(SUM(CASE WHEN due_date = CURDATE() AND status IN ('Pending', 'Partial') THEN (COALESCE(amount_due, amount) - COALESCE(amount_paid, paid_amount, 0)) ELSE 0 END), 0) AS dues_today,
         COUNT(DISTINCT CASE WHEN due_date < CURDATE() AND status IN ('Pending', 'Partial') THEN plan_id END) AS overdue_plans
       FROM emi_installments
       ${instBranchSql}`,
      instBranchParams
    );

    const [[credits]] = await db.query(
      `SELECT
         COUNT(CASE WHEN (i.payment_mode = 'Credit' OR i.status IN ('Credit', 'Partial')) AND (i.grand_total - COALESCE(i.paid_amount,0)) > 0 THEN 1 END) AS active_credits,
         COUNT(CASE WHEN (i.payment_mode = 'Credit' OR i.status IN ('Credit', 'Partial')) AND (i.grand_total - COALESCE(i.paid_amount,0)) > 0 AND i.credit_due_date < CURDATE() THEN 1 END) AS credit_overdue,
         COALESCE(SUM(CASE WHEN (i.payment_mode = 'Credit' OR i.status IN ('Credit', 'Partial')) THEN (i.grand_total - COALESCE(i.paid_amount,0)) ELSE 0 END), 0) AS total_credit_outstanding
       FROM invoices i
       WHERE 1=1 ${invBranchSql}`,
      invBranchParams
    );

    res.json({
      success: true,
      data: {
        activeEmiPlans: Number(plans.active_plans || 0),
        totalEmiOutstanding: Number(plans.total_emi_outstanding || 0),
        duesToday: Number(installments.dues_today || 0),
        overduePlans: Number(installments.overdue_plans || 0),
        activeCreditInvoices: Number(credits.active_credits || 0),
        creditOverdue: Number(credits.credit_overdue || 0),
        totalCreditOutstanding: Number(credits.total_credit_outstanding || 0),
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// GET /api/emi/credit-sales — list credit invoices with calculated server aging
async function getCreditSales(req, res) {
  try {
    const branchId = req.branchId || null;
    const branchSql = branchId ? "AND i.branch_id = ?" : "";
    const params = branchId ? [branchId] : [];
    const [rows] = await db.query(
      `SELECT i.id, i.invoice_no, i.invoice_date, i.credit_days, i.credit_due_date,
              i.grand_total, i.paid_amount, (i.grand_total - COALESCE(i.paid_amount, 0)) AS balance_due,
              i.status, i.payment_mode,
              c.id AS customer_id, c.customer_id AS cust_code, c.full_name AS customer_name, c.phone AS customer_phone,
              c.credit_limit,
              DATEDIFF(CURDATE(), COALESCE(i.credit_due_date, i.invoice_date)) AS overdue_days
       FROM invoices i
       LEFT JOIN customers c ON i.customer_id = c.id
       WHERE (i.payment_mode = 'Credit' OR i.status IN ('Credit', 'Partial'))
         AND (i.grand_total - COALESCE(i.paid_amount, 0)) > 0
         ${branchSql}
       ORDER BY i.credit_due_date ASC, i.invoice_date ASC`,
      params
    );

    const enriched = rows.map(r => {
      let aging = "Not Due";
      const overdue = Number(r.overdue_days || 0);

      if (!r.credit_due_date) {
        aging = "Not Due";
      } else if (overdue < 0) {
        aging = `Due in ${Math.abs(overdue)} days`;
      } else if (overdue === 0) {
        aging = "Due Today";
      } else if (overdue <= 30) {
        aging = `${overdue} Days Overdue (1–30)`;
      } else if (overdue <= 60) {
        aging = `${overdue} Days Overdue (31–60)`;
      } else if (overdue <= 90) {
        aging = `${overdue} Days Overdue (61–90)`;
      } else {
        aging = `${overdue} Days Overdue (90+ Days)`;
      }

      return {
        ...r,
        aging_category: aging,
      };
    });

    res.json({ success: true, data: enriched });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// GET /api/emi/plans — list all active/closed EMI plans
async function getPlans(req, res) {
  try {
    const { status, search } = req.query;
    let where = "WHERE 1=1";
    const params = [];
    if (req.branchId) {
      where += " AND ep.branch_id = ?";
      params.push(req.branchId);
    }

    if (status) {
      where += " AND ep.status = ?";
      params.push(status);
    }
    if (search) {
      where += " AND (ep.plan_id LIKE ? OR ep.plan_code LIKE ? OR c.full_name LIKE ? OR c.phone LIKE ? OR ep.invoice_ref LIKE ?)";
      const s = `%${search}%`;
      params.push(s, s, s, s, s);
    }

    const [rows] = await db.query(
      `SELECT ep.*,
              ep.tenure_months AS num_emis,
              ep.monthly_installment AS emi_amount,
              ep.principal_amount AS loan_amount,
              ep.notes AS finance_partner,
              (SELECT COUNT(*) FROM emi_installments ei WHERE ei.plan_id = ep.id AND ei.status = 'Paid') AS paid_emis,
              c.customer_id AS cust_code, c.full_name AS customer_name, c.phone AS customer_phone
       FROM emi_plans ep
       LEFT JOIN customers c ON ep.customer_id = c.id
       ${where}
       ORDER BY ep.created_at DESC`,
      params
    );

    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// GET /api/emi/plans/:id — single plan details with schedule & receipts
async function getPlanById(req, res) {
  try {
    const planId = req.params.id;
    const branchSql = req.branchId ? "AND ep.branch_id = ?" : "";
    const params = req.branchId ? [planId, planId, req.branchId] : [planId, planId];
    const [rows] = await db.query(
      `SELECT ep.*,
              ep.tenure_months AS num_emis,
              ep.monthly_installment AS emi_amount,
              ep.principal_amount AS loan_amount,
              ep.notes AS finance_partner,
              (SELECT COUNT(*) FROM emi_installments ei WHERE ei.plan_id = ep.id AND ei.status = 'Paid') AS paid_emis,
              pm.status AS mandate_status, pm.provider_mandate_id, pm.authorization_url,
              c.customer_id AS cust_code, c.full_name AS customer_name, c.phone AS customer_phone, c.balance_due AS customer_balance_due
       FROM emi_plans ep
       LEFT JOIN payment_mandates pm ON pm.id = ep.mandate_id
       LEFT JOIN customers c ON ep.customer_id = c.id
       WHERE (ep.id = ? OR ep.plan_id = ?) ${branchSql}`,
      params
    );
    if (rows.length === 0) return res.status(404).json({ success: false, message: "EMI plan not found" });

    const plan = rows[0];

    // Installment schedule
    const [installments] = await db.query(
      `SELECT * FROM emi_installments WHERE plan_id = ? ORDER BY installment_no ASC`,
      [plan.id]
    );

    // Payment receipts
    const [payments] = await db.query(
      `SELECT * FROM emi_payments WHERE plan_id = ? ORDER BY created_at DESC`,
      [plan.id]
    );

    res.json({
      success: true,
      data: {
        ...plan,
        installments,
        payments
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// POST /api/emi/plans — create a new EMI plan with installment schedule
async function createPlan(req, res) {
  const {
    customer_id, invoice_ref, item_description,
    total_amount, down_payment = 0, num_emis, tenure_months,
    interest_rate = 0, interest_rate_pct,
    finance_partner = "In-House", first_due_date, start_date
  } = req.body;

  const totalAmount = Number(total_amount || 0);
  const downPay = Number(down_payment || 0);
  const tenureMonths = parseInt(num_emis || tenure_months || 6);
  const intRate = Number(interest_rate_pct ?? interest_rate ?? 0);

  if (!customer_id || totalAmount <= 0) {
    return res.status(400).json({ success: false, message: "Customer and valid total amount are required" });
  }
  if (downPay < 0 || downPay >= totalAmount) {
    return res.status(400).json({ success: false, message: "Down payment must be between 0 and less than total amount" });
  }
  if (tenureMonths <= 0) {
    return res.status(400).json({ success: false, message: "Number of EMIs must be at least 1" });
  }

  const principalAmount = accounting.money(totalAmount - downPay);
  const totalInterest = accounting.money(principalAmount * (intRate / 100));
  const totalPayable = accounting.money(principalAmount + totalInterest);
  const monthlyInstallment = Math.floor(totalPayable / tenureMonths);
  const finalInstallment = accounting.money(totalPayable - (monthlyInstallment * (tenureMonths - 1)));
  const startDate = first_due_date || start_date || new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10);
  const endDateObj = new Date(startDate);
  endDateObj.setMonth(endDateObj.getMonth() + tenureMonths - 1);
  const endDate = endDateObj.toISOString().slice(0, 10);
  const activeBranchId = Number(req.branchId || req.user?.branch_id || 1);

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const [custRows] = await conn.query("SELECT id, full_name, branch_id FROM customers WHERE id = ? FOR UPDATE", [customer_id]);
    if (custRows.length === 0) {
      await conn.rollback();
      return res.status(404).json({ success: false, message: "Customer not found" });
    }
    if (req.user.role !== "admin" && Number(custRows[0].branch_id || 1) !== Number(req.user.branch_id || 1)) {
      await conn.rollback();
      return res.status(403).json({ success: false, message: "Cannot create EMI plan for another branch" });
    }

    let invoiceId = null;
    if (invoice_ref) {
      const [invoiceRows] = await conn.query("SELECT id, branch_id FROM invoices WHERE invoice_no = ? FOR UPDATE", [invoice_ref]);
      if (invoiceRows.length > 0) {
        invoiceId = invoiceRows[0].id;
        if (req.user.role !== "admin" && Number(invoiceRows[0].branch_id || 1) !== Number(req.user.branch_id || 1)) {
          throw new Error("Cannot link EMI plan to another branch invoice");
        }
      }
    }

    const [[{ count }]] = await conn.query("SELECT COUNT(*) AS count FROM emi_plans");
    const planCode = `EMI-${new Date().getFullYear()}-${String(count + 1).padStart(4, "0")}`;
    const planNotes = finance_partner ? `Finance partner: ${finance_partner}${item_description ? " | " + item_description : ""}` : (item_description || null);

    const [planResult] = await conn.query(
      `INSERT INTO emi_plans
       (plan_code, customer_id, invoice_id, total_amount, down_payment, principal_amount,
        interest_rate_pct, total_interest, grand_total, tenure_months, monthly_installment,
        paid_amount, remaining_amount, start_date, end_date, next_due_date, status, notes,
        created_by, branch_id, plan_id, invoice_ref)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        planCode, customer_id, invoiceId, totalAmount, downPay, principalAmount,
        intRate, totalInterest, totalPayable, tenureMonths, monthlyInstallment,
        0, totalPayable, startDate, endDate, startDate, "Active", planNotes,
        req.user?.id || null, activeBranchId, planCode, invoice_ref || null
      ]
    );

    const newPlanId = planResult.insertId;
    for (let i = 1; i <= tenureMonths; i++) {
      const instDueDate = new Date(startDate);
      instDueDate.setMonth(instDueDate.getMonth() + (i - 1));
      const dueDateStr = instDueDate.toISOString().slice(0, 10);
      const amountDue = i === tenureMonths ? finalInstallment : monthlyInstallment;

      await conn.query(
        `INSERT INTO emi_installments
         (plan_id, installment_no, due_date, amount, paid_amount, status, branch_id, amount_due, amount_paid)
         VALUES (?, ?, ?, ?, 0, 'Pending', ?, ?, 0)`,
        [newPlanId, i, dueDateStr, amountDue, activeBranchId, amountDue]
      );
    }

    if (invoice_ref) {
      await conn.query("UPDATE invoices SET status = 'EMI Active' WHERE invoice_no = ?", [invoice_ref]);
    }

    const performedBy = req.user?.full_name || req.user?.username || "Admin";
    await conn.query(
      `INSERT INTO customer_audit_logs (customer_id, action_type, action, performed_by, description, details, branch_id)
       VALUES (?, 'EMI_PLAN_CREATED', 'EMI_PLAN_CREATED', ?, ?, ?, ?)`,
      [
        customer_id, performedBy,
        `Created EMI Plan ${planCode} for ${custRows[0].full_name}: INR ${totalPayable.toLocaleString("en-IN")} over ${tenureMonths} months (${finance_partner})`,
        `Created EMI Plan ${planCode} for ${custRows[0].full_name}: INR ${totalPayable.toLocaleString("en-IN")} over ${tenureMonths} months (${finance_partner})`,
        activeBranchId
      ]
    );

    await conn.commit();
    res.status(201).json({
      success: true,
      message: `EMI Plan ${planCode} created successfully with ${tenureMonths} monthly installments.`,
      data: {
        id: newPlanId,
        plan_id: planCode,
        plan_code: planCode,
        loan_amount: principalAmount,
        principal_amount: principalAmount,
        total_payable: totalPayable,
        emi_amount: monthlyInstallment,
        monthly_installment: monthlyInstallment,
        final_emi: finalInstallment,
        first_due_date: startDate
      }
    });
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ success: false, message: err.message });
  } finally {
    conn.release();
  }
}

// POST /api/emi/plans/:id/collect — collect installment payment atomically
async function collectPayment(req, res) {
  const planParam = req.params.id;
  const { installment_id, amount, payment_mode = "Cash", payment_date, reference, reference_no, notes } = req.body;
  const collectAmount = Number(amount || 0);

  if (!collectAmount || collectAmount <= 0) {
    return res.status(400).json({ success: false, message: "Valid payment amount greater than 0 is required" });
  }

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const [planRows] = await conn.query(
      "SELECT * FROM emi_plans WHERE id = ? OR plan_id = ? OR plan_code = ? FOR UPDATE",
      [planParam, planParam, planParam]
    );
    if (planRows.length === 0) {
      await conn.rollback();
      return res.status(404).json({ success: false, message: "EMI plan not found" });
    }
    const plan = planRows[0];
    const planCode = plan.plan_id || plan.plan_code || plan.id;

    if (req.user.role !== "admin" && Number(plan.branch_id || 1) !== Number(req.user.branch_id || 1)) {
      await conn.rollback();
      return res.status(403).json({ success: false, message: "Cannot collect EMI for another branch" });
    }

    let installment = null;
    if (installment_id) {
      const [instRows] = await conn.query(
        "SELECT * FROM emi_installments WHERE id = ? AND plan_id = ? FOR UPDATE",
        [installment_id, plan.id]
      );
      if (instRows.length > 0) installment = instRows[0];
    } else {
      const [instRows] = await conn.query(
        "SELECT * FROM emi_installments WHERE plan_id = ? AND status IN ('Pending', 'Partial') ORDER BY installment_no ASC LIMIT 1 FOR UPDATE",
        [plan.id]
      );
      if (instRows.length > 0) installment = instRows[0];
    }

    if (!installment) {
      await conn.rollback();
      return res.status(400).json({ success: false, message: "No pending installments found for this EMI plan." });
    }
    if (installment.status === "Paid") {
      await conn.rollback();
      return res.status(409).json({ success: false, message: `Installment #${installment.installment_no} is already fully paid.` });
    }

    const amountDue = Number(installment.amount_due || installment.amount || 0);
    const amountPaid = Number(installment.amount_paid || installment.paid_amount || 0);
    const outstandingForInst = accounting.money(amountDue - amountPaid);
    if (collectAmount > outstandingForInst + 0.01) {
      await conn.rollback();
      return res.status(400).json({
        success: false,
        message: `Payment amount (INR ${collectAmount}) exceeds installment balance (INR ${outstandingForInst}).`
      });
    }

    const [[{ count }]] = await conn.query("SELECT COUNT(*) AS count FROM emi_payments");
    const paymentNo = `RCP-EMI-${new Date().getFullYear()}-${String(count + 1).padStart(4, "0")}`;
    const payDate = payment_date || new Date().toISOString().slice(0, 10);
    const performedBy = req.user?.full_name || req.user?.username || "Admin";
    const ref = reference_no || reference || null;

    const [payResult] = await conn.query(
      `INSERT INTO emi_payments
       (payment_no, plan_id, installment_id, customer_id, amount, payment_date, payment_mode, reference_no, collected_by, notes, branch_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        paymentNo, plan.id, installment.id, plan.customer_id,
        collectAmount, payDate, payment_mode, ref, performedBy, notes || null, plan.branch_id || req.user?.branch_id || 1
      ]
    );

    const newInstPaid = accounting.money(amountPaid + collectAmount);
    const newInstStatus = newInstPaid >= amountDue - 0.01 ? "Paid" : "Partial";

    await conn.query(
      `UPDATE emi_installments SET
         paid_amount = ?,
         amount_paid = ?,
         status = ?,
         paid_date = ?,
         payment_mode = ?,
         receipt_no = ?
       WHERE id = ?`,
      [newInstPaid, newInstPaid, newInstStatus, payDate, payment_mode, paymentNo, installment.id]
    );

    const planPaid = accounting.money(Number(plan.paid_amount || 0) + collectAmount);
    const newRemaining = accounting.money(Math.max(0, Number(plan.remaining_amount || 0) - collectAmount));
    const [nextInstRows] = await conn.query(
      "SELECT due_date FROM emi_installments WHERE plan_id = ? AND status IN ('Pending', 'Partial') AND id != ? ORDER BY installment_no ASC LIMIT 1",
      [plan.id, installment.id]
    );
    const nextDueDate = nextInstRows.length > 0 ? nextInstRows[0].due_date : null;
    const newPlanStatus = newRemaining <= 0 ? "Completed" : "Active";

    await conn.query(
      `UPDATE emi_plans SET
         paid_amount = ?,
         remaining_amount = ?,
         next_due_date = ?,
         status = ?
       WHERE id = ?`,
      [planPaid, newRemaining, nextDueDate, newPlanStatus, plan.id]
    );

    const [[balanceRow]] = await conn.query(
      "SELECT (COALESCE(SUM(debit), 0) - COALESCE(SUM(credit), 0)) AS current_balance FROM customer_ledger WHERE customer_id = ?",
      [plan.customer_id]
    );
    const currentBalance = Number(balanceRow.current_balance || 0);
    const newBalance = Math.max(0, accounting.money(currentBalance - collectAmount));

    const particulars = `EMI Installment #${installment.installment_no} (${planCode}) via ${payment_mode}${notes ? " - " + notes : ""}`;
    await conn.query(
      `INSERT INTO customer_ledger (customer_id, date, particulars, debit, credit, balance, reference)
       VALUES (?, ?, ?, 0, ?, ?, ?)`,
      [plan.customer_id, payDate, particulars, collectAmount, newBalance, paymentNo]
    );
    await conn.query("UPDATE customers SET balance_due = ? WHERE id = ?", [newBalance, plan.customer_id]);

    if (plan.invoice_ref) {
      const [invRows] = await conn.query("SELECT id, grand_total, paid_amount FROM invoices WHERE invoice_no = ? FOR UPDATE", [plan.invoice_ref]);
      if (invRows.length > 0) {
        const inv = invRows[0];
        const newInvPaid = accounting.money(Number(inv.paid_amount || 0) + collectAmount);
        const newInvStatus = newInvPaid >= Number(inv.grand_total) - 0.01 ? "Paid" : "Partial";
        await conn.query(
          "UPDATE invoices SET paid_amount = ?, balance_due = GREATEST(0, grand_total - ?), status = ? WHERE id = ?",
          [newInvPaid, newInvPaid, newInvStatus, inv.id]
        );
      }
    }

    const journal = await accounting.postCustomerReceipt(conn, {
      branch_id: plan.branch_id || req.user?.branch_id || 1,
      amount: collectAmount,
      payment_mode,
      reference_no: paymentNo,
      source_type: "EMI_PAYMENT",
      source_id: payResult.insertId,
      entry_date: payDate,
      created_by: performedBy,
      narration: `EMI receipt ${paymentNo} for ${planCode}`,
    });

    await conn.query(
      `INSERT INTO customer_audit_logs (customer_id, action_type, action, performed_by, description, details, branch_id)
       VALUES (?, 'EMI_PAYMENT_COLLECTED', 'EMI_PAYMENT_COLLECTED', ?, ?, ?, ?)`,
      [
        plan.customer_id, performedBy,
        `Collected INR ${collectAmount.toLocaleString("en-IN")} for ${planCode} Installment #${installment.installment_no} (Receipt: ${paymentNo})`,
        `Collected INR ${collectAmount.toLocaleString("en-IN")} for ${planCode} Installment #${installment.installment_no} (Receipt: ${paymentNo})`,
        plan.branch_id || req.user?.branch_id || 1
      ]
    );

    await conn.commit();

    res.status(201).json({
      success: true,
      message: `Payment of INR ${collectAmount.toLocaleString("en-IN")} collected successfully. Receipt: ${paymentNo}`,
      data: {
        receipt_no: paymentNo,
        payment_no: paymentNo,
        installment_no: installment.installment_no,
        amount_collected: collectAmount,
        remaining_plan_balance: newRemaining,
        new_customer_balance_due: newBalance,
        plan_status: newPlanStatus,
        journal_voucher_no: journal.voucher_no
      }
    });
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ success: false, message: err.message });
  } finally {
    conn.release();
  }
}

// GET /api/emi/due-reminders — upcoming and overdue EMI installments + credit bills
async function getDueReminders(req, res) {
  try {
    const branchId = req.branchId || null;
    const emiBranchSql = branchId ? "AND ep.branch_id = ?" : "";
    const creditBranchSql = branchId ? "AND i.branch_id = ?" : "";
    const branchParams = branchId ? [branchId] : [];
    // 1. EMI Installments due
    const [emiDues] = await db.query(
      `SELECT ei.id, ei.installment_no, ei.due_date,
              (COALESCE(ei.amount_due, ei.amount) - COALESCE(ei.amount_paid, ei.paid_amount, 0)) AS amount_due,
              COALESCE(ep.plan_id, ep.plan_code) AS plan_id, ep.notes AS finance_partner,
              c.id AS customer_id, c.customer_id AS cust_code, c.full_name AS customer_name, c.phone AS customer_phone,
              DATEDIFF(CURDATE(), ei.due_date) AS days_diff,
              'EMI' AS record_type
       FROM emi_installments ei
       JOIN emi_plans ep ON ei.plan_id = ep.id
       JOIN customers c ON ep.customer_id = c.id
       WHERE ei.status IN ('Pending', 'Due', 'Failed', 'Partial', 'Overdue')
         AND ep.status = 'Active'
         ${emiBranchSql}
       ORDER BY ei.due_date ASC`,
      branchParams
    );

    // 2. Credit sales due
    const [creditDues] = await db.query(
      `SELECT i.id, i.invoice_no AS plan_id, i.credit_due_date AS due_date,
              (i.grand_total - COALESCE(i.paid_amount,0)) AS amount_due,
              'Direct Credit' AS finance_partner,
              c.id AS customer_id, c.customer_id AS cust_code, c.full_name AS customer_name, c.phone AS customer_phone,
              DATEDIFF(CURDATE(), i.credit_due_date) AS days_diff,
              'Credit' AS record_type
       FROM invoices i
       JOIN customers c ON i.customer_id = c.id
       WHERE (i.payment_mode = 'Credit' OR i.status IN ('Credit', 'Partial'))
         AND (i.grand_total - COALESCE(i.paid_amount,0)) > 0
         AND i.credit_due_date IS NOT NULL
         ${creditBranchSql}
       ORDER BY i.credit_due_date ASC`,
      branchParams
    );

    const allDues = [...emiDues, ...creditDues].map(d => {
      const diff = Number(d.days_diff || 0);
      let urgency = "UPCOMING";
      if (diff > 0) urgency = "OVERDUE";
      else if (diff === 0) urgency = "DUE_TODAY";

      return {
        ...d,
        urgency,
        days_overdue: Math.max(0, diff),
      };
    });

    // Sort: OVERDUE first, then DUE_TODAY, then UPCOMING
    const priorityOrder = { OVERDUE: 1, DUE_TODAY: 2, UPCOMING: 3 };
    allDues.sort((a, b) => (priorityOrder[a.urgency] || 4) - (priorityOrder[b.urgency] || 4));

    res.json({ success: true, data: allDues });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// GET /api/emi/payments — complete receipt collection log
async function getPayments(req, res) {
  try {
    const { search, mode, page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;
    let where = "WHERE 1=1";
    const params = [];
    if (req.branchId) {
      where += " AND epay.branch_id = ?";
      params.push(req.branchId);
    }

    if (search) {
      where += " AND (epay.payment_no LIKE ? OR ep.plan_id LIKE ? OR ep.plan_code LIKE ? OR c.full_name LIKE ? OR c.phone LIKE ?)";
      const s = `%${search}%`;
      params.push(s, s, s, s, s);
    }
    if (mode) {
      where += " AND epay.payment_mode = ?";
      params.push(mode);
    }

    const [rows] = await db.query(
      `SELECT epay.*,
              COALESCE(ep.plan_id, ep.plan_code) AS plan_id, ep.notes AS finance_partner,
              c.customer_id AS cust_code, c.full_name AS customer_name, c.phone AS customer_phone
       FROM emi_payments epay
       JOIN emi_plans ep ON epay.plan_id = ep.id
       JOIN customers c ON epay.customer_id = c.id
       ${where}
       ORDER BY epay.payment_date DESC, epay.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), parseInt(offset)]
    );

    const [[{ total }]] = await db.query(
      `SELECT COUNT(*) AS total
       FROM emi_payments epay
       JOIN emi_plans ep ON epay.plan_id = ep.id
       JOIN customers c ON epay.customer_id = c.id
       ${where}`,
      params
    );

    res.json({ success: true, data: rows, total });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

module.exports = {
  getKpis,
  getCreditSales,
  getPlans,
  getPlanById,
  createPlan,
  collectPayment,
  getDueReminders,
  getPayments,
};

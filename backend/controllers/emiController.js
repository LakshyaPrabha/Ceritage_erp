const db = require("../config/db");

// GET /api/emi/kpis
async function getKpis(req, res) {
  try {
    const [[plans]] = await db.query(
      `SELECT
         COUNT(CASE WHEN status = 'Active' THEN 1 END) AS active_plans,
         COALESCE(SUM(CASE WHEN status = 'Active' THEN remaining_amount ELSE 0 END), 0) AS total_emi_outstanding
       FROM emi_plans`
    );

    const [[installments]] = await db.query(
      `SELECT
         COALESCE(SUM(CASE WHEN due_date = CURDATE() AND status IN ('PENDING', 'PARTIAL') THEN (amount_due - amount_paid) ELSE 0 END), 0) AS dues_today,
         COUNT(DISTINCT CASE WHEN due_date < CURDATE() AND status IN ('PENDING', 'PARTIAL') THEN plan_id END) AS overdue_plans
       FROM emi_installments`
    );

    const [[credits]] = await db.query(
      `SELECT
         COUNT(CASE WHEN (payment_mode = 'Credit' OR status IN ('Credit', 'Partial')) AND (grand_total - COALESCE(paid_amount,0)) > 0 THEN 1 END) AS active_credits,
         COUNT(CASE WHEN (payment_mode = 'Credit' OR status IN ('Credit', 'Partial')) AND (grand_total - COALESCE(paid_amount,0)) > 0 AND credit_due_date < CURDATE() THEN 1 END) AS credit_overdue,
         COALESCE(SUM(CASE WHEN (payment_mode = 'Credit' OR status IN ('Credit', 'Partial')) THEN (grand_total - COALESCE(paid_amount,0)) ELSE 0 END), 0) AS total_credit_outstanding
       FROM invoices`
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
       ORDER BY i.credit_due_date ASC, i.invoice_date ASC`
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

    if (status) {
      where += " AND ep.status = ?";
      params.push(status);
    }
    if (search) {
      where += " AND (ep.plan_id LIKE ? OR c.full_name LIKE ? OR c.phone LIKE ? OR ep.invoice_ref LIKE ?)";
      const s = `%${search}%`;
      params.push(s, s, s, s);
    }

    const [rows] = await db.query(
      `SELECT ep.*,
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
    const [rows] = await db.query(
      `SELECT ep.*,
              c.customer_id AS cust_code, c.full_name AS customer_name, c.phone AS customer_phone, c.balance_due AS customer_balance_due
       FROM emi_plans ep
       LEFT JOIN customers c ON ep.customer_id = c.id
       WHERE ep.id = ? OR ep.plan_id = ?`,
      [planId, planId]
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
    total_amount, down_payment = 0, num_emis = 6, interest_rate = 0,
    finance_partner = "In-House", first_due_date
  } = req.body;

  const totalAmount = Number(total_amount || 0);
  const downPay = Number(down_payment || 0);
  const numEmis = parseInt(num_emis || 6);
  const intRate = Number(interest_rate || 0);

  if (!customer_id || totalAmount <= 0) {
    return res.status(400).json({ success: false, message: "Customer and valid total amount are required" });
  }
  if (downPay < 0 || downPay >= totalAmount) {
    return res.status(400).json({ success: false, message: "Down payment must be between 0 and less than total amount" });
  }
  if (numEmis <= 0) {
    return res.status(400).json({ success: false, message: "Number of EMIs must be at least 1" });
  }

  // Calculation Formula
  const loanAmount = totalAmount - downPay;
  const interestAmount = loanAmount * (intRate / 100);
  const totalPayable = loanAmount + interestAmount;
  const roundedEmi = Math.floor(totalPayable / numEmis);
  const finalEmi = totalPayable - (roundedEmi * (numEmis - 1)); // exact penny reconciliation

  const startDate = first_due_date ? new Date(first_due_date) : new Date(Date.now() + 30 * 86400000);
  const firstDueDateStr = startDate.toISOString().slice(0, 10);

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    // Verify customer exists
    const [custRows] = await conn.query("SELECT id, full_name FROM customers WHERE id = ?", [customer_id]);
    if (custRows.length === 0) {
      await conn.rollback();
      return res.status(404).json({ success: false, message: "Customer not found" });
    }

    // Generate unique plan_id
    const [[{ count }]] = await conn.query("SELECT COUNT(*) AS count FROM emi_plans");
    const plan_id = `EMI-${new Date().getFullYear()}-${String(count + 1).padStart(4, "0")}`;

    // Insert EMI plan
    const [planResult] = await conn.query(
      `INSERT INTO emi_plans
       (plan_id, customer_id, invoice_ref, item_description, total_amount,
        down_payment, loan_amount, num_emis, interest_rate, emi_amount,
        finance_partner, first_due_date, next_due_date, paid_emis,
        remaining_amount, status)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,0,?,'Active')`,
      [
        plan_id, customer_id, invoice_ref || null, item_description || "Jewellery Purchase",
        totalAmount, downPay, loanAmount, numEmis, intRate, roundedEmi,
        finance_partner, firstDueDateStr, firstDueDateStr, totalPayable
      ]
    );

    const newPlanId = planResult.insertId;

    // Generate Installment Schedule
    for (let i = 1; i <= numEmis; i++) {
      const instDueDate = new Date(startDate.getTime());
      instDueDate.setMonth(instDueDate.getMonth() + (i - 1));
      const dueDateStr = instDueDate.toISOString().slice(0, 10);
      const amountDue = i === numEmis ? finalEmi : roundedEmi;

      await conn.query(
        `INSERT INTO emi_installments
         (plan_id, customer_id, installment_no, due_date, amount_due, amount_paid, status)
         VALUES (?, ?, ?, ?, ?, 0, 'PENDING')`,
        [newPlanId, customer_id, i, dueDateStr, amountDue]
      );
    }

    // Update linked invoice status if applicable
    if (invoice_ref) {
      await conn.query(
        "UPDATE invoices SET status = 'EMI Active' WHERE invoice_no = ?",
        [invoice_ref]
      );
    }

    const performedBy = req.user?.full_name || req.user?.username || "Admin";
    await conn.query(
      `INSERT INTO customer_audit_logs (customer_id, action, performed_by, details)
       VALUES (?, 'EMI_PLAN_CREATED', ?, ?)`,
      [
        customer_id, performedBy,
        `Created EMI Plan ${plan_id} for ${custRows[0].full_name}: ₹${totalPayable.toLocaleString('en-IN')} over ${numEmis} months (${finance_partner})`
      ]
    );

    await conn.commit();

    res.status(201).json({
      success: true,
      message: `EMI Plan ${plan_id} created successfully with ${numEmis} monthly installments.`,
      data: {
        id: newPlanId,
        plan_id,
        loan_amount: loanAmount,
        total_payable: totalPayable,
        emi_amount: roundedEmi,
        final_emi: finalEmi,
        first_due_date: firstDueDateStr
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
  const { installment_id, amount, payment_mode = "Cash", payment_date, reference, notes } = req.body;
  const collectAmount = Number(amount || 0);

  if (!collectAmount || collectAmount <= 0) {
    return res.status(400).json({ success: false, message: "Valid payment amount greater than 0 is required" });
  }

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    // 1. Lock and load EMI Plan
    const [planRows] = await conn.query(
      "SELECT * FROM emi_plans WHERE id = ? OR plan_id = ? FOR UPDATE",
      [planParam, planParam]
    );
    if (planRows.length === 0) {
      await conn.rollback();
      return res.status(404).json({ success: false, message: "EMI plan not found" });
    }
    const plan = planRows[0];

    // 2. Lock and load Installment
    let installment = null;
    if (installment_id) {
      const [instRows] = await conn.query(
        "SELECT * FROM emi_installments WHERE id = ? AND plan_id = ? FOR UPDATE",
        [installment_id, plan.id]
      );
      if (instRows.length > 0) installment = instRows[0];
    } else {
      // Find next pending or partial installment
      const [instRows] = await conn.query(
        "SELECT * FROM emi_installments WHERE plan_id = ? AND status IN ('PENDING', 'PARTIAL') ORDER BY installment_no ASC LIMIT 1 FOR UPDATE",
        [plan.id]
      );
      if (instRows.length > 0) installment = instRows[0];
    }

    if (!installment) {
      await conn.rollback();
      return res.status(400).json({ success: false, message: "No pending installments found for this EMI plan." });
    }

    if (installment.status === "PAID") {
      await conn.rollback();
      return res.status(409).json({ success: false, message: `Installment #${installment.installment_no} is already fully paid.` });
    }

    const outstandingForInst = Number(installment.amount_due) - Number(installment.amount_paid);
    if (collectAmount > outstandingForInst) {
      await conn.rollback();
      return res.status(400).json({
        success: false,
        message: `Payment amount (₹${collectAmount}) exceeds installment balance (₹${outstandingForInst}).`
      });
    }

    // 3. Generate Unique Receipt Number
    const [[{ count }]] = await conn.query("SELECT COUNT(*) AS count FROM emi_payments");
    const receipt_no = `RCP-EMI-${new Date().getFullYear()}-${String(count + 1).padStart(4, "0")}`;
    const payDate = payment_date || new Date().toISOString().slice(0, 10);
    const performedBy = req.user?.full_name || req.user?.username || "Admin";

    // 4. Insert EMI Payment Receipt
    await conn.query(
      `INSERT INTO emi_payments
       (receipt_no, plan_id, customer_id, installment_no, amount, payment_mode, payment_date, reference, notes, performed_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        receipt_no, plan.id, plan.customer_id, installment.installment_no,
        collectAmount, payment_mode, payDate, reference || null, notes || null, performedBy
      ]
    );

    // 5. Update Installment
    const newInstPaid = Number(installment.amount_paid) + collectAmount;
    const newInstStatus = newInstPaid >= Number(installment.amount_due) ? "PAID" : "PARTIAL";

    await conn.query(
      `UPDATE emi_installments SET
         amount_paid = ?,
         status = ?,
         paid_at = NOW(),
         payment_mode = ?,
         receipt_no = ?,
         reference = ?
       WHERE id = ?`,
      [newInstPaid, newInstStatus, payment_mode, receipt_no, reference || null, installment.id]
    );

    // 6. Update EMI Plan remaining amount, paid_emis, next_due_date, and status
    const newRemaining = Math.max(0, Number(plan.remaining_amount) - collectAmount);
    const newPaidEmis = newInstStatus === "PAID" ? (Number(plan.paid_emis || 0) + 1) : Number(plan.paid_emis || 0);

    // Find next pending due date
    const [nextInstRows] = await conn.query(
      "SELECT due_date FROM emi_installments WHERE plan_id = ? AND status IN ('PENDING', 'PARTIAL') AND id != ? ORDER BY installment_no ASC LIMIT 1",
      [plan.id, installment.id]
    );
    const nextDueDate = nextInstRows.length > 0 ? nextInstRows[0].due_date : null;
    const newPlanStatus = (newRemaining <= 0 || newPaidEmis >= Number(plan.num_emis)) ? "Closed" : "Active";

    await conn.query(
      `UPDATE emi_plans SET
         remaining_amount = ?,
         paid_emis = ?,
         next_due_date = ?,
         status = ?
       WHERE id = ?`,
      [newRemaining, newPaidEmis, nextDueDate, newPlanStatus, plan.id]
    );

    // 7. ATOMIC CUSTOMER LEDGER INTEGRATION
    // Insert Credit entry into customer_ledger
    const [[balanceRow]] = await conn.query(
      "SELECT (COALESCE(SUM(debit), 0) - COALESCE(SUM(credit), 0)) AS current_balance FROM customer_ledger WHERE customer_id = ?",
      [plan.customer_id]
    );
    const currentBalance = Number(balanceRow.current_balance || 0);
    const newBalance = Math.max(0, currentBalance - collectAmount);

    const particulars = `EMI Installment #${installment.installment_no} (${plan.plan_id}) via ${payment_mode}${notes ? ` - ${notes}` : ''}`;

    await conn.query(
      `INSERT INTO customer_ledger (customer_id, date, particulars, debit, credit, balance, reference)
       VALUES (?, ?, ?, 0, ?, ?, ?)`,
      [plan.customer_id, payDate, particulars, collectAmount, newBalance, receipt_no]
    );

    // Update customer cached balance_due
    await conn.query("UPDATE customers SET balance_due = ? WHERE id = ?", [newBalance, plan.customer_id]);

    // 8. Update linked invoice if present
    if (plan.invoice_ref) {
      const [invRows] = await conn.query("SELECT id, grand_total, paid_amount FROM invoices WHERE invoice_no = ?", [plan.invoice_ref]);
      if (invRows.length > 0) {
        const inv = invRows[0];
        const newInvPaid = Number(inv.paid_amount || 0) + collectAmount;
        const newInvStatus = newInvPaid >= Number(inv.grand_total) ? "Paid" : (newInvPaid > 0 ? "Partial" : "EMI Active");
        await conn.query("UPDATE invoices SET paid_amount = ?, status = ? WHERE id = ?", [newInvPaid, newInvStatus, inv.id]);
      }
    }

    // 9. Audit Log
    await conn.query(
      `INSERT INTO customer_audit_logs (customer_id, action, performed_by, details)
       VALUES (?, 'EMI_PAYMENT_COLLECTED', ?, ?)`,
      [
        plan.customer_id, performedBy,
        `Collected ₹${collectAmount.toLocaleString('en-IN')} for ${plan.plan_id} Installment #${installment.installment_no} (Receipt: ${receipt_no})`
      ]
    );

    await conn.commit();

    res.status(201).json({
      success: true,
      message: `Payment of ₹${collectAmount.toLocaleString('en-IN')} collected successfully. Receipt: ${receipt_no}`,
      data: {
        receipt_no,
        installment_no: installment.installment_no,
        amount_collected: collectAmount,
        remaining_plan_balance: newRemaining,
        new_customer_balance_due: newBalance,
        plan_status: newPlanStatus
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
    // 1. EMI Installments due
    const [emiDues] = await db.query(
      `SELECT ei.id, ei.installment_no, ei.due_date, (ei.amount_due - ei.amount_paid) AS amount_due,
              ep.plan_id, ep.finance_partner,
              c.id AS customer_id, c.customer_id AS cust_code, c.full_name AS customer_name, c.phone AS customer_phone,
              DATEDIFF(CURDATE(), ei.due_date) AS days_diff,
              'EMI' AS record_type
       FROM emi_installments ei
       JOIN emi_plans ep ON ei.plan_id = ep.id
       JOIN customers c ON ei.customer_id = c.id
       WHERE ei.status IN ('PENDING', 'PARTIAL')
         AND ep.status = 'Active'
       ORDER BY ei.due_date ASC`
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
       ORDER BY i.credit_due_date ASC`
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

    if (search) {
      where += " AND (epay.receipt_no LIKE ? OR ep.plan_id LIKE ? OR c.full_name LIKE ? OR c.phone LIKE ?)";
      const s = `%${search}%`;
      params.push(s, s, s, s);
    }
    if (mode) {
      where += " AND epay.payment_mode = ?";
      params.push(mode);
    }

    const [rows] = await db.query(
      `SELECT epay.*,
              ep.plan_id, ep.finance_partner,
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

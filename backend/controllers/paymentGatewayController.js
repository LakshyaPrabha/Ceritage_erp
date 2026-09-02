const db = require("../config/db");
const gateway = require("../services/paymentGatewayService");
const autopay = require("../services/emiAutopayService");
const settlements = require("../services/gatewaySettlementService");
const accounting = require("../services/accountingPostingService");

function activeBranch(req, fallback) {
  return Number(req.branchId || req.user?.branch_id || fallback || 1);
}

async function getConfig(req, res) {
  try {
    const provider = gateway.normalizeProvider(req.query.provider);
    const config = gateway.getPublicConfig(provider);
    const branchId = req.branchId || null;
    const where = branchId ? "WHERE provider = ? AND branch_id = ?" : "WHERE provider = ?";
    const params = branchId ? [provider, branchId] : [provider];
    const [[counts]] = await db.query(
      `SELECT
         COUNT(*) AS total_payments,
         SUM(status = 'CAPTURED') AS captured,
         SUM(status = 'FAILED') AS failed
       FROM payment_gateway_payments
       ${where}`,
      params
    ).catch(() => [[{ total_payments: 0, captured: 0, failed: 0 }]]);
    res.json({ success: true, data: { ...config, counts } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

async function setupEmiAutopay(req, res) {
  const planParam = req.params.id;
  const provider = gateway.normalizeProvider(req.body.provider);
  const adapter = gateway.getAdapter(provider);
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    const [planRows] = await conn.query(
      "SELECT * FROM emi_plans WHERE id = ? OR plan_id = ? OR plan_code = ? FOR UPDATE",
      [planParam, planParam, planParam]
    );
    if (!planRows.length) {
      await conn.rollback();
      return res.status(404).json({ success: false, message: "EMI plan not found" });
    }
    const plan = planRows[0];
    if (req.user.role !== "admin" && Number(plan.branch_id || 1) !== Number(req.user.branch_id || 1)) {
      await conn.rollback();
      return res.status(403).json({ success: false, message: "Cannot setup AutoPay for another branch" });
    }
    if (plan.status !== "Active") {
      await conn.rollback();
      return res.status(400).json({ success: false, message: "AutoPay can only be enabled for active EMI plans" });
    }

    const [customerRows] = await conn.query("SELECT * FROM customers WHERE id = ? FOR UPDATE", [plan.customer_id]);
    if (!customerRows.length) throw new Error("Customer not found for EMI plan");
    const customer = customerRows[0];

    let [gatewayCustomers] = await conn.query(
      "SELECT * FROM payment_gateway_customers WHERE provider = ? AND customer_id = ? FOR UPDATE",
      [provider, customer.id]
    );
    let gatewayCustomer = gatewayCustomers[0];
    if (!gatewayCustomer) {
      const created = await adapter.createCustomer(customer);
      const [result] = await conn.query(
        `INSERT INTO payment_gateway_customers (provider, customer_id, branch_id, provider_customer_id, status, metadata)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [provider, customer.id, plan.branch_id || 1, created.provider_customer_id, created.status || "CREATED", JSON.stringify(created.metadata || {})]
      );
      gatewayCustomer = { id: result.insertId, provider_customer_id: created.provider_customer_id };
    }

    const mandateCreated = await adapter.createMandate({ customer, plan, gatewayCustomer });
    const [mandateResult] = await conn.query(
      `INSERT INTO payment_mandates
       (provider, customer_id, branch_id, emi_plan_id, provider_customer_id, provider_mandate_id, status,
        amount_limit, currency, start_date, end_date, authorization_url, metadata)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'INR', ?, ?, ?, ?)`,
      [
        provider,
        customer.id,
        plan.branch_id || 1,
        plan.id,
        gatewayCustomer.provider_customer_id,
        mandateCreated.provider_mandate_id,
        mandateCreated.status || "CREATED",
        Number(plan.monthly_installment || 0),
        plan.start_date,
        plan.end_date,
        mandateCreated.authorization_url || null,
        JSON.stringify(mandateCreated.metadata || {}),
      ]
    );

    await conn.query(
      `UPDATE emi_plans
       SET payment_method = 'AUTOPAY',
           autopay_status = ?,
           gateway_provider = ?,
           mandate_id = ?,
           next_debit_date = next_due_date,
           last_failure_reason = NULL
       WHERE id = ?`,
      [mandateCreated.status === "ACTIVE" ? "ACTIVE" : "PENDING_SETUP", provider, mandateResult.insertId, plan.id]
    );

    await conn.query(
      `INSERT INTO customer_audit_logs (customer_id, action_type, action, performed_by, description, details, branch_id)
       VALUES (?, 'EMI_AUTOPAY_SETUP', 'EMI_AUTOPAY_SETUP', ?, ?, ?, ?)`,
      [
        customer.id,
        req.user.full_name || req.user.username || "Admin",
        `AutoPay setup initiated for ${plan.plan_id || plan.plan_code} through ${provider}`,
        JSON.stringify({ mandate_id: mandateResult.insertId, provider_mandate_id: mandateCreated.provider_mandate_id }),
        plan.branch_id || 1,
      ]
    );

    await conn.commit();
    res.status(201).json({
      success: true,
      message: "EMI AutoPay setup initiated",
      data: {
        mandate_id: mandateResult.insertId,
        provider,
        mandate_status: mandateCreated.status || "CREATED",
        authorization_url: mandateCreated.authorization_url || null,
      },
    });
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ success: false, message: err.message });
  } finally {
    conn.release();
  }
}

async function updateAutopayStatus(req, res, action) {
  const planParam = req.params.id;
  const target = action === "pause" ? "PAUSED" : action === "resume" ? "ACTIVE" : "CANCELLED";
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    const [plans] = await conn.query(
      "SELECT * FROM emi_plans WHERE id = ? OR plan_id = ? OR plan_code = ? FOR UPDATE",
      [planParam, planParam, planParam]
    );
    if (!plans.length) {
      await conn.rollback();
      return res.status(404).json({ success: false, message: "EMI plan not found" });
    }
    const plan = plans[0];
    if (req.user.role !== "admin" && Number(plan.branch_id || 1) !== Number(req.user.branch_id || 1)) {
      await conn.rollback();
      return res.status(403).json({ success: false, message: "Cannot update AutoPay for another branch" });
    }
    const [mandates] = await conn.query("SELECT * FROM payment_mandates WHERE id = ? FOR UPDATE", [plan.mandate_id]);
    const mandate = mandates[0];
    if (!mandate) {
      await conn.rollback();
      return res.status(400).json({ success: false, message: "No AutoPay mandate is linked to this plan" });
    }
    if (action === "resume" && mandate.status === "CANCELLED") {
      await conn.rollback();
      return res.status(400).json({ success: false, message: "Cancelled mandates cannot be resumed" });
    }
    await conn.query("UPDATE payment_mandates SET status = ? WHERE id = ?", [target, plan.mandate_id]);
    await conn.query(
      "UPDATE emi_plans SET autopay_status = ?, payment_method = CASE WHEN ? = 'CANCELLED' THEN 'MANUAL' ELSE payment_method END WHERE id = ?",
      [target, target, plan.id]
    );
    await conn.commit();
    res.json({ success: true, message: `AutoPay ${action}d`, data: { plan_id: plan.id, autopay_status: target } });
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ success: false, message: err.message });
  } finally {
    conn.release();
  }
}

async function pauseAutopay(req, res) {
  return updateAutopayStatus(req, res, "pause");
}

async function cancelAutopay(req, res) {
  return updateAutopayStatus(req, res, "cancel");
}

async function resumeAutopay(req, res) {
  return updateAutopayStatus(req, res, "resume");
}

async function retryEmiAutopay(req, res) {
  const planParam = req.params.id;
  const provider = gateway.normalizeProvider(req.body.provider);
  const adapter = gateway.getAdapter(provider);
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    const [plans] = await conn.query(
      "SELECT * FROM emi_plans WHERE id = ? OR plan_id = ? OR plan_code = ? FOR UPDATE",
      [planParam, planParam, planParam]
    );
    if (!plans.length) {
      await conn.rollback();
      return res.status(404).json({ success: false, message: "EMI plan not found" });
    }
    const plan = plans[0];
    if (req.user.role !== "admin" && Number(plan.branch_id || 1) !== Number(req.user.branch_id || 1)) {
      await conn.rollback();
      return res.status(403).json({ success: false, message: "Cannot retry AutoPay for another branch" });
    }
    if (plan.payment_method !== "AUTOPAY" || !plan.mandate_id || plan.autopay_status !== "ACTIVE") {
      await conn.rollback();
      return res.status(400).json({ success: false, message: "AutoPay mandate is not active for this plan" });
    }

    const [mandates] = await conn.query("SELECT * FROM payment_mandates WHERE id = ? FOR UPDATE", [plan.mandate_id]);
    const mandate = mandates[0];
    if (!mandate || mandate.status !== "ACTIVE") {
      await conn.rollback();
      return res.status(400).json({ success: false, message: "Mandate is not available for retry" });
    }

    const [installments] = await conn.query(
      `SELECT * FROM emi_installments
       WHERE plan_id = ? AND status IN ('Failed','Due','Pending','Partial','Overdue')
       ORDER BY installment_no ASC LIMIT 1 FOR UPDATE`,
      [plan.id]
    );
    if (!installments.length) {
      await conn.rollback();
      return res.status(400).json({ success: false, message: "No payable EMI installment found" });
    }
    const installment = installments[0];
    const outstanding = accounting.money(Number(installment.amount_due || installment.amount || 0) - Number(installment.amount_paid || installment.paid_amount || 0));
    if (outstanding <= 0) throw new Error("Installment has no outstanding balance");

    const idempotencyKey = `emi-autopay-${plan.id}-${installment.id}-${installment.retry_count || 0}-${Date.now()}`;
    const order = await adapter.createPaymentOrder({
      amount: outstanding,
      currency: "INR",
      idempotency_key: idempotencyKey,
      plan,
      installment,
      mandate,
    });

    const [orderResult] = await conn.query(
      `INSERT INTO payment_gateway_orders
       (provider, provider_order_id, customer_id, branch_id, emi_plan_id, emi_installment_id, mandate_id, amount, currency, status, payment_type, idempotency_key, metadata)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'INR', ?, 'EMI_AUTOPAY', ?, ?)`,
      [provider, order.provider_order_id, plan.customer_id, plan.branch_id || 1, plan.id, installment.id, plan.mandate_id, outstanding, order.status || "CREATED", idempotencyKey, JSON.stringify(order.metadata || {})]
    );
    const [paymentResult] = await conn.query(
      `INSERT INTO payment_gateway_payments
       (provider, provider_order_id, provider_mandate_id, customer_id, branch_id, emi_plan_id, emi_installment_id,
        order_id, mandate_id, amount, currency, status, payment_type, payment_mode, idempotency_key)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'INR', 'CREATED', 'EMI_AUTOPAY', 'UPI', ?)`,
      [provider, order.provider_order_id, mandate.provider_mandate_id, plan.customer_id, plan.branch_id || 1, plan.id, installment.id, orderResult.insertId, plan.mandate_id, outstanding, idempotencyKey]
    );

    await conn.query(
      `UPDATE emi_installments
       SET status = 'Processing', gateway_payment_id = ?, processing_started_at = NOW(),
           last_attempt_at = NOW(), failure_reason = NULL
       WHERE id = ?`,
      [paymentResult.insertId, installment.id]
    );
    await conn.query(
      "UPDATE emi_plans SET autopay_status = 'ACTIVE', last_failure_reason = NULL WHERE id = ?",
      [plan.id]
    );

    await conn.commit();
    res.status(201).json({
      success: true,
      message: "AutoPay retry attempt created. Awaiting verified gateway webhook.",
      data: {
        gateway_payment_id: paymentResult.insertId,
        provider,
        provider_order_id: order.provider_order_id,
        amount: outstanding,
        status: "CREATED",
      },
    });
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ success: false, message: err.message });
  } finally {
    conn.release();
  }
}

async function webhook(req, res) {
  const provider = gateway.normalizeProvider(req.params.provider);
  const adapter = gateway.getAdapter(provider);
  const bodyText = gateway.rawPayload(req.rawBody, req.body);
  if (!adapter.verifyWebhookSignature({ headers: req.headers, rawBody: bodyText, body: req.body })) {
    return res.status(401).json({ success: false, message: "Invalid gateway webhook signature" });
  }

  const parsed = adapter.parseWebhook(req.body);
  if (!parsed.event_id) return res.status(400).json({ success: false, message: "Webhook event id is required" });

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    let eventId;
    try {
      const [eventResult] = await conn.query(
        `INSERT INTO payment_webhook_events
         (provider, webhook_event_id, event_type, provider_payment_id, provider_order_id, signature_valid, processing_status, payload)
         VALUES (?, ?, ?, ?, ?, 1, 'PROCESSING', ?)`,
        [provider, parsed.event_id, parsed.event_type || "payment", parsed.provider_payment_id || null, parsed.provider_order_id || null, JSON.stringify(req.body || {})]
      );
      eventId = eventResult.insertId;
    } catch (err) {
      if (err.code === "ER_DUP_ENTRY") {
        await conn.rollback();
        return res.json({ success: true, duplicate: true, message: "Webhook already processed" });
      }
      throw err;
    }

    const [paymentRows] = await conn.query(
      `SELECT * FROM payment_gateway_payments
       WHERE provider = ?
         AND ((provider_payment_id IS NOT NULL AND provider_payment_id = ?)
              OR (provider_order_id IS NOT NULL AND provider_order_id = ?))
       ORDER BY id DESC LIMIT 1 FOR UPDATE`,
      [provider, parsed.provider_payment_id || "", parsed.provider_order_id || ""]
    );
    if (!paymentRows.length) {
      await conn.query(
        "UPDATE payment_webhook_events SET processing_status = 'IGNORED', failure_reason = 'No matching gateway payment', processed_at = NOW() WHERE id = ?",
        [eventId]
      );
      await conn.commit();
      return res.json({ success: true, ignored: true, message: "No matching internal payment for webhook" });
    }

    const payment = paymentRows[0];
    let result = null;
    if (parsed.status === "CAPTURED") {
      // Route to the correct handler based on payment_type
      if (payment.payment_type === "INVOICE_PAYMENT") {
        // Idempotency: skip if already processed
        if (payment.status === "CAPTURED" && payment.journal_id) {
          result = { duplicate: true };
        } else {
          // Apply invoice payment via webhook (same logic as verifyInvoicePayment but without signature re-check)
          const meta = JSON.parse(payment.metadata || "{}");
          const invoiceId = meta.invoice_id;
          if (invoiceId) {
            const [invRows] = await conn.query("SELECT * FROM invoices WHERE id = ? FOR UPDATE", [invoiceId]);
            if (invRows.length) {
              const inv = invRows[0];
              const amount = accounting.money(parsed.amount || payment.amount);
              const payMode = payment.payment_mode || "UPI";
              const receiptRef = `GW-WH-${inv.invoice_no}-${Date.now().toString().slice(-6)}`;
              const journal = await accounting.postCustomerReceipt(conn, {
                branch_id: inv.branch_id,
                amount,
                payment_mode: payMode,
                reference_no: receiptRef,
                source_type: "GATEWAY_INVOICE_PAYMENT_WEBHOOK",
                source_id: payment.id,
                entry_date: new Date().toISOString().slice(0, 10),
                created_by: "Webhook",
                narration: `Webhook: Razorpay payment for invoice ${inv.invoice_no}`,
              });
              const mapping = await accounting.getPaymentMapping(conn, payMode);
              // Check if tender already recorded (idempotency)
              const [existTender] = await conn.query("SELECT id FROM invoice_tenders WHERE reference_no = ?", [parsed.provider_payment_id]);
              if (!existTender.length) {
                await conn.query(
                  "INSERT INTO invoice_tenders (invoice_id, branch_id, payment_mode, amount, account_id, reference_no) VALUES (?,?,?,?,?,?)",
                  [invoiceId, inv.branch_id, payMode, amount, mapping.receipt_account_id, parsed.provider_payment_id]
                );
              }
              const newPaid = accounting.money(Number(inv.paid_amount || 0) + amount);
              const newBalance = accounting.money(Math.max(0, Number(inv.grand_total || 0) - newPaid));
              await conn.query(
                "UPDATE invoices SET paid_amount = ?, balance_due = ?, status = ? WHERE id = ?",
                [newPaid, newBalance, newBalance <= 0 ? "Paid" : "Partial", invoiceId]
              );
              if (inv.customer_id) {
                const [[balRow]] = await conn.query(
                  "SELECT (COALESCE(SUM(debit),0)-COALESCE(SUM(credit),0)) AS bal FROM customer_ledger WHERE customer_id = ?",
                  [inv.customer_id]
                );
                const newCustBal = accounting.money(Math.max(0, Number(balRow.bal || 0) - amount));
                const today = new Date().toISOString().slice(0, 10);
                await conn.query(
                  "INSERT INTO customer_ledger (customer_id, date, particulars, debit, credit, balance, reference) VALUES (?,?,?,0,?,?,?)",
                  [inv.customer_id, today, `Razorpay webhook payment for ${inv.invoice_no}`, amount, newCustBal, receiptRef]
                );
                await conn.query("UPDATE customers SET balance_due = ? WHERE id = ?", [newCustBal, inv.customer_id]);
              }
              await conn.query(
                "UPDATE payment_gateway_payments SET status = 'CAPTURED', provider_payment_id = COALESCE(provider_payment_id,?), journal_id = ?, captured_at = NOW() WHERE id = ?",
                [parsed.provider_payment_id, journal.id, payment.id]
              );
              result = { invoice_no: inv.invoice_no, amount, journal_voucher: journal.voucher_no };
            }
          }
        }
      } else {
        // EMI AutoPay path
        result = await autopay.applySuccessfulGatewayPayment(conn, {
          gateway_payment_id: payment.id,
          provider_payment_id: parsed.provider_payment_id,
          amount: parsed.amount || payment.amount,
          payment_mode: payment.payment_mode || "UPI",
          webhook_event_id: parsed.event_id,
          gateway_fee: parsed.gateway_fee,
          gateway_fee_tax: parsed.gateway_fee_tax,
          captured_at: new Date(),
        });
      }
    } else if (parsed.status === "FAILED") {
      result = await autopay.markGatewayPaymentFailed(conn, {
        gateway_payment_id: payment.id,
        provider_payment_id: parsed.provider_payment_id,
        webhook_event_id: parsed.event_id,
        failure_reason: parsed.failure_reason,
      });
    } else {
      await conn.query(
        "UPDATE payment_gateway_payments SET status = ?, provider_payment_id = COALESCE(provider_payment_id, ?) WHERE id = ?",
        [parsed.status || "AUTHORIZED", parsed.provider_payment_id || null, payment.id]
      );
      result = { status: parsed.status || "AUTHORIZED" };
    }

    await conn.query(
      "UPDATE payment_webhook_events SET processing_status = 'PROCESSED', processed_at = NOW() WHERE id = ?",
      [eventId]
    );
    await conn.commit();
    res.json({ success: true, data: result });
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ success: false, message: err.message });
  } finally {
    conn.release();
  }
}

async function listSettlements(req, res) {
  try {
    const branchId = req.branchId || null;
    const where = branchId ? "WHERE branch_id = ?" : "";
    const params = branchId ? [branchId] : [];
    const [rows] = await db.query(
      `SELECT * FROM payment_settlements
       ${where}
       ORDER BY settlement_date DESC, created_at DESC
       LIMIT 100`,
      params
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

async function createSettlement(req, res) {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    const result = await settlements.createSettlement(conn, {
      provider: req.body.provider,
      gateway_payment_ids: req.body.gateway_payment_ids || [],
      settlement_id: req.body.settlement_id,
      gateway_fee: req.body.gateway_fee,
      gateway_fee_tax: req.body.gateway_fee_tax,
      net_amount: req.body.net_amount,
      settlement_date: req.body.settlement_date,
      branch_id: activeBranch(req),
      created_by: req.user?.full_name || req.user?.username || "Admin",
    });
    await conn.commit();
    res.status(201).json({ success: true, message: "Gateway settlement reconciled", data: result });
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ success: false, message: err.message });
  } finally {
    conn.release();
  }
}


// ── createInvoiceOrder: Create Razorpay Order for an invoice payment ──────────
// Backend derives the payable amount from the DB. Never trusts frontend amount.
async function createInvoiceOrder(req, res) {
  const branchId = activeBranch(req);
  const conn = await db.getConnection();
  try {
    const { invoice_id, payment_mode } = req.body;
    if (!invoice_id) return res.status(400).json({ success: false, message: "invoice_id is required" });

    await conn.beginTransaction();

    // Lock invoice row and verify ownership
    const [invRows] = await conn.query(
      "SELECT * FROM invoices WHERE id = ? FOR UPDATE",
      [invoice_id]
    );
    if (!invRows.length) {
      await conn.rollback();
      return res.status(404).json({ success: false, message: "Invoice not found" });
    }
    const inv = invRows[0];

    // Branch isolation
    if (req.user.role !== "admin" && Number(inv.branch_id) !== branchId) {
      await conn.rollback();
      return res.status(403).json({ success: false, message: "Cannot access another branch invoice" });
    }

    // Derive payable from DB — never trust frontend amount
    const payable = accounting.money(Number(inv.balance_due || 0));
    if (payable <= 0) {
      await conn.rollback();
      return res.status(400).json({ success: false, message: "Invoice has no outstanding balance" });
    }

    const provider = gateway.normalizeProvider(process.env.PAYMENT_GATEWAY_PROVIDER || "razorpay");
    const adapter = gateway.getAdapter(provider);
    if (!adapter.isConfigured) {
      await conn.rollback();
      return res.status(503).json({ success: false, message: "Payment gateway is not configured. Please set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in .env" });
    }

    const idempotencyKey = `inv-${invoice_id}-${Date.now()}`;

    // Create Razorpay order
    const order = await adapter.createPaymentOrder({
      amount: payable,
      currency: "INR",
      idempotency_key: idempotencyKey,
    });

    // Store gateway order in DB
    await conn.query(
      `INSERT INTO payment_gateway_orders
       (provider, provider_order_id, customer_id, branch_id, amount, currency, status, payment_type, idempotency_key, metadata)
       VALUES (?, ?, ?, ?, ?, 'INR', 'CREATED', 'INVOICE_PAYMENT', ?, ?)`,
      [provider, order.provider_order_id, inv.customer_id, inv.branch_id, payable, idempotencyKey, JSON.stringify({ invoice_id, invoice_no: inv.invoice_no })]
    );

    // Insert pending gateway payment record
    const [payResult] = await conn.query(
      `INSERT INTO payment_gateway_payments
       (provider, provider_order_id, customer_id, branch_id, amount, currency, status, payment_type, payment_mode, idempotency_key, metadata)
       VALUES (?, ?, ?, ?, ?, 'INR', 'CREATED', 'INVOICE_PAYMENT', ?, ?, ?)`,
      [provider, order.provider_order_id, inv.customer_id, inv.branch_id, payable, payment_mode || "UPI", idempotencyKey, JSON.stringify({ invoice_id, invoice_no: inv.invoice_no })]
    );

    await conn.commit();

    // Return only public key + order_id to frontend — NEVER return secret
    const keyId = process.env.RAZORPAY_KEY_ID || "";
    res.json({
      success: true,
      data: {
        gateway_payment_id: payResult.insertId,
        provider_order_id: order.provider_order_id,
        amount_paise: Math.round(payable * 100),
        currency: "INR",
        invoice_id,
        invoice_no: inv.invoice_no,
        customer_name: inv.customer_name || null,
        key_id: keyId,  // Public key only — safe to send to frontend
      },
    });
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ success: false, message: err.message });
  } finally {
    conn.release();
  }
}

// ── verifyInvoicePayment: Server-side signature verification after Checkout ───
async function verifyInvoicePayment(req, res) {
  const branchId = activeBranch(req);
  const conn = await db.getConnection();
  try {
    const {
      gateway_payment_id,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      payment_mode,
    } = req.body;

    if (!gateway_payment_id || !razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ success: false, message: "Missing required payment verification fields" });
    }

    // --- SERVER-SIDE SIGNATURE VERIFICATION ---
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keySecret) return res.status(503).json({ success: false, message: "Gateway secret not configured" });

    const crypto = require("crypto");
    const expectedSignature = crypto
      .createHmac("sha256", keySecret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      // Signature mismatch — mark payment failed, do NOT update invoice
      await db.query(
        "UPDATE payment_gateway_payments SET status = 'FAILED', failure_reason = 'Signature verification failed' WHERE id = ?",
        [gateway_payment_id]
      );
      return res.status(400).json({ success: false, message: "Payment signature verification failed" });
    }

    await conn.beginTransaction();

    // Lock gateway payment record
    const [payRows] = await conn.query(
      "SELECT * FROM payment_gateway_payments WHERE id = ? FOR UPDATE",
      [gateway_payment_id]
    );
    if (!payRows.length) {
      await conn.rollback();
      return res.status(404).json({ success: false, message: "Gateway payment record not found" });
    }
    const gatewayPay = payRows[0];

    // Branch isolation
    if (req.user.role !== "admin" && Number(gatewayPay.branch_id) !== branchId) {
      await conn.rollback();
      return res.status(403).json({ success: false, message: "Cannot verify payment from another branch" });
    }

    // Idempotency: already processed
    if (gatewayPay.status === "CAPTURED" && gatewayPay.journal_id) {
      await conn.rollback();
      return res.json({ success: true, duplicate: true, message: "Payment already processed" });
    }

    // Get invoice from metadata
    const meta = JSON.parse(gatewayPay.metadata || "{}");
    const invoiceId = meta.invoice_id;
    if (!invoiceId) throw new Error("Invoice reference not found in gateway payment metadata");

    const [invRows] = await conn.query("SELECT * FROM invoices WHERE id = ? FOR UPDATE", [invoiceId]);
    if (!invRows.length) throw new Error("Invoice not found");
    const inv = invRows[0];

    const amount = accounting.money(gatewayPay.amount);
    const payMode = payment_mode || gatewayPay.payment_mode || "UPI";

    // Build receipt no
    const [[{ count }]] = await conn.query("SELECT COUNT(*) AS count FROM invoice_tenders WHERE invoice_id = ?", [invoiceId]);
    const receiptRef = `GW-${inv.invoice_no}-${count + 1}`;

    // Post accounting: Debit clearing account, Credit Receivable
    const journal = await accounting.postCustomerReceipt(conn, {
      branch_id: inv.branch_id,
      amount,
      payment_mode: payMode,
      reference_no: receiptRef,
      source_type: "GATEWAY_INVOICE_PAYMENT",
      source_id: gateway_payment_id,
      entry_date: new Date().toISOString().slice(0, 10),
      created_by: req.user?.full_name || req.user?.username || "Gateway",
      narration: `Razorpay payment for invoice ${inv.invoice_no}`,
    });

    // Map account for tender record
    const mapping = await accounting.getPaymentMapping(conn, payMode);

    // Insert invoice tender
    await conn.query(
      `INSERT INTO invoice_tenders (invoice_id, branch_id, payment_mode, amount, account_id, reference_no)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [invoiceId, inv.branch_id, payMode, amount, mapping.receipt_account_id, razorpay_payment_id]
    );

    // Update invoice paid_amount and balance_due
    const newPaid = accounting.money(Number(inv.paid_amount || 0) + amount);
    const newBalance = accounting.money(Math.max(0, Number(inv.grand_total || 0) - newPaid));
    const newStatus = newBalance <= 0 ? "Paid" : "Partial";
    await conn.query(
      "UPDATE invoices SET paid_amount = ?, balance_due = ?, status = ? WHERE id = ?",
      [newPaid, newBalance, newStatus, invoiceId]
    );

    // Update customer balance
    if (inv.customer_id) {
      const [[balRow]] = await conn.query(
        "SELECT (COALESCE(SUM(debit),0)-COALESCE(SUM(credit),0)) AS bal FROM customer_ledger WHERE customer_id = ?",
        [inv.customer_id]
      );
      const newCustBal = accounting.money(Math.max(0, Number(balRow.bal || 0) - amount));
      const today = new Date().toISOString().slice(0, 10);
      await conn.query(
        `INSERT INTO customer_ledger (customer_id, date, particulars, debit, credit, balance, reference)
         VALUES (?, ?, ?, 0, ?, ?, ?)`,
        [inv.customer_id, today, `Razorpay payment for ${inv.invoice_no}`, amount, newCustBal, receiptRef]
      );
      await conn.query("UPDATE customers SET balance_due = ? WHERE id = ?", [newCustBal, inv.customer_id]);
    }

    // Update gateway payment record
    await conn.query(
      `UPDATE payment_gateway_payments
       SET status = 'CAPTURED', provider_payment_id = ?, journal_id = ?, captured_at = NOW(), failure_reason = NULL
       WHERE id = ?`,
      [razorpay_payment_id, journal.id, gateway_payment_id]
    );

    // Audit log
    await conn.query(
      `INSERT INTO audit_logs (user_id, username, action, module, description, branch_id)
       VALUES (?, ?, 'GATEWAY_PAYMENT_VERIFIED', 'payments', ?, ?)`,
      [req.user?.id || null, req.user?.username || "Gateway", `Invoice ${inv.invoice_no} paid ₹${amount} via Razorpay ${razorpay_payment_id}`, inv.branch_id]
    );

    await conn.commit();
    res.json({
      success: true,
      message: "Payment verified and applied",
      data: {
        invoice_no: inv.invoice_no,
        amount_paid: amount,
        new_balance_due: newBalance,
        invoice_status: newStatus,
        journal_voucher: journal.voucher_no,
      },
    });
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ success: false, message: err.message });
  } finally {
    conn.release();
  }
}

// ── refundGatewayPayment: Initiate Razorpay refund ───────────────────────────
async function refundGatewayPayment(req, res) {
  const branchId = activeBranch(req);
  const conn = await db.getConnection();
  try {
    const { refund_amount, reason, refund_speed } = req.body;
    const gatewayPaymentId = req.params.id;

    if (!gatewayPaymentId) return res.status(400).json({ success: false, message: "gateway_payment_id is required" });

    await conn.beginTransaction();

    const [payRows] = await conn.query(
      "SELECT * FROM payment_gateway_payments WHERE id = ? FOR UPDATE",
      [gatewayPaymentId]
    );
    if (!payRows.length) {
      await conn.rollback();
      return res.status(404).json({ success: false, message: "Gateway payment not found" });
    }
    const pay = payRows[0];

    // Branch isolation
    if (req.user.role !== "admin" && Number(pay.branch_id) !== branchId) {
      await conn.rollback();
      return res.status(403).json({ success: false, message: "Cannot refund another branch payment" });
    }

    if (pay.status !== "CAPTURED") {
      await conn.rollback();
      return res.status(400).json({ success: false, message: `Cannot refund a payment in ${pay.status} state` });
    }
    if (!pay.provider_payment_id) {
      await conn.rollback();
      return res.status(400).json({ success: false, message: "Razorpay payment_id missing — cannot initiate refund" });
    }

    // Validate refund amount
    const capturedAmount = accounting.money(Number(pay.amount || 0));
    const alreadyRefunded = accounting.money(Number(pay.metadata ? (JSON.parse(pay.metadata || "{}").refunded_amount || 0) : 0));
    const refundable = accounting.money(capturedAmount - alreadyRefunded);
    const requestedRefund = accounting.money(Number(refund_amount || capturedAmount));

    if (requestedRefund <= 0 || requestedRefund > refundable + 0.01) {
      await conn.rollback();
      return res.status(400).json({ success: false, message: `Refund amount ${requestedRefund} exceeds refundable amount ${refundable}` });
    }

    // Call Razorpay Refund API
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keyId || !keySecret) {
      await conn.rollback();
      return res.status(503).json({ success: false, message: "Razorpay credentials not configured" });
    }

    const refundResponse = await fetch(`https://api.razorpay.com/v1/payments/${pay.provider_payment_id}/refund`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString("base64")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount: Math.round(requestedRefund * 100),  // paise
        speed: refund_speed || "normal",
        notes: { reason: reason || "Customer request", erp_payment_id: String(gatewayPaymentId) },
      }),
    });
    const refundData = await refundResponse.json();
    if (!refundResponse.ok) {
      await conn.rollback();
      return res.status(400).json({ success: false, message: refundData?.error?.description || "Razorpay refund failed" });
    }

    // Store refund info in metadata
    const existingMeta = JSON.parse(pay.metadata || "{}");
    existingMeta.refunded_amount = accounting.money((existingMeta.refunded_amount || 0) + requestedRefund);
    existingMeta.refunds = [...(existingMeta.refunds || []), {
      razorpay_refund_id: refundData.id,
      amount: requestedRefund,
      status: refundData.status,
      created_at: new Date().toISOString(),
    }];
    const newStatus = existingMeta.refunded_amount >= capturedAmount - 0.01 ? "REFUNDED" : "PARTIALLY_REFUNDED";

    await conn.query(
      "UPDATE payment_gateway_payments SET status = ?, metadata = ? WHERE id = ?",
      [newStatus, JSON.stringify(existingMeta), gatewayPaymentId]
    );

    // Post reversal accounting journal
    const refundRef = `REF-${refundData.id}`;
    await accounting.postSalesRefund(conn, {
      branch_id: pay.branch_id,
      amount: requestedRefund,
      refund_mode: pay.payment_mode || "UPI",
      reference_no: refundRef,
      source_id: gatewayPaymentId,
      entry_date: new Date().toISOString().slice(0, 10),
      created_by: req.user?.full_name || req.user?.username || "Admin",
      narration: `Razorpay refund ${refundData.id} for gateway payment ${gatewayPaymentId}`,
      cgst: 0, sgst: 0, igst: 0,
    });

    // Audit log
    await conn.query(
      `INSERT INTO audit_logs (user_id, username, action, module, description, branch_id)
       VALUES (?, ?, 'GATEWAY_REFUND_INITIATED', 'payments', ?, ?)`,
      [req.user?.id || null, req.user?.username || "Admin",
       `Razorpay refund ${refundData.id} initiated: ₹${requestedRefund} for payment ${pay.provider_payment_id}`,
       pay.branch_id]
    );

    await conn.commit();
    res.json({
      success: true,
      message: "Refund initiated with Razorpay",
      data: {
        razorpay_refund_id: refundData.id,
        refund_amount: requestedRefund,
        status: refundData.status,
        speed: refundData.speed_processed || refund_speed || "normal",
      },
    });
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ success: false, message: err.message });
  } finally {
    conn.release();
  }
}

// ── createEmiInstallmentOrder: Create Razorpay Order for one EMI installment ─
async function createEmiInstallmentOrder(req, res) {
  const branchId = activeBranch(req);
  const planParam = req.params.id;
  const { installment_id } = req.body;

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const [plans] = await conn.query(
      "SELECT * FROM emi_plans WHERE id = ? OR plan_id = ? OR plan_code = ? FOR UPDATE",
      [planParam, planParam, planParam]
    );
    if (!plans.length) {
      await conn.rollback();
      return res.status(404).json({ success: false, message: "EMI plan not found" });
    }
    const plan = plans[0];

    // Branch isolation
    if (req.user.role !== "admin" && Number(plan.branch_id || 1) !== branchId) {
      await conn.rollback();
      return res.status(403).json({ success: false, message: "Cannot access another branch EMI plan" });
    }

    if (plan.status !== "Active") {
      await conn.rollback();
      return res.status(400).json({ success: false, message: "EMI plan is not active" });
    }

    // Find the installment
    let installmentQuery = "SELECT * FROM emi_installments WHERE plan_id = ?";
    const installmentParams = [plan.id];
    if (installment_id) {
      installmentQuery += " AND id = ?";
      installmentParams.push(installment_id);
    } else {
      installmentQuery += " AND status IN ('Pending','Due','Partial','Failed','Overdue') ORDER BY installment_no ASC LIMIT 1";
    }
    installmentQuery += " FOR UPDATE";
    const [installments] = await conn.query(installmentQuery, installmentParams);

    if (!installments.length) {
      await conn.rollback();
      return res.status(400).json({ success: false, message: "No payable EMI installment found" });
    }
    const installment = installments[0];

    const outstanding = accounting.money(
      Number(installment.amount_due || installment.amount || 0) - Number(installment.amount_paid || 0)
    );
    if (outstanding <= 0) {
      await conn.rollback();
      return res.status(400).json({ success: false, message: "Installment has no outstanding balance" });
    }

    const provider = gateway.normalizeProvider(process.env.PAYMENT_GATEWAY_PROVIDER || "razorpay");
    const adapter = gateway.getAdapter(provider);
    if (!adapter.isConfigured) {
      await conn.rollback();
      return res.status(503).json({ success: false, message: "Payment gateway not configured" });
    }

    const idempotencyKey = `emi-online-${plan.id}-${installment.id}-${Date.now()}`;
    const order = await adapter.createPaymentOrder({
      amount: outstanding,
      currency: "INR",
      idempotency_key: idempotencyKey,
      plan,
      installment,
    });

    // Save gateway order
    await conn.query(
      `INSERT INTO payment_gateway_orders
       (provider, provider_order_id, customer_id, branch_id, emi_plan_id, emi_installment_id,
        amount, currency, status, payment_type, idempotency_key, metadata)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'INR', 'CREATED', 'EMI_ONLINE_PAYMENT', ?, ?)`,
      [provider, order.provider_order_id, plan.customer_id, plan.branch_id || 1,
       plan.id, installment.id, outstanding, idempotencyKey,
       JSON.stringify({ plan_id: plan.id, installment_no: installment.installment_no })]
    );

    const [payResult] = await conn.query(
      `INSERT INTO payment_gateway_payments
       (provider, provider_order_id, customer_id, branch_id, emi_plan_id, emi_installment_id,
        amount, currency, status, payment_type, payment_mode, idempotency_key)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'INR', 'CREATED', 'EMI_ONLINE_PAYMENT', 'UPI', ?)`,
      [provider, order.provider_order_id, plan.customer_id, plan.branch_id || 1,
       plan.id, installment.id, outstanding, idempotencyKey]
    );

    await conn.commit();

    res.json({
      success: true,
      data: {
        gateway_payment_id: payResult.insertId,
        provider_order_id: order.provider_order_id,
        amount_paise: Math.round(outstanding * 100),
        currency: "INR",
        installment_no: installment.installment_no,
        key_id: process.env.RAZORPAY_KEY_ID || "",
      },
    });
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ success: false, message: err.message });
  } finally {
    conn.release();
  }
}

// ── verifyEmiInstallmentPayment: Verify Razorpay payment for EMI installment ─
async function verifyEmiInstallmentPayment(req, res) {
  const branchId = activeBranch(req);
  const { gateway_payment_id, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

  if (!gateway_payment_id || !razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return res.status(400).json({ success: false, message: "Missing required verification fields" });
  }

  // Server-side signature verification
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keySecret) return res.status(503).json({ success: false, message: "Gateway secret not configured" });

  const crypto = require("crypto");
  const expected = crypto
    .createHmac("sha256", keySecret)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest("hex");

  if (expected !== razorpay_signature) {
    await db.query(
      "UPDATE payment_gateway_payments SET status = 'FAILED', failure_reason = 'Signature verification failed' WHERE id = ?",
      [gateway_payment_id]
    );
    return res.status(400).json({ success: false, message: "EMI payment signature verification failed" });
  }

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const [payRows] = await conn.query(
      "SELECT * FROM payment_gateway_payments WHERE id = ? FOR UPDATE",
      [gateway_payment_id]
    );
    if (!payRows.length) {
      await conn.rollback();
      return res.status(404).json({ success: false, message: "Gateway payment not found" });
    }
    const gatewayPay = payRows[0];

    if (req.user.role !== "admin" && Number(gatewayPay.branch_id) !== branchId) {
      await conn.rollback();
      return res.status(403).json({ success: false, message: "Cannot verify another branch payment" });
    }

    // Idempotency
    if (gatewayPay.status === "CAPTURED" && gatewayPay.journal_id) {
      await conn.rollback();
      return res.json({ success: true, duplicate: true, message: "EMI payment already processed" });
    }

    // Mark provider_payment_id on the record so webhook can find it
    await conn.query(
      "UPDATE payment_gateway_payments SET provider_payment_id = ?, status = 'AUTHORIZED' WHERE id = ?",
      [razorpay_payment_id, gateway_payment_id]
    );

    // Apply the successful payment through the autopay service (same as webhook path)
    const result = await autopay.applySuccessfulGatewayPayment(conn, {
      gateway_payment_id: gateway_payment_id,
      provider_payment_id: razorpay_payment_id,
      amount: accounting.money(gatewayPay.amount),
      payment_mode: "UPI",
      webhook_event_id: null,
      gateway_fee: 0,
      gateway_fee_tax: 0,
      captured_at: new Date(),
    });

    if (result.duplicate) {
      await conn.rollback();
      return res.json({ success: true, duplicate: true, message: "EMI payment already processed" });
    }

    await conn.commit();
    res.json({
      success: true,
      message: "EMI payment verified and applied",
      data: {
        payment_no: result.payment_no,
        amount_paid: accounting.money(gatewayPay.amount),
        remaining_plan_balance: result.remaining_plan_balance,
        installment_status: result.installment_status,
        journal_voucher: result.journal?.voucher_no,
      },
    });
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ success: false, message: err.message });
  } finally {
    conn.release();
  }
}
module.exports = {
  getConfig,
  setupEmiAutopay,
  pauseAutopay,
  cancelAutopay,
  resumeAutopay,
  retryEmiAutopay,
  webhook,
  listSettlements,
  createSettlement,
  createInvoiceOrder,
  verifyInvoicePayment,
  refundGatewayPayment,
  createEmiInstallmentOrder,
  verifyEmiInstallmentPayment,
};




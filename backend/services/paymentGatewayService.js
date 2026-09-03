const crypto = require("crypto");

function normalizeProvider(provider) {
  return String(provider || process.env.PAYMENT_GATEWAY_PROVIDER || "mock").trim().toLowerCase();
}

function rawPayload(rawBody, body) {
  if (Buffer.isBuffer(rawBody)) return rawBody.toString("utf8");
  if (typeof rawBody === "string" && rawBody) return rawBody;
  return JSON.stringify(body || {});
}

function hmacSha256(secret, value) {
  return crypto.createHmac("sha256", secret || "").update(value).digest("hex");
}

function getMockAdapter() {
  const secret = process.env.MOCK_GATEWAY_WEBHOOK_SECRET || process.env.PAYMENT_GATEWAY_WEBHOOK_SECRET || "ceritage_mock_secret";
  return {
    provider: "mock",
    environment: process.env.PAYMENT_GATEWAY_ENV || "TEST",
    isConfigured: true,
    async createCustomer(customer) {
      return {
        provider_customer_id: `mock_cust_${customer.id}`,
        status: "ACTIVE",
        metadata: { name: customer.full_name, phone: customer.phone },
      };
    },
    async createMandate({ customer, plan }) {
      return {
        provider_mandate_id: `mock_mandate_${plan.id}_${Date.now()}`,
        status: "ACTIVE",
        authorization_url: `${process.env.FRONTEND_URL || "http://localhost:5173"}/mock-mandate/${plan.id}`,
        metadata: { customer_id: customer.id, emi_plan_id: plan.id },
      };
    },
    async createPaymentOrder({ amount, currency, idempotency_key, plan, installment, mandate }) {
      return {
        provider_order_id: `mock_order_${idempotency_key}`,
        status: "CREATED",
        metadata: {
          emi_plan_id: plan?.id,
          emi_installment_id: installment?.id,
          mandate_id: mandate?.id,
        },
      };
    },
    verifyWebhookSignature({ headers, rawBody: bodyText }) {
      const signature = headers["x-mock-signature"] || headers["x-razorpay-signature"] || "";
      return signature === hmacSha256(secret, bodyText);
    },
    parseWebhook(body) {
      const payment = body?.payload?.payment || body?.payment || {};
      return {
        event_id: body.id || body.event_id || payment.webhook_event_id,
        event_type: body.event || body.event_type || payment.status,
        provider_payment_id: payment.id || payment.provider_payment_id,
        provider_order_id: payment.order_id || payment.provider_order_id,
        provider_mandate_id: payment.mandate_id || payment.provider_mandate_id,
        amount: Number(payment.amount || 0) / (Number(payment.amount || 0) > 1000000 ? 100 : 1),
        currency: payment.currency || "INR",
        status: String(payment.status || body.event || "").toUpperCase().includes("FAIL") ? "FAILED" : "CAPTURED",
        failure_reason: payment.error_description || payment.failure_reason || null,
        gateway_fee: Number(payment.fee || payment.gateway_fee || 0) / (Number(payment.fee || 0) > 100000 ? 100 : 1),
        gateway_fee_tax: Number(payment.tax || payment.gateway_fee_tax || 0) / (Number(payment.tax || 0) > 100000 ? 100 : 1),
      };
    },
    signTestWebhook(payload) {
      return hmacSha256(secret, JSON.stringify(payload));
    },
  };
}

function getRazorpayAdapter() {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
  return {
    provider: "razorpay",
    environment: process.env.PAYMENT_GATEWAY_ENV || "TEST",
    isConfigured: Boolean(keyId && keySecret),
    async createCustomer(customer) {
      if (!keyId || !keySecret) throw new Error("Razorpay credentials are not configured");
      const response = await fetch("https://api.razorpay.com/v1/customers", {
        method: "POST",
        headers: {
          Authorization: `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString("base64")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: customer.full_name,
          contact: customer.phone,
          email: customer.email,
          notes: { erp_customer_id: String(customer.id) },
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error?.description || "Razorpay customer creation failed");
      return { provider_customer_id: data.id, status: "ACTIVE", metadata: data };
    },
    async createMandate({ customer, plan }) {
      return {
        provider_mandate_id: null,
        status: "CREATED",
        authorization_url: null,
        metadata: {
          note: "Razorpay mandate authorization must be completed through the configured checkout/subscription flow.",
          customer_id: customer.id,
          emi_plan_id: plan.id,
        },
      };
    },
    async createPaymentOrder({ amount, currency, idempotency_key, plan, installment }) {
      if (!keyId || !keySecret) throw new Error("Razorpay credentials are not configured");
      const response = await fetch("https://api.razorpay.com/v1/orders", {
        method: "POST",
        headers: {
          Authorization: `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString("base64")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: Math.round(Number(amount) * 100),
          currency: currency || "INR",
          receipt: idempotency_key,
          notes: {
            emi_plan_id: String(plan?.id || ""),
            emi_installment_id: String(installment?.id || ""),
          },
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error?.description || "Razorpay order creation failed");
      return { provider_order_id: data.id, status: "CREATED", metadata: data };
    },
    verifyWebhookSignature({ headers, rawBody: bodyText }) {
      if (!webhookSecret) return false;
      const signature = headers["x-razorpay-signature"] || "";
      return signature === hmacSha256(webhookSecret, bodyText);
    },
    parseWebhook(body) {
      const payment = body?.payload?.payment?.entity || {};
      const eventType = body?.event || "";
      const captured = eventType === "payment.captured" || payment.status === "captured";
      const failed = eventType === "payment.failed" || payment.status === "failed";
      return {
        event_id: body?.id || payment?.id,
        event_type: eventType || payment.status,
        provider_payment_id: payment.id,
        provider_order_id: payment.order_id,
        provider_mandate_id: payment.token_id || payment.recurring_token || null,
        amount: Number(payment.amount || 0) / 100,
        currency: payment.currency || "INR",
        status: failed ? "FAILED" : captured ? "CAPTURED" : "AUTHORIZED",
        failure_reason: payment.error_description || null,
        gateway_fee: Number(payment.fee || 0) / 100,
        gateway_fee_tax: Number(payment.tax || 0) / 100,
      };
    },
  };
}

function getAdapter(provider) {
  const normalized = normalizeProvider(provider);
  if (normalized === "razorpay") return getRazorpayAdapter();
  return getMockAdapter();
}

function getPublicConfig(provider) {
  const adapter = getAdapter(provider);
  return {
    provider: adapter.provider,
    environment: adapter.environment,
    configured: adapter.isConfigured,
    webhook_configured: adapter.provider === "mock"
      ? true
      : Boolean(process.env.RAZORPAY_WEBHOOK_SECRET || process.env.PAYMENT_GATEWAY_WEBHOOK_SECRET),
  };
}

module.exports = {
  getAdapter,
  getPublicConfig,
  normalizeProvider,
  rawPayload,
};

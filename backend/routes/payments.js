const express = require("express");
const router = express.Router();
const { verifyToken, checkPermission } = require("../middleware/auth");
const c = require("../controllers/paymentsController");
const gateway = require("../controllers/paymentGatewayController");

router.post("/webhook/:provider", gateway.webhook);

router.use(verifyToken);

// KPIs & Mode Breakdowns
router.get("/kpis", checkPermission("payments"), c.getKpis);

// Payment Modes Configuration
router.get("/modes", checkPermission("payments"), c.getModes);
router.put("/modes/:id", checkPermission("payments", "edit"), c.updateMode);
router.get("/gateway/config", checkPermission("payments"), gateway.getConfig);

// Unified Transactions Feed
router.get("/transactions", checkPermission("payments"), c.getTransactions);

// Record Transactional Payment (Customer Dues / Supplier Settlement)
router.post("/record", checkPermission("payments", "edit"), c.recordPayment);

router.get("/settlements", checkPermission("accounting"), gateway.listSettlements);
router.post("/settlements", checkPermission("accounting", "edit"), gateway.createSettlement);


// Online payment via Razorpay Checkout
router.post("/gateway/create-order",   checkPermission("billing"),       gateway.createInvoiceOrder);
router.post("/gateway/verify-payment", checkPermission("billing"),       gateway.verifyInvoicePayment);
router.post("/gateway/refund/:id",     checkPermission("billing", "edit"), gateway.refundGatewayPayment);

// AutoPay mandate management (wired to EMI routes too)
router.post("/emi/:id/autopay/setup",  checkPermission("emi", "edit"), gateway.setupEmiAutopay);
router.post("/emi/:id/autopay/pause",  checkPermission("emi", "edit"), gateway.pauseAutopay);
router.post("/emi/:id/autopay/resume", checkPermission("emi", "edit"), gateway.resumeAutopay);
router.post("/emi/:id/autopay/cancel", checkPermission("emi", "edit"), gateway.cancelAutopay);
router.post("/emi/:id/autopay/retry",  checkPermission("emi", "edit"), gateway.retryEmiAutopay);

module.exports = router;


const express = require("express");
const router = express.Router();
const { verifyToken, checkPermission } = require("../middleware/auth");
const c = require("../controllers/emiController");
const gateway = require("../controllers/paymentGatewayController");

router.use(verifyToken);

// KPIs & Analytics
router.get("/kpis",           checkPermission("customers"), c.getKpis);

// Credit Sales & Reminders
router.get("/credit-sales",   checkPermission("customers"), c.getCreditSales);
router.get("/due-reminders",  checkPermission("customers"), c.getDueReminders);

// EMI Plans & Payment Collection
router.get("/plans",          checkPermission("customers"), c.getPlans);
router.get("/plans/:id",      checkPermission("customers"), c.getPlanById);
router.post("/plans",         checkPermission("customers", "edit"), c.createPlan);
router.post("/plans/:id/collect", checkPermission("customers", "edit"), c.collectPayment);
router.post("/plans/:id/autopay/setup", checkPermission("customers", "edit"), gateway.setupEmiAutopay);
router.post("/plans/:id/autopay/pause", checkPermission("customers", "edit"), gateway.pauseAutopay);
router.post("/plans/:id/autopay/resume", checkPermission("customers", "edit"), gateway.resumeAutopay);
router.post("/plans/:id/autopay/cancel", checkPermission("customers", "edit"), gateway.cancelAutopay);
router.post("/plans/:id/autopay/retry", checkPermission("customers", "edit"), gateway.retryEmiAutopay);

// Payment Receipts Log
router.get("/payments",       checkPermission("customers"), c.getPayments);

// Online EMI installment payment via Razorpay
router.post("/plans/:id/online-payment",        checkPermission("customers", "edit"), gateway.createEmiInstallmentOrder);
router.post("/plans/:id/online-payment/verify",  checkPermission("customers", "edit"), gateway.verifyEmiInstallmentPayment);

module.exports = router;


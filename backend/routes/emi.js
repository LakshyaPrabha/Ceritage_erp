const express = require("express");
const router = express.Router();
const { verifyToken, checkPermission } = require("../middleware/auth");
const c = require("../controllers/emiController");

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

// Payment Receipts Log
router.get("/payments",       checkPermission("customers"), c.getPayments);

module.exports = router;

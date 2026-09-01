const express = require("express");
const router = express.Router();
const { verifyToken, checkPermission } = require("../middleware/auth");
const c = require("../controllers/paymentsController");

router.use(verifyToken);

// KPIs & Mode Breakdowns
router.get("/kpis", checkPermission("payments"), c.getKpis);

// Payment Modes Configuration
router.get("/modes", checkPermission("payments"), c.getModes);
router.put("/modes/:id", checkPermission("payments", "edit"), c.updateMode);

// Unified Transactions Feed
router.get("/transactions", checkPermission("payments"), c.getTransactions);

// Record Transactional Payment (Customer Dues / Supplier Settlement)
router.post("/record", checkPermission("payments", "edit"), c.recordPayment);

module.exports = router;

const express = require("express");
const router = express.Router();
const { verifyToken, checkPermission } = require("../middleware/auth");
const c = require("../controllers/aiController");

router.use(verifyToken);

// ── AI Predictive Engine Routes ──
router.get("/demand-forecast",   c.getDemandForecast);
router.get("/dead-stock",        c.getDeadStockVelocity);
router.get("/customer-segments", c.getCustomerSegments);
router.get("/gold-trend",        c.getGoldTrendAdvisor);

module.exports = router;

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
router.post("/chat",             c.chatQuery);
router.get("/smart-search",      c.smartSearch);
router.get("/fraud-radar",       c.getFraudRadar);
router.get("/recommendations",   c.getProductRecommendations);

// ── AI Configuration & LLM Connection Management ──
router.get("/status",            c.getAiStatus);
router.post("/config",           c.saveAiConfig);
router.post("/test-connection",  c.testConnection);

module.exports = router;



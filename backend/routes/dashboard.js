const express = require("express");
const router = express.Router();
const { verifyToken } = require("../middleware/auth");
const c = require("../controllers/dashboardController");

router.use(verifyToken);
router.get("/kpis",         c.getKpis);
router.get("/recent-bills", c.getRecentBills);
router.get("/alerts",       c.getAlerts);

module.exports = router;

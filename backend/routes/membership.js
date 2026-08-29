const express = require("express");
const router = express.Router();
const { verifyToken, checkPermission } = require("../middleware/auth");
const c = require("../controllers/membershipController");

router.use(verifyToken);

// Plans & Analytics
router.get("/kpis",                 checkPermission("customers"), c.getMembershipKpis);
router.get("/plans",                checkPermission("customers"), c.getPlans);
router.post("/plans",               checkPermission("customers", "edit"), c.savePlan);

// Member Subscriptions Directory
router.get("/members",              checkPermission("customers"), c.getActiveMembers);

// Auto-Tier Evaluation
router.post("/evaluate-tier-upgrades", checkPermission("customers", "edit"), c.evaluateTierUpgrades);

module.exports = router;

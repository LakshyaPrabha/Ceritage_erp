const express = require("express");
const router = express.Router();
const { verifyToken, checkPermission } = require("../middleware/auth");
const c = require("../controllers/metalRatesController");

router.use(verifyToken);
router.get("/current",     c.getCurrent);
router.get("/history",     c.getHistory);
router.post("/refresh",    checkPermission("rates", "edit"), c.refreshRates);
router.post("/adjustments", checkPermission("rates", "edit"), c.updateAdjustments);

module.exports = router;

const express = require("express");
const router = express.Router();
const { verifyToken, checkPermission } = require("../middleware/auth");
const c = require("../controllers/ratesController");

router.use(verifyToken);
router.get("/current", c.getCurrent);
router.get("/history", c.getHistory);
router.post("/",       checkPermission("rates", "edit"), c.updateRates);
router.post("/sync",   checkPermission("rates", "edit"), c.syncMarketRates);

module.exports = router;

const express = require("express");
const router  = express.Router();
const { verifyToken, checkPermission } = require("../middleware/auth");
const c = require("../controllers/inventoryController");

router.use(verifyToken);

router.get("/kpis",        checkPermission("products"),         c.getKpis);
router.get("/live",        checkPermission("products"),         c.getLiveStock);
router.get("/low-stock",   checkPermission("products"),         c.getLowStock);
router.get("/damaged",     checkPermission("products"),         c.getDamagedStock);
router.get("/adjustments", checkPermission("products"),         c.getAdjustments);
router.post("/adjustments",checkPermission("products","edit"),  c.createAdjustment);
router.get("/movement",    checkPermission("products"),         c.getMovementLog);

module.exports = router;

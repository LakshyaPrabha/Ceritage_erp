const express = require("express");
const router = express.Router();
const { verifyToken, checkPermission } = require("../middleware/auth");
const c = require("../controllers/reportsController");

router.use(verifyToken);

router.get("/kpis",            checkPermission("reports"), c.getExecutiveKpis);
router.get("/sales",           checkPermission("reports"), c.getSalesReport);
router.get("/purchase",        checkPermission("reports"), c.getPurchaseReport);
router.get("/inventory",       checkPermission("reports"), c.getInventoryReport);
router.get("/customers",       checkPermission("reports"), c.getCustomerReport);
router.get("/suppliers",       checkPermission("reports"), c.getSupplierReport);
router.get("/profit",          checkPermission("reports"), c.getProfitReport);
router.get("/gst",             checkPermission("reports"), c.getGstReport);
router.post("/seed-demo-data", checkPermission("reports", "edit"), c.seedDemoData);
router.post("/clear-demo-data",checkPermission("reports", "delete"), c.clearDemoData);

module.exports = router;

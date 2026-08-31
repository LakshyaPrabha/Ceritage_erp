const express = require("express");
const router  = express.Router();
const { verifyToken, checkPermission } = require("../middleware/auth");
const c = require("../controllers/salesController");

router.use(verifyToken);

// KPIs & stats
router.get("/kpis",checkPermission("sales"),c.getKpis);

// Sales list + single + create
router.get("/",checkPermission("sales"),c.getAll);
router.get("/:id",checkPermission("sales"),c.getById);
router.post("/",checkPermission("sales","edit"),c.createSale);

// Sales returns
router.get("/returns/list",checkPermission("sales"),c.getSalesReturns);
router.post("/returns",checkPermission("sales","edit"),c.createSalesReturn);

// Delivery challans
router.get("/challans",checkPermission("sales"),c.getChallans);
router.post("/challans",checkPermission("sales","edit"), c.createChallan);
router.put("/challans/:id/status",checkPermission("sales","edit"), c.updateChallanStatus);

// Pending & advance orders
router.get("/orders/pending",checkPermission("sales"),c.getPendingOrders);
router.get("/orders/advance",checkPermission("sales"),c.getAdvanceOrders);

module.exports = router;

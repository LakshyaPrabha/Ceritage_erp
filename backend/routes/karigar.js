const express = require("express");
const router = express.Router();
const { verifyToken, checkPermission } = require("../middleware/auth");
const c = require("../controllers/karigarController");

router.use(verifyToken);
router.get("/kpis",           checkPermission("karigar"), c.getKpis);
router.get("/work-orders",    checkPermission("karigar"), c.getWorkOrders);
router.post("/work-orders",   checkPermission("karigar","edit"), c.createWorkOrder);
router.post("/gold-issue",    checkPermission("karigar","edit"), c.issueGold);
router.post("/gold-receive",  checkPermission("karigar","edit"), c.receiveGold);
router.post("/payment",       checkPermission("karigar","edit"), c.makePayment);
router.get("/",               checkPermission("karigar"), c.getAll);
router.post("/",              checkPermission("karigar","edit"), c.create);

module.exports = router;

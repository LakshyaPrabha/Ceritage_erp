const express = require("express");
const router = express.Router();
const { verifyToken, checkPermission } = require("../middleware/auth");
const c = require("../controllers/karigarController");

router.use(verifyToken);
router.get("/kpis",           checkPermission("karigar"), c.getKpis);
router.get("/work-orders",    checkPermission("karigar"), c.getWorkOrders);
router.post("/work-orders",   checkPermission("karigar","edit"), c.createWorkOrder);
router.get("/issues",         checkPermission("karigar"), c.getIssues);
router.post("/gold-issue",    checkPermission("karigar","edit"), c.issueGold);
router.get("/receives",       checkPermission("karigar"), c.getReceives);
router.post("/gold-receive",  checkPermission("karigar","edit"), c.receiveGold);
router.get("/payments",       checkPermission("karigar"), c.getPayments);
router.post("/payment",       checkPermission("karigar","edit"), c.makePayment);
router.get("/",               checkPermission("karigar"), c.getAll);
router.post("/",              checkPermission("karigar","edit"), c.create);

module.exports = router;

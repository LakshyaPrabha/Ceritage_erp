const express = require("express");
const router  = express.Router();
const { verifyToken, checkPermission } = require("../middleware/auth");
const c = require("../controllers/advanceController");

router.use(verifyToken);

router.get("/kpis",                 checkPermission("products"),        c.getKpis);
router.get("/",                     checkPermission("products"),        c.getAll);
router.get("/:id",                  checkPermission("products"),        c.getById);
router.post("/",                    checkPermission("products","edit"), c.create);
router.post("/:id/add-payment",     checkPermission("products","edit"), c.addAdvancePayment);
router.put("/:id/redeem",           checkPermission("products","edit"), c.redeemLock);
router.put("/:id/extend-validity",  checkPermission("products","edit"), c.extendValidity);
router.put("/:id/status",           checkPermission("products","edit"), c.updateStatus);
router.delete("/:id",               checkPermission("products","delete"), c.deleteLock);

module.exports = router;

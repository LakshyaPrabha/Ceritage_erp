const express = require("express");
const router  = express.Router();
const { verifyToken, checkPermission } = require("../middleware/auth");
const c = require("../controllers/suppliersController");

router.use(verifyToken);

router.get("/kpis",        checkPermission("suppliers"),         c.getKpis);
router.get("/payments",    checkPermission("suppliers"),         c.getPayments);
router.post("/payment",    checkPermission("suppliers","edit"),  c.makePayment);
router.get("/",            checkPermission("suppliers"),         c.getAll);
router.post("/",           checkPermission("suppliers","edit"),  c.create);
router.put("/:id",         checkPermission("suppliers","edit"),  c.update);
router.delete("/:id",      checkPermission("suppliers","delete"),c.remove);
router.get("/:id/ledger",  checkPermission("suppliers"),         c.getLedger);

module.exports = router;

const express = require("express");
const router = express.Router();
const { verifyToken, checkPermission } = require("../middleware/auth");
const c = require("../controllers/jangadController");

router.use(verifyToken);

// ── Jangad & Approval Management Routes ──
router.get("/kpis",                 checkPermission("jangad"),         c.getKpis);
router.get("/",                     checkPermission("jangad"),         c.getAll);
router.get("/stock-isolated",        checkPermission("jangad"),         c.getStockIsolated);
router.get("/:id",                  checkPermission("jangad"),         c.getById);
router.post("/",                    checkPermission("jangad", "edit"), c.create);
router.post("/:id/return",          checkPermission("jangad", "edit"), c.returnItems);
router.post("/:id/convert-to-invoice", checkPermission("jangad", "edit"), c.convertToInvoice);

module.exports = router;

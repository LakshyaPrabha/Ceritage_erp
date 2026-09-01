const express = require("express");
const router = express.Router();
const { verifyToken, checkPermission } = require("../middleware/auth");
const c = require("../controllers/rfidController");

router.use(verifyToken);

// ── KPIs & Analytics ───────────────────────────────────────────
router.get("/kpis",                 checkPermission("products"), c.getKpis);

// ── Trays Management & Transfers ───────────────────────────────
router.get("/trays",                checkPermission("products"), c.getTrays);
router.post("/trays",               checkPermission("products", "edit"), c.createTray);
router.post("/trays/transfer-location", checkPermission("products", "edit"), c.transferTraysLocation);
router.get("/trays/:id",            checkPermission("products"), c.getTrayById);
router.put("/trays/:id",            checkPermission("products", "edit"), c.updateTray);
router.delete("/trays/:id",         checkPermission("products", "delete"), c.deleteTray);
router.post("/trays/:id/assign",    checkPermission("products", "edit"), c.assignProductsToTray);
router.post("/trays/:id/remove",    checkPermission("products", "edit"), c.removeProductFromTray);

// ── RFID Tag Encoding & Handheld Gun Lookup ────────────────────
router.post("/pair-tag",            checkPermission("products", "edit"), c.pairRfidTag);
router.get("/lookup/:query",        checkPermission("products"), c.lookupTagOrSku);

// ── Real-Time RFID Audit & Reconciliation Engine ───────────────
router.post("/audit/process-scan",  checkPermission("products", "edit"), c.processAuditScan);
router.get("/audit/history",        checkPermission("products"), c.getAuditHistory);
router.get("/audit/:id",            checkPermission("products"), c.getAuditSessionDetails);

module.exports = router;

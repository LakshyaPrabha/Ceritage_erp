const express = require("express");
const router = express.Router();
const { verifyToken, checkPermission } = require("../middleware/auth");
const c = require("../controllers/purchaseController");

router.use(verifyToken);

// KPIs & Reports
router.get("/kpis",                       checkPermission("purchase"), c.getKpis);
router.get("/outstanding",                checkPermission("purchase"), c.getOutstanding);

// GRN Routes
router.get("/grn",                        checkPermission("purchase"), c.getGRNs);
router.get("/grns",                       checkPermission("purchase"), c.getGRNs);
router.get("/grn/:id",                    checkPermission("purchase"), c.getGRNById);
router.get("/grns/:id",                   checkPermission("purchase"), c.getGRNById);
router.post("/grn",                       checkPermission("purchase", "edit"), c.createGRN);
router.post("/grns",                      checkPermission("purchase", "edit"), c.createGRN);

// Purchase Orders Routes
router.get("/orders",                     checkPermission("purchase"), c.getAll);
router.post("/orders",                    checkPermission("purchase", "edit"), c.create);
router.get("/orders/:id",                 checkPermission("purchase"), c.getById);
router.patch("/orders/:id/status",        checkPermission("purchase", "edit"), c.updateStatus);
router.get("/orders/:id/pending-items",   checkPermission("purchase"), c.getPendingItems);

// Base PO CRUD (backward-compatible)
router.get("/",                           checkPermission("purchase"), c.getAll);
router.post("/",                          checkPermission("purchase", "edit"), c.create);
router.get("/:id",                        checkPermission("purchase"), c.getById);

// Old Metal Scrap Purchases
router.get("/old-metal",                  checkPermission("purchase"), c.getOldMetalPurchases);
router.post("/old-metal",                 checkPermission("purchase", "edit"), c.createOldMetalPurchase);

module.exports = router;

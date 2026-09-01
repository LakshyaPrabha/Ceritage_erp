const express = require("express");
const router = express.Router();
const { verifyToken, checkPermission } = require("../middleware/auth");
const c = require("../controllers/purchaseController");

router.use(verifyToken);

// KPIs
router.get("/kpis", checkPermission("purchase"), c.getKpis);

// Suppliers dropdown
router.get("/suppliers-list", checkPermission("purchase"), c.getSuppliersList);

// GRNs
router.get("/grns/list", checkPermission("purchase"), c.getGRNs);
router.post("/grns", checkPermission("purchase", "edit"), c.createGRN);

// Purchase Returns
router.get("/returns/list", checkPermission("purchase"), c.getPurchaseReturns);
router.post("/returns", checkPermission("purchase", "edit"), c.createPurchaseReturn);

// Supplier Payments
router.get("/supplier-payments/list", checkPermission("purchase"), c.getSupplierPayments);
router.post("/supplier-payments", checkPermission("purchase", "edit"), c.createSupplierPayment);

// Supplier Ledger
router.get("/supplier-ledger/:supplier_id", checkPermission("purchase"), c.getSupplierLedger);

// Old Metal Purchases
router.get("/old-metal", checkPermission("purchase"), c.getOldMetalPurchases);
router.post("/old-metal", checkPermission("purchase", "edit"), c.createOldMetalPurchase);

// Purchase Orders (Collections & Parametrized)
router.get("/", checkPermission("purchase"), c.getAll);
router.post("/", checkPermission("purchase", "edit"), c.create);
router.get("/:id", checkPermission("purchase"), c.getById);
router.put("/:id", checkPermission("purchase", "edit"), c.updatePO);

module.exports = router;

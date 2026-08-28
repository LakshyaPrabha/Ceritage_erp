const express = require("express");
const router  = express.Router();
const { verifyToken, checkPermission } = require("../middleware/auth");
const c = require("../controllers/customersController");

router.use(verifyToken);

// ── Aggregates & lists (no :id) ────────────────────────────
router.get("/kpis",             checkPermission("customers"),        c.getKpis);
router.get("/search",           checkPermission("customers"),        c.search);
router.get("/reminders",        checkPermission("customers"),        c.getReminders);
router.get("/due-tracking",     checkPermission("customers"),        c.getDueTracking);
router.get("/credit-register",  checkPermission("customers"),        c.getCreditRegister);
router.get("/wallet-summary",   checkPermission("customers"),        c.getWalletSummary);

// ── CRUD ───────────────────────────────────────────────────
router.get("/",    checkPermission("customers"),          c.getAll);
router.post("/",   checkPermission("customers", "edit"),  c.create);
router.get("/:id", checkPermission("customers"),          c.getById);
router.put("/:id", checkPermission("customers", "edit"),  c.update);
router.delete("/:id", checkPermission("customers", "delete"), c.remove);

// ── Sub-resources ──────────────────────────────────────────
router.get("/:id/ledger",           checkPermission("customers"),       c.getLedger);
router.get("/:id/purchase-history", checkPermission("customers"),       c.getPurchaseHistory);
router.get("/:id/wallet",           checkPermission("customers"),       c.getWallet);
router.post("/:id/wallet/credit",   checkPermission("customers","edit"), c.walletCredit);
router.post("/:id/loyalty/redeem",  checkPermission("customers","edit"), c.redeemPoints);
router.put("/:id/kyc",              checkPermission("customers","edit"), c.updateKyc);

module.exports = router;

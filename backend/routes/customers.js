const express = require("express");
const router  = express.Router();
const { verifyToken, checkPermission } = require("../middleware/auth");
const c = require("../controllers/customersController");
const mem = require("../controllers/membershipController");
const occ = require("../controllers/occasionController");

router.use(verifyToken);

// Reports & sub-aggregations
router.get("/kpis",                 checkPermission("customers"),           c.getKpis);
router.get("/reports/dues",         checkPermission("customers"),           c.getDuesReport);
router.get("/reports/wallet",       checkPermission("customers"),           c.getWalletReport);
router.get("/reports/credit",       checkPermission("customers"),           c.getCreditReport);
router.get("/reports/kyc",          checkPermission("customers"),           c.getKycReport);

// Occasions, Birthdays & Anniversaries
router.get("/occasions",            checkPermission("customers"),           occ.getOccasions);
router.get("/occasions/kpis",       checkPermission("customers"),           occ.getOccasionKpis);
router.get("/reminders/upcoming",   checkPermission("customers"),           occ.getUpcomingReminders);
router.post("/:id/occasions/:occasionType/acknowledge", checkPermission("customers", "edit"), occ.acknowledgeOccasion);
router.post("/:id/occasions/greeting", checkPermission("customers", "edit"), occ.generateGreetingCard);

// Core CRUD & Lifecycle
router.get("/",                     checkPermission("customers"),           c.getAll);
router.get("/:id",                  checkPermission("customers"),           c.getById);
router.post("/",                    checkPermission("customers", "edit"),   c.create);
router.put("/:id",                  checkPermission("customers", "edit"),   c.update);
router.delete("/:id",               checkPermission("customers", "delete"), c.remove);
router.post("/:id/restore",         checkPermission("customers", "edit"),   c.restore);

// Customer 360 & Activity Stream
router.get("/:id/360",              checkPermission("customers"),           c.getCustomer360);
router.get("/:id/activity",         checkPermission("customers"),           c.getActivityTimeline);

// Customer Notes & CRM
router.get("/:id/notes",            checkPermission("customers"),           c.getNotes);
router.post("/:id/notes",           checkPermission("customers", "edit"),   c.createNote);
router.put("/:id/notes/:noteId/pin",checkPermission("customers", "edit"),   c.togglePinNote);
router.delete("/:id/notes/:noteId", checkPermission("customers", "delete"), c.deleteNote);

// Membership Plans & Subscriptions
router.get("/:id/membership",       checkPermission("customers"),           mem.getCustomerMembership);
router.post("/:id/membership/enroll", checkPermission("customers", "edit"), mem.enrollCustomer);
router.post("/:id/membership/renew",  checkPermission("customers", "edit"), mem.renewMembership);

// Purchases & Returns Join
router.get("/:id/purchases-and-returns", checkPermission("customers"),      c.getPurchasesAndReturns);
router.get("/:id/purchase-history", checkPermission("customers"),           c.getPurchaseHistory);
router.get("/:id/returns",          checkPermission("customers"),           c.getCustomerReturns);

// Financial Ledger & Payments
router.get("/:id/ledger",           checkPermission("customers"),           c.getLedger);
router.post("/:id/payments",        checkPermission("customers", "edit"),   c.recordPayment);

// Store Wallet
router.get("/:id/wallet",           checkPermission("customers"),           c.getWallet);
router.post("/:id/wallet/credit",   checkPermission("customers", "edit"),   c.addWalletCredit);
router.post("/:id/wallet/adjust",   checkPermission("customers", "edit"),   c.adjustWallet);

// Loyalty Points
router.get("/:id/loyalty",          checkPermission("customers"),           c.getLoyalty);
router.post("/:id/loyalty/adjust",  checkPermission("customers", "edit"),   c.adjustLoyalty);

module.exports = router;

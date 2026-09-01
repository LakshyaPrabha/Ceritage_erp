const express = require("express");
const router = express.Router();
const { verifyToken, checkPermission } = require("../middleware/auth");
const c = require("../controllers/accountingController");

router.use(verifyToken);

// Financial Summaries & Reports
router.get("/summary",         checkPermission("analytics"), c.getSummary);
router.get("/cashbook",        checkPermission("analytics"), c.getCashBook);
router.get("/bankbook",        checkPermission("analytics"), c.getBankBook);
router.get("/trial-balance",   checkPermission("analytics"), c.getTrialBalance);
router.get("/pl",              checkPermission("analytics"), c.getProfitAndLoss);
router.get("/balance-sheet",   checkPermission("analytics"), c.getBalanceSheet);

// Chart of Accounts & Journals
router.get("/accounts",        checkPermission("analytics"), c.getAccounts);
router.get("/journal",         checkPermission("analytics"), c.getJournalEntries);
router.post("/vouchers",       checkPermission("analytics", "edit"), c.createVoucher);

module.exports = router;

const express = require("express");
const router  = express.Router();
const { verifyToken, checkPermission } = require("../middleware/auth");
const c = require("../controllers/billingController");

router.use(verifyToken);

// ── Aggregates (must be before /:id) ─────────────────────────────────────────
router.get("/kpis",           checkPermission("billing"),         c.getKpis);
router.get("/notes",          checkPermission("billing"),         c.getCreditDebitNotes);
router.post("/notes",         checkPermission("billing","edit"),  c.createCreditDebitNote);
router.get("/returns",        checkPermission("billing"),         c.getReturns);
router.post("/returns",       checkPermission("billing","edit"),  c.createReturn);

// ── Invoices CRUD ─────────────────────────────────────────────────────────────
router.get("/",               checkPermission("billing"),         c.getAll);
router.post("/",              checkPermission("billing","edit"),  c.create);
router.get("/:id",            checkPermission("billing"),         c.getById);

module.exports = router;

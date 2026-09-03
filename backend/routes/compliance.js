const express = require("express");
const router = express.Router();
const { verifyToken, checkPermission } = require("../middleware/auth");
const c = require("../controllers/complianceController");

router.use(verifyToken);

// ── TCS & PMLA Compliance Routes ──
router.get("/kpis",         checkPermission("compliance"),         c.getKpis);
router.get("/logs",         checkPermission("compliance"),         c.getAllLogs);
router.post("/record-tcs",  checkPermission("compliance", "edit"), c.recordTcsLog);
router.get("/form60",       checkPermission("compliance"),         c.getForm60Declarations);
router.post("/form60",      checkPermission("compliance", "edit"), c.createForm60);
router.get("/form27eq",     checkPermission("compliance"),         c.getForm27Eq);

module.exports = router;

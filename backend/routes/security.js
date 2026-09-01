const express = require("express");
const router = express.Router();
const { verifyToken, checkPermission } = require("../middleware/auth");
const c = require("../controllers/securityController");

router.use(verifyToken);

router.get("/overview",    checkPermission("security"),         c.getOverview);
router.get("/settings",    checkPermission("security"),         c.getSettings);
router.put("/settings",    checkPermission("security", "edit"), c.updateSettings);
router.get("/audit-logs",  checkPermission("security"),         c.getAuditLogs);
router.get("/sessions",    checkPermission("security"),         c.getSessions);
router.delete("/sessions/:id", checkPermission("security", "edit"), c.revokeSession);
router.post("/backup",     checkPermission("security", "edit"), c.generateBackup);

module.exports = router;

const express = require("express");
const router = express.Router();
const { verifyToken, checkPermission } = require("../middleware/auth");
const c = require("../controllers/gstController");

router.use(verifyToken);

// GST Summary & Returns
router.get("/summary",          checkPermission("gst"), c.getSummary);
router.get("/gstr-1",           checkPermission("gst"), c.getGstr1);
router.get("/gstr-3b",          checkPermission("gst"), c.getGstr3b);
router.get("/hsn-summary",      checkPermission("gst"), c.getHsnSummary);
router.post("/hsn-codes",       checkPermission("gst", "edit"), c.addHsnCode);
router.get("/filing-calendar",  checkPermission("gst"), c.getFilingCalendar);
router.post("/calculate",       checkPermission("gst"), c.calculateTax);

module.exports = router;

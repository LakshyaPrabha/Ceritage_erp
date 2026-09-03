const express = require("express");
const router = express.Router();
const { verifyToken, checkPermission } = require("../middleware/auth");
const c = require("../controllers/gstController");

router.use(verifyToken);

// ── Complete GST Reporting & Control Suite (Untitled document (8).pdf) ──
router.post("/validate-complete",       checkPermission("gst"),         c.executeCompleteValidation);
router.get("/errors",                   checkPermission("gst"),         c.getGstErrors);
router.post("/recalculate-invoice/:id", checkPermission("gst", "edit"), c.recalculateInvoiceGst);
router.get("/gstr2b",                   checkPermission("gst"),         c.getGstr2b);
router.get("/tax-master",               checkPermission("gst"),         c.getTaxMaster);
router.post("/tax-master",              checkPermission("gst", "edit"), c.createTaxRule);
router.get("/returns-working",          checkPermission("gst"),         c.getReturnsWorking);
router.post("/close-period",            checkPermission("gst", "edit"), c.closeGstPeriod);
router.post("/ca-review-pack",          checkPermission("gst"),         c.generateCaReviewPack);

module.exports = router;

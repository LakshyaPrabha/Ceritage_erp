const express = require("express");
const router = express.Router();
const { verifyToken, checkPermission } = require("../middleware/auth");
const c = require("../controllers/purchaseController");

router.use(verifyToken);
router.get("/kpis",         checkPermission("purchase"), c.getKpis);
router.get("/grns",         checkPermission("purchase"), c.getGRNs);
router.post("/grns",        checkPermission("purchase","edit"), c.createGRN);
router.get("/old-metal",    checkPermission("purchase"), c.getOldMetalPurchases);
router.post("/old-metal",   checkPermission("purchase","edit"), c.createOldMetalPurchase);
router.get("/",             checkPermission("purchase"), c.getAll);
router.get("/:id",          checkPermission("purchase"), c.getById);
router.post("/",            checkPermission("purchase","edit"), c.create);

module.exports = router;

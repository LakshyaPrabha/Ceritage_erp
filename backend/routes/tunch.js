const express = require("express");
const router = express.Router();
const { verifyToken, checkPermission } = require("../middleware/auth");
const c = require("../controllers/tunchController");

router.use(verifyToken);

// Metal Summaries & Movements
router.get("/summary",           checkPermission("products"), c.getSummary);
router.get("/ledger",            checkPermission("products"), c.getLedger);
router.get("/karigar-balances",  checkPermission("products"), c.getKarigarBalances);
router.post("/record",           checkPermission("products", "edit"), c.recordMovement);

module.exports = router;

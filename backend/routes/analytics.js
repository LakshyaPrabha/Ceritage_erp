const express = require("express");
const router = express.Router();
const { verifyToken, checkPermission } = require("../middleware/auth");
const c = require("../controllers/analyticsController");

router.use(verifyToken);
router.get("/summary", checkPermission("analytics"), c.getSummary);
router.get("/:tab", checkPermission("analytics"), c.getTable);

module.exports = router;

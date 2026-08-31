const express = require("express");
const router  = express.Router();
const { verifyToken, checkPermission } = require("../middleware/auth");
const c = require("../controllers/hallmarkController");

router.use(verifyToken);

router.get("/kpis",         checkPermission("products"),        c.getKpis);
router.get("/list",         checkPermission("products"),        c.getHallmarkList);
router.get("/tracking",     checkPermission("products"),        c.getHuidTracking);
router.get("/verify/:huid", checkPermission("products"),        c.verifyHuid);
router.post("/register",    checkPermission("products","edit"), c.registerHuid);

module.exports = router;

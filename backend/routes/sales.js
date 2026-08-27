const express = require("express");
const router = express.Router();
const { verifyToken, checkPermission } = require("../middleware/auth");
const c = require("../controllers/salesController");

router.use(verifyToken);
router.get("/kpis",     checkPermission("sales"), c.getKpis);
router.get("/challans", checkPermission("sales"), c.getChallans);
router.post("/challans",checkPermission("sales","edit"), c.createChallan);
router.get("/",         checkPermission("sales"), c.getAll);

module.exports = router;

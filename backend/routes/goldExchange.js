const express = require("express");
const router = express.Router();
const { verifyToken, checkPermission } = require("../middleware/auth");
const c = require("../controllers/goldExchangeController");

router.use(verifyToken);
router.get("/kpis", checkPermission("gold-exchange"), c.getKpis);
router.get("/",     checkPermission("gold-exchange"), c.getAll);
router.post("/",    checkPermission("gold-exchange","edit"), c.create);

module.exports = router;

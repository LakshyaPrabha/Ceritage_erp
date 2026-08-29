const express = require("express");
const router = express.Router();
const { verifyToken, checkPermission } = require("../middleware/auth");
const c = require("../controllers/ordersController");

router.use(verifyToken);
router.get("/kpis",          checkPermission("orders"), c.getKpis);
router.get("/",              checkPermission("orders"), c.getAll);
router.post("/",             checkPermission("orders","edit"), c.create);
router.patch("/:id/status",  checkPermission("orders","edit"), c.updateStatus);

module.exports = router;

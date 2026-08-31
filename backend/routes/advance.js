const express = require("express");
const router  = express.Router();
const { verifyToken, checkPermission } = require("../middleware/auth");
const c = require("../controllers/advanceController");

router.use(verifyToken);

router.get("/kpis",     checkPermission("products"),        c.getKpis);
router.get("/",         checkPermission("products"),        c.getAll);
router.post("/",        checkPermission("products","edit"), c.create);
router.put("/:id",      checkPermission("products","edit"), c.updateStatus);

module.exports = router;

const express = require("express");
const router = express.Router();
const { verifyToken, checkPermission } = require("../middleware/auth");
const c = require("../controllers/productsController");

router.use(verifyToken);
router.get("/kpis",    checkPermission("products"), c.getKpis);
router.get("/stones",  checkPermission("products"), c.getStones);
router.post("/stones", checkPermission("products","edit"), c.createStone);
router.get("/",        checkPermission("products"), c.getAll);
router.get("/:id",     checkPermission("products"), c.getById);
router.post("/",       checkPermission("products","edit"), c.create);
router.put("/:id",     checkPermission("products","edit"), c.update);
router.delete("/:id",  checkPermission("products","delete"), c.remove);

module.exports = router;

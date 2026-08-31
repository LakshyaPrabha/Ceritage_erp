const express = require("express");
const router  = express.Router();
const { verifyToken, checkPermission } = require("../middleware/auth");
const c = require("../controllers/repairController");

router.use(verifyToken);

router.get("/kpis",checkPermission("repair"),         c.getKpis);
router.get("/",checkPermission("repair"),         c.getAll);
router.post("/",checkPermission("repair","edit"),  c.create);
router.get("/:id",checkPermission("repair"),         c.getById);
router.put("/:id",checkPermission("repair","edit"),  c.update);
router.patch("/:id/status",checkPermission("repair","edit"),  c.updateStatus);
router.delete("/:id",checkPermission("repair","delete"),c.remove);

module.exports = router;

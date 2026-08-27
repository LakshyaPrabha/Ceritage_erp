const express = require("express");
const router = express.Router();
const { verifyToken, checkPermission } = require("../middleware/auth");
const c = require("../controllers/customersController");

router.use(verifyToken);

router.get("/kpis",              checkPermission("customers"),       c.getKpis);
router.get("/",                  checkPermission("customers"),       c.getAll);
router.get("/:id",               checkPermission("customers"),       c.getById);
router.post("/",                 checkPermission("customers","edit"), c.create);
router.put("/:id",               checkPermission("customers","edit"), c.update);
router.delete("/:id",            checkPermission("customers","delete"), c.remove);
router.get("/:id/ledger",        checkPermission("customers"),       c.getLedger);
router.get("/:id/purchase-history", checkPermission("customers"),   c.getPurchaseHistory);

module.exports = router;

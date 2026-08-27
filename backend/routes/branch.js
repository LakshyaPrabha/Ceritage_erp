const express = require("express");
const router = express.Router();
const { verifyToken, checkPermission } = require("../middleware/auth");
const c = require("../controllers/branchController");

router.use(verifyToken);
router.get("/transfers",   checkPermission("branch"), c.getTransfers);
router.post("/transfers",  checkPermission("branch","edit"), c.createTransfer);
router.get("/",            checkPermission("branch"), c.getAll);
router.post("/",           checkPermission("branch","edit"), c.create);

module.exports = router;

const express = require("express");
const router = express.Router();
const { verifyToken, checkPermission } = require("../middleware/auth");
const c = require("../controllers/branchController");

router.use(verifyToken);

router.get("/kpis",                          checkPermission("branch"),         c.getKpis);
router.get("/sub-branches",                  checkPermission("branch"),         c.getSubBranches);
router.post("/sub-branches",                 checkPermission("branch", "edit"), c.createSubBranch);
router.put("/sub-branches/:id",              checkPermission("branch", "edit"), c.updateSubBranch);
router.delete("/sub-branches/:id",           checkPermission("branch", "edit"), c.deleteSubBranch);
router.get("/transfers",                     checkPermission("branch"),         c.getTransfers);
router.post("/transfers",                    checkPermission("branch", "edit"), c.createTransfer);
router.patch("/transfers/:id/status",        checkPermission("branch", "edit"), c.updateTransferStatus);
router.get("/",                              checkPermission("branch"),         c.getAll);
router.post("/",                             checkPermission("branch", "edit"), c.create);
router.put("/:id",                           checkPermission("branch", "edit"), c.update);

module.exports = router;

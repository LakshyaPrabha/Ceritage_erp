const express = require("express");
const router = express.Router();
const { verifyToken, checkPermission } = require("../middleware/auth");
const c = require("../controllers/employeesController");

router.use(verifyToken);
router.get("/kpis",                checkPermission("employees"), c.getKpis);
router.get("/",                    checkPermission("employees"), c.getAll);
router.post("/",                   checkPermission("employees","edit"), c.create);
router.put("/:id",                 checkPermission("employees","edit"), c.update);
router.post("/attendance",         checkPermission("employees","edit"), c.markAttendance);
router.post("/leaves",             checkPermission("employees","edit"), c.submitLeave);
router.patch("/leaves/:id/status", checkPermission("employees","edit"), c.approveLeave);

module.exports = router;

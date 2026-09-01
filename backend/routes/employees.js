const express = require("express");
const router = express.Router();
const { verifyToken, checkPermission } = require("../middleware/auth");
const c = require("../controllers/employeesController");

router.use(verifyToken);
router.get("/kpis",                checkPermission("employees"), c.getKpis);
router.get("/attendance",          checkPermission("employees"), c.getAttendance);
router.post("/attendance",         checkPermission("employees","edit"), c.markAttendance);
router.get("/leaves",              checkPermission("employees"), c.getLeaves);
router.post("/leaves",             checkPermission("employees","edit"), c.submitLeave);
router.patch("/leaves/:id/status", checkPermission("employees","edit"), c.approveLeave);
router.get("/",                    checkPermission("employees"), c.getAll);
router.post("/",                   checkPermission("employees","edit"), c.create);
router.put("/:id",                 checkPermission("employees","edit"), c.update);

module.exports = router;

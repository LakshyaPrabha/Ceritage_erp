const express = require("express");
const router = express.Router();
const { verifyToken, checkPermission } = require("../middleware/auth");
const c = require("../controllers/employeesController");

router.use(verifyToken);

router.get("/kpis",                        checkPermission("employees"),         c.getKpis);
router.get("/attendance",                  checkPermission("employees"),         c.getAttendance);
router.post("/attendance",                 checkPermission("employees", "edit"), c.markAttendance);
router.post("/attendance/mark-all-present",checkPermission("employees", "edit"), c.markAllPresent);
router.get("/leaves",                      checkPermission("employees"),         c.getLeaves);
router.post("/leaves",                     checkPermission("employees", "edit"), c.submitLeave);
router.patch("/leaves/:id/status",         checkPermission("employees", "edit"), c.approveLeave);
router.patch("/leaves/:id",                checkPermission("employees", "edit"), c.approveLeave);
router.get("/payroll",                     checkPermission("employees"),         c.getPayroll);
router.post("/payroll/pay",                checkPermission("employees", "edit"), c.paySalary);
router.get("/:id",                         checkPermission("employees"),         c.getById);
router.get("/",                            checkPermission("employees"),         c.getAll);
router.post("/",                           checkPermission("employees", "edit"), c.create);
router.put("/:id",                         checkPermission("employees", "edit"), c.update);
router.delete("/:id",                      checkPermission("employees", "delete"), c.delete);

module.exports = router;

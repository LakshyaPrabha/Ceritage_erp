const express = require("express");
const router = express.Router();
const { verifyToken, adminOnly } = require("../middleware/auth");
const {
  getAllUsers, getUserById, createUser, updateUser,
  deleteUser, getRolePermissions, updateRolePermissions,
} = require("../controllers/usersController");

router.use(verifyToken, adminOnly); // All user management = admin only

router.get("/",                          getAllUsers);
router.get("/:id",                       getUserById);
router.post("/",                         createUser);
router.put("/:id",                       updateUser);
router.delete("/:id",                    deleteUser);
router.get("/roles/permissions/:role",   getRolePermissions);
router.put("/roles/permissions/:role",   updateRolePermissions);

module.exports = router;

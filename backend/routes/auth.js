const express = require("express");
const router = express.Router();
const { login, logout, getMe } = require("../controllers/authController");
const { verifyToken } = require("../middleware/auth");

router.post("/login",  login);
router.post("/logout", verifyToken, logout);
router.get("/me",      verifyToken, getMe);

module.exports = router;

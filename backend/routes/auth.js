const express = require("express");
const router = express.Router();
const { signup, signin, logout, getProfile } = require("../controller/auth.controller");
const authMiddleware = require("../middleware/authMiddleware");

router.post("/signup", signup);
router.post("/signin", signin);
router.post("/logout", logout);
router.get("/profile", authMiddleware, getProfile);
module.exports = router;
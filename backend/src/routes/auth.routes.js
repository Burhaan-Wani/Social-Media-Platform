const { Router } = require("express");
const {
    register,
    login,
    logout,
    refreshToken,
} = require("../controllers/auth.controller");
const { verifyRefreshToken } = require("../middlewares/authMiddleware");

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.post("/logout", logout);
router.post("/refresh", verifyRefreshToken, refreshToken);

module.exports = router;

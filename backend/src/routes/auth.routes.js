const { Router } = require("express");
const {
    register,
    login,
    logout,
    refreshToken,
} = require("../controllers/auth.controller");
const {
    requireAuth,
    verifyRefreshToken,
} = require("../middlewares/authMiddleware");

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.post("/logout", requireAuth, logout);
router.post("/refresh", verifyRefreshToken, refreshToken);

module.exports = router;

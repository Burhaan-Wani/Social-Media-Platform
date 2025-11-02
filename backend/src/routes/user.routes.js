const { Router } = require("express");
const {
    myProfile,
    getUserProfile,
    updateProfile,
    followUnfollowUser,
    getFollowers,
    getFollowing,
} = require("../controllers/user.controller");
const { requireAuth } = require("../middlewares/authMiddleware");

const router = Router();

// Public Routes
// router.get("/search", searchUsers);
router.get("/:username", getUserProfile);

// Protected Routes
router.use(requireAuth);
router.route("/me").get(myProfile).patch(updateProfile);
// router.delete("/me", verifyAccessToken, deleteAccount);
router.post("/:id/follow", followUnfollowUser);
router.get("/:id/followers", getFollowers);
router.get("/:id/following", getFollowing);

module.exports = router;

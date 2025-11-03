const { Router } = require("express");
const { getFeedPosts } = require("../controllers/feed.controller");
const { requireAuth } = require("../middlewares/authMiddleware");

const router = Router();

router.use(requireAuth);

// GET /api/v1/feed?page=2&limit=10
router.get("/", getFeedPosts);

module.exports = router;

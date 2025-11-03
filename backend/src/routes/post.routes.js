const { Router } = require("express");
const {
    createPost,
    getAllPosts,
    getPostById,
    updatePost,
    deletePost,
    likeUnlikePost,
    addComment,
    deleteComment,
} = require("../controllers/post.controller");
const upload = require("../middlewares/multer");
const { requireAuth } = require("../middlewares/authMiddleware");

const router = Router();

router.use(requireAuth);

router.route("/").post(upload.single("media"), createPost).get(getAllPosts);
router
    .route("/:id")
    .get(getPostById)
    .patch(upload.single("media"), updatePost)
    .delete(deletePost);
router.patch("/:id/like", likeUnlikePost);
router.post("/:id/comment", addComment);
router.post("/:postId/comment/:commentId", deleteComment);

module.exports = router;

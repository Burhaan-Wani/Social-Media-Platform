const Comment = require("../models/comment.model");
const Post = require("../models/post.model");
const AppError = require("../utils/AppError");
const catchAsync = require("../utils/catchAsync");
const {
    uploadToCloudinary,
    deleteFromCloudninary,
} = require("../utils/cloudinaryUploadAndDelete");

const createPost = catchAsync(async (req, res, next) => {
    const { caption } = req.body;
    const file = req.file;
    if (!file) {
        return next(new AppError("Post media is required", 400));
    }

    let media = null;
    const upload = await uploadToCloudinary(file);
    media = {
        url: upload.url,
        publicId: upload.id,
        type: upload.resource_type,
    };
    const post = await Post.create({
        caption,
        media,
        author: req.user.id,
    });

    return res.status(201).json({
        status: "success",
        data: {
            post,
        },
    });
});

const getAllPosts = catchAsync(async (req, res, next) => {
    const posts = await Post.find()
        .populate("author", "username profilePic")
        .populate({
            path: "Comments",
            populate: {
                path: "user",
                select: "username profilePic",
            },
        })
        .sort({ createdAt: -1 });

    res.status(200).json({
        status: "success",
        data: {
            posts,
        },
    });
});

const getPostById = catchAsync(async (req, res, next) => {
    const { id } = req.params;

    const post = await Post.findById(id)
        .populate("author", "username profilePic")
        .populate({
            path: "comments",
            populate: { path: "user", select: "username profilePic" },
        });

    if (!post) {
        return next(new AppError("Post not found", 404));
    }
    res.status(200).json({
        status: "success",
        data: {
            post,
        },
    });
});
const updatePost = catchAsync(async (req, res, next) => {
    const { caption } = req.body;
    const { id } = req.params;
    const file = req.file;

    const post = await Post.findById(id);
    if (!Post) {
        return next(new AppError("Post not found", 404));
    }

    if (!post.author.equals(req.user.id)) {
        return next(new AppError("Cannot update others posts", 403));
    }

    if (caption) post.caption = caption;
    if (file) {
        if (post.media?.publicId) {
            await deleteFromCloudninary(post.media.publicId);
        }
        const upload = await uploadToCloudinary(file);
        post.media = {
            url: upload.url,
            publicId: upload.id,
            type: upload.resource_type,
        };
    }

    await post.save();
    res.status(200).json({
        status: "success",
        data: {
            post,
        },
    });
});

const deletePost = catchAsync(async (req, res, next) => {
    const { id } = req.params;

    const post = await Post.findById(id);
    if (!post) {
        return next(new AppError("Post not found", 404));
    }

    if (!post.author.equals(req.user.id)) {
        return next(new AppError("Cannot delete others posts", 403));
    }
    if (post.media?.publicId) {
        await deleteFromCloudninary(post.media.publicId);
    }

    await Comment.deleteMany({ post: post._id });
    await Post.findByIdAndDelete(id);
    res.statu(200).json({
        status: "success",
        message: "Post delete successfully",
    });
});
const likeUnlikePost = catchAsync(async (req, res, next) => {
    const { id } = req.params;
    const userId = req.user.id;

    const post = await Post.findById(id);
    if (!post) {
        return next(new AppError("Post not found", 404));
    }

    const isLiked = post.likes.includes(userId);
    if (isLiked) {
        post.likes = post.likes.filter((id) => id !== userId);
    } else {
        post.likes.push(userId);
    }

    await post.save();

    res.status(200).json({
        status: "success",
        message: isLiked ? "Post unliked" : "Post liked",
    });
});
const addComment = catchAsync(async (req, res, next) => {
    const { id } = req.params;
    const { text } = req.body;

    const post = await Post.findById(id);
    if (!post) {
        return next(new AppError("Post not found", 404));
    }

    const comment = await Comment.create({
        post: id,
        user: req.user.id,
        text,
    });

    post.comments.push(comment._id);
    await post.save();
    res.status(200).json({
        status: "success",
        data: {
            comment,
        },
    });
});

const deleteComment = catchAsync(async (req, res, next) => {
    const { postId, commentId } = req.params;

    const comment = await Comment.findById(commentId);
    if (!comment) {
        return next(new AppError("Comment not found", 404));
    }

    if (!comment.user.equals(req.user.id)) {
        return next(new AppError("Cannot delete others comments", 403));
    }

    await Comment.findByIdAndDelete(commentId);
    await Post.findByIdAndUpdate(postId, { $pull: { comments: commentId } });

    res.status(200).json({
        status: "success",
        message: "Comment deleted",
    });
});

module.exports = {
    getAllPosts,
    getPostById,
    addComment,
    deleteComment,
    deletePost,
    likeUnlikePost,
    updatePost,
    createPost,
};

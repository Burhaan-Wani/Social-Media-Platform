const Post = require("../models/post.model");
const User = require("../models/user.model");
const catchAsync = require("../utils/catchAsync");

const getFeedPosts = catchAsync(async (req, res, next) => {
    const user = await User.findById(req.user._id).select("following");
    const usersToFetch = [...user.following, req.user._id];

    const limit = parseInt(req.query.limit) || 10;
    const lastId = req.query.lastId; // cursor (optional)

    // Base filter: posts from followed users + self
    const filter = { author: { $in: usersToFetch } };

    // If cursor provided → get posts older than that ID
    if (lastId) {
        filter._id = { $lt: lastId }; // posts older than last one seen
    }

    const posts = await Post.find(filter)
        .populate("author", "username profilePic")
        .populate({
            path: "comments",
            populate: { path: "user", select: "username profilePic" },
        })
        .sort({ _id: -1 }) // newest first
        .limit(limit);

    // The new cursor will be the _id of the last post returned
    const nextCursor = posts.length > 0 ? posts[posts.length - 1]._id : null;

    res.json({
        success: true,
        count: posts.length,
        nextCursor,
        posts,
    });

    return res.status(200).json({
        status: "success",
        data: {
            posts,
            nextCursor,
            count: posts.length,
        },
    });
});

module.exports = {
    getFeedPosts,
};

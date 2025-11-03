const User = require("../models/user.model");
const AppError = require("../utils/AppError");
const catchAsync = require("../utils/catchAsync");
const createNotification = require("../utils/createNotification");

const myProfile = catchAsync(async (req, res, next) => {
    const { id } = req.user;
    const myProfile = await User.findById(id).select("-password -sessions");
    res.status(200).json({
        status: "success",
        data: {
            me: myProfile,
        },
    });
});

const getUserProfile = catchAsync(async (req, res, next) => {
    const { username } = req.params;

    const user = await User.findOne({ username })
        .select("-password -refreshTokenHash -sessions") // hide sensitive data
        .lean();

    if (!user) {
        return res.status(404).json({ message: "User not found" });
    }

    // Instead of sending large arrays, send only counts
    const followersCount = user.followers?.length || 0;
    const followingCount = user.following?.length || 0;

    const userProfile = {
        _id: user._id,
        username: user.username,
        fullName: user.fullName,
        email: user.email,
        bio: user.bio,
        profilePic: user.profilePic,
        coverPhoto: user.coverPhoto,
        followersCount,
        followingCount,
        createdAt: user.createdAt,
    };

    res.status(200).json({
        status: "success",
        data: {
            user: userProfile,
        },
    });
});

const updateProfile = catchAsync(async (req, res, next) => {
    const updates = req.body;

    const allowedFields = [
        "fullName",
        "bio",
        "profilePic",
        "location",
        "website",
    ];

    let filteredUpdates = {};
    for (let key of allowedFields) {
        if (updates[key]) filteredUpdates[key] = updates[key];
    }

    const user = await User.findByIdAndUpdate(
        req.user.id,
        { $set: filteredUpdates },
        { new: true }
    ).select("-passwords -sessions");

    res.status(201).json({
        status: "success",
        data: {
            user,
        },
    });
});

const followUnfollowUser = catchAsync(async (req, res, next) => {
    const targetUserId = req.params.id;
    const currentUserId = req.user.id;

    if (targetUserId.toString() === currentUserId.toString()) {
        return next(new AppError("You cannot follow yourself", 400));
    }

    const targetUser = await User.findById(targetUserId);
    const currentUser = await User.findById(currentUserId);

    if (!targetUser || !currentUser) {
        return next(new AppError("User not found", 404));
    }

    // check if already following
    const isFollowing = currentUser.following.includes(targetUserId);
    if (isFollowing) {
        await User.updateOne(
            { _id: currentUserId },
            {
                $pull: { following: targetUserId },
            }
        );
        await User.updateOne(
            { _id: targetUser },
            {
                $pull: { followers: currentUserId },
            }
        );

        return res.status(200).json({
            status: "success",
            message: "User unfollowed",
        });
    } else {
        await User.updateOne(
            { _id: currentUserId },
            {
                $addToSet: { following: targetUserId },
            }
        );
        await User.updateOne(
            { _id: targetUser },
            {
                $addToSet: { followers: currentUserId },
            }
        );

        await createNotification({
            recipientId: targetUser._id,
            senderId: req.user.id,
            type: "follow",
        });
        return res.status(200).json({
            status: "success",
            message: "User unfollowed",
        });
    }
});

const getFollowers = catchAsync(async (req, res, next) => {
    const { id } = req.params;

    const user = await User.findById(id)
        .select("-password -refreshTokenHash -sessions")
        .populate({
            path: "followers",
            select: "username fullName profilePic",
        });

    if (!user) {
        return next(new AppError("User not found", 404));
    }

    res.status(200).json({
        status: "success",
        count: user.followers.length,
        followers: user.followers,
    });
});

const getFollowing = catchAsync(async (req, res, next) => {
    const { id } = req.params;

    const user = await User.findById(id)
        .select("-password -refreshTokenHash -sessions")
        .populate({
            path: "following",
            select: "username fullName profilePic",
        });

    if (!user) {
        return next(new AppError("User not found", 404));
    }

    res.status(200).json({
        status: "success",
        count: user.following.length,
        following: user.following,
    });
});

module.exports = {
    myProfile,
    getUserProfile,
    updateProfile,
    followUnfollowUser,
    getFollowers,
    getFollowing,
};

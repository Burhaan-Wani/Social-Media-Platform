const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
    {
        recipient: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true, // the user who receives the notification
        },
        sender: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true, // the user who triggered the notification
        },
        type: {
            type: String,
            enum: ["like", "comment", "follow"],
            required: true,
        },
        post: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Post",
            default: null, // optional, only for like/comment notifications
        },
        comment: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Comment",
            default: null, // optional, only for comment notifications
        },
        message: {
            type: String,
            required: true, // human-readable text, e.g. "John liked your post"
        },
        isRead: {
            type: Boolean,
            default: false,
        },
    },
    { timestamps: true }
);

// ✅ Optimize queries for "get notifications" route
notificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });

const Notification = mongoose.model("Notification", notificationSchema);

module.exports = Notification;

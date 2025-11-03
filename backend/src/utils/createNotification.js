const Notification = require("../models/notification.model");
const User = require("../models/user.model");
const { getSocketServer, onlineUsers } = require("../socket");
const AppError = require("./AppError");

const createNotification = async ({
    recipientId,
    senderId,
    type,
    postId = null,
    commentId = null,
}) => {
    try {
        if (recipientId.toString() === senderId.toString()) return;

        const sender = await User.findById(senderId).select("username");
        let message;
        switch (type) {
            case "like":
                message = `${sender.username} liked your post`;
                break;
            case "comment":
                message = `${sender.username} commented on your post`;
                break;
            case "follow":
                message = `${sender.username} started following you`;
                break;
            default:
                message = "You have a new notification";
        }

        // ✅ Real-time: Emit notification to recipient if online

        const notification = await Notification.create({
            recipient: recipientId,
            sender: senderId,
            type,
            message,
            post: postId,
            comment: commentId,
        });
        const io = getSocketServer();
        const recipientSocketId = onlineUsers.get(recipientId.toString());
        if (io && recipientSocketId) {
            io.to(recipientSocketId).emit("notification", notification);
        }

        return notification;
    } catch (error) {
        console.log("Error creating notification", error.message);
        throw new AppError("Error creating notification", 500);
    }
};

module.exports = createNotification;

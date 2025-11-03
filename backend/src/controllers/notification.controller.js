const Notification = require("../models/notification.model");
const AppError = require("../utils/AppError");
const catchAsync = require("../utils/catchAsync");

// Get all notifications for logged-in user
const getAllNotifications = catchAsync(async (req, res, next) => {
    const notifications = await Notification.find({ recipient: req.user.id })
        .populate("sender", "username profilePic")
        .populate("post", "caption")
        .sort({ createdAt: -1 });

    res.status(200).json({
        status: "success",
        notifications,
        notificationsCount: notifications.length,
    });
});
const markAsRead = catchAsync(async (req, res, next) => {
    const { id } = req.params.id;

    const notification = await Notification.findOneAndUpdate(
        { _id: id, recipient: req.user.id },
        { isRead: true },
        { new: true }
    );

    res.status(200).json({
        status: "success",
        data: {
            notification,
        },
    });
});
const markAllNotificationAsRead = catchAsync(async (req, res, next) => {
    await Notification.updateMany(
        { recipient: req.user.id, isRead: false },
        { isRead: true }
    );

    res.status(200).json({
        status: "success",
        message: "All notifications marked as read",
    });
});

const deleteNotification = catchAsync(async (req, res, next) => {
    const { id } = req.params;

    const notification = await Notification.findOneAndDelete({
        _id: id,
        recipient: req.user.id,
    });

    if (!notification) {
        return next(new AppError("Notification not found", 404));
    }
    res.status(200).json({
        status: "success",
        message: "Notification deleted",
    });
});
const clearAllNotifications = catchAsync(async (req, res, next) => {
    await Notification.deleteMany({
        recipient: req.user.id,
    });

    res.status(200).json({
        status: "success",
        message: "All notifications deleted",
    });
});

module.exports = {
    getAllNotifications,
    markAsRead,
    markAllNotificationAsRead,
    deleteNotification,
    clearAllNotifications,
};

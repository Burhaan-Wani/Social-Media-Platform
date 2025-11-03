const { Router } = require("express");
const {
    markAsRead,
    deleteNotification,
    clearAllNotifications,
    markAllNotificationAsRead,
    getAllNotifications,
} = require("../controllers/notification.controller");
const { requireAuth } = require("../middlewares/authMiddleware");

const router = Router();

router.use(requireAuth);
// Get all notifications for logged-in user
router.get("/", getAllNotifications);

// Mark a single notification as read
router.patch("/:id/read", markAsRead);

// Mark all notifications as read
router.patch("/read-all", markAllNotificationAsRead);

// Delete a single notification
router.delete("/:id", deleteNotification);

// Delete all notifications
router.delete("/", clearAllNotifications);

module.exports = router;

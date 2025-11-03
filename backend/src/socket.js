// socket.js
let io;
const onlineUsers = new Map();

/**
 * Initialize Socket.IO server
 * @param {Server} serverInstance - instance of Socket.IO Server
 */
const setSocketServer = (serverInstance) => {
    io = serverInstance;

    io.on("connection", (socket) => {
        console.log("User connected:", socket.id);

        // Register logged-in user
        socket.on("registerUser", (userId) => {
            onlineUsers.set(userId, socket.id);
            console.log(`User ${userId} registered with socket ${socket.id}`);
        });

        // Handle disconnect
        socket.on("disconnect", () => {
            for (const [userId, id] of onlineUsers.entries()) {
                if (id === socket.id) {
                    onlineUsers.delete(userId);
                    break;
                }
            }
            console.log("User disconnected:", socket.id);
        });
    });
};

/**
 * Get the initialized Socket.IO instance
 */
const getSocketServer = () => io;

module.exports = { setSocketServer, getSocketServer, onlineUsers };

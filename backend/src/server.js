require("dotenv").config();
const http = require("http");
const app = require("./app");
const { Server } = require("socket.io");
const connectDB = require("./config/db");
const { setSocketServer } = require("./socket");

const PORT = process.env.PORT || 5000;

connectDB()
    .then(() => {
        const server = http.createServer(app);

        const io = new Server(server, {
            cors: {
                origin: process.env.CLIENT_URL || "*",
                methods: ["GET", "POST"],
            },
        });

        setSocketServer(io); // Initialize sockets

        server.listen(PORT, () => {
            console.log(`🚀 Server running on http://localhost:${PORT}`);
        });
    })
    .catch((err) => {
        console.error("❌ MongoDB Connection Error:", err);
        process.exit(1);
    });

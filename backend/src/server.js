require("dotenv").config();
const http = require("http");
const app = require("./app");
const connectDB = require("./config/db");

const PORT = process.env.PORT || 5000;

// Start server after DB connection
const startServer = async () => {
    connectDB()
        .then(() => {
            const server = http.createServer(app);

            server.listen(PORT, () => {
                console.log(`🚀 Server running on http://localhost:${PORT}`);
            });
        })
        .catch(() => {
            console.error("❌ MongoDB Connection Error:");
            process.exit(1); // Exit process on failure
        });

    // Handle uncaught errors
    process.on("unhandledRejection", (err) => {
        console.error("💥 Unhandled Rejection:", err);
        server.close(() => process.exit(1));
    });
};

startServer();

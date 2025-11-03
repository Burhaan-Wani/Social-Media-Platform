const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const morgan = require("morgan");

const authRoutes = require("./routes/auth.routes");
const userRoutes = require("./routes/user.routes");
const postRoutes = require("./routes/post.routes");
const feedRoutes = require("./routes/feed.routes");
const notificationRoutes = require("./routes/feed.routes");
const globalErrorHandler = require("./middlewares/errorHandlingMiddleware");

const app = express();

// Middlewares
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(
    cors({
        origin: process.env.CLIENT_URL || "http://localhost:3000",
        credentials: true, // allows cookies and auth headers
        methods: ["'GET", "POST", "PUT", "PATCH", "DELETE"],
    })
);
if (process.env.NODE_ENV === "development") {
    app.use(morgan("dev"));
}

// Routes
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/posts", postRoutes);
app.use("/api/v1/feeds", feedRoutes);
app.use("/api/v1/notifications", notificationRoutes);

// Global Error handling
app.use(globalErrorHandler);

module.exports = app;

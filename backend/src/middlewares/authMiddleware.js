const jwt = require("jsonwebtoken");

const AppError = require("../utils/AppError");
const catchAsync = require("../utils/catchAsync");
const User = require("../models/user.model");
const { hashToken } = require("../utils/token");

const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

const requireAuth = catchAsync(async (req, res, next) => {
    const authHeader = req.headers.authorization;
    console.log(authHeader);
    if (!authHeader?.startsWith("Bearer ")) {
        return next(new AppError("Unauthorized", 401));
    }

    const token = authHeader.split(" ")[1]; // Extract token after "Bearer "

    let payload;
    try {
        payload = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    } catch (error) {
        return next(new AppError("Invalid or expired access token", 401));
    }

    const user = await User.findById(payload?.id);
    if (!user) {
        return next(new AppError("User not found", 404));
    }

    req.user = {
        id: payload.id,
        role: payload.role,
    };
    next();
});

const verifyRefreshToken = catchAsync(async (req, res, next) => {
    const token = req.cookies?.refreshToken;
    if (!token)
        return res.status(401).json({ message: "No refresh token provided" });

    let payload;
    try {
        payload = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET);
    } catch (err) {
        // Try to extract user ID from the token (even if expired)
        const decoded = jwt.decode(token);

        if (decoded?.id) {
            const user = await User.findById(decoded.id).select("+sessions");
            if (user) {
                const tokenHash = hashToken(token);
                user.sessions = user.sessions.filter(
                    (s) => s.refreshTokenHash !== tokenHash
                );
                await user.save();
            }
        }

        res.clearCookie("refreshToken", cookieOptions);
        return res.status(401).json({
            status: "fail",
            message: "Refresh token expired or invalid. Please login again.",
        });
    }

    const user = await User.findById(payload.id).select("+sessions");
    if (!user) return res.status(401).json({ message: "User not found" });

    const tokenHash = hashToken(token);
    const sessionIndex = user.sessions?.findIndex(
        (s) => s.refreshTokenHash === tokenHash
    );

    if (sessionIndex === -1) {
        // Reuse detected: clean up all sessions
        user.sessions = [];
        await user.save();
        res.clearCookie("refreshToken", cookieOptions);
        return res.status(401).json({
            status: "fail",
            message: "Refresh token reuse detected. Please login again.",
        });
    }

    // Attach to request for controller use
    req.user = user;
    req.sessionIndex = sessionIndex;
    req.tokenHash = tokenHash;
    next();
});

const requireRole = (role) => (req, res, next) => {
    if (req.user.role !== role) {
        return res.status(403).json({
            status: "fail",
            message: "Forbidden",
        });
    }
    next();
};

module.exports = {
    requireAuth,
    requireRole,
    verifyRefreshToken,
};

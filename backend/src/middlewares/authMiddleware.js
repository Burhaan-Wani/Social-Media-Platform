const { promisify } = require("util");
const jwt = require("jsonwebtoken");

const AppError = require("../utils/AppError");
const catchAsync = require("../utils/catchAsync");
const User = require("../models/user.model");

const requireAuth = catchAsync(async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
        return next(new AppError("Unauthorized", 401));
    }

    const payload = promisify(jwt.verify)(
        authHeader,
        process.env.ACCESS_TOKEN_SECRET
    );

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
    if (!token) {
        return next(new AppError("No refresh token provided", 401));
    }

    let payload = promisify(jwt.verify)(
        token,
        process.env.REFRESH_TOKEN_SECRET
    );

    const user = await User.findById(payload.id).select("+sessions");
    if (!user) {
        return next(new AppError("User not found", 404));
    }

    const tokenHash = hashToken(token);
    let isSessionValid = user.sessions.some(
        (s) => s.refreshTokenHash === tokenHash
    );
    if (!isSessionValid) {
        return next(new AppError("Invalid refresh token", 403));
    }
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

const jwt = require("jsonwebtoken");
const { promisify } = require("util");

const User = require("../models/user.model");
const AppError = require("../utils/AppError");
const catchAsync = require("../utils/catchAsync");
const {
    signAccessToken,
    signRefreshToken,
    hashToken,
} = require("../utils/token");

const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

const register = catchAsync(async (req, res, next) => {
    const { username, email, password } = req.body;
    if (!username || !email || !password) {
        return next(new AppError("All fields are required", 400));
    }

    const existing = await User.findOne({ email });
    if (existing) {
        return next(new AppError("Email already used", 409));
    }

    const user = await User.create({
        username,
        email,
        password,
    });

    const accessToken = signAccessToken({ id: user._id, role: user.role });
    const refreshToken = signRefreshToken({ id: user._id, role: user.role });
    const refreshHash = hashToken(refreshToken);

    user.sessions = user.sessions || [];
    user.sessions.push({
        refreshTokenHash: refreshHash,
        userAgent: req.headers["user-agent"],
        ip: req.ip,
    });

    await user.save();

    res.cookie("refreshToken", refreshToken, cookieOptions);
    res.status(201).json({
        status: "success",
        data: { accessToken },
    });
});

const login = catchAsync(async (req, res, next) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return next(new AppError("Email and Password is required", 400));
    }

    const user = await User.findOne({ email }).select("+password +sessions");

    if (
        !user ||
        !(await user.comparePasswords(password, user.password ?? ""))
    ) {
        return next(new AppError("Invalid credentials", 401));
    }

    const accessToken = signAccessToken({ id: user._id, role: user.role });
    const refreshToken = signRefreshToken({ id: user._id, role: user.role });
    const refreshHash = hashToken(refreshToken);

    user.sessions = user.sessions || [];
    user.sessions.push({
        refreshTokenHash: refreshHash,
        userAgent: req.headers["user-agent"],
        ip: req.ip,
    });

    res.cookie("refreshToken", refreshToken, cookieOptions);
    res.json({ status: "success", data: { accessToken } });
});

const logout = catchAsync(async (req, res, next) => {
    const token = req.cookies?.refreshToken;
    if (!token) {
        res.clearCookie("refreshToken", cookieOptions);
        res.status(200).json({
            status: "success",
            message: "Logged Out",
        });
    }

    let payload = promisify(jwt.verify)(
        token,
        process.env.REFRESH_TOKEN_SECRET
    );

    const user = await User.findById(payload.id).select("+sessions");
    if (user) {
        const tokenHash = hashToken(token);
        user.sessions = user.sessions.filter(
            (s) => s.refreshTokenHash !== tokenHash
        );
        await user.save();
    }
    res.clearCookie("refreshToken", cookieOptions);
    res.status(200).json({
        status: "success",
        message: "Logged Out",
    });
});

const refreshToken = catchAsync(async (req, res, next) => {
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
    let sessionIndex = user.sessions.findIndex(
        (s) => s.refreshTokenHash === tokenHash
    );
    if (sessionIndex === -1) {
        // possible token reuse: token valid but not found server-side => security incident
        user.sessions = []; // revoke all sessions
        await user.save();
        res.clearCookie("refreshToken", cookieOptions);
        res.status(401).json({
            status: "fail",
            message: "Refresh token reuse detected, Please login again.",
        });
    }

    // rotate: issue new refresh token and access token
    const newAccessToken = signAccessToken({ id: user._id, role: user.role });
    const newRefreshToken = signRefreshToken({ id: user._id, role: user.role });
    const newHash = hashToken(newRefreshToken);

    // replace stored hash (rotation)
    user.sessions[sessionIndex].refreshTokenHash = newHash;
    user.sessions[sessionIndex].createdAt = Date.now();
    user.save();

    res.cookie("refreshToken", newRefreshToken, cookieOptions);
    res.json({ status: "success", data: { accessToken: newAccessToken } });
});

module.exports = {
    register,
    login,
    logout,
    refreshToken,
};

const jwt = require("jsonwebtoken");
const crypto = require("crypto");

const signAccessToken = (payload) => {
    return jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: process.env.ACCESS_TOKEN_EXPIRY || "15m",
    });
};
const signRefreshToken = (payload) => {
    return jwt.sign(payload, process.env.REFRESH_TOKEN_SECRET, {
        expiresIn: process.env.ACCESS_TOKEN_EXPIRY || "7d",
    });
};

// Hash refresh token for DB storage
const hashToken = (token) => {
    return crypto.createHash("sha256").update(token).digest("hex");
};

module.exports = {
    signAccessToken,
    signRefreshToken,
    hashToken,
};

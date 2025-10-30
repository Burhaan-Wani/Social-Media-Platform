const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
    {
        username: {
            type: String,
            required: true,
            unique: true,
            trim: true,
        },
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
        },
        password: {
            type: String,
            required: true,
            select: false,
        },
        profilePic: {
            type: String,
            default: "",
        },
        bio: {
            type: String,
            maxlength: 160,
        },
        followers: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
            },
        ],
        following: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
            },
        ],
        role: {
            type: String,
            enum: ["user", "admin"],
            default: "user",
        },
        sessions: [
            {
                refreshTokenHash: String,
                createdAt: {
                    type: Date,
                    default: Date.now,
                },
                userAgent: String,
                ip: String,
            },
        ],
    },
    {
        timestamps: true,
    }
);

// encrypt password in pre-save middleware
userSchema.pre("save", async function (next) {
    if (!this.isModified("password")) return next();
    this.password = await bcrypt.hash(this.password, 12);
    next();
});

userSchema.methods.comparePasswords = async function (password, hashPassword) {
    return await bcrypt.compare(password, hashPassword);
};
const User = mongoose.model("User", userSchema);

module.exports = User;

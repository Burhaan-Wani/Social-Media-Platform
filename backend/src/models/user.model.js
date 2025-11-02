const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
    {
        username: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            minlength: 3,
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
            minlength: 6,
        },

        // 🔹 Profile Details
        fullName: { type: String, trim: true },
        bio: { type: String, trim: true, maxlength: 200 },
        profilePic: { type: String, default: "" },
        location: { type: String, trim: true },
        website: { type: String, trim: true },

        // 🔹 Social Graph
        followers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
        following: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],

        // 🔹 Auth Sessions (from your Auth module)
        sessions: [
            {
                refreshTokenHash: String,
                createdAt: { type: Date, default: Date.now },
                userAgent: String,
                ip: String,
            },
        ],
    },
    { timestamps: true }
);

// Password hashing
userSchema.pre("save", async function (next) {
    if (!this.isModified("password")) return next();
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

userSchema.methods.comparePasswords = async function (password, hashPassword) {
    return await bcrypt.compare(password, hashPassword);
};
const User = mongoose.model("User", userSchema);
module.exports = User;

const fs = require("fs");

const cloudinary = require("../config/cloudinary");
const AppError = require("./AppError");

const uploadToCloudinary = async (file) => {
    try {
        const response = await cloudinary.uploader.upload(file.path, {
            folder: "posts",
        });

        fs.unlinkSync(file.path);

        return {
            url: response.secure_url,
            id: response.public_id,
            resource_type: response.resource_type,
        };
    } catch (error) {
        try {
            fs.unlinkSync(file.path);
        } catch (deleteError) {
            console.error("Error deleting file:", deleteError.message);
        }

        // Log the error and rethrow it
        console.error("Could not upload file to Cloudinary:", error.message);
        throw new AppError("File upload to Cloudinary failed.", 500);
    }
};

const deleteFromCloudninary = async (id) => {
    try {
        await cloudinary.uploader.destroy(id);
    } catch (error) {
        console.log("Failed to remove file from cloudinary");
        throw new AppError("Failed to remove file from cloudinary", 500);
    }
};
module.exports = { uploadToCloudinary, deleteFromCloudninary };

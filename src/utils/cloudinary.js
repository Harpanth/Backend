import { v2 as cloudinary } from "cloudinary"
import fs from "fs"
import dotenv from "dotenv";

dotenv.config()

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_SECRET_KEY
});

console.log("Cloudinary Config:", {
    cloud_name: cloudinary.config().cloud_name,
    api_key: cloudinary.config().api_key,
    secure: cloudinary.config().secure,
});

const checkCloudinaryConnection = async () => {
    try {
        const result = await cloudinary.api.ping();
        console.log("Cloudinary Connection Successful:", result);
    } catch (error) {
        console.error("Cloudinary Connection Failed:", JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
        process.exit(1);
    }
}

const uploadOnCloudinary = async (localFilePath) => {
    try {
        console.log("Local file path being uploaded:", localFilePath);

        
        await checkCloudinaryConnection();
        if (!localFilePath) return null
        // upload the file on cloudinary
        try {
            const response = await cloudinary.uploader.upload(localFilePath, {
                resource_type: "auto",
                timeout: 120000, // Increase timeout to 2 minutes
            });
            console.log("Upload successful:", response);
            return response;
        } catch (error) {
            console.error("Upload failed:", JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
            if (error.response) {
                console.error("Cloudinary Response Error:", error.response);
            }
            process.exit(1);
        }
        // console.log('response:', response)

    } catch (error) {
        // fs.unlinkSync(localFilePath) // remove the locally saved temporary file as the upload operation got failed
        return null;
    }
}
export { uploadOnCloudinary }
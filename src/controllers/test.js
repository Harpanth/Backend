

import dotenv from "dotenv";
import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure Cloudinary
cloudinary.config({
    cloud_name: "da6vixt3z",
    api_key: "375981198737115",
    api_secret: "n763TAk_RAGcg7UCLKaEdwjOc_M",
    debug: true, // Enables verbose logging
});



// Log Cloudinary Config to Verify
console.log("Cloudinary Config:", {
    cloud_name: cloudinary.config().cloud_name,
    api_key: cloudinary.config().api_key,
    secure: cloudinary.config().secure,
});

// File path to upload
const filePath = path.resolve(__dirname, "../../public/temp/Screenshot from 2024-11-20 16-49-35.png");

console.log("Resolved file path:", filePath);

// Check if the file exists and is readable
if (!fs.existsSync(filePath)) {
    console.error("File does not exist at path:", filePath);
    process.exit(1);
}

try {
    fs.accessSync(filePath, fs.constants.R_OK);
    console.log("File is accessible and readable.");
} catch (err) {
    console.error("File is not accessible:", err.message);
    process.exit(1);
}

// Function to Test Cloudinary Connection
const testCloudinaryConnection = async () => {
    try {
        const result = await cloudinary.api.ping();
        console.log("Cloudinary Connection Successful:", result);
    } catch (error) {
        console.error("Cloudinary Connection Failed:", JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
        process.exit(1);
    }
};

// Function to Test File Upload
const testUpload = async () => {
    try {
        const response = await cloudinary.uploader.upload(filePath, {
            resource_type: "auto",
            timeout: 120000, // Increase timeout to 2 minutes
        });
        console.log("Upload successful:", response);
    } catch (error) {
        console.error("Upload failed:", JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
        if (error.response) {
            console.error("Cloudinary Response Error:", error.response);
        }
        process.exit(1);
    }
};

// Main Execution
(async () => {
    console.log("Testing Cloudinary Connection...");
    await testCloudinaryConnection();

    console.log("Testing File Upload...");
    await testUpload();
})();



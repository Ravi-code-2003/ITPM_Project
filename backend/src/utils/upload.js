const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const path = require("path");
const fs = require("fs");

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, "../../uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Local storage configuration (fallback if Cloudinary not configured)
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    // Create unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// File filter for images only
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image")) {
    cb(null, true);
  } else {
    cb(new Error("Only image files are allowed!"), false);
  }
};

// Create multer upload middleware
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: fileFilter,
});

// Upload to Cloudinary helper function
const uploadToCloudinary = async (filePath) => {
  try {
    if (process.env.CLOUDINARY_CLOUD_NAME) {
      const result = await cloudinary.uploader.upload(filePath, {
        folder: "student-connect/proofs",
        transformation: [
          { width: 800, height: 600, crop: "limit", quality: "auto:good" }
        ],
      });
      
      // Delete local file after successful upload
      fs.unlinkSync(filePath);
      
      return result.secure_url;
    } else {
      // Return local file path if Cloudinary not configured
      return `/uploads/${path.basename(filePath)}`;
    }
  } catch (error) {
    console.error("Cloudinary upload error:", error);
    // Return local file path as fallback
    return `/uploads/${path.basename(filePath)}`;
  }
};

// Error handling middleware for file uploads
const handleUploadError = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({ message: "File too large. Maximum size is 5MB." });
    }
  }
  
  if (error.message === "Only image files are allowed!") {
    return res.status(400).json({ message: "Only image files are allowed!" });
  }
  
  next(error);
};

module.exports = {
  upload,
  uploadToCloudinary,
  handleUploadError,
  cloudinary,
};
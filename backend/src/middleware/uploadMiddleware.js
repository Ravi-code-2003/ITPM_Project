const multer = require("multer");
const path = require("path");
const fs = require("fs");
const cloudinary = require("cloudinary").v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadsDir = path.join(__dirname, "../../uploads/lostfound");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `lostfound-${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = ["image/jpeg", "image/png"];
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
    return;
  }
  cb(new Error("Only JPG and PNG images are allowed"), false);
};

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter,
});

const uploadImage = async (filePath) => {
  try {
    if (process.env.CLOUDINARY_CLOUD_NAME) {
      const result = await cloudinary.uploader.upload(filePath, {
        folder: "student-connect/lost-found",
        transformation: [{ width: 1000, height: 1000, crop: "limit", quality: "auto:good" }],
      });

      fs.unlinkSync(filePath);
      return result.secure_url;
    }

    return `/uploads/lostfound/${path.basename(filePath)}`;
  } catch (error) {
    console.error("Failed to upload image:", error.message);
    return `/uploads/lostfound/${path.basename(filePath)}`;
  }
};

const handleUploadError = (error, req, res, next) => {
  if (error instanceof multer.MulterError && error.code === "LIMIT_FILE_SIZE") {
    return res.status(400).json({
      success: false,
      message: "Image is too large. Maximum size is 5MB.",
    });
  }

  if (error.message === "Only JPG and PNG images are allowed") {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }

  return next(error);
};

module.exports = {
  upload,
  uploadImage,
  handleUploadError,
};

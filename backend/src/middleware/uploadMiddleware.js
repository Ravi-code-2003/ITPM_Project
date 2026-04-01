const { upload, handleUploadError } = require("../utils/upload");

// Expect a single image file under field name "image"
const singleImageUpload = upload.single("image");

module.exports = {
  singleImageUpload,
  handleUploadError,
};

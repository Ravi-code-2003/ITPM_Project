const express = require("express");
const { protect, authorize, approvedOnly } = require("../middleware/auth");
const {
  createPost,
  getLostPosts,
  getFoundPosts,
  getCurrentUserPosts,
  deletePost,
  markAsResolved,
  getMatchesByLostId,
} = require("../controllers/lostFoundController");
const { upload, handleUploadError } = require("../middleware/uploadMiddleware");

const router = express.Router();

router.use(protect);
router.use(authorize("student"));
router.use(approvedOnly);

router.post("/", upload.single("image"), handleUploadError, createPost);
router.get("/lost", getLostPosts);
router.get("/found", getFoundPosts);
router.get("/user", getCurrentUserPosts);
router.get("/matches/:lostId", getMatchesByLostId);
router.delete("/:id", deletePost);
router.patch("/:id/resolve", markAsResolved);

module.exports = router;

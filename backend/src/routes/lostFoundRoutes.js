const express = require("express");
const {
  createLostFoundPost,
  getLostPosts,
  getFoundPosts,
  getUserPosts,
  deletePost,
  resolvePost,
  getMatchesByLostId,
  markAsFound,
  addComment,
  getComments,
  replyComment,
} = require("../controllers/lostFoundController");
const { protect } = require("../middleware/auth");
const { singleImageUpload, handleUploadError } = require("../middleware/uploadMiddleware");

const router = express.Router();

// Create a lost or found post
router.post("/", protect, singleImageUpload, createLostFoundPost);

// Fetch posts
router.get("/lost", protect, getLostPosts);
router.get("/found", protect, getFoundPosts);
router.get("/user", protect, getUserPosts);

// Matches
router.get("/matches/:lostId", protect, getMatchesByLostId);

// Update posts
router.delete("/:id", protect, deletePost);
router.patch("/:id/resolve", protect, resolvePost);
router.post("/:id/mark-found", protect, markAsFound);

// Comments - add comment to a lost post
router.post("/:postId/comment", protect, addComment);

// Comments - get all comments for a lost post (owner only)
router.get("/:postId/comments", protect, getComments);

// Comments - reply to a comment (owner only)
router.post("/comment/:commentId/reply", protect, replyComment);

// Multer error handling
router.use(handleUploadError);

module.exports = router;

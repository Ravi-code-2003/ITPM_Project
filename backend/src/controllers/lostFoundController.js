const LostFound = require("../models/LostFound");
const Comment = require("../models/Comment");
const Claim = require("../models/Claim");
const Notification = require("../models/Notification");
const { uploadToCloudinary } = require("../utils/upload");

const normalizeText = (text = "") =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const tokenize = (text = "") => {
  const normalized = normalizeText(text);
  if (!normalized) return [];
  return normalized.split(" ");
};

const jaccardSimilarity = (aTokens, bTokens) => {
  if (!aTokens.length || !bTokens.length) return 0;
  const aSet = new Set(aTokens);
  const bSet = new Set(bTokens);
  const intersection = [...aSet].filter((t) => bSet.has(t));
  const union = new Set([...aSet, ...bSet]);
  return union.size === 0 ? 0 : intersection.length / union.size;
};

const computeMatchScore = (lostPost, foundPost) => {
  const titleScore = jaccardSimilarity(
    tokenize(lostPost.title),
    tokenize(foundPost.title)
  );
  const locationScore = jaccardSimilarity(
    tokenize(lostPost.location),
    tokenize(foundPost.location)
  );
  const categoryScore = lostPost.category === foundPost.category ? 1 : 0;

  // Weighted score emphasizes title and location, category is a gate
  return 0.5 * titleScore + 0.3 * locationScore + 0.2 * categoryScore;
};

const findMatchesForLostPost = async (lostPost) => {
  if (!lostPost) return [];

  const candidates = await LostFound.find({
    postType: "found",
    status: "open",
    category: lostPost.category,
  }).sort({ createdAt: -1 });

  const scored = candidates
    .map((candidate) => ({
      candidate,
      score: computeMatchScore(lostPost, candidate),
    }))
    .filter((item) => item.score >= 0.35)
    .sort((a, b) => b.score - a.score);

  return scored.map((item) => item.candidate);
};

const createLostFoundPost = async (req, res) => {
  try {
    const {
      postType,
      title,
      description,
      category,
      location,
      date,
      contactInfo,
    } = req.body;

    if (!postType || !title || !description || !category || !location || !date) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
      });
    }

    if (!["lost", "found"].includes(postType)) {
      return res.status(400).json({
        success: false,
        message: "Invalid post type",
      });
    }

    if (postType === "found" && !req.file) {
      return res.status(400).json({
        success: false,
        message: "Photo is required for found items",
      });
    }

    let imageUrl = "";
    if (req.file) {
      imageUrl = await uploadToCloudinary(req.file.path);
    }

    const parsedDate = new Date(date);
    if (Number.isNaN(parsedDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: "Invalid date",
      });
    }

    const post = await LostFound.create({
      userId: req.user._id,
      postType,
      title,
      description,
      category,
      location,
      date: parsedDate,
      imageUrl,
      contactInfo: contactInfo || "",
    });

    let matches = [];
    if (post.postType === "lost") {
      matches = await findMatchesForLostPost(post);
    }

    res.status(201).json({
      success: true,
      message: "Post created successfully",
      post,
      matches,
    });
  } catch (error) {
    console.error("Create lost/found post error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while creating post",
    });
  }
};

const getLostPosts = async (req, res) => {
  try {
    const posts = await LostFound.find({ postType: "lost" }).sort({ createdAt: -1 });
    res.json({ success: true, posts });
  } catch (error) {
    console.error("Get lost posts error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching lost posts",
    });
  }
};

const getFoundPosts = async (req, res) => {
  try {
    const posts = await LostFound.find({ postType: "found" }).sort({ createdAt: -1 });
    res.json({ success: true, posts });
  } catch (error) {
    console.error("Get found posts error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching found posts",
    });
  }
};

const getUserPosts = async (req, res) => {
  try {
    const posts = await LostFound.find({ userId: req.user._id }).sort({
      createdAt: -1,
    });
    res.json({ success: true, posts });
  } catch (error) {
    console.error("Get user posts error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching user posts",
    });
  }
};

const deletePost = async (req, res) => {
  try {
    const { id } = req.params;
    const post = await LostFound.findOneAndDelete({
      _id: id,
      userId: req.user._id,
    });

    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found or access denied",
      });
    }

    res.json({ success: true, message: "Post deleted successfully" });
  } catch (error) {
    console.error("Delete post error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while deleting post",
    });
  }
};

const resolvePost = async (req, res) => {
  try {
    const { id } = req.params;
    const post = await LostFound.findOneAndUpdate(
      { _id: id, userId: req.user._id },
      { status: "resolved" },
      { new: true }
    );

    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found or access denied",
      });
    }

    res.json({
      success: true,
      message: "Post marked as resolved",
      post,
    });
  } catch (error) {
    console.error("Resolve post error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while resolving post",
    });
  }
};

const getMatchesByLostId = async (req, res) => {
  try {
    const { lostId } = req.params;
    const lostPost = await LostFound.findById(lostId);

    if (!lostPost || lostPost.postType !== "lost") {
      return res.status(404).json({
        success: false,
        message: "Lost item not found",
      });
    }

    const matches = await findMatchesForLostPost(lostPost);

    res.json({
      success: true,
      matches,
    });
  } catch (error) {
    console.error("Get matches error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching matches",
    });
  }
};

const markAsFound = async (req, res) => {
  try {
    const { id } = req.params;
    const { message = "" } = req.body;

    const lostPost = await LostFound.findById(id).select("postType userId title").lean();

    if (!lostPost) {
      return res.status(404).json({
        success: false,
        message: "Lost post not found",
      });
    }

    if (lostPost.postType !== "lost") {
      return res.status(400).json({
        success: false,
        message: "Mark as found is only available for lost posts",
      });
    }

    if (lostPost.userId.toString() === req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "You cannot claim your own lost post",
      });
    }

    const finderName = (req.user.fullName || req.user.name || "").trim();
    const finderStudentId = (
      req.user.studentId ||
      req.user.registrationNumber ||
      req.user.userId ||
      ""
    ).toString().trim();
    const finderPhone = (req.user.phoneNumber || req.user.phone || "Not provided")
      .toString()
      .trim();
    const finderEmail = (req.user.email || "").trim().toLowerCase();

    if (!finderName || !finderEmail) {
      return res.status(400).json({
        success: false,
        message: "Your profile is missing required details",
      });
    }

    const claim = await Claim.create({
      lostPostId: lostPost._id,
      finderId: req.user._id,
      ownerId: lostPost.userId,
      name: finderName,
      studentId: finderStudentId || "Not provided",
      phone: finderPhone,
      email: finderEmail,
      message: message.trim(),
    });

    await Notification.create({
      userId: lostPost.userId,
      type: "FOUND_MATCH",
      message: `${finderName} marked your lost item "${lostPost.title}" as found.`,
      relatedId: claim._id,
    });

    return res.status(201).json({
      success: true,
      message: "Claim submitted and owner notified",
      claimId: claim._id,
    });
  } catch (error) {
    console.error("Mark as found error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while creating claim",
    });
  }
};

// ============= COMMENT ENDPOINTS =============

/**
 * Add a comment/message to a LOST post
 * Only found item reporters can comment on lost posts
 */
const addComment = async (req, res) => {
  try {
    const { postId } = req.params;
    const { message, contactInfo } = req.body;

    // Validate input
    if (!message || message.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: "Message is required",
      });
    }

    // Get the post
    const post = await LostFound.findById(postId);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      });
    }

    // Can only comment on LOST posts
    if (post.postType !== "lost") {
      return res.status(400).json({
        success: false,
        message: "Comments are only allowed on lost item posts",
      });
    }

    // Owner cannot comment on own post
    if (post.userId.toString() === req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "You cannot comment on your own post",
      });
    }

    // Create comment
    const comment = await Comment.create({
      postId,
      senderId: req.user._id,
      receiverId: post.userId,
      message: message.trim(),
      contactInfo: contactInfo ? contactInfo.trim() : "",
      isReply: false,
      parentCommentId: null,
    });

    // Populate sender info
    await comment.populate("senderId", "name email");

    res.status(201).json({
      success: true,
      message: "Comment added successfully",
      comment,
    });
  } catch (error) {
    console.error("Add comment error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while adding comment",
    });
  }
};

/**
 * Get all comments for a lost post
 * ONLY the lost post owner can access this endpoint
 */
const getComments = async (req, res) => {
  try {
    const { postId } = req.params;

    // Get the post
    const post = await LostFound.findById(postId);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      });
    }

    // Only the post owner can view comments
    if (post.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "You can only view comments on your own lost posts",
      });
    }

    // Get all comments and replies for this post
    const comments = await Comment.find({ postId })
      .populate("senderId", "name email phoneNumber")
      .populate("parentCommentId")
      .sort({ createdAt: 1 })
      .lean();

    res.json({
      success: true,
      comments,
    });
  } catch (error) {
    console.error("Get comments error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching comments",
    });
  }
};

/**
 * Reply to a comment
 * ONLY the lost post owner can reply to comments
 */
const replyComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    const { message } = req.body;

    // Validate input
    if (!message || message.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: "Reply message is required",
      });
    }

    // Get the parent comment
    const parentComment = await Comment.findById(commentId);
    if (!parentComment) {
      return res.status(404).json({
        success: false,
        message: "Comment not found",
      });
    }

    // Get the lost post
    const post = await LostFound.findById(parentComment.postId);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      });
    }

    // Only the lost post owner can reply
    if (post.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Only the item owner can reply to comments",
      });
    }

    // Create reply
    const reply = await Comment.create({
      postId: parentComment.postId,
      senderId: req.user._id,
      receiverId: parentComment.senderId,
      message: message.trim(),
      contactInfo: "",
      isReply: true,
      parentCommentId: commentId,
    });

    // Populate sender info
    await reply.populate("senderId", "name email");

    res.status(201).json({
      success: true,
      message: "Reply added successfully",
      reply,
    });
  } catch (error) {
    console.error("Reply comment error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while replying to comment",
    });
  }
};

module.exports = {
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
};

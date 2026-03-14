const LostFound = require("../models/LostFound");
const { uploadImage } = require("../middleware/uploadMiddleware");

const escapeRegex = (value = "") => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const normalizeTokens = (text = "") =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((token) => token.length > 2);

const intersectionCount = (arrA, arrB) => {
  const setB = new Set(arrB);
  return arrA.reduce((count, value) => (setB.has(value) ? count + 1 : count), 0);
};

// Compute a simple heuristic similarity score between lost and found posts.
const calculateMatchScore = (lostPost, foundPost) => {
  let score = 0;
  const reasons = [];

  if (lostPost.category.toLowerCase() === foundPost.category.toLowerCase()) {
    score += 3;
    reasons.push("category");
  }

  const lostLocationTokens = normalizeTokens(lostPost.location);
  const foundLocationTokens = normalizeTokens(foundPost.location);
  const locationMatches = intersectionCount(lostLocationTokens, foundLocationTokens);
  if (locationMatches > 0) {
    score += 2;
    reasons.push("location");
  }

  const lostTextTokens = normalizeTokens(`${lostPost.title} ${lostPost.description}`);
  const foundTextTokens = normalizeTokens(`${foundPost.title} ${foundPost.description}`);
  const keywordMatches = intersectionCount(lostTextTokens, foundTextTokens);
  if (keywordMatches > 0) {
    score += Math.min(keywordMatches, 3);
    reasons.push("keywords");
  }

  return { score, reasons };
};

const findMatchesForLostPost = async (lostPost) => {
  const locationPattern = normalizeTokens(lostPost.location).map(escapeRegex).join("|");
  const candidates = await LostFound.find({
    postType: "found",
    status: "open",
    // Avoid matching against the same user's found post to reduce noise.
    userId: { $ne: lostPost.userId },
    // Keep candidate set small using broad category/location pre-filter.
    $or: [
      { category: new RegExp(escapeRegex(lostPost.category), "i") },
      ...(locationPattern ? [{ location: new RegExp(locationPattern, "i") }] : []),
    ],
  }).sort({ createdAt: -1 });

  const scored = candidates
    .map((foundPost) => {
      const { score, reasons } = calculateMatchScore(lostPost, foundPost);
      return { foundPost, score, reasons };
    })
    .filter((entry) => entry.score >= 4)
    .sort((a, b) => b.score - a.score || b.foundPost.createdAt - a.foundPost.createdAt)
    .slice(0, 10);

  return scored.map((entry) => ({
    ...entry.foundPost.toObject(),
    matchScore: entry.score,
    matchReasons: entry.reasons,
  }));
};

/**
 * POST /api/lostfound
 * Create a lost/found post. If lost post, return possible matches.
 */
const createPost = async (req, res) => {
  try {
    const {
      postType,
      title,
      description,
      category,
      location,
      date,
      contactInfo = "",
    } = req.body;

    if (!["lost", "found"].includes(postType)) {
      return res.status(400).json({
        success: false,
        message: "postType must be either 'lost' or 'found'",
      });
    }

    if (!title || !description || !category || !location || !date) {
      return res.status(400).json({
        success: false,
        message: "Title, description, category, location, and date are required",
      });
    }

    if (Number.isNaN(new Date(date).getTime())) {
      return res.status(400).json({
        success: false,
        message: "Invalid date value",
      });
    }

    if (postType === "found" && !req.file) {
      return res.status(400).json({
        success: false,
        message: "Found item image is required",
      });
    }

    let imageUrl = "";
    if (req.file?.path) {
      imageUrl = await uploadImage(req.file.path);
    }

    const post = await LostFound.create({
      userId: req.user.id,
      postType,
      title: title.trim(),
      description: description.trim(),
      category: category.trim(),
      location: location.trim(),
      date: new Date(date),
      imageUrl,
      contactInfo: contactInfo?.trim() || "",
      status: "open",
    });

    if (postType === "lost") {
      const matches = await findMatchesForLostPost(post);
      return res.status(201).json({
        success: true,
        message: "Lost item reported successfully",
        post,
        hasMatches: matches.length > 0,
        matches,
      });
    }

    return res.status(201).json({
      success: true,
      message: "Found item reported successfully",
      post,
      hasMatches: false,
      matches: [],
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

const getLostPosts = async (req, res) => {
  try {
    const posts = await LostFound.find({ postType: "lost" }).sort({ createdAt: -1 });
    return res.json({ success: true, posts });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const getFoundPosts = async (req, res) => {
  try {
    const posts = await LostFound.find({ postType: "found" }).sort({ createdAt: -1 });
    return res.json({ success: true, posts });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const getCurrentUserPosts = async (req, res) => {
  try {
    const posts = await LostFound.find({ userId: req.user.id }).sort({ createdAt: -1 });
    return res.json({ success: true, posts });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const deletePost = async (req, res) => {
  try {
    const deleted = await LostFound.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.id,
    });

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: "Post not found or you are not authorized to delete it",
      });
    }

    return res.json({
      success: true,
      message: "Post deleted successfully",
    });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

const markAsResolved = async (req, res) => {
  try {
    const post = await LostFound.findOne({
      _id: req.params.id,
      userId: req.user.id,
    });

    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found or you are not authorized to update it",
      });
    }

    post.status = "resolved";
    await post.save();

    return res.json({
      success: true,
      message: "Post marked as resolved",
      post,
    });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

/**
 * GET /api/lostfound/matches/:lostId
 * Return matched found posts for a specific lost post.
 */
const getMatchesByLostId = async (req, res) => {
  try {
    const lostPost = await LostFound.findOne({
      _id: req.params.lostId,
      userId: req.user.id,
      postType: "lost",
    });

    if (!lostPost) {
      return res.status(404).json({
        success: false,
        message: "Lost item not found",
      });
    }

    const matches = await findMatchesForLostPost(lostPost);
    return res.json({
      success: true,
      lostPost,
      count: matches.length,
      matches,
    });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

module.exports = {
  createPost,
  getLostPosts,
  getFoundPosts,
  getCurrentUserPosts,
  deletePost,
  markAsResolved,
  getMatchesByLostId,
};

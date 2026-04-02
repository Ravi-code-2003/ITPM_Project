const groqService = require("../services/groqService");

const WINDOW_MS = parseInt(process.env.AI_RATE_LIMIT_WINDOW_MS, 10) || 60 * 1000;
const MAX_REQUESTS = parseInt(process.env.AI_RATE_LIMIT_MAX, 10) || 10;

const requestBuckets = new Map();

const aiRateLimiter = (req, res, next) => {
  const userId = req.user?._id?.toString();
  const ip = req.ip || req.connection?.remoteAddress || "unknown";
  const key = `${userId || "anonymous"}:${ip}`;

  const now = Date.now();
  const bucket = requestBuckets.get(key) || { count: 0, startTime: now };

  if (now - bucket.startTime > WINDOW_MS) {
    bucket.count = 0;
    bucket.startTime = now;
  }

  bucket.count += 1;
  requestBuckets.set(key, bucket);

  if (bucket.count > MAX_REQUESTS) {
    return res.status(429).json({
      message: groqService.getRateLimitResponse(),
    });
  }

  return next();
};

module.exports = aiRateLimiter;

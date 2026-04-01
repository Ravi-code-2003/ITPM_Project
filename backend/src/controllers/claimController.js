const Claim = require("../models/Claim");

const getClaimDetails = async (req, res) => {
  try {
    const { claimId } = req.params;

    const claim = await Claim.findById(claimId)
      .select("_id lostPostId ownerId name studentId phone email message status createdAt")
      .lean();

    if (!claim) {
      return res.status(404).json({
        success: false,
        message: "Claim not found",
      });
    }

    if (claim.ownerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized to view this claim",
      });
    }

    return res.json({
      success: true,
      claim: {
        _id: claim._id,
        lostPostId: claim.lostPostId,
        name: claim.name,
        studentId: claim.studentId,
        phone: claim.phone,
        email: claim.email,
        message: claim.message,
        status: claim.status,
        createdAt: claim.createdAt,
      },
    });
  } catch (error) {
    console.error("Get claim details error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while fetching claim details",
    });
  }
};

module.exports = {
  getClaimDetails,
};

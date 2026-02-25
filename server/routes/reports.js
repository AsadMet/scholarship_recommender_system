const express = require("express")
const User = require("../models/User")
const Scholarship = require("../models/Scholarship")
const adminAuth = require("../middleware/adminAuth")
const router = express.Router()


// Get dashboard statistics
router.get("/stats", adminAuth, async (req, res) => {
  try {
    const totalUsers = await User.countDocuments({ role: "user" })
    const totalScholarships = await Scholarship.countDocuments()
    const activeScholarships = await Scholarship.countDocuments({ status: "active" })
    // Count total application entries across all scholarships (sum of applicants array sizes)
    const totalApplications = await Scholarship.aggregate([
      { $project: { numApplicants: { $size: { $ifNull: ["$applicants", []] } } } },
      { $group: { _id: null, total: { $sum: "$numApplicants" } } },
    ])

    const recentUsers = await User.find({ role: "user" })
      .select("name email createdAt")
      .sort({ createdAt: -1 })
      .limit(5)

    const recentApplications = await Scholarship.aggregate([
      { $unwind: "$applicants" },
      { $sort: { "applicants.appliedDate": -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: "users",
          localField: "applicants.user",
          foreignField: "_id",
          as: "user",
        },
      },
      {
        $project: {
          title: 1,
          "user.name": 1,
          "user.email": 1,
          "applicants.appliedDate": 1,
          "applicants.status": 1,
        },
      },
    ])

    res.json({
      stats: {
        totalUsers,
        totalScholarships,
        activeScholarships,
        totalApplications: totalApplications[0]?.total || 0,
      },
      recentUsers,
      recentApplications,
    })
  } catch (error) {
    console.error("Get stats error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// Get user analytics
router.get("/users", adminAuth, async (req, res) => {
  try {
    const usersByMonth = await User.aggregate([
      {
        $match: { role: "user" },
      },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
          },
          count: { $sum: 1 },
        },
      },
      {
        $sort: { "_id.year": 1, "_id.month": 1 },
      },
    ])

    const usersByMajor = await User.aggregate([
      {
        $match: {
          role: "user",
          "profile.major": { $exists: true, $ne: null },
        },
      },
      // Split, filter out empty parts, uppercase each, then join with single spaces to normalize
      {
        $project: {
          parts: {
            $filter: {
              input: { $split: ["$profile.major", " "] },
              as: "p",
              cond: { $ne: ["$$p", ""] },
            },
          },
        },
      },
      {
        $project: {
          majorNorm: {
            $trim: {
              input: {
                $reduce: {
                  input: "$parts",
                  initialValue: "",
                  in: {
                    $cond: [
                      { $eq: ["$$value", ""] },
                      { $toUpper: "$$this" },
                      { $concat: ["$$value", " ", { $toUpper: "$$this" }] },
                    ],
                  },
                },
              },
            },
          },
        },
      },
      {
        $group: {
          _id: "$majorNorm",
          count: { $sum: 1 },
        },
      },
      {
        $sort: { count: -1 },
      },
    ])

    res.json({
      usersByMonth,
      usersByMajor,
    })
  } catch (error) {
    console.error("Get user analytics error:", error)
    res.status(500).json({ message: "Server error" })
  }
})



module.exports = router

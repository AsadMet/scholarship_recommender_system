const mongoose = require("mongoose")

const scholarshipSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    deadline: {
      type: Date,
      required: false,
      default: null,
    },
    extractedDeadline: {
      type: String,
    },
    requirements: {
      minGPA: {
        type: Number,
        default: 0,
      },
      majors: [String],
      ageLimit: {
        min: { type: Number, default: null },
        max: { type: Number, default: null },
      },
    },
    provider: {
      name: String,
      website: String,
    },
    // Direct contact email extracted from the page (normalized)
    contactEmail: {
      type: String,
      trim: true,
    },
    studyLevel: {
      type: String,
    },
    studyLevels: [String],
    // List of eligible courses/fields/programmes for application
    eligibleCourses: [String],
    // Detailed description of the scholarship for content-based filtering
    description: {
      type: String,
      default: "",
      trim: true,
    },
    // Keywords extracted from the scholarship for better matching
    keywords: {
      type: [String],
      default: [],
    },
    // Category for easier filtering (e.g., STEM, Arts, Business)
    category: {
      type: String,
      default: "General",
      trim: true,
    },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
    applicants: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        appliedDate: {
          type: Date,
          default: Date.now,
        },
        status: {
          type: String,
          enum: ["pending", "accepted", "rejected"],
          default: "pending",
        },
      },
    ],
    // NEW: track the source page URL to uniquely identify a scholarship
    sourceUrl: {
      type: String,
      required: true,
      trim: true,
    },
  },
  {
    timestamps: true,
  },
)

// Prevent duplicates: one record per sourceUrl
scholarshipSchema.index({ sourceUrl: 1 }, { unique: true })

module.exports = mongoose.model("Scholarship", scholarshipSchema)

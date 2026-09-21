import mongoose from "mongoose";

const reportSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
    },

    studentName: {
      type: String,
      required: true,
    },

    offense: {
      type: String,
      required: true,
    },

    location: {
      type: String,
      required: true,
    },

    date: {
      type: Date,
      required: true,
    },

    time: String,

    description: {
      type: String,
      required: true,
    },

    evidence: [
      {
        url: {
          type: String,
          required: true,
        },

        type: {
          type: String,
          enum: ["image", "video", "document"],
        },

        uploadedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    reporterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },

    reporterType: {
      type: String,
      enum: ["student", "teacher", "admin", "guest"],
      default: "student",
    },
    

    teacherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Teacher",
      default: null,
    },

    status: {
      type: String,
      enum: ["pending", "accepted", "rejected", "under_review"],
      default: "pending",
    },

    // ============================================================
    // GEMINI AI REVIEW
    // ============================================================
    //
    // This section stores Gemini's review of a pending report.
    //
    // IMPORTANT:
    // - AI does NOT automatically accept/reject the report.
    // - AI cannot prove that evidence is authentic.
    // - AI only evaluates apparent severity, risk, and
    //   consistency/relevance of the submitted evidence.
    //
    aiReview: {
      analyzed: {
        type: Boolean,
        default: false,
      },

      analyzedAt: {
        type: Date,
        default: null,
      },

      model: {
        type: String,
        default: null,
      },

      // Overall risk/urgency of the report.
      riskLevel: {
        type: String,
        enum: ["Low", "Medium", "High"],
        default: null,
      },

      // Apparent seriousness of the reported incident.
      severity: {
        type: String,
        enum: ["Low", "Medium", "High"],
        default: null,
      },

      // Explanation of why Gemini assigned the severity.
      severityReason: {
        type: String,
        default: "",
      },

      // Suggested review urgency.
      // This does NOT mean the report should automatically
      // be accepted or rejected.
      reviewPriority: {
        type: String,
        enum: ["Low", "Medium", "High"],
        default: null,
      },

      // AI assessment of the submitted evidence.
      //
      // "Consistent" does NOT mean the evidence is proven authentic.
      evidenceAssessment: {
        type: String,
        enum: [
          "Relevant",
          "Consistent",
          "Partially Consistent",
          "Inconsistent",
          "Insufficient",
          "Unable to Verify",
        ],
        default: null,
      },

      // Confidence specifically related to the evidence assessment.
      // Stored as a number from 0-100.
      evidenceConfidence: {
        type: Number,
        min: 0,
        max: 100,
        default: null,
      },

      // Specific observations Gemini made about the evidence.
      evidenceFindings: {
        type: [String],
        default: [],
      },

      // Important limitations of the AI analysis.
      limitations: {
        type: [String],
        default: [],
      },

      // Short overall explanation for the reviewer.
      summary: {
        type: String,
        default: "",
      },

      // Number of image evidence files actually analyzed.
      analyzedImageCount: {
        type: Number,
        default: 0,
      },

      // Number of evidence files that were not visually analyzed
      // by this endpoint, such as video/document files.
      unanalyzedEvidenceCount: {
        type: Number,
        default: 0,
      },

      // Stores an error if the previous AI analysis failed.
      // This allows the frontend to display a useful state.
      error: {
        type: String,
        default: "",
      },
    },
  },
  {
    timestamps: true,
  }
);

const Report =
  mongoose.models.Report || mongoose.model("Report", reportSchema);

export default Report;
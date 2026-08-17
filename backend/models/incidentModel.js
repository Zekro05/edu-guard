import mongoose from "mongoose";

const incidentSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
      index: true,
    },

    reportId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Report",
      index: true,
    },

    /* ================= STATUS FLOW ================= */
    status: {
      type: String,
      enum: [
        "received",
        "saved-student-statement",
        "reviewing",
        "refer-for-intervention",
        "intervention-ready",
        "completed",
      ],
      default: "received",
      index: true,
    },

    completedAt: {
      type: Date,
      default: null,
    },

    /* ================= CASE INFO ================= */
    title: {
      type: String,
      required: true,
    },

    category: {
      type: String,
      default: "Uncategorized",
    },

    action: {
      type: String,
      default: "",
    },

    level: {
      type: String,
      enum: ["Low", "Medium", "High"],
      default: "Low",
    },

    escalationInfo: {
  involvedPersons: String,
  additionalParticipants: String,
  approvalDetails: String,
},

    /* ================= STATEMENTS ================= */
    studentStatement: {
      type: String,
      default: "",
    },

    statementStatus: {
      type: String,
      enum: [
        "not_requested",
        "waiting_for_response",
        "submitted",
        "manual_entry",
      ],
      default: "not_requested",
    },

    statementRequestedAt: {
      type: Date,
      default: null,
    },

    statementSubmittedAt: {
      type: Date,
      default: null,
    },

    /* ================= EVIDENCE ================= */
    evidence: [
      {
        url: String,
        type: String,
        filename: String,

        uploadedAt: {
          type: Date,
          default: Date.now,
        },

        uploadedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },

        size: Number,
      },
    ],

    /* ================= 👤 REVIEW TRACKING ================= */
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    reviewedByName: {
      type: String,
      default: null,
    },

    /* ================= 🧾 AUDIT TRAIL ================= */
    caseLogs: [
      {
        stage: {
          type: String,
          enum: [
            "received",
            "saved-student-statement",
            "reviewing",
            "refer-for-intervention",
            "intervention-ready",
            "completed",
          ],
          required: true,
        },

        note: {
          type: String,
          default: "",
        },

        changedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },

        changedByName: {
          type: String,
          default: "N/A",
          required: false,
        },

        time: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },

  {
    timestamps: true, // createdAt + updatedAt
  }
);

/* ================= MODEL EXPORT ================= */
export default mongoose.models.Incident || mongoose.model("Incident", incidentSchema);
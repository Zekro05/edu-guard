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
    status: {
  type: String,
  enum: [
    "received",
    "reviewing",
    "waiting_for_student",
    "escalated",
    "intervention-ready",
    "completed",
  ],
  default: "received",
},

completedAt: {
  type: Date,
  default: null,
},

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
      default: "Pending review",
    },

    level: {
      type: String,
      enum: ["Low", "Medium", "High"],
      default: "Low",
    },

    studentStatement: {
  type: String,
  default: "",
},

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

caseLogs: [
  {
    stage: String,
    note: String,
    time: {
      type: Date,
      default: Date.now,
    },
  },
],
  },
  {
    timestamps: true, // createdAt + updatedAt (USE THIS IN FRONTEND)
  }
);

export default mongoose.model("Incident", incidentSchema);
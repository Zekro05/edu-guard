import mongoose from "mongoose";

const caseSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
    },

    offense: {
      type: String,
      required: true,
    },

    severity: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "low",
    },

    recommendation: {
      type: String,
      enum: [
        "warning",
        "detention",
        "call a parent",
        "community service",
        "suspension",
      ],
      default: "warning",
    },

    notes: {
      type: String,
      default: "",
    },

    status: {
      type: String,
      enum: ["pending", "reviewed", "escalated", "closed"],
      default: "pending",
    },

    reviewedBy: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Case", caseSchema);
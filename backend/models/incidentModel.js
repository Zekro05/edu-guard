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
  },
  {
    timestamps: true, // createdAt + updatedAt (USE THIS IN FRONTEND)
  }
);

export default mongoose.model("Incident", incidentSchema);
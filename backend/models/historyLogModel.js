import mongoose from "mongoose";

const historyLogSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    role: {
      type: String,
      enum: ["Admin", "Guidance", "Teacher", "Student"],
      required: true,
    },

    action: {
      type: String,
      required: true,
    },

    category: {
      type: String,
      enum: ["Auth", "Incident", "Student", "System", "Backup"], // ✅ ADD BACKUP
      required: true,
    },

    details: {
      type: String,
      default: "",
    },

    ipAddress: {
      type: String,
    },

    // ✅ ADD THESE FOR BACKUP SYSTEM
    fileName: {
      type: String,
      default: "",
    },

    fileUrl: {
      type: String,
      default: "",
    },

    status: {
      type: String,
      enum: ["success", "failed"],
      default: "success",
    },

    type: {
      type: String,
      enum: ["manual", "auto"],
    },
  },
  { timestamps: true }
);

export default mongoose.model("HistoryLog", historyLogSchema);
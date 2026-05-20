import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: String,
    message: String,
    type: {
      type: String,
      enum: ["update", "success", "general", "warning", "rejected"],
      default: "general",
    },
    priority: {
      type: String,
      enum: ["low", "high"],
      default: "low",
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    data: {
      type: Object,
      default: {},
    },
  },
  { timestamps: true }
);

export default mongoose.model("Notification", notificationSchema);
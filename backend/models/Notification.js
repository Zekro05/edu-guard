import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
    },
    title: String,
    message: String,
    type: {
      type: String,
      default: "general", // update | success | general
    },
    priority: {
      type: String,
      default: "low", // low | high
    },
    isRead: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Notification", notificationSchema);
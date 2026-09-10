import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
    },

    message: {
      type: String,
      required: true,
      trim: true,
    },

    type: {
      type: String,
      enum: [
        "message",
        "report",
        "incident",
        "update",
        "success",
        "warning",
        "rejected",
        "general",
      ],
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
      index: true,
    },

    readAt: {
      type: Date,
      default: null,
    },

    relatedId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },

    relatedType: {
      type: String,
      enum: [
        "Message",
        "Report",
        "Incident",
        "System",
        null,
      ],
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

notificationSchema.index({
  user: 1,
  isRead: 1,
  createdAt: -1,
});

export default mongoose.model(
  "Notification",
  notificationSchema,
);
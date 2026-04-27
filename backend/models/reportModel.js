import mongoose from "mongoose";

const reportSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
    },

    studentName: { type: String, required: true }, // keep for display (optional but useful)

    offense: { type: String, required: true },
    location: { type: String, required: true },
    date: { type: String, required: true },
    time: { type: String },
    description: { type: String, required: true },

    reporter: { type: String, required: true },
    reporterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    status: {
      type: String,
      enum: ["pending", "accepted", "rejected"],
      default: "pending",
    },
  },
  { timestamps: true }
);

export default mongoose.model("Report", reportSchema);
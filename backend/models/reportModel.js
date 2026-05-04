import mongoose from "mongoose";

const reportSchema = new mongoose.Schema(
  {
    /* ================= TARGET STUDENT ================= */
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
    },

    studentName: {
      type: String,
      required: true,
    },

    /* ================= INCIDENT INFO ================= */
    offense: {
      type: String,
      required: true,
    },

    location: {
      type: String,
      required: true,
    },

    date: {
      type: String,
      required: true,
    },

    time: {
      type: String,
    },

    description: {
      type: String,
      required: true,
    },

    /* ================= REPORTER INFO ================= */
    reporter: {
      type: String,
      required: true,
    },

    reporterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // 🔥 NEW: WHO CREATED THE REPORT
    reporterType: {
      type: String,
      enum: ["student", "teacher", "admin"],
      default: "student",
    },

    // 🔥 OPTIONAL: link to teacher profile (if reporter is teacher)
    teacherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Teacher",
      default: null,
    },

    /* ================= STATUS ================= */
    status: {
      type: String,
      enum: ["pending", "accepted", "rejected"],
      default: "pending",
    },
  },
  { timestamps: true }
);

export default mongoose.model("Report", reportSchema);
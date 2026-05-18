import mongoose from "mongoose";

const reportSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
    },

    studentName: {
  type: String,
  required: true,
},

    offense: { type: String, required: true },
    location: { type: String, required: true },

    date: {
      type: Date,
      required: true,
    },

    time: String,

    description: { type: String, required: true },

    evidence: [{
    url: { type: String, required: true },
    type: { type: String, enum: ['image', 'video', 'document'] },
    uploadedAt: { type: Date, default: Date.now }
  }],

    reporterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },

    reporterType: {
      type: String,
      enum: ["student", "teacher", "admin", "guest"], 
      default: "student",
    },

    teacherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Teacher",
      default: null,
    },
    
    status: {
      type: String,
      enum: ["pending", "accepted", "rejected"],
      default: "pending",
    },
  },
  { timestamps: true }
);

const Report =
  mongoose.models.Report || mongoose.model("Report", reportSchema);


export default Report;
// backend/models/Report.js
import mongoose from "mongoose";

const ReportSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ["mobile", "incident", "complaint", "overview", "ai"],
    required: true,
  },
  studentName: String,
  offenseType: String,
  location: String,
  description: String,
  date: Date,
  time: String,
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
}, { timestamps: true });

const Report = mongoose.model("Report", ReportSchema);

export default Report;

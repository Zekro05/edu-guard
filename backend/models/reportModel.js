import mongoose from "mongoose";

const reportSchema = new mongoose.Schema({
  studentName: { type: String, required: true },
  offense: { type: String, required: true },
  location: { type: String, required: true },
  date: { type: String, required: true },
  time: { type: String },
  description: { type: String, required: true },

  professorId: { type: String, required: true },

  status: { type: String, enum: ["pending", "accepted", "rejected"], default: "pending" }
}, { timestamps: true });

export default mongoose.model("Report", reportSchema);
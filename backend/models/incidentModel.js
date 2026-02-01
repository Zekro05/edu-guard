
import mongoose from "mongoose";

const incidentSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: "Student", required: true },
  title: { type: String, required: true },
  date: { type: Date, default: Date.now },
  category: { type: String },
  action: { type: String },
  level: { type: String, enum: ["Low", "Medium", "High"], default: "Low" },
}, { timestamps: true });


export default mongoose.model("Incident", incidentSchema);
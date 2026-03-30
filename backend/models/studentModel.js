import mongoose from "mongoose";

const studentSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: true,
      trim: true,
    },

    middleName: {
      type: String,
      trim: true,
    },

    lastName: {
      type: String,
      required: true,
      trim: true,
    },

    grade: {
      type: String,
      required: true,
    },

    studentId: {
      type: String,
      unique: true,
      sparse: true,
    },

    email: {
      type: String,
      lowercase: true,
      trim: true,
    },

    phone: {
      type: String,
    },

    gender: {
      type: String,
      enum: ["Male", "Female"],
      default: "",
    },

    profilePhoto: {
      type: String,
      default: "",
    },

    riskLevel: {
      type: String,
      enum: ["Low", "Medium", "High"],
      default: "Low",
    },

    notes: {
      type: String,
    },

    totalIncidents: {
      type: Number,
      default: 0,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

// ✅ CREATE MODEL
const Student = mongoose.model("Student", studentSchema);

// ✅ KEEP DEFAULT EXPORT (for your existing system)
export default Student;

// ✅ ADD THESE FOR BACKUP SYSTEM
export const find = () => Student.find();
export const deleteMany = (query) => Student.deleteMany(query);
export const insertMany = (data) => Student.insertMany(data);
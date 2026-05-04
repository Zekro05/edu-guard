import mongoose from "mongoose";

const teacherSchema = new mongoose.Schema(
  {
    /* ================= PERSONAL INFO ================= */
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

    gender: {
      type: String,
      enum: ["Male", "Female"],
      default: "",
    },

    /* ================= SCHOOL INFO ================= */
    employeeId: {
      type: String,
      required: true,
      unique: true,
      sparse: true,
    },

    department: {
      type: String,
      default: "",
    },

    email: {
      type: String,
      lowercase: true,
      trim: true,
      unique: true,
      required: true,
    },

    phone: {
      type: String,
    },

    /* ================= SYSTEM INFO ================= */
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

    /* ================= RELATION ================= */
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

/* ================= MODEL ================= */
const Teacher = mongoose.model("Teacher", teacherSchema);

export default Teacher;

/* ================= BACKWARD COMPAT (optional like Student) ================= */
export const find = () => Teacher.find();
export const deleteMany = (query) => Teacher.deleteMany(query);
export const insertMany = (data) => Teacher.insertMany(data);
import mongoose from "mongoose";

const teacherSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true },
    middleName: { type: String },
    lastName: { type: String, required: true },

    email: { type: String, required: true, unique: true },

    employeeId: { type: String, required: true }, // 🔥 teacher version of studentId
    department: { type: String },

    profilePhoto: { type: String },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

export default mongoose.model("Teacher", teacherSchema);
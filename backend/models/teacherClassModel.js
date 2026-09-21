import mongoose from "mongoose";

const teacherClassRosterSchema = new mongoose.Schema(
  {
    teacherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },

    studentIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Student",
        required: true,
      },
    ],
  },
  {
    timestamps: true,
  },
);

teacherClassRosterSchema.index(
  { teacherId: 1 },
  { unique: true },
);

export default mongoose.models.TeacherClassRoster ||
  mongoose.model(
    "TeacherClassRoster",
    teacherClassRosterSchema,
  );
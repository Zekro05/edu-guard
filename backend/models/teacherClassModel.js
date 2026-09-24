import mongoose from "mongoose";

const teacherClassRosterSchema = new mongoose.Schema(
  {
    teacherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
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

// One unique index for each teacher
teacherClassRosterSchema.index(
  { teacherId: 1 },
  { unique: true },
);

export default mongoose.models.TeacherClassRoster ||
  mongoose.model(
    "TeacherClassRoster",
    teacherClassRosterSchema,
  );
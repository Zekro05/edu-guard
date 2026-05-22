import mongoose from "mongoose";

const interventionSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
    },

    incidentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Incident",
      required: true,
    },

    type: {
      type: String,
      enum: ["warning", "detention", "call a parent", "community service", "suspension"],
      required: true,
    },

    description: {
      type: String,
      default: "",
    },

    status: {
      type: String,
      enum: ["active", "resolved", "completed"],
      default: "active",
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
     interventionBy: {
    type: String,
    default: "Unknown Admin",
  },
  approvedBy: {
    type: String,
    default: "",
  },
completedBy: {
    type: String,
    default: "",
  },
auditLogs: [
    {
      action: String,
      note: String,

      by: {
        type: String,
        default: "System",
      },

      time: {
        type: Date,
        default: Date.now,
      },
    },
  ],

  },
  { timestamps: true }
);

export default mongoose.model("Intervention", interventionSchema);
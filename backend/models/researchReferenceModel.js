import mongoose from "mongoose";

const researchReferenceSchema = new mongoose.Schema(
  {
    referenceId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },

    type: {
      type: String,
      enum: ["RRL", "RRS"],
      required: true,
      default: "RRS",
    },

    category: {
      type: String,
      required: true,
      enum: [
        "Bullying",
        "Discipline",
        "Attendance",
        "Classroom Behavior",
        "Communication",
        "Counseling",
        "Mentoring",
        "Student Intervention",
        "Student Engagement",
      ],
      index: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
    },

    authors: {
      type: [String],
      default: [],
    },

    year: {
      type: Number,
      required: true,
    },

    journal: {
      type: String,
      default: "",
    },

    volume: {
      type: String,
      default: "",
    },

    issue: {
      type: String,
      default: "",
    },

    pages: {
      type: String,
      default: "",
    },

    doi: {
      type: String,
      default: "",
      trim: true,
    },

    sourceUrl: {
      type: String,
      default: "",
      trim: true,
    },

    keywords: {
      type: [String],
      default: [],
      index: true,
    },

    findings: {
      type: String,
      required: true,
    },

    recommendationTypes: {
      type: [String],
      default: [],
    },

    recommendedAction: {
      type: String,
      default: "",
    },

    evidenceLevel: {
      type: String,
      default: "Systematic review or meta-analysis",
    },

    approved: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
  },
);

export default
  mongoose.models.ResearchReference ||
  mongoose.model(
    "ResearchReference",
    researchReferenceSchema,
  );
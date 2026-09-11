import dotenv from "dotenv";
import mongoose from "mongoose";
import path from "path";
import { fileURLToPath } from "url";

// Get the project root:
// edu-guard/backend/scripts/seedResearchReferences.js
//                         ↑
// We need to go:
// scripts -> backend -> edu-guard
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const projectRoot = path.resolve(__dirname, "../../");

// Explicitly load the ROOT .env file
dotenv.config({
  path: path.join(projectRoot, ".env"),
});

console.log("====================================");
console.log("📚 RESEARCH REFERENCE SEED");
console.log("====================================");
console.log("📁 Project root:", projectRoot);
console.log("🔑 MONGO_URI loaded:", !!process.env.MONGO_URI);

if (!process.env.MONGO_URI) {
  console.error("");
  console.error("❌ MONGO_URI was not found.");
  console.error("");
  console.error("Expected .env location:");
  console.error(path.join(projectRoot, ".env"));
  console.error("");
  console.error("Make sure your .env contains:");
  console.error("MONGO_URI=your_mongodb_connection_string");
  console.error("");
  process.exit(1);
}

import ResearchReference from "../models/researchReferenceModel.js";
import researchReferences from "../data/researchReferences.js";

const seedResearchReferences = async () => {
  try {
    console.log("🔌 Connecting to MongoDB...");

    await mongoose.connect(process.env.MONGO_URI);

    console.log("✅ MongoDB connected");
    console.log("");

    console.log(
      `📚 Seeding ${researchReferences.length} research references...`
    );

    for (const reference of researchReferences) {
      await ResearchReference.findOneAndUpdate(
        { referenceId: reference.referenceId },
        reference,
        {
          upsert: true,
          new: true,
          setDefaultsOnInsert: true,
        }
      );
    }

    console.log("");
    console.log(
      `✅ ${researchReferences.length} research references seeded successfully.`
    );

    const count = await ResearchReference.countDocuments({
      approved: true,
    });

    console.log(`📖 Approved research references: ${count}`);

    console.log("");
    console.log("====================================");
    console.log("🎉 SEED COMPLETE");
    console.log("====================================");

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error("");
    console.error("===== FULL ERROR =====");
    console.error(error);
    console.error("======================");

    try {
      await mongoose.connection.close();
    } catch {}

    process.exit(1);
  }
};

seedResearchReferences();
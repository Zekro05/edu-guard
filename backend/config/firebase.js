import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import admin from "firebase-admin";

// Get backend/config directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from project root
dotenv.config({
  path: path.resolve(__dirname, "../../.env"),
});

console.log("🔥 FIREBASE ENV CHECK");
console.log("PROJECT ID:", process.env.FIREBASE_PROJECT_ID);
console.log("CLIENT EMAIL:", process.env.FIREBASE_CLIENT_EMAIL);
console.log(
  "PRIVATE KEY EXISTS:",
  !!process.env.FIREBASE_PRIVATE_KEY
);

const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(
  /\\n/g,
  "\n"
);

if (!process.env.FIREBASE_PROJECT_ID) {
  throw new Error("FIREBASE_PROJECT_ID is missing from .env");
}

if (!process.env.FIREBASE_CLIENT_EMAIL) {
  throw new Error("FIREBASE_CLIENT_EMAIL is missing from .env");
}

if (!privateKey) {
  throw new Error("FIREBASE_PRIVATE_KEY is missing from .env");
}

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey,
    }),
  });
}

console.log("✅ Firebase Admin initialized");

export default admin;
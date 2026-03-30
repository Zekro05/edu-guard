// backend/utils/firebase.js
import fs from "fs";
import path from "path";
import { initializeApp, cert } from "firebase-admin/app";
import { getStorage } from "firebase-admin/storage";

const serviceAccountPath = path.join(process.cwd(), "backend/config/firebaseKey.json");
const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, "utf-8"));

const app = initializeApp({
  credential: cert(serviceAccount),
  storageBucket: "eduguard-system-4f3d4.appspot.com", // replace with your bucket name
});

const bucket = getStorage().bucket();

export const uploadFileToFirebase = async (filePath, destName) => {
  try {
    await bucket.upload(filePath, { destination: destName, gzip: true });
    console.log(`Uploaded ${destName} to Firebase successfully.`);
  } catch (err) {
    console.error("Firebase upload failed:", err.message);
  }
};
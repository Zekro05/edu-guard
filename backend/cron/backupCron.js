import cron from "node-cron";
import axios from "axios";

const BASE_URL =
  process.env.BASE_URL || "https://edu-guard-backend.onrender.com";

// every day at 12 AM
cron.schedule("0 0 * * *", async () => {
  try {
    await axios.get(`${BASE_URL}/api/backup?type=auto`);
    console.log("Auto backup success");
  } catch (err) {
    console.log("Auto backup failed:", err.message);
  }
});
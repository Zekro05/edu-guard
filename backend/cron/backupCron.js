import cron from "node-cron";
import axios from "axios";

const API =
  process.env.BASE_URL || "https://edu-guard-backend.onrender.com";
cron.schedule("0 0 * * *", async () => {
  try {
    await API.get(`${BASE_URL}/api/backup?type=auto`);
    console.log("Auto backup success");
  } catch (err) {
    console.log("Auto backup failed:", err.message);
  }
});
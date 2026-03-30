import cron from "node-cron";
import axios from "axios";

// every day at 12 AM
cron.schedule("0 0 * * *", async () => {
  try {
    await axios.get("http://localhost:5000/api/backup?type=auto");
    console.log("Auto backup success");
  } catch (err) {
    console.log("Auto backup failed");
  }
});
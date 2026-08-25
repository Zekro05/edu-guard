import dotenv from "dotenv";
dotenv.config();

import admin from "../backend/config/firebase.js";

/*
=========================================================
WEB FCM TOKEN
=========================================================
*/

const token =
  "e2HQ_HgQFUIFt9-QsZHSLw:APA91bH1LBnHE0epDEQZ_ocCi7qMmVhzPyM8BRYbKpe1sHs6ut0XbuYe-d6mHcIbyyBqMvaVMfjCmV0LlWYdWZYZ89CbKbXaUYyn8PggXFIVH18rjAycUtc";

/*
=========================================================
TEST MESSAGE
=========================================================
*/

const message = {
  notification: {
    title: "EduGuard Test",
    body: "This is a test notification.",
  },

  token,
};

/*
=========================================================
SEND NOTIFICATION
=========================================================
*/

try {
  const response = await admin.messaging().send(message);

  console.log("====================================");
  console.log("✅ FCM NOTIFICATION SENT!");
  console.log("Message ID:");
  console.log(response);
  console.log("====================================");
} catch (error) {
  console.error("====================================");
  console.error("❌ FCM SEND ERROR");
  console.error("Code:", error.code);
  console.error("Message:", error.message);
  console.error(error);
  console.error("====================================");
}
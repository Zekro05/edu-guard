import { sendPushNotification } from "../utils/pushNotification.js";

export const testPushNotification = async (req, res) => {
  try {
    const { expoPushToken } = req.body;

    if (!expoPushToken) {
      return res.status(400).json({
        success: false,
        message: "expoPushToken is required",
      });
    }

    const tickets = await sendPushNotification({
      token: expoPushToken,

      title: "EduGuard 🔔",

      body: "This is a backend push notification test.",

      data: {
        type: "test",
        source: "backend",
      },
    });

    return res.status(200).json({
      success: true,
      message: "Push notification request sent.",
      tickets,
    });
  } catch (error) {
    console.error("TEST PUSH ERROR:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
import { Expo } from "expo-server-sdk";

const expo = new Expo();

export const sendPushNotification = async ({
  token,
  title,
  body,
  data = {},
}) => {
  try {
    if (!token) {
      throw new Error("Expo push token is required");
    }

    if (!Expo.isExpoPushToken(token)) {
      throw new Error(`Invalid Expo push token: ${token}`);
    }

    const message = {
      to: token,
      sound: "default",
      title,
      body,
      data,
    };

    const chunks = expo.chunkPushNotifications([message]);

    const tickets = [];

    for (const chunk of chunks) {
      try {
        const chunkTickets =
          await expo.sendPushNotificationsAsync(chunk);

        tickets.push(...chunkTickets);
      } catch (error) {
        console.error(
          "Expo push request error:",
          error
        );
      }
    }

    console.log("📨 Expo push tickets:", tickets);

    return tickets;
  } catch (error) {
    console.error(
      "❌ SEND PUSH NOTIFICATION ERROR:",
      error.message
    );

    throw error;
  }
};
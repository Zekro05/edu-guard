import User from "../models/userModel.js";

/* =========================================================
   GET ADMIN NOTIFICATION SETTINGS
========================================================= */

export const getAdminNotificationSettings = async () => {
  const admin = await User.findOne({
    role: "admin",
  }).select("notificationSettings");

  if (!admin) {
    return null;
  }

  return {
    emailAlerts:
      admin.notificationSettings?.emailAlerts ?? true,

    highRiskAlerts:
      admin.notificationSettings?.highRiskAlerts ?? true,

    aiPredictionAlerts:
      admin.notificationSettings?.aiPredictionAlerts ?? false,

    securityWarnings:
      admin.notificationSettings?.securityWarnings ?? false,

    adminEmail:
      admin.notificationSettings?.adminEmail ||
      admin.email ||
      "",

    guidanceEmail:
      admin.notificationSettings?.guidanceEmail || "",
  };
};

/* =========================================================
   SHOULD SEND
========================================================= */

export const shouldSendNotification = async (
  notificationType
) => {
  const settings =
    await getAdminNotificationSettings();

  if (!settings) {
    return false;
  }

  return Boolean(settings[notificationType]);
};
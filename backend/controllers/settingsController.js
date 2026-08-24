import User from "../models/userModel.js";

/* =========================================================
   GET NOTIFICATION SETTINGS
========================================================= */

export const getNotificationSettings = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select(
      "notificationSettings"
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const settings = {
      emailAlerts:
        user.notificationSettings?.emailAlerts ?? true,

      highRiskAlerts:
        user.notificationSettings?.highRiskAlerts ?? true,

      aiPredictionAlerts:
        user.notificationSettings?.aiPredictionAlerts ?? false,

      securityWarnings:
        user.notificationSettings?.securityWarnings ?? false,

      adminEmail:
        user.notificationSettings?.adminEmail || "",

      guidanceEmail:
        user.notificationSettings?.guidanceEmail || "",
    };

    res.status(200).json({
      success: true,
      settings,
    });
  } catch (error) {
    console.error(
      "GET NOTIFICATION SETTINGS ERROR:",
      error
    );

    res.status(500).json({
      success: false,
      message: "Failed to load notification settings",
    });
  }
};

/* =========================================================
   UPDATE NOTIFICATION SETTINGS
========================================================= */

export const updateNotificationSettings = async (
  req,
  res
) => {
  try {
    const {
      emailAlerts,
      highRiskAlerts,
      aiPredictionAlerts,
      securityWarnings,
      adminEmail,
      guidanceEmail,
    } = req.body;

    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    user.notificationSettings = {
      emailAlerts:
        typeof emailAlerts === "boolean"
          ? emailAlerts
          : true,

      highRiskAlerts:
        typeof highRiskAlerts === "boolean"
          ? highRiskAlerts
          : true,

      aiPredictionAlerts:
        typeof aiPredictionAlerts === "boolean"
          ? aiPredictionAlerts
          : false,

      securityWarnings:
        typeof securityWarnings === "boolean"
          ? securityWarnings
          : false,

      adminEmail:
        typeof adminEmail === "string"
          ? adminEmail.trim().toLowerCase()
          : "",

      guidanceEmail:
        typeof guidanceEmail === "string"
          ? guidanceEmail.trim().toLowerCase()
          : "",
    };

    await user.save();

    res.status(200).json({
      success: true,
      message: "Notification settings updated successfully",
      settings: user.notificationSettings,
    });
  } catch (error) {
    console.error(
      "UPDATE NOTIFICATION SETTINGS ERROR:",
      error
    );

    res.status(500).json({
      success: false,
      message: "Failed to update notification settings",
    });
  }
};
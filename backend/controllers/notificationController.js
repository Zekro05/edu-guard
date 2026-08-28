import User from "../models/userModel.js";

/* =========================================================
   SAVE FCM TOKEN
========================================================= */

export const saveFCMToken = async (req, res) => {
  try {
    const { token, platform, provider = "fcm" } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: "FCM token is required",
      });
    }

    if (!["android", "ios", "web"].includes(platform)) {
      return res.status(400).json({
        success: false,
        message: "Invalid platform",
      });
    }

    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (!Array.isArray(user.pushTokens)) {
      user.pushTokens = [];
    }

    /* Remove duplicate token */
    user.pushTokens = user.pushTokens.filter(
      (item) => item.token !== token
    );

    /* Save new token */
    user.pushTokens.push({
      token,
      platform,
      provider,
    });

    await user.save();

    return res.status(200).json({
      success: true,
      message: "FCM token saved successfully",
    });
  } catch (error) {
    console.error("SAVE FCM TOKEN ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to save FCM token",
    });
  }
};


/* =========================================================
   GET NOTIFICATION SETTINGS
   Shared by:
   - Admin Web
   - Teacher Mobile
   - Student Mobile
========================================================= */

export const getNotificationSettings = async (req, res) => {
  try {
    if (!req.userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const user = await User.findById(req.userId).select(
      "notificationSettings role"
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      settings: user.notificationSettings || {},
    });
  } catch (err) {
    console.error(
      "GET NOTIFICATION SETTINGS ERROR:",
      err
    );

    return res.status(500).json({
      success: false,
      message: err.message || "Failed to load notification settings",
    });
  }
};


/* =========================================================
   UPDATE NOTIFICATION SETTINGS
   Shared by:
   - Admin Web
   - Teacher Mobile
   - Student Mobile
========================================================= */

export const updateNotificationSettings = async (req, res) => {
  try {
    if (!req.userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (!req.body || typeof req.body !== "object") {
      return res.status(400).json({
        success: false,
        message: "Invalid notification settings",
      });
    }

    /*
    =====================================================
    ALLOWED SETTINGS

    These are shared between student, teacher, and admin.
    Admin-specific settings are also allowed because this
    controller is shared.
    =====================================================
    */

    const allowedSettings = [
      "mute",
      "incidentUpdates",
      "guidanceMessages",
      "systemAnnouncements",
      "highRiskAlerts",
      "quietHours",
      "sound",
      "vibration",

      // Admin settings
      "emailAlerts",
      "aiPredictionAlerts",
      "securityWarnings",

      // Optional email destinations
      "adminEmail",
      "guidanceEmail",
    ];

    const updates = {};

    for (const key of allowedSettings) {
      if (
        Object.prototype.hasOwnProperty.call(
          req.body,
          key
        )
      ) {
        updates[key] = req.body[key];
      }
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        message: "No valid notification settings provided",
      });
    }

    /*
    =====================================================
    TYPE VALIDATION

    Boolean settings must actually be booleans.
    =====================================================
    */

    const booleanSettings = [
      "mute",
      "incidentUpdates",
      "guidanceMessages",
      "systemAnnouncements",
      "highRiskAlerts",
      "quietHours",
      "sound",
      "vibration",
      "emailAlerts",
      "aiPredictionAlerts",
      "securityWarnings",
    ];

    for (const key of booleanSettings) {
      if (
        Object.prototype.hasOwnProperty.call(
          updates,
          key
        ) &&
        typeof updates[key] !== "boolean"
      ) {
        return res.status(400).json({
          success: false,
          message: `${key} must be a boolean`,
        });
      }
    }

    /*
    =====================================================
    UPDATE ONLY THE PROVIDED SETTINGS

    This prevents one mobile setting from accidentally
    deleting the other settings.
    =====================================================
    */

    user.notificationSettings = {
      ...(user.notificationSettings || {}),
      ...updates,
    };

    await user.save();

    return res.status(200).json({
      success: true,
      message: "Notification settings updated successfully",
      settings: user.notificationSettings,
    });
  } catch (err) {
    console.error(
      "UPDATE NOTIFICATION SETTINGS ERROR:",
      err
    );

    return res.status(500).json({
      success: false,
      message:
        err.message ||
        "Failed to update notification settings",
    });
  }
};
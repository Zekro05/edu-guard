import User from "../models/userModel.js";

/* =========================================================
   DEFAULT NOTIFICATION SETTINGS
========================================================= */

const DEFAULT_NOTIFICATION_SETTINGS = {
  /* =======================================================
     WEB / EMAIL SETTINGS
  ======================================================= */

  emailAlerts: true,

  aiPredictionAlerts: false,

  securityWarnings: false,

  adminEmail: "",

  guidanceEmail: "",

  /* =======================================================
     MOBILE SETTINGS
  ======================================================= */

  mute: false,

  incidentUpdates: true,

  guidanceMessages: true,

  systemAnnouncements: true,

  highRiskAlerts: true,

  quietHours: false,

  sound: true,

  vibration: true,
};

/* =========================================================
   HELPER
   Convert notification settings into a normal object
========================================================= */

const getNotificationSettingsObject = (user) => {
  let existingSettings = {};

  if (user?.notificationSettings) {
    if (typeof user.notificationSettings.toObject === "function") {
      existingSettings = user.notificationSettings.toObject();
    } else {
      existingSettings = user.notificationSettings;
    }
  }

  return {
    ...DEFAULT_NOTIFICATION_SETTINGS,
    ...existingSettings,
  };
};

/* =========================================================
   GET NOTIFICATION SETTINGS
========================================================= */

export const getNotificationSettings = async (req, res) => {
  try {
    console.log("========================================");
    console.log("🔔 GET NOTIFICATION SETTINGS");
    console.log("User ID:", req.userId);
    console.log("========================================");

    const user = await User.findById(req.userId).select(
      "notificationSettings"
    );

    if (!user) {
      console.log("❌ USER NOT FOUND");

      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    /*
      Merge the saved settings with defaults.

      This makes sure older users who do not yet have
      the mobile notification fields still receive the
      correct default values.
    */

    const settings = getNotificationSettingsObject(user);

    /*
      Make sure email fields are always strings.
    */

    settings.adminEmail =
      typeof settings.adminEmail === "string"
        ? settings.adminEmail
        : "";

    settings.guidanceEmail =
      typeof settings.guidanceEmail === "string"
        ? settings.guidanceEmail
        : "";

    console.log("✅ NOTIFICATION SETTINGS LOADED");
    console.log(settings);
    console.log("========================================");

    return res.status(200).json({
      success: true,
      settings,
    });
  } catch (error) {
    console.error("========================================");
    console.error("❌ GET NOTIFICATION SETTINGS ERROR");
    console.error(error);
    console.error("========================================");

    return res.status(500).json({
      success: false,
      message: "Failed to load notification settings",
    });
  }
};

/* =========================================================
   UPDATE NOTIFICATION SETTINGS
========================================================= */

export const updateNotificationSettings = async (req, res) => {
  try {
    console.log("========================================");
    console.log("💾 UPDATE NOTIFICATION SETTINGS");
    console.log("User ID:", req.userId);
    console.log("Request Body:", req.body);
    console.log("========================================");

    const user = await User.findById(req.userId);

    if (!user) {
      console.log("❌ USER NOT FOUND");

      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    /*
      Get the user's current settings first.

      IMPORTANT:
      We do NOT replace the entire object.

      If the mobile app sends:

        {
          sound: false
        }

      the other settings remain unchanged.
    */

    const settings = getNotificationSettingsObject(user);

    /* =======================================================
       BOOLEAN SETTINGS
    ======================================================= */

    const booleanFields = [
      /* Web / Email */

      "emailAlerts",

      "aiPredictionAlerts",

      "securityWarnings",

      /* Mobile */

      "mute",

      "incidentUpdates",

      "guidanceMessages",

      "systemAnnouncements",

      "highRiskAlerts",

      "quietHours",

      "sound",

      "vibration",
    ];

    /*
      Only update a boolean setting if the request
      actually contains a boolean value.
    */

    for (const field of booleanFields) {
      if (typeof req.body[field] === "boolean") {
        settings[field] = req.body[field];

        console.log(
          `🔄 ${field}:`,
          req.body[field]
        );
      }
    }

    /* =======================================================
       EMAIL SETTINGS
    ======================================================= */

    if (typeof req.body.adminEmail === "string") {
      settings.adminEmail =
        req.body.adminEmail.trim().toLowerCase();

      console.log(
        "🔄 adminEmail:",
        settings.adminEmail
      );
    }

    if (typeof req.body.guidanceEmail === "string") {
      settings.guidanceEmail =
        req.body.guidanceEmail.trim().toLowerCase();

      console.log(
        "🔄 guidanceEmail:",
        settings.guidanceEmail
      );
    }

    /* =======================================================
       SAVE SETTINGS
    ======================================================= */

    user.notificationSettings = settings;

    await user.save();

    /*
      Read the settings again after saving so the response
      contains exactly what is stored in the user document.
    */

    const savedSettings =
      getNotificationSettingsObject(user);

    console.log("========================================");
    console.log("✅ NOTIFICATION SETTINGS SAVED");
    console.log("User ID:", req.userId);
    console.log("Saved Settings:", savedSettings);
    console.log("========================================");

    return res.status(200).json({
      success: true,
      message: "Notification settings updated successfully",
      settings: savedSettings,
    });
  } catch (error) {
    console.error("========================================");
    console.error("❌ UPDATE NOTIFICATION SETTINGS ERROR");
    console.error(error);
    console.error("========================================");

    return res.status(500).json({
      success: false,
      message: "Failed to update notification settings",
    });
  }
};
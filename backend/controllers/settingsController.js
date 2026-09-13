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
   DEFAULT SECURITY SETTINGS
========================================================= */

const DEFAULT_SECURITY_SETTINGS = {
  twoFactorEnabled: true,

  sessionTimeoutEnabled: true,
};

/* =========================================================
   HELPER
   Convert notification settings into a normal object
========================================================= */

const getNotificationSettingsObject = (user) => {
  let existingSettings = {};

  if (user?.notificationSettings) {
    if (
      typeof user.notificationSettings.toObject ===
      "function"
    ) {
      existingSettings =
        user.notificationSettings.toObject();
    } else {
      existingSettings =
        user.notificationSettings;
    }
  }

  return {
    ...DEFAULT_NOTIFICATION_SETTINGS,
    ...existingSettings,
  };
};

/* =========================================================
   HELPER
   Convert security settings into a normal object
========================================================= */

const getSecuritySettingsObject = (user) => {
  let existingSettings = {};

  if (user?.securitySettings) {
    if (
      typeof user.securitySettings.toObject ===
      "function"
    ) {
      existingSettings =
        user.securitySettings.toObject();
    } else {
      existingSettings =
        user.securitySettings;
    }
  }

  return {
    ...DEFAULT_SECURITY_SETTINGS,
    ...existingSettings,
  };
};

/* =========================================================
   GET NOTIFICATION SETTINGS
========================================================= */

export const getNotificationSettings = async (
  req,
  res
) => {
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
      Merge saved settings with defaults.

      This makes sure older users who do not yet have
      newer notification fields still receive defaults.
    */

    const settings =
      getNotificationSettingsObject(user);

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

    console.log(
      "✅ NOTIFICATION SETTINGS LOADED"
    );

    console.log(settings);

    console.log("========================================");

    return res.status(200).json({
      success: true,
      settings,
    });
  } catch (error) {
    console.error("========================================");

    console.error(
      "❌ GET NOTIFICATION SETTINGS ERROR"
    );

    console.error(error);

    console.error("========================================");

    return res.status(500).json({
      success: false,
      message:
        "Failed to load notification settings",
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
    console.log("========================================");
    console.log(
      "💾 UPDATE NOTIFICATION SETTINGS"
    );
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

    const settings =
      getNotificationSettingsObject(user);

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
      if (
        typeof req.body[field] ===
        "boolean"
      ) {
        settings[field] =
          req.body[field];

        console.log(
          `🔄 ${field}:`,
          req.body[field]
        );
      }
    }

    /* =======================================================
       EMAIL SETTINGS
    ======================================================= */

    if (
      typeof req.body.adminEmail ===
      "string"
    ) {
      settings.adminEmail =
        req.body.adminEmail
          .trim()
          .toLowerCase();

      console.log(
        "🔄 adminEmail:",
        settings.adminEmail
      );
    }

    if (
      typeof req.body.guidanceEmail ===
      "string"
    ) {
      settings.guidanceEmail =
        req.body.guidanceEmail
          .trim()
          .toLowerCase();

      console.log(
        "🔄 guidanceEmail:",
        settings.guidanceEmail
      );
    }

    /* =======================================================
       SAVE NOTIFICATION SETTINGS
    ======================================================= */

    user.notificationSettings =
      settings;

    await user.save();

    /*
      Read the settings again after saving so the response
      contains exactly what is stored in the user document.
    */

    const savedSettings =
      getNotificationSettingsObject(user);

    console.log("========================================");

    console.log(
      "✅ NOTIFICATION SETTINGS SAVED"
    );

    console.log(
      "User ID:",
      req.userId
    );

    console.log(
      "Saved Settings:",
      savedSettings
    );

    console.log("========================================");

    return res.status(200).json({
      success: true,

      message:
        "Notification settings updated successfully",

      settings: savedSettings,
    });
  } catch (error) {
    console.error("========================================");

    console.error(
      "❌ UPDATE NOTIFICATION SETTINGS ERROR"
    );

    console.error(error);

    console.error("========================================");

    return res.status(500).json({
      success: false,

      message:
        "Failed to update notification settings",
    });
  }
};

/* =========================================================
   GET SECURITY SETTINGS
========================================================= */

export const getSecuritySettings = async (
  req,
  res
) => {
  try {
    console.log("========================================");
    console.log("🛡️ GET SECURITY SETTINGS");
    console.log("User ID:", req.userId);
    console.log("========================================");

    const user = await User.findById(
      req.userId
    ).select("securitySettings");

    if (!user) {
      console.log("❌ USER NOT FOUND");

      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    /*
      Read the actual stored values.

      IMPORTANT:

      false must remain false.

      We only use true as the fallback when the
      field does not exist yet.
    */

    const securitySettings =
      user.securitySettings || {};

    const settings = {
      twoFactorEnabled:
        securitySettings.twoFactorEnabled !==
        false,

      sessionTimeoutEnabled:
        securitySettings.sessionTimeoutEnabled !==
        false,
    };

    console.log(
      "📦 DATABASE SECURITY SETTINGS:"
    );

    console.log(
      securitySettings
    );

    console.log(
      "📤 RETURNING SETTINGS:"
    );

    console.log(
      settings
    );

    console.log("========================================");

    return res.status(200).json({
      success: true,
      settings,
    });
  } catch (error) {
    console.error("========================================");

    console.error(
      "❌ GET SECURITY SETTINGS ERROR"
    );

    console.error(error);

    console.error("========================================");

    return res.status(500).json({
      success: false,
      message:
        "Failed to load security settings",
    });
  }
};

/* =========================================================
   UPDATE SECURITY SETTINGS
========================================================= */

export const updateSecuritySettings = async (
  req,
  res
) => {
  try {
    console.log("========================================");

    console.log(
      "🛡️ UPDATE SECURITY SETTINGS"
    );

    console.log(
      "User ID:",
      req.userId
    );

    console.log(
      "Request Body:",
      req.body
    );

    console.log("========================================");

    const user = await User.findById(
      req.userId
    );

    if (!user) {
      console.log("❌ USER NOT FOUND");

      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    /* =======================================================
       TWO-FACTOR AUTHENTICATION
    ======================================================= */

    if (
      typeof req.body.twoFactorEnabled ===
      "boolean"
    ) {
      console.log(
        "🔐 Updating twoFactorEnabled:",
        req.body.twoFactorEnabled
      );

      /*
        IMPORTANT:

        Update the nested Mongoose field directly.

        This guarantees that Mongoose tracks the
        change correctly, including false.
      */

      user.set(
        "securitySettings.twoFactorEnabled",
        req.body.twoFactorEnabled
      );
    }

    /* =======================================================
       SESSION TIMEOUT PROTECTION
    ======================================================= */

    if (
      typeof req.body.sessionTimeoutEnabled ===
      "boolean"
    ) {
      console.log(
        "⏱️ Updating sessionTimeoutEnabled:",
        req.body.sessionTimeoutEnabled
      );

      /*
        Update the nested Mongoose field directly.
      */

      user.set(
        "securitySettings.sessionTimeoutEnabled",
        req.body.sessionTimeoutEnabled
      );
    }

    console.log(
      "📦 SECURITY SETTINGS BEFORE SAVE:"
    );

    console.log(
      user.securitySettings
    );

    /* =======================================================
       SAVE USER
    ======================================================= */

    await user.save();

    console.log(
      "✅ USER SAVED SUCCESSFULLY"
    );

    /* =======================================================
       READ DIRECTLY FROM DATABASE AGAIN
    ======================================================= */

    const freshUser =
      await User.findById(req.userId)
        .select("securitySettings")
        .lean();

    if (!freshUser) {
      console.log(
        "❌ USER NOT FOUND AFTER SAVE"
      );

      return res.status(404).json({
        success: false,
        message:
          "User not found after update",
      });
    }

    const savedSecuritySettings =
      freshUser.securitySettings || {};

    /*
      IMPORTANT:

      false = OFF
      true = ON
      undefined = ON by default

      This prevents false from accidentally becoming
      true when returning the response.
    */

    const savedSettings = {
      twoFactorEnabled:
        savedSecuritySettings.twoFactorEnabled !==
        false,

      sessionTimeoutEnabled:
        savedSecuritySettings.sessionTimeoutEnabled !==
        false,
    };

    console.log("========================================");

    console.log(
      "💾 ACTUALLY SAVED IN DATABASE:"
    );

    console.log(
      savedSecuritySettings
    );

    console.log(
      "📤 RETURNING TO FRONTEND:"
    );

    console.log(
      savedSettings
    );

    console.log("========================================");

    return res.status(200).json({
      success: true,

      message:
        "Security settings updated successfully",

      settings: savedSettings,
    });
  } catch (error) {
    console.error("========================================");

    console.error(
      "❌ UPDATE SECURITY SETTINGS ERROR"
    );

    console.error(error);

    console.error("========================================");

    return res.status(500).json({
      success: false,

      message:
        "Failed to update security settings",
    });
  }
};


import User from "../models/userModel.js";

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

    /*
    =====================================================
    REMOVE DUPLICATE TOKEN
    =====================================================
    */

    user.pushTokens = user.pushTokens.filter(
      (item) => item.token !== token
    );

    /*
    =====================================================
    SAVE TOKEN
    =====================================================
    */

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
/* ================= GET SETTINGS ================= */
export const getNotificationSettings = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select(
      "notificationSettings"
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.json({
      success: true,
      settings: user.notificationSettings,
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

/* ================= UPDATE SETTINGS ================= */
export const updateNotificationSettings = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    user.notificationSettings = {
      ...user.notificationSettings,
      ...req.body,
    };

    await user.save();

    res.json({
      success: true,
      settings: user.notificationSettings,
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};
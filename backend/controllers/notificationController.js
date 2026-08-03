import User from "../models/userModel.js";

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
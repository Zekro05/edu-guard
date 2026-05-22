import HistoryLog from "../models/historyLogModel.js";

export const createHistoryLog = async ({
  userId,
  role,
  action,
  category,
  details,
  ipAddress,
}) => {
  try {
    await HistoryLog.create({
      user: userId,
      role,
      action,
      category,
      details,
      ipAddress,
    });
  } catch (error) {
    console.error("History log error:", error.message);
  }
};
import fs from "fs";
import path from "path";
import Student from "../models/studentModel.js";
import Report from "../models/reportModel.js";
import HistoryLog from "../models/historyLogModel.js";
import { uploadFileToFirebase } from "../utils/firebase.js";

export const createBackup = async (req, res) => {
  try {
    // Fetch data
    const students = await Student.find({});
    const reports = await Report.find({});

    // Prepare backup folder
    const folderPath = path.join(process.cwd(), "backups");
    fs.mkdirSync(folderPath, { recursive: true });

    const fileName = `backup-${Date.now()}.json`;
    const filePath = path.join(folderPath, fileName);

    // Save JSON backup
    fs.writeFileSync(filePath, JSON.stringify({ students, reports, createdAt: new Date() }, null, 2));

    // Upload to Firebase (safe)
    try {
      await uploadFileToFirebase(filePath, fileName);
      console.log("Firebase upload successful:", fileName);
    } catch (err) {
      console.error("Firebase upload failed:", err.message);
    }

    // Log history safely
    await HistoryLog.create({
      user: req.user?._id || null,        // allow null for testing/manual backup
      role: req.user?.role || "Admin",
      action: "Created Backup",
      category: "System",
      details: fileName,
      ipAddress: req.ip,
    });

    res.status(200).json({ message: "Backup created successfully!", fileName });
  } catch (err) {
    console.error("BackupController Error:", err);
    res.status(500).json({ message: "Backup failed", error: err.message });
  }
};

// ------------------- LIST BACKUPS -------------------
export const listBackups = async (req, res) => {
  try {
    const folderPath = path.join(process.cwd(), "backups");
    fs.mkdirSync(folderPath, { recursive: true });
    const files = fs.readdirSync(folderPath)
      .filter(file => file.endsWith(".json"))
      .map(file => ({
        name: file,
        date: fs.statSync(path.join(folderPath, file)).mtime,
        type: "Manual",
        status: "Successful",
      }));

    res.status(200).json(files);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to list backups", error: err.message });
  }
};

export const restoreBackup = async (req, res) => {
  try {
    const { fileName } = req.params;
    const filePath = path.join(process.cwd(), "backups", fileName);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: "Backup file not found" });
    }

    const data = JSON.parse(fs.readFileSync(filePath, "utf-8"));

    // Clear old data
    await Student.deleteMany({});
    await Report.deleteMany({});

    // Restore
    await Student.insertMany(data.students);
    await Report.insertMany(data.reports);

    // Log restore action
    await HistoryLog.create({
      user: req.user?._id || null,
      role: req.user?.role || "Admin",
      action: "Restored Backup",
      category: "System",
      details: fileName,
      ipAddress: req.ip,
    });

    res.status(200).json({ message: `Backup ${fileName} restored successfully!` });
  } catch (err) {
    console.error("Restore Error:", err);
    res.status(500).json({ message: "Restore failed", error: err.message });
  }
};
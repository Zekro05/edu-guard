// backend/routes/backupRoutes.js
import express from "express";
import { createBackup, listBackups, restoreBackup } from "../controllers/backupController.js";
// optional auth middleware

const router = express.Router();

router.get("/backup", createBackup);        // manual backup
router.get("/backups", listBackups);        // list all backups
router.post("/restore/:fileName", restoreBackup); // restore a backup

export default router;
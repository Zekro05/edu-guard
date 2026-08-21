import express from "express";
import mongoose from "mongoose";
import Report from "../models/reportModel.js";
import Incident from "../models/incidentModel.js";
import Student from "../models/studentModel.js";
import Intervention from "../models/interventionModel.js";
import User from "../models/userModel.js";
import { verifyToken } from "../middleware/verifyToken.js";
import { io } from "../server.js";
import {
  getMyReports,
  getReports,
  createReport,
} from "../controllers/reportController.js";
import { getDisciplineAction } from "../utils/disciplineEngine.js";
import { upload } from "../middleware/upload.js";
import Notification from "../models/Notification.js";
import { createGuestReport } from "../controllers/reportController.js";
import { createDirectIncident } from "../controllers/reportController.js";
import { getOffenseSeverity } from "../utils/offenseSeverity.js";
import { sendPushNotification } from "../utils/sendPushNotification.js";

const router = express.Router();

/* ================= CREATE REPORT ================= */
router.get("/test-notif", (req, res) => {
  console.log("🔥 TEST NOTIF TRIGGERED");

  io.emit("newNotification", {
    id: Date.now(),
    title: "TEST NOTIFICATION",
    message: "Web socket test from backend",
    createdAt: new Date().toISOString(),
  });

  return res.json({ message: "Test notification sent" });
});

router.post(
  "/guest",
  upload.array("evidence", 10),
  (req, res, next) => {
    console.log("🔥 GUEST ROUTE HIT");
    console.log("BODY:", req.body);
    console.log("FILES:", req.files);
    next();
  },
  createGuestReport,
);

router.post(
  "/",
  verifyToken,
  upload.array("evidence", 10),
  (req, res, next) => {
    console.log("🔥 REPORT ROUTE HIT");
    console.log("BODY:", req.body);
    console.log("FILES:", req.files);
    next();
  },
  createReport,
);

router.post(
  "/direct",
  verifyToken,
  upload.array("evidence", 10),
  createDirectIncident,
);

/* ================= GET MY REPORTS ================= */
router.get("/my", verifyToken, getMyReports);

/* ================= GET ALL REPORTS ================= */
router.get("/", async (req, res) => {
  try {
    const { page = 1, limit = 100, status, search } = req.query;

    const query = {};

    if (status) query.status = status;

    if (search) {
      query.$or = [
        { studentName: { $regex: search, $options: "i" } },
        { offense: { $regex: search, $options: "i" } },
      ];
    }

    const reports = await Report.find(query)
      .populate("studentId", "name section age gender")
      .populate("reporterId", "name email")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Report.countDocuments(query);

    res.json({
      reports,
      totalPages: Math.ceil(total / limit),
      currentPage: Number(page),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* ================= GET REPORT BY ID ================= */
router.get("/:id", verifyToken, async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        message: "Invalid report ID",
      });
    }

    const report = await Report.findById(id)
      .populate(
        "studentId",
        "firstName middleName lastName name grade section gender",
      )
      .populate("reporterId", "firstName lastName name email");

    if (!report) {
      return res.status(404).json({
        message: "Report not found",
      });
    }

    // Find the incident created from this report
    const incident = await Incident.findOne({
      reportId: report._id,
    }).select("status completedAt statementStatus caseLogs action level");

    let interventions = [];

    if (incident) {
      interventions = await Intervention.find({
        incidentId: incident._id,
      }).sort({ createdAt: -1 });
    }

    // Use the Incident status if it exists
    const currentStatus = incident?.status || report.status || "pending";

    res.json({
      ...report.toObject(),

      // Actual case status
      status: currentStatus,

      // Keep report status separately if needed
      reportStatus: report.status,

      // Incident information
      incidentId: incident?._id || null,
      incidentStatus: incident?.status || null,
      completedAt: incident?.completedAt || null,
      statementStatus: incident?.statementStatus || null,
      caseLogs: incident?.caseLogs || [],
      actionTaken: incident?.action || null,
      incidentLevel: incident?.level || null,
      interventions
    });
  } catch (err) {
    console.error("GET report by ID error:", err);

    res.status(500).json({
      message: err.message,
    });
  }
});

/* ================= ACCEPT REPORT ================= */
router.put("/:id/accept", verifyToken, async (req, res) => {
  try {
    const report = await Report.findById(req.params.id);

    if (!report) {
      return res.status(404).json({ message: "Report not found" });
    }

    report.status = "under_review";
    await report.save();

    const studentId = report.studentId;

    const totalOffenses = await Report.countDocuments({ studentId });

    const severity = getOffenseSeverity(report.offense);

    const decision = getDisciplineAction({
      offenseCount: totalOffenses,
      offense: report.offense,
    });

    decision.level = severity;

    const incident = await Incident.create({
      studentId,
      reportId: report._id,
      title: report.offense,
      category: report.offense,
      action: decision.action,
      level: decision.level,
      status: "received",
      evidence: report.evidence || [],
    });

    await Student.findByIdAndUpdate(studentId, {
      totalIncidents: totalOffenses,
      riskLevel: decision.level,
    });

    /* =====================================================
       NOTIFY STUDENT
    ===================================================== */

    const student = await Student.findById(studentId);

    if (student) {
      const user = await User.findOne({
        studentId: student.studentId,
      }).select("expoPushToken email name firstName lastName");

      if (user) {
        const notification = await Notification.create({
          userId: user._id,
          title: "Report Accepted",
          message: `A report regarding "${report.offense}" was approved.`,
          type: "warning",
          priority: "high",
          isRead: false,
          data: {
            type: "report_accepted",
            reportId: report._id.toString(),
            incidentId: incident._id.toString(),
            studentId: student._id.toString(),
          },
        });

        /* ================= SOCKET ================= */

        io.to(user._id.toString()).emit("newNotification", {
          ...notification.toObject(),
          id: notification._id.toString(),
        });

        console.log(
          "🔔 Student realtime notification sent:",
          user._id.toString(),
        );

        /* ================= EXPO PUSH ================= */

        if (user.expoPushToken) {
          try {
            await sendPushNotification({
              token: user.expoPushToken,

              title: "⚠️ Report Accepted",

              body: `A report regarding "${report.offense}" was approved.`,

              data: {
                type: "report_accepted",
                reportId: report._id.toString(),
                incidentId: incident._id.toString(),
                studentId: student._id.toString(),
                notificationId: notification._id.toString(),
              },
            });

            console.log(
              "📱 Report accepted push sent to:",
              user.email || user._id.toString(),
            );
          } catch (pushError) {
            console.error(
              "⚠️ REPORT ACCEPTED PUSH ERROR:",
              pushError,
            );
          }
        } else {
          console.log(
            "⚠️ Student has no Expo push token:",
            user._id.toString(),
          );
        }
      }
    }

    /* =====================================================
       NOTIFY REPORTER
    ===================================================== */

    if (report.reporterId) {
      const reporter = await User.findById(report.reporterId).select(
        "expoPushToken email name firstName lastName",
      );

      const reporterNotification = await Notification.create({
        userId: report.reporterId,
        title: "Report Processed",
        message: `Your report about "${report.offense}" has been accepted and is being acted upon.`,
        type: "success",
        priority: "low",
        isRead: false,
        data: {
          type: "report_processed",
          reportId: report._id.toString(),
          incidentId: incident._id.toString(),
        },
      });

      /* ================= SOCKET ================= */

      io.to(report.reporterId.toString()).emit(
        "newNotification",
        {
          ...reporterNotification.toObject(),
          id: reporterNotification._id.toString(),
        },
      );

      console.log(
        "🔔 Reporter realtime notification sent:",
        report.reporterId.toString(),
      );

      /* ================= EXPO PUSH ================= */

      if (reporter?.expoPushToken) {
        try {
          await sendPushNotification({
            token: reporter.expoPushToken,

            title: "✅ Report Processed",

            body: `Your report about "${report.offense}" has been accepted and is being acted upon.`,

            data: {
              type: "report_processed",
              reportId: report._id.toString(),
              incidentId: incident._id.toString(),
              notificationId: reporterNotification._id.toString(),
            },
          });

          console.log(
            "📱 Reporter push sent to:",
            reporter.email || report.reporterId.toString(),
          );
        } catch (pushError) {
          console.error(
            "⚠️ REPORTER ACCEPTED PUSH ERROR:",
            pushError,
          );
        }
      } else {
        console.log(
          "⚠️ Reporter has no Expo push token:",
          report.reporterId.toString(),
        );
      }
    }

    return res.json({
      message: "Report accepted & processed",
      decision,
      incident,
    });
  } catch (err) {
    console.error("ACCEPT REPORT ERROR:", err);

    return res.status(500).json({
      message: err.message,
    });
  }
});

/* ================= REJECT REPORT ================= */
router.put("/:id/reject", verifyToken, async (req, res) => {
  try {
    const report = await Report.findByIdAndUpdate(
      req.params.id,
      { status: "rejected" },
      { returnDocument: "after" },
    );

    if (!report) {
      return res.status(404).json({
        message: "Report not found",
      });
    }

    /* =====================================================
       NOTIFY STUDENT
       ONLY FOR REGISTERED STUDENTS
    ===================================================== */

    if (report.studentId) {
      const student = await Student.findById(report.studentId);

      if (student) {
        const user = await User.findOne({
          studentId: student.studentId,
        }).select("expoPushToken email name firstName lastName");

        if (user) {
          const notification = await Notification.create({
            userId: user._id,
            title: "Report Rejected",
            message: `A report regarding "${report.offense}" was rejected.`,
            type: "rejected",
            priority: "high",
            isRead: false,
            data: {
              type: "report_rejected",
              reportId: report._id.toString(),
              studentId: student._id.toString(),
            },
          });

          /* ================= SOCKET ================= */

          io.to(user._id.toString()).emit("newNotification", {
            ...notification.toObject(),
            id: notification._id.toString(),
          });

          console.log(
            "🔔 Student rejection notification sent:",
            user._id.toString(),
          );

          /* ================= EXPO PUSH ================= */

          if (user.expoPushToken) {
            try {
              await sendPushNotification({
                token: user.expoPushToken,

                title: "❌ Report Rejected",

                body: `A report regarding "${report.offense}" was rejected.`,

                data: {
                  type: "report_rejected",
                  reportId: report._id.toString(),
                  studentId: student._id.toString(),
                  notificationId: notification._id.toString(),
                },
              });

              console.log(
                "📱 Report rejection push sent to:",
                user.email || user._id.toString(),
              );
            } catch (pushError) {
              console.error(
                "⚠️ REPORT REJECTION PUSH ERROR:",
                pushError,
              );
            }
          } else {
            console.log(
              "⚠️ Student has no Expo push token:",
              user._id.toString(),
            );
          }
        }
      }
    }

    /* =====================================================
       NOTIFY REPORTER
    ===================================================== */

    if (report.reporterId) {
      const reporter = await User.findById(report.reporterId).select(
        "expoPushToken email name firstName lastName",
      );

      const notification = await Notification.create({
        userId: report.reporterId,
        title: "Your Report Was Reviewed",
        message: `Your report about "${report.offense}" was reviewed and rejected.`,
        type: "rejected",
        priority: "low",
        isRead: false,
        data: {
          type: "report_rejected",
          reportId: report._id.toString(),
        },
      });

      /* ================= SOCKET ================= */

      io.to(report.reporterId.toString()).emit(
        "newNotification",
        {
          ...notification.toObject(),
          id: notification._id.toString(),
        },
      );

      console.log(
        "🔔 Reporter rejection notification sent:",
        report.reporterId.toString(),
      );

      /* ================= EXPO PUSH ================= */

      if (reporter?.expoPushToken) {
        try {
          await sendPushNotification({
            token: reporter.expoPushToken,

            title: "❌ Your Report Was Reviewed",

            body: `Your report about "${report.offense}" was reviewed and rejected.`,

            data: {
              type: "report_rejected",
              reportId: report._id.toString(),
              notificationId: notification._id.toString(),
            },
          });

          console.log(
            "📱 Reporter rejection push sent to:",
            reporter.email || report.reporterId.toString(),
          );
        } catch (pushError) {
          console.error(
            "⚠️ REPORTER REJECTION PUSH ERROR:",
            pushError,
          );
        }
      } else {
        console.log(
          "⚠️ Reporter has no Expo push token:",
          report.reporterId.toString(),
        );
      }
    }

    return res.json(report);
  } catch (err) {
    console.error("REJECT ERROR:", err);

    return res.status(500).json({
      message: err.message,
    });
  }
});

/* ================= GET REPORTS ================= */
router.get("/reports", getReports);

export default router;

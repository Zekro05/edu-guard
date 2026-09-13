import express from "express";
import mongoose from "mongoose";

import Report from "../models/reportModel.js";
import Incident from "../models/incidentModel.js";
import Student from "../models/studentModel.js";
import Intervention from "../models/interventionModel.js";
import User from "../models/userModel.js";
import Notification from "../models/Notification.js";

import { verifyToken } from "../middleware/verifyToken.js";
import { io } from "../server.js";

import {
  getMyReports,
  getReports,
  createReport,
  getPrintableReports,
  createGuestReport,
  createDirectIncident,
} from "../controllers/reportController.js";

import { getDisciplineAction } from "../utils/disciplineEngine.js";
import { getOffenseSeverity } from "../utils/offenseSeverity.js";

import { upload } from "../middleware/upload.js";

import { sendPushNotification } from "../services/notificationService.js";
import { sendNotificationEmail } from "../mailer/emails.js";

const router = express.Router();

/* =========================================================
   HELPER: SAFE STRING FOR FCM DATA
========================================================= */

const fcmString = (value) => {
  if (value === null || value === undefined) {
    return "";
  }

  return String(value);
};

/* =========================================================
   HELPER: SEND FCM TO USER
========================================================= */

const sendFCMToUser = async ({
  user,
  title,
  body,
  data = {},
  logPrefix = "FCM",
}) => {
  try {
    if (!user) {
      console.log(`⚠️ ${logPrefix}: No user provided`);
      return;
    }

    const fcmTokens = Array.isArray(user.pushTokens)
      ? user.pushTokens.filter(
          (pushToken) =>
            pushToken?.token &&
            pushToken?.provider === "fcm" &&
            ["android", "ios", "web"].includes(
              pushToken?.platform,
            ),
        )
      : [];

    console.log("");
    console.log("========================================");
    console.log(`📱 ${logPrefix}`);
    console.log("========================================");
    console.log("User:", user.email || user._id);
    console.log("Total push tokens:", user.pushTokens?.length || 0);
    console.log("Valid FCM tokens:", fcmTokens.length);

    if (!fcmTokens.length) {
      console.log(
        `⚠️ ${logPrefix}: No valid FCM tokens found`,
      );
      console.log("Push Tokens:", user.pushTokens);
      console.log("========================================");
      return;
    }

    const fcmData = {};

    Object.entries(data || {}).forEach(([key, value]) => {
      fcmData[key] = fcmString(value);
    });

    for (const pushToken of fcmTokens) {
      try {
        console.log("");
        console.log("📱 Sending FCM...");
        console.log("Platform:", pushToken.platform);
        console.log("Provider:", pushToken.provider);
        console.log(
          "Token:",
          `${pushToken.token.substring(0, 15)}...`,
        );

        const result = await sendPushNotification({
          token: pushToken.token,
          title,
          body,
          data: fcmData,
        });

        console.log(`✅ ${logPrefix}: FCM sent successfully`);
        console.log("Push Result:", result);
      } catch (error) {
        console.error("");
        console.error(`❌ ${logPrefix}: FCM failed`);
        console.error("Platform:", pushToken.platform);
        console.error(
          "Error:",
          error?.message || error,
        );
      }
    }

    console.log("========================================");
  } catch (error) {
    console.error(
      `❌ ${logPrefix}: Unexpected FCM error:`,
      error?.message || error,
    );
  }
};

/* =========================================================
   HELPER: CREATE DATABASE + SOCKET NOTIFICATION
========================================================= */

const createRealtimeNotification = async ({
  userId,
  title,
  message,
  type = "general",
  priority = "low",
  relatedId = null,
  relatedType = null,
  data = {},
  logPrefix = "NOTIFICATION",
}) => {
  try {
    if (!userId) {
      console.log(
        `⚠️ ${logPrefix}: No user ID supplied`,
      );

      return null;
    }

    /*
     * IMPORTANT:
     * Notification.user MUST contain User._id.
     *
     * NEVER use:
     * userId: userId
     */

    const notification = await Notification.create({
      user: userId,
      title,
      message,
      type,
      priority,
      isRead: false,
      relatedId,
      relatedType,
      data,
    });

    const notificationObject =
      notification.toObject();

    const notificationPayload = {
      ...notificationObject,

      id: notification._id.toString(),
      _id: notification._id.toString(),

      user: userId.toString(),

      data: {
        ...data,
      },
    };

    /*
     * Socket.IO realtime notification
     */
    io.to(userId.toString()).emit(
      "newNotification",
      notificationPayload,
    );

    console.log("");
    console.log(
      `✅ ${logPrefix}: Database notification created`,
    );
    console.log(
      "Notification ID:",
      notification._id.toString(),
    );
    console.log(
      "User:",
      userId.toString(),
    );
    console.log(
      "Type:",
      type,
    );
    console.log(
      "Priority:",
      priority,
    );

    console.log(
      `🔌 ${logPrefix}: Socket notification emitted`,
    );

    return notification;
  } catch (error) {
    console.error("");
    console.error(
      `❌ ${logPrefix}: Notification creation failed`,
    );
    console.error(
      "Message:",
      error?.message || error,
    );
    console.error(
      "Error:",
      error,
    );

    /*
     * Do NOT throw.
     *
     * A notification failure should not make
     * accepting/rejecting a report fail.
     */
    return null;
  }
};

/* =========================================================
   HELPER: ADMIN EMAIL
========================================================= */

const sendAdminNotificationEmail = async ({
  admin,
  title,
  message,
  type,
  priority,
  data = {},
}) => {
  try {
    if (!admin?.email) {
      console.log(
        "⚠️ ADMIN EMAIL: Admin has no email address",
      );
      return;
    }

    const settings =
      admin.notificationSettings || {};

    if (settings.emailAlerts === false) {
      console.log(
        "🔕 ADMIN EMAIL: emailAlerts is OFF",
      );
      return;
    }

    const adminName =
      admin.firstName ||
      admin.name ||
      `${admin.firstName || ""} ${
        admin.lastName || ""
      }`.trim() ||
      "Administrator";

    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <body
          style="
            margin: 0;
            padding: 0;
            background: #f4f7fb;
            font-family: Arial, sans-serif;
            color: #1f2937;
          "
        >
          <div
            style="
              max-width: 600px;
              margin: 40px auto;
              background: #ffffff;
              border-radius: 16px;
              overflow: hidden;
              border: 1px solid #e5e7eb;
            "
          >
            <div
              style="
                padding: 24px;
                background: #16a34a;
                color: white;
              "
            >
              <h2
                style="
                  margin: 0;
                  font-size: 22px;
                "
              >
                GuidEd Admin Alert
              </h2>

              <p
                style="
                  margin: 6px 0 0;
                  opacity: 0.9;
                "
              >
                New system activity requires your attention.
              </p>
            </div>

            <div style="padding: 28px;">
              <p
                style="
                  margin-top: 0;
                  font-size: 15px;
                "
              >
                Hello <strong>${adminName}</strong>,
              </p>

              <div
                style="
                  background: #f0fdf4;
                  border: 1px solid #bbf7d0;
                  border-radius: 12px;
                  padding: 18px;
                  margin: 20px 0;
                "
              >
                <h3
                  style="
                    margin: 0 0 10px;
                    color: #166534;
                  "
                >
                  ${title}
                </h3>

                <p
                  style="
                    margin: 0;
                    color: #374151;
                    line-height: 1.6;
                  "
                >
                  ${message}
                </p>
              </div>

              <div
                style="
                  margin-top: 20px;
                  padding: 16px;
                  background: #f9fafb;
                  border-radius: 10px;
                "
              >
                <p
                  style="
                    margin: 0 0 8px;
                    font-size: 13px;
                    color: #6b7280;
                  "
                >
                  <strong>Notification Type:</strong>
                  ${type}
                </p>

                <p
                  style="
                    margin: 0 0 8px;
                    font-size: 13px;
                    color: #6b7280;
                  "
                >
                  <strong>Priority:</strong>
                  ${priority}
                </p>

                ${
                  data?.reportId
                    ? `
                      <p
                        style="
                          margin: 0 0 8px;
                          font-size: 13px;
                          color: #6b7280;
                        "
                      >
                        <strong>Report ID:</strong>
                        ${data.reportId}
                      </p>
                    `
                    : ""
                }

                ${
                  data?.incidentId
                    ? `
                      <p
                        style="
                          margin: 0;
                          font-size: 13px;
                          color: #6b7280;
                        "
                      >
                        <strong>Incident ID:</strong>
                        ${data.incidentId}
                      </p>
                    `
                    : ""
                }
              </div>

              <p
                style="
                  margin-top: 28px;
                  font-size: 12px;
                  color: #9ca3af;
                  line-height: 1.5;
                "
              >
                This notification was generated automatically
                by the GuidEd system based on your admin
                notification settings.
              </p>
            </div>
          </div>
        </body>
      </html>
    `;

    await sendNotificationEmail({
      to: admin.email,
      subject: `GuidEd Admin Alert: ${title}`,
      html: emailHtml,
    });

    console.log(
      "✅ ADMIN EMAIL SENT:",
      admin.email,
    );
  } catch (error) {
    console.error(
      "❌ ADMIN EMAIL FAILED:",
      error?.message || error,
    );
  }
};

/* =========================================================
   ADMIN NOTIFICATION HELPER
========================================================= */

const notifyAdmins = async ({
  title,
  message,
  type = "update",
  priority = "low",
  settingKey = "emailAlerts",
  data = {},
}) => {
  try {
    console.log("");
    console.log("========================================");
    console.log("🔔 ADMIN NOTIFICATION STARTED");
    console.log("Title:", title);
    console.log("Message:", message);
    console.log("Setting:", settingKey);
    console.log("========================================");

    const admins = await User.find({
      role: "admin",
    }).select(
      "_id email name firstName lastName notificationSettings pushTokens",
    );

    if (!admins.length) {
      console.log(
        "⚠️ NO ADMIN USERS FOUND",
      );
      return;
    }

    console.log(
      `👨‍💼 Found ${admins.length} admin(s)`,
    );

    for (const admin of admins) {
      try {
        const settings =
          admin.notificationSettings || {};

        console.log("");
        console.log("----------------------------------------");
        console.log(
          "👤 ADMIN:",
          admin.email,
        );
        console.log(
          "Admin ID:",
          admin._id.toString(),
        );

        const settingEnabled =
          settings[settingKey] !== false;

        console.log(
          `⚙️ ${settingKey}:`,
          settingEnabled
            ? "ON"
            : "OFF",
        );

        if (!settingEnabled) {
          console.log(
            `🔕 Admin notification skipped because ${settingKey} is OFF`,
          );

          continue;
        }

        const notification =
          await createRealtimeNotification({
            userId: admin._id,

            title,
            message,

            type,
            priority,

            relatedId:
              data?.reportId ||
              data?.incidentId ||
              null,

            relatedType:
              data?.incidentId
                ? "incident"
                : data?.reportId
                  ? "report"
                  : "system",

            data,

            logPrefix:
              "ADMIN NOTIFICATION",
          });

        await sendFCMToUser({
          user: admin,

          title: `GuidEd 🔔 ${title}`,

          body: message,

          data: {
            type,

            ...data,

            notificationId:
              notification?._id?.toString() ||
              "",
          },

          logPrefix:
            "ADMIN FCM PUSH",
        });

        await sendAdminNotificationEmail({
          admin,

          title,
          message,

          type,
          priority,

          data,
        });

        console.log(
          `✅ ADMIN NOTIFICATION COMPLETED FOR: ${admin.email}`,
        );
      } catch (adminError) {
        console.error(
          `❌ Failed processing admin ${admin.email}:`,
          adminError?.message ||
            adminError,
        );
      }
    }

    console.log("");
    console.log("========================================");
    console.log("✅ ADMIN NOTIFICATION FINISHED");
    console.log("========================================");
  } catch (error) {
    console.error(
      "❌ notifyAdmins ERROR:",
      error?.message || error,
    );
  }
};

/* =========================================================
   TEST NOTIFICATION
========================================================= */

router.get(
  "/test-notif",
  (req, res) => {
    console.log(
      "🔥 TEST NOTIF TRIGGERED",
    );

    io.emit(
      "newNotification",
      {
        id: Date.now(),

        title:
          "TEST NOTIFICATION",

        message:
          "Web socket test from backend",

        type:
          "general",

        priority:
          "low",

        isRead:
          false,

        createdAt:
          new Date().toISOString(),

        data: {
          type:
            "test",
        },
      },
    );

    return res.json({
      success: true,
      message:
        "Test notification sent",
    });
  },
);

/* =========================================================
   CREATE GUEST REPORT
========================================================= */

router.post(
  "/guest",
  upload.array(
    "evidence",
    10,
  ),
  (req, res, next) => {
    console.log(
      "🔥 GUEST ROUTE HIT",
    );

    console.log(
      "BODY:",
      req.body,
    );

    console.log(
      "FILES:",
      req.files,
    );

    next();
  },
  createGuestReport,
);

/* =========================================================
   CREATE REPORT
========================================================= */

router.post(
  "/",
  verifyToken,
  upload.array(
    "evidence",
    10,
  ),
  (req, res, next) => {
    console.log(
      "🔥 REPORT ROUTE HIT",
    );

    console.log(
      "BODY:",
      req.body,
    );

    console.log(
      "FILES:",
      req.files,
    );

    next();
  },
  createReport,
);

/* =========================================================
   CREATE DIRECT INCIDENT
========================================================= */

router.post(
  "/direct",
  verifyToken,
  upload.array(
    "evidence",
    10,
  ),
  createDirectIncident,
);

/* =========================================================
   GET MY REPORTS
========================================================= */

router.get(
  "/my",
  verifyToken,
  getMyReports,
);

/* =========================================================
   GET ALL REPORTS
========================================================= */

router.get(
  "/",
  async (req, res) => {
    try {
      const {
        page = 1,
        limit = 100,
        status,
        search,
      } = req.query;

      const query = {};

      if (status) {
        query.status = status;
      }

      if (search) {
        query.$or = [
          {
            studentName: {
              $regex: search,
              $options: "i",
            },
          },
          {
            offense: {
              $regex: search,
              $options: "i",
            },
          },
        ];
      }

      const reports =
        await Report.find(query)
          .populate(
            "studentId",
            "name section age gender",
          )
          .populate(
            "reporterId",
            "name email",
          )
          .sort({
            createdAt: -1,
          })
          .skip(
            (page - 1) * limit,
          )
          .limit(
            parseInt(limit),
          );

      const total =
        await Report.countDocuments(
          query,
        );

      res.json({
        reports,

        totalPages:
          Math.ceil(
            total / limit,
          ),

        currentPage:
          Number(page),
      });
    } catch (err) {
      console.error(
        "GET REPORTS ERROR:",
        err,
      );

      res.status(500).json({
        message:
          err.message,
      });
    }
  },
);

/* =========================================================
   GET PRINTABLE REPORTS
========================================================= */

router.get(
  "/printable",
  verifyToken,
  getPrintableReports,
);

/* =========================================================
   GET REPORT BY ID
========================================================= */

router.get(
  "/:id",
  verifyToken,
  async (req, res) => {
    try {
      const { id } =
        req.params;

      if (
        !mongoose.Types.ObjectId.isValid(
          id,
        )
      ) {
        return res.status(400).json({
          message:
            "Invalid report ID",
        });
      }

      const report =
        await Report.findById(id)
          .populate(
            "studentId",
            "firstName middleName lastName name grade section gender",
          )
          .populate(
            "reporterId",
            "firstName lastName name email",
          );

      if (!report) {
        return res.status(404).json({
          message:
            "Report not found",
        });
      }

      const incident =
        await Incident.findOne({
          reportId:
            report._id,
        }).select(
          "status completedAt statementStatus caseLogs action level",
        );

      let interventions = [];

      if (incident) {
        interventions =
          await Intervention.find({
            incidentId:
              incident._id,
          }).sort({
            createdAt: -1,
          });
      }

      const currentStatus =
        incident?.status ||
        report.status ||
        "pending";

      res.json({
        ...report.toObject(),

        status:
          currentStatus,

        reportStatus:
          report.status,

        incidentId:
          incident?._id ||
          null,

        incidentStatus:
          incident?.status ||
          null,

        completedAt:
          incident?.completedAt ||
          null,

        statementStatus:
          incident?.statementStatus ||
          null,

        caseLogs:
          incident?.caseLogs ||
          [],

        actionTaken:
          incident?.action ||
          null,

        incidentLevel:
          incident?.level ||
          null,

        interventions,
      });
    } catch (err) {
      console.error(
        "GET report by ID error:",
        err,
      );

      res.status(500).json({
        message:
          err.message,
      });
    }
  },
);
/* =========================================================
   ACCEPT REPORT
========================================================= */

router.put(
  "/:id/accept",
  verifyToken,
  async (req, res) => {
    try {
      console.log("");
      console.log("========================================");
      console.log("🚨 ACCEPT REPORT STARTED");
      console.log("========================================");

      console.log(
        "Report ID:",
        req.params.id,
      );

      console.log(
        "Logged-in User ID:",
        req.userId,
      );

      /* =====================================================
         VALIDATE REPORT ID
      ===================================================== */

      if (
        !mongoose.Types.ObjectId.isValid(
          req.params.id,
        )
      ) {
        return res.status(400).json({
          message:
            "Invalid report ID",
        });
      }

      /* =====================================================
         GET ADMIN
      ===================================================== */

      const admin =
        await User.findById(
          req.userId,
        ).select(
          "_id email name firstName lastName role notificationSettings pushTokens",
        );

      if (!admin) {
        return res.status(401).json({
          message:
            "Logged-in user not found",
        });
      }

      if (
        admin.role !==
        "admin"
      ) {
        return res.status(403).json({
          message:
            "Only administrators can accept reports",
        });
      }

      /* =====================================================
         GET REPORT
      ===================================================== */

      const report =
        await Report.findById(
          req.params.id,
        );

      if (!report) {
        return res.status(404).json({
          message:
            "Report not found",
        });
      }

      console.log(
        "📄 Report:",
        report._id.toString(),
      );

      console.log(
        "Offense:",
        report.offense,
      );

      console.log(
        "Student ID:",
        report.studentId,
      );

      console.log(
        "Reporter ID:",
        report.reporterId,
      );

      console.log(
        "Current Status:",
        report.status,
      );

      /* =====================================================
         PREVENT DUPLICATE ACCEPTANCE
      ===================================================== */

      if (
        report.status ===
        "under_review"
      ) {
        return res.status(400).json({
          message:
            "This report has already been accepted.",
        });
      }

      /* =====================================================
         DETERMINE DISCIPLINE ACTION
      ===================================================== */

      const studentId =
        report.studentId;

      const totalOffenses =
        await Report.countDocuments({
          studentId,
        });

      const severity =
        getOffenseSeverity(
          report.offense,
        );

      const decision =
        getDisciplineAction({
          offenseCount:
            totalOffenses,

          offense:
            report.offense,
        });

      decision.level =
        severity;

      console.log("");
      console.log(
        "🧠 DISCIPLINE DECISION",
      );

      console.log(
        "Total Offenses:",
        totalOffenses,
      );

      console.log(
        "Severity:",
        severity,
      );

      console.log(
        "Action:",
        decision.action,
      );

      console.log(
        "Level:",
        decision.level,
      );

      /* =====================================================
         UPDATE REPORT
      ===================================================== */

      report.status =
        "under_review";

      await report.save();

      console.log(
        "✅ Report status updated:",
        report.status,
      );

      /* =====================================================
         CREATE INCIDENT
      ===================================================== */

      const incident =
        await Incident.create({
          studentId,

          reportId:
            report._id,

          title:
            report.offense,

          category:
            report.offense,

          action:
            decision.action,

          level:
            decision.level,

          status:
            "received",

          evidence:
            report.evidence ||
            [],
        });

      console.log("");
      console.log(
        "✅ INCIDENT CREATED:",
        incident._id.toString(),
      );

      /* =====================================================
         UPDATE STUDENT STATS
      ===================================================== */

      await Student.findByIdAndUpdate(
        studentId,
        {
          totalIncidents:
            totalOffenses,

          riskLevel:
            decision.level,
        },
      );

      /* =====================================================
         FIND REPORTED STUDENT
      ===================================================== */

      let student = null;
      let studentUser = null;

      if (studentId) {
        student =
          await Student.findById(
            studentId,
          );

        if (student) {
          console.log("");
          console.log(
            "👨‍🎓 REPORTED STUDENT FOUND",
          );

          console.log(
            "Student MongoDB ID:",
            student._id.toString(),
          );

          console.log(
            "Student ID:",
            student.studentId,
          );

          /* =================================================
             FIND USER ACCOUNT OF REPORTED STUDENT
          ================================================= */

          studentUser =
            await User.findOne({
              studentId:
                student.studentId,
            }).select(
              "_id studentId email name firstName lastName pushTokens notificationSettings",
            );

          if (studentUser) {
            console.log(
              "✅ Student User account found:",
              studentUser.email ||
                studentUser._id.toString(),
            );

            console.log(
              "Student User ID:",
              studentUser._id.toString(),
            );

            console.log(
              "Student push tokens:",
              studentUser.pushTokens?.length ||
                0,
            );
          } else {
            console.log(
              "⚠️ Student User account not found:",
              student.studentId,
            );
          }
        } else {
          console.log(
            "⚠️ Student record not found:",
            studentId,
          );
        }
      }

      /* =====================================================
         STUDENT NOTIFICATION
         REPORTED STUDENT
      ===================================================== */

      if (studentUser) {
        try {
          console.log("");
          console.log("========================================");
          console.log(
            "📢 REPORTED STUDENT ACCEPT NOTIFICATION",
          );
          console.log("========================================");

          console.log(
            "Student:",
            studentUser.email ||
              studentUser._id.toString(),
          );

          const studentNotificationData =
            {
              type:
                "report_accepted",

              reportId:
                report._id.toString(),

              incidentId:
                incident._id.toString(),

              studentId:
                student?._id?.toString() ||
                "",

              status:
                "under_review",

              level:
                incident.level,

              action:
                decision.action ||
                null,
            };

          /* =================================================
             DATABASE + SOCKET.IO
          ================================================= */

          const studentNotification =
            await createRealtimeNotification({
              userId:
                studentUser._id,

              title:
                "Report Accepted",

              message:
                `A report regarding "${report.offense}" ` +
                `was approved and is now under review.`,

              type:
                "warning",

              priority:
                "high",

              relatedId:
                report._id,

              relatedType:
                "report",

              data:
                studentNotificationData,

              logPrefix:
                "STUDENT ACCEPT NOTIFICATION",
            });

          console.log(
            "Student notification ID:",
            studentNotification?._id?.toString() ||
              "Database notification failed",
          );

          /* =================================================
             NATIVE FCM
          ================================================= */

          await sendFCMToUser({
            user:
              studentUser,

            title:
              "⚠️ Report Accepted",

            body:
              `A report regarding "${report.offense}" ` +
              `was approved and is now under review.`,

            data: {
              ...studentNotificationData,

              notificationId:
                studentNotification?._id?.toString() ||
                "",
            },

            logPrefix:
              "STUDENT ACCEPT FCM",
          });

          console.log(
            "✅ REPORTED STUDENT ACCEPT NOTIFICATION COMPLETED",
          );

          console.log("========================================");
        } catch (
          studentNotificationError
        ) {
          console.error("");
          console.error(
            "❌ REPORTED STUDENT ACCEPT NOTIFICATION ERROR:",
          );

          console.error(
            "Message:",
            studentNotificationError?.message ||
              studentNotificationError,
          );

          console.error(
            "Error:",
            studentNotificationError,
          );

          console.error("========================================");
        }
      } else {
        console.log("");
        console.log(
          "⚠️ REPORTED STUDENT NOTIFICATION SKIPPED",
        );

        console.log(
          "Reason: Student User account not found.",
        );
      }

      /* =====================================================
         REPORTER NOTIFICATION
         REPORTER WHO SUBMITTED THE REPORT
      ===================================================== */

      if (report.reporterId) {
        try {
          console.log("");
          console.log("========================================");
          console.log(
            "📢 REPORTER ACCEPT NOTIFICATION",
          );
          console.log("========================================");

          console.log(
            "Reporter ID:",
            report.reporterId.toString(),
          );

          const reporter =
            await User.findById(
              report.reporterId,
            ).select(
              "_id email name firstName lastName pushTokens notificationSettings",
            );

          if (!reporter) {
            console.log(
              "⚠️ Reporter user not found:",
              report.reporterId.toString(),
            );
          } else {
            console.log(
              "✅ Reporter found:",
              reporter.email ||
                reporter._id.toString(),
            );

            const reporterNotificationData =
              {
                type:
                  "report_accepted",

                reportId:
                  report._id.toString(),

                incidentId:
                  incident._id.toString(),

                status:
                  "under_review",

                level:
                  incident.level,

                action:
                  decision.action ||
                  null,
              };

            /* =================================================
               DATABASE + SOCKET.IO
            ================================================= */

            const reporterNotification =
              await createRealtimeNotification({
                userId:
                  reporter._id,

                title:
                  "Your Report Was Accepted",

                message:
                  `Your report about "${report.offense}" ` +
                  `was approved and is now under review.`,

                type:
                  "success",

                priority:
                  "high",

                relatedId:
                  report._id,

                relatedType:
                  "report",

                data:
                  reporterNotificationData,

                logPrefix:
                  "REPORTER ACCEPT NOTIFICATION",
              });

            /* =================================================
               REPORTER FCM
            ================================================= */

            await sendFCMToUser({
              user:
                reporter,

              title:
                "✅ Your Report Was Accepted",

              body:
                `Your report about "${report.offense}" ` +
                `was approved and is now under review.`,

              data: {
                ...reporterNotificationData,

                notificationId:
                  reporterNotification?._id?.toString() ||
                  "",
              },

              logPrefix:
                "REPORTER ACCEPT FCM",
            });

            console.log(
              "✅ REPORTER ACCEPT NOTIFICATION COMPLETED",
            );
          }

          console.log("========================================");
        } catch (reporterError) {
          console.error("");
          console.error(
            "❌ REPORTER ACCEPT NOTIFICATION ERROR:",
          );

          console.error(
            reporterError?.message ||
              reporterError,
          );

          console.error(
            reporterError,
          );
        }
      } else {
        console.log(
          "⚠️ No reporterId found on this report. Reporter notification skipped.",
        );
      }

      /* =====================================================
         CURRENT ADMIN ALERT
      ===================================================== */

      const isHighRisk =
        incident.level
          ?.toLowerCase() ===
        "high";

      const adminSettingKey =
        isHighRisk
          ? "highRiskAlerts"
          : "emailAlerts";

      const adminSettings =
        admin.notificationSettings ||
        {};

      if (
        adminSettings[
          adminSettingKey
        ] !== false
      ) {
        const adminNotificationData =
          {
            type:
              "incident_created",

            reportId:
              report._id.toString(),

            incidentId:
              incident._id.toString(),

            status:
              "received",

            level:
              incident.level,

            action:
              decision.action ||
              null,
          };

        /* =================================================
           DATABASE + SOCKET.IO
        ================================================= */

        const adminNotification =
          await createRealtimeNotification({
            userId:
              admin._id,

            title:
              "New Incident Created",

            message:
              `A report has been accepted and converted ` +
              `into a new incident. Offense: ` +
              `"${report.offense}".`,

            type:
              "warning",

            priority:
              isHighRisk
                ? "high"
                : "medium",

            relatedId:
              incident._id,

            relatedType:
              "incident",

            data:
              adminNotificationData,

            logPrefix:
              "ADMIN INCIDENT NOTIFICATION",
          });

        /* =================================================
           NATIVE / WEB FCM
        ================================================= */

        await sendFCMToUser({
          user:
            admin,

          title:
            "🚨 New Incident",

          body:
            `A report has been accepted and converted ` +
            `into a new incident. Offense: ` +
            `"${report.offense}".`,

          data: {
            ...adminNotificationData,

            notificationId:
              adminNotification?._id?.toString() ||
              "",
          },

          logPrefix:
            "ADMIN INCIDENT FCM",
        });

        /* =================================================
           ADMIN EMAIL
        ================================================= */

        await sendAdminNotificationEmail({
          admin,

          title:
            "New Incident Created",

          message:
            `A report has been accepted and converted ` +
            `into a new incident. Offense: ` +
            `"${report.offense}".`,

          type:
            "warning",

          priority:
            isHighRisk
              ? "high"
              : "medium",

          data:
            adminNotificationData,
        });
      } else {
        console.log(
          `🔕 Admin incident alert disabled because ${adminSettingKey} is OFF`,
        );
      }

      /* =====================================================
         REALTIME REPORT UPDATE
      ===================================================== */

      io.emit(
        "reportUpdated",
        {
          reportId:
            report._id,

          status:
            "under_review",
        },
      );

      /* =====================================================
         REALTIME INCIDENT CREATED
      ===================================================== */

      io.emit(
        "caseCreated",
        incident,
      );

      console.log("");
      console.log("========================================");
      console.log(
        "✅ ACCEPT REPORT COMPLETED",
      );
      console.log("========================================");

      return res.json({
        success: true,

        message:
          "Report accepted & processed",

        decision,

        incident,

        report: {
          _id:
            report._id,

          status:
            report.status,
        },
      });
    } catch (err) {
      console.error("");
      console.error("========================================");
      console.error(
        "❌ ACCEPT REPORT ERROR",
      );
      console.error("========================================");

      console.error(
        "Message:",
        err?.message,
      );

      console.error(
        "Error:",
        err,
      );

      console.error("========================================");

      return res.status(500).json({
        success: false,

        message:
          err?.message ||
          "Failed to accept report",
      });
    }
  },
);



/* =========================================================
   REJECT REPORT
========================================================= */

router.put(
  "/:id/reject",
  verifyToken,
  async (req, res) => {
    try {
      console.log("");
      console.log("========================================");
      console.log("❌ REJECT REPORT STARTED");
      console.log("========================================");

      console.log(
        "Report ID:",
        req.params.id,
      );

      console.log(
        "Logged-in User ID:",
        req.userId,
      );

      /* =====================================================
         VALIDATE ID
      ===================================================== */

      if (
        !mongoose.Types.ObjectId.isValid(
          req.params.id,
        )
      ) {
        return res.status(400).json({
          message:
            "Invalid report ID",
        });
      }

      /* =====================================================
         GET ADMIN
      ===================================================== */

      const admin =
        await User.findById(
          req.userId,
        ).select(
          "_id email name firstName lastName role notificationSettings pushTokens",
        );

      if (!admin) {
        return res.status(401).json({
          message:
            "Logged-in user not found",
        });
      }

      if (
        admin.role !==
        "admin"
      ) {
        return res.status(403).json({
          message:
            "Only administrators can reject reports",
        });
      }

      /* =====================================================
         GET REPORT
      ===================================================== */

      const report =
        await Report.findById(
          req.params.id,
        );

      if (!report) {
        return res.status(404).json({
          message:
            "Report not found",
        });
      }

      console.log(
        "📄 Report:",
        report._id.toString(),
      );

      console.log(
        "Offense:",
        report.offense,
      );

      console.log(
        "Student ID:",
        report.studentId,
      );

      console.log(
        "Reporter ID:",
        report.reporterId,
      );

      /* =====================================================
         PREVENT DUPLICATE REJECTION
      ===================================================== */

      if (
        report.status ===
        "rejected"
      ) {
        return res.status(400).json({
          message:
            "This report has already been rejected.",
        });
      }

      /* =====================================================
         UPDATE REPORT
      ===================================================== */

      report.status =
        "rejected";

      await report.save();

      console.log(
        "✅ Report status:",
        report.status,
      );

      /* =====================================================
         FIND STUDENT
      ===================================================== */

      let student = null;
      let studentUser = null;

      if (report.studentId) {
        student =
          await Student.findById(
            report.studentId,
          );

        if (student) {
          studentUser =
            await User.findOne({
              studentId:
                student.studentId,
            }).select(
              "_id studentId email name firstName lastName pushTokens notificationSettings",
            );
        }
      }

      /* =====================================================
         STUDENT REJECTION NOTIFICATION
         REPORTED STUDENT
      ===================================================== */

      if (studentUser) {
        const studentNotificationData =
          {
            type:
              "report_rejected",

            reportId:
              report._id.toString(),

            studentId:
              student?._id?.toString() ||
              "",

            status:
              "rejected",
          };

        const studentNotification =
          await createRealtimeNotification({
            userId:
              studentUser._id,

            title:
              "Report Rejected",

            message:
              `A report regarding "${report.offense}" ` +
              `was reviewed and rejected.`,

            type:
              "rejected",

            priority:
              "high",

            relatedId:
              report._id,

            relatedType:
              "report",

            data:
              studentNotificationData,

            logPrefix:
              "STUDENT REJECT NOTIFICATION",
          });

        /* =================================================
           STUDENT FCM
        ================================================= */

        await sendFCMToUser({
          user:
            studentUser,

          title:
            "❌ Report Rejected",

          body:
            `A report regarding "${report.offense}" ` +
            `was reviewed and rejected.`,

          data: {
            ...studentNotificationData,

            notificationId:
              studentNotification?._id?.toString() ||
              "",
          },

          logPrefix:
            "STUDENT REJECT FCM",
        });
      } else {
        console.log(
          "⚠️ Student user account not found for rejected report",
        );
      }

      /* =====================================================
         REPORTER REJECTION NOTIFICATION
         PERSON WHO SUBMITTED THE REPORT
      ===================================================== */

      if (report.reporterId) {
        try {
          console.log("");
          console.log("========================================");
          console.log("📢 REPORTER REJECT NOTIFICATION");
          console.log("========================================");

          console.log(
            "Reporter ID:",
            report.reporterId.toString(),
          );

          const reporter =
            await User.findById(
              report.reporterId,
            ).select(
              "_id email name firstName lastName pushTokens notificationSettings",
            );

          if (reporter) {
            console.log(
              "✅ Reporter found:",
              reporter.email ||
                reporter._id.toString(),
            );

            const reporterNotificationData =
              {
                type:
                  "report_rejected",

                reportId:
                  report._id.toString(),

                status:
                  "rejected",
              };

            const reporterNotification =
              await createRealtimeNotification({
                userId:
                  reporter._id,

                title:
                  "Your Report Was Reviewed",

                message:
                  `Your report about "${report.offense}" ` +
                  `was reviewed and rejected.`,

                type:
                  "rejected",

                priority:
                  "low",

                relatedId:
                  report._id,

                relatedType:
                  "report",

                data:
                  reporterNotificationData,

                logPrefix:
                  "REPORTER REJECT NOTIFICATION",
              });

            /* =================================================
               REPORTER FCM
            ================================================= */

            await sendFCMToUser({
              user:
                reporter,

              title:
                "❌ Your Report Was Reviewed",

              body:
                `Your report about "${report.offense}" ` +
                `was reviewed and rejected.`,

              data: {
                ...reporterNotificationData,

                notificationId:
                  reporterNotification?._id?.toString() ||
                  "",
              },

              logPrefix:
                "REPORTER REJECT FCM",
            });

            console.log(
              "✅ REPORTER REJECT NOTIFICATION COMPLETED",
            );
          } else {
            console.log(
              "⚠️ Reporter user not found:",
              report.reporterId,
            );
          }

          console.log("========================================");
        } catch (reporterError) {
          console.error(
            "❌ REPORTER REJECT NOTIFICATION ERROR:",
            reporterError?.message ||
              reporterError,
          );
        }
      } else {
        console.log(
          "⚠️ No reporterId found on this report. Reporter notification skipped.",
        );
      }

      /* =====================================================
         ADMIN ALERT
      ===================================================== */

      await notifyAdmins({
        title:
          "Report Rejected",

        message:
          `A submitted report regarding "${report.offense}" ` +
          `has been rejected.`,

        type:
          "rejected",

        priority:
          "low",

        settingKey:
          "emailAlerts",

        data: {
          type:
            "report_rejected",

          reportId:
            report._id.toString(),

          status:
            "rejected",
        },
      });

      /* =====================================================
         REALTIME REPORT UPDATE
      ===================================================== */

      io.emit(
        "reportUpdated",
        {
          reportId:
            report._id,

          status:
            "rejected",
        },
      );

      console.log("");
      console.log("========================================");
      console.log(
        "✅ REJECT REPORT COMPLETED",
      );
      console.log("========================================");

      return res.json({
        success: true,

        message:
          "Report rejected successfully",

        report: {
          _id:
            report._id,

          status:
            report.status,
        },
      });
    } catch (err) {
      console.error("");
      console.error("========================================");
      console.error(
        "❌ REJECT REPORT ERROR",
      );
      console.error("========================================");

      console.error(
        "Message:",
        err?.message,
      );

      console.error(
        "Error:",
        err,
      );

      console.error("========================================");

      return res.status(500).json({
        success: false,

        message:
          err?.message ||
          "Failed to reject report",
      });
    }
  },
);

/* =========================================================
   GET REPORTS
========================================================= */

router.get(
  "/reports",
  getReports,
);

export default router;
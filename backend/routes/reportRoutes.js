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
} from "../controllers/reportController.js";

import { getDisciplineAction } from "../utils/disciplineEngine.js";
import { getOffenseSeverity } from "../utils/offenseSeverity.js";

import { upload } from "../middleware/upload.js";

import {
  createGuestReport,
  createDirectIncident,
} from "../controllers/reportController.js";

import { sendPushNotification } from "../utils/pushNotification.js";
import { sendNotificationEmail } from "../mailer/emails.js";

const router = express.Router();

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
      "_id email name firstName lastName notificationSettings expoPushToken",
    );

    if (!admins.length) {
      console.log("⚠️ NO ADMIN USERS FOUND");
      console.log("========================================");
      return;
    }

    console.log(`👨‍💼 Found ${admins.length} admin(s)`);

    for (const admin of admins) {
      try {
        const settings = admin.notificationSettings || {};

        console.log("");
        console.log("----------------------------------------");
        console.log("👤 ADMIN:", admin.email);
        console.log("Admin ID:", admin._id.toString());
        console.log(
          "Notification Settings:",
          settings,
        );

        /* =====================================================
           CHECK SETTING
        ===================================================== */

        const settingEnabled =
          settings[settingKey] !== false;

        console.log(
          `⚙️ ${settingKey}:`,
          settingEnabled ? "ON" : "OFF",
        );

        /*
          IMPORTANT:

          If the specific notification setting is disabled,
          do not send anything to this admin.
        */

        if (!settingEnabled) {
          console.log(
            `🔕 Admin notification skipped because ${settingKey} is OFF`,
          );

          console.log("----------------------------------------");
          continue;
        }

        /* =====================================================
           DATABASE NOTIFICATION
        ===================================================== */

        const notification =
          await Notification.create({
            userId: admin._id,
            title,
            message,
            type,
            priority,
            isRead: false,
            data,
          });

        console.log(
          "✅ Admin database notification created:",
          notification._id.toString(),
        );

        /* =====================================================
           SOCKET.IO
        ===================================================== */

        io.to(admin._id.toString()).emit(
          "newNotification",
          {
            ...notification.toObject(),
            id: notification._id.toString(),
            data,
          },
        );

        console.log(
          "🔌 Admin realtime notification emitted:",
          admin._id.toString(),
        );

        /* =====================================================
           EXPO PUSH
        ===================================================== */

        if (admin.expoPushToken) {
          try {
            console.log(
              "📱 Sending admin Expo push...",
            );

            const pushResult =
              await sendPushNotification({
                token: admin.expoPushToken,
                title: `EduGuard 🔔 ${title}`,
                body: message,
                data: {
                  type,
                  ...data,
                  notificationId:
                    notification._id.toString(),
                },
              });

            console.log(
              "✅ Admin Expo push sent:",
              admin.email,
            );

            console.log(
              "📨 Expo result:",
              pushResult,
            );
          } catch (pushError) {
            console.error(
              "❌ Admin Expo push failed:",
              admin.email,
            );

            console.error(
              pushError?.message ||
                pushError,
            );
          }
        } else {
          console.log(
            "⚠️ Admin has no Expo push token:",
            admin.email,
          );
        }

        /* =====================================================
           EMAIL
        ===================================================== */

        /*
          This is the important part.

          Your email.js exports:

          sendNotificationEmail({
            to,
            subject,
            html,
          })

          Therefore we call that function here.
        */

        if (
          settings.emailAlerts !== false &&
          admin.email
        ) {
          console.log("");
          console.log(
            "📧 EMAIL ALERT ENABLED FOR:",
            admin.email,
          );

          const adminName =
            admin.firstName ||
            admin.name ||
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
                      EduGuard Admin Alert
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
                      by the EduGuard system based on your admin
                      notification settings.
                    </p>

                  </div>

                </div>

              </body>
            </html>
          `;

          try {
            await sendNotificationEmail({
              to: admin.email,
              subject: `EduGuard Admin Alert: ${title}`,
              html: emailHtml,
            });

            console.log(
              "✅ ADMIN EMAIL SENT SUCCESSFULLY:",
              admin.email,
            );
          } catch (emailError) {
            console.error(
              "❌ ADMIN EMAIL FAILED:",
              admin.email,
            );

            console.error(
              "❌ Email error:",
              emailError?.message ||
                emailError,
            );
          }
        } else {
          console.log(
            "🔕 Admin email NOT sent.",
          );

          if (settings.emailAlerts === false) {
            console.log(
              "Reason: emailAlerts is OFF",
            );
          }

          if (!admin.email) {
            console.log(
              "Reason: admin has no email address",
            );
          }
        }

        console.log(
          `✅ ADMIN NOTIFICATION COMPLETED FOR: ${admin.email}`,
        );

        console.log("----------------------------------------");
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
    console.log("");
  } catch (error) {
    console.error(
      "❌ notifyAdmins ERROR:",
      error?.message ||
        error,
    );
  }
};

/* =========================================================
   TEST NOTIFICATION
========================================================= */

router.get("/test-notif", (req, res) => {
  console.log("🔥 TEST NOTIF TRIGGERED");

  io.emit("newNotification", {
    id: Date.now(),
    title: "TEST NOTIFICATION",
    message: "Web socket test from backend",
    createdAt: new Date().toISOString(),
  });

  return res.json({
    message: "Test notification sent",
  });
});

/* =========================================================
   CREATE GUEST REPORT
========================================================= */

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

/* =========================================================
   CREATE REPORT
========================================================= */

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

/* =========================================================
   CREATE DIRECT INCIDENT
========================================================= */

router.post(
  "/direct",
  verifyToken,
  upload.array("evidence", 10),
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

router.get("/", async (req, res) => {
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

    const reports = await Report.find(query)
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
      totalPages: Math.ceil(
        total / limit,
      ),
      currentPage: Number(page),
    });
  } catch (err) {
    console.error(
      "GET REPORTS ERROR:",
      err,
    );

    res.status(500).json({
      message: err.message,
    });
  }
});

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
      const { id } = req.params;

      if (
        !mongoose.Types.ObjectId.isValid(id)
      ) {
        return res.status(400).json({
          message: "Invalid report ID",
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
          message: "Report not found",
        });
      }

      /* =====================================================
         FIND INCIDENT CREATED FROM REPORT
      ===================================================== */

      const incident =
        await Incident.findOne({
          reportId: report._id,
        }).select(
          "status completedAt statementStatus caseLogs action level",
        );

      let interventions = [];

      if (incident) {
        interventions =
          await Intervention.find({
            incidentId: incident._id,
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

        status: currentStatus,

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
        message: err.message,
      });
    }
  },
);

/* =========================================================
   ACCEPT REPORT
========================================================= */

router.put("/:id/accept", verifyToken, async (req, res) => {
  try {
    console.log("");
    console.log("========================================");
    console.log("🚨 ACCEPT REPORT STARTED");
    console.log("========================================");
    console.log("Report ID:", req.params.id);
    console.log("Logged-in User ID:", req.userId);

    /* =====================================================
       GET CURRENTLY LOGGED-IN ADMIN
    ===================================================== */

    const admin = await User.findById(req.userId).select(
      "_id email name firstName lastName role notificationSettings pushTokens"
    );

    if (!admin) {
      console.log("❌ Logged-in admin not found");

      return res.status(401).json({
        message: "Logged-in user not found",
      });
    }

    if (admin.role !== "admin") {
      console.log("❌ User is not an admin:", admin.role);

      return res.status(403).json({
        message: "Only administrators can accept reports",
      });
    }

    console.log("");
    console.log("👨‍💼 CURRENT ADMIN");
    console.log("----------------------------------------");
    console.log("Name:", admin.name);
    console.log("Email:", admin.email);
    console.log("Admin ID:", admin._id.toString());
    console.log("----------------------------------------");

    /* =====================================================
       GET REPORT
    ===================================================== */

    const report = await Report.findById(req.params.id);

    if (!report) {
      console.log("❌ Report not found");

      return res.status(404).json({
        message: "Report not found",
      });
    }

    console.log("");
    console.log("📄 REPORT FOUND");
    console.log("----------------------------------------");
    console.log("Report ID:", report._id.toString());
    console.log("Offense:", report.offense);
    console.log("Student ID:", report.studentId);
    console.log("Reporter ID:", report.reporterId);
    console.log("Current Status:", report.status);
    console.log("----------------------------------------");

    /* =====================================================
       PREVENT DUPLICATE ACCEPTANCE
    ===================================================== */

    if (report.status === "under_review") {
      console.log("⚠️ Report already accepted");

      return res.status(400).json({
        message: "This report has already been accepted.",
      });
    }

    /* =====================================================
       UPDATE REPORT STATUS
    ===================================================== */

    report.status = "under_review";

    await report.save();

    console.log("");
    console.log("✅ REPORT STATUS UPDATED");
    console.log("New Status:", report.status);

    /* =====================================================
       DETERMINE DISCIPLINE ACTION
    ===================================================== */

    const studentId = report.studentId;

    const totalOffenses = await Report.countDocuments({
      studentId,
    });

    const severity = getOffenseSeverity(
      report.offense
    );

    const decision = getDisciplineAction({
      offenseCount: totalOffenses,
      offense: report.offense,
    });

    decision.level = severity;

    console.log("");
    console.log("========================================");
    console.log("🧠 DISCIPLINE DECISION");
    console.log("========================================");
    console.log("Student ID:", studentId);
    console.log("Total Offenses:", totalOffenses);
    console.log("Severity:", severity);
    console.log("Action:", decision.action);
    console.log("Level:", decision.level);
    console.log("========================================");

    /* =====================================================
       CREATE INCIDENT
    ===================================================== */

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

    console.log("");
    console.log("========================================");
    console.log("✅ INCIDENT CREATED");
    console.log("========================================");
    console.log(
      "Incident ID:",
      incident._id.toString()
    );
    console.log("Incident Status:", incident.status);
    console.log("Incident Level:", incident.level);
    console.log("========================================");

    /* =====================================================
       UPDATE STUDENT STATS
    ===================================================== */

    await Student.findByIdAndUpdate(studentId, {
      totalIncidents: totalOffenses,
      riskLevel: decision.level,
    });

    console.log("");
    console.log("✅ STUDENT STATS UPDATED");
    console.log("Student ID:", studentId);
    console.log("Total Incidents:", totalOffenses);
    console.log("Risk Level:", decision.level);

    /* =====================================================
       NOTIFY STUDENT
       
       IMPORTANT:
       - Notification.user MUST contain User._id
       - Mobile uses native FCM tokens
       - Do NOT use expoPushToken
    ===================================================== */

    try {
      console.log("");
      console.log("========================================");
      console.log("🔔 STUDENT NOTIFICATION STARTED");
      console.log("========================================");

      /* ===================================================
         FIND STUDENT
      =================================================== */

      const student = await Student.findById(studentId);

      if (!student) {
        console.log(
          "⚠️ Student record not found:",
          studentId
        );
      } else {
        console.log("✅ Student record found");
        console.log(
          "Student Mongo ID:",
          student._id.toString()
        );
        console.log(
          "Student ID:",
          student.studentId
        );

        /* =================================================
           FIND USER ACCOUNT
        ================================================= */

        const studentUser = await User.findOne({
          studentId: student.studentId,
        }).select(
          "_id studentId email name firstName lastName pushTokens notificationSettings"
        );

        if (!studentUser) {
          console.log("");
          console.log(
            "❌ STUDENT USER ACCOUNT NOT FOUND"
          );
          console.log(
            "Searching using studentId:",
            student.studentId
          );
        } else {
          console.log("");
          console.log(
            "✅ STUDENT USER ACCOUNT FOUND"
          );
          console.log("----------------------------------------");
          console.log(
            "User ID:",
            studentUser._id.toString()
          );
          console.log(
            "Student ID:",
            studentUser.studentId
          );
          console.log(
            "Email:",
            studentUser.email
          );
          console.log(
            "Name:",
            studentUser.name ||
              `${studentUser.firstName || ""} ${
                studentUser.lastName || ""
              }`.trim()
          );
          console.log("----------------------------------------");

          /* ===============================================
             CREATE DATABASE NOTIFICATION
             
             VERY IMPORTANT:
             Use `user`, NOT `userId`.
          =============================================== */

          const notification =
            await Notification.create({
              user: studentUser._id,

              title: "Report Accepted",

              message:
                `A report regarding "${report.offense}" ` +
                `was approved and is now under review.`,

              type: "success",

              priority: "high",

              isRead: false,

              relatedId: report._id,

              relatedType: "report",

              data: {
                type: "report_accepted",

                reportId:
                  report._id.toString(),

                incidentId:
                  incident._id.toString(),

                studentId:
                  student._id.toString(),

                status: "under_review",

                level:
                  incident.level,

                action:
                  decision.action || null,
              },
            });

          console.log("");
          console.log(
            "========================================"
          );
          console.log(
            "✅ STUDENT DATABASE NOTIFICATION CREATED"
          );
          console.log(
            "========================================"
          );
          console.log(
            "Notification ID:",
            notification._id.toString()
          );
          console.log(
            "Notification User:",
            notification.user?.toString()
          );
          console.log(
            "Notification Type:",
            notification.type
          );
          console.log(
            "Notification Priority:",
            notification.priority
          );
          console.log(
            "Notification Data:",
            notification.data
          );
          console.log(
            "========================================"
          );

          /* ===============================================
             SOCKET.IO REALTIME NOTIFICATION
          =============================================== */

          const studentUserId =
            studentUser._id.toString();

          console.log("");
          console.log(
            "🔌 SENDING SOCKET.IO NOTIFICATION"
          );
          console.log(
            "Target User Room:",
            studentUserId
          );

          io.to(studentUserId).emit(
            "newNotification",
            {
              ...notification.toObject(),

              id:
                notification._id.toString(),

              _id:
                notification._id.toString(),

              user:
                studentUserId,

              data: {
                ...notification.data,
              },
            }
          );

          console.log(
            "✅ SOCKET.IO NOTIFICATION EMITTED"
          );
          console.log(
            "Target Room:",
            studentUserId
          );

          /* ===============================================
             NATIVE FCM PUSH NOTIFICATION
             
             MOBILE:
             Firebase Cloud Messaging
             
             NOT Expo Push
          =============================================== */

          const fcmTokens =
            Array.isArray(studentUser.pushTokens)
              ? studentUser.pushTokens.filter(
                  (pushToken) =>
                    pushToken?.token &&
                    pushToken?.provider === "fcm"
                )
              : [];

          console.log("");
          console.log(
            "========================================"
          );
          console.log(
            "📱 STUDENT FCM PUSH"
          );
          console.log(
            "========================================"
          );
          console.log(
            "Total push tokens:",
            Array.isArray(
              studentUser.pushTokens
            )
              ? studentUser.pushTokens.length
              : 0
          );
          console.log(
            "FCM tokens:",
            fcmTokens.length
          );

          if (
            fcmTokens.length > 0
          ) {
            for (
              const pushToken of fcmTokens
            ) {
              try {
                console.log("");
                console.log(
                  "📱 Sending FCM push..."
                );
                console.log(
                  "Platform:",
                  pushToken.platform
                );
                console.log(
                  "Provider:",
                  pushToken.provider
                );
                console.log(
                  "Token:",
                  `${pushToken.token.substring(
                    0,
                    15
                  )}...`
                );

                const pushResult =
                  await sendPushNotification({
                    token:
                      pushToken.token,

                    title:
                      "⚠️ Report Accepted",

                    body:
                      `A report regarding "${report.offense}" ` +
                      `was approved and is now under review.`,

                    data: {
                      type:
                        "report_accepted",

                      reportId:
                        report._id.toString(),

                      incidentId:
                        incident._id.toString(),

                      studentId:
                        student._id.toString(),

                      status:
                        "under_review",

                      level:
                        incident.level,

                      notificationId:
                        notification._id.toString(),
                    },
                  });

                console.log(
                  "✅ FCM PUSH SENT"
                );

                console.log(
                  "Push Result:",
                  pushResult
                );
              } catch (pushError) {
                console.error("");
                console.error(
                  "❌ FCM PUSH FAILED"
                );
                console.error(
                  "Platform:",
                  pushToken.platform
                );
                console.error(
                  "Error:",
                  pushError?.message ||
                    pushError
                );
                console.error(
                  "Full Error:",
                  pushError
                );
              }
            }
          } else {
            console.log("");
            console.log(
              "⚠️ NO FCM TOKENS FOUND FOR STUDENT"
            );
            console.log(
              "Student User ID:",
              studentUserId
            );
            console.log(
              "pushTokens:",
              studentUser.pushTokens
            );
          }

          console.log(
            "========================================"
          );
          console.log(
            "🔔 STUDENT NOTIFICATION COMPLETED"
          );
          console.log(
            "========================================"
          );
        }
      }
    } catch (
      studentNotificationError
    ) {
      console.error("");
      console.error(
        "========================================"
      );
      console.error(
        "❌ STUDENT NOTIFICATION ERROR"
      );
      console.error(
        "========================================"
      );
      console.error(
        "Message:",
        studentNotificationError?.message
      );
      console.error(
        "Error:",
        studentNotificationError
      );
      console.error(
        "========================================"
      );
    }

    /* =====================================================
       ADMIN ALERT
       
       ONLY THE CURRENTLY LOGGED-IN ADMIN
       RECEIVES THIS ALERT.
    ===================================================== */

    console.log("");
    console.log("========================================");
    console.log("🚨 ADMIN ALERT");
    console.log("========================================");
    console.log(
      "Admin:",
      admin.email
    );
    console.log(
      "Admin ID:",
      admin._id.toString()
    );
    console.log(
      "Incident:",
      incident._id.toString()
    );
    console.log(
      "Level:",
      incident.level
    );

    /* =====================================================
       DETERMINE ADMIN SETTING
    ===================================================== */

    const isHighRisk =
      incident.level?.toLowerCase() ===
      "high";

    const settingKey = isHighRisk
      ? "highRiskAlerts"
      : "emailAlerts";

    const settings =
      admin.notificationSettings || {};

    console.log(
      "Setting Key:",
      settingKey
    );

    console.log(
      "Setting Value:",
      settings[settingKey]
    );

    /* =====================================================
       CHECK ADMIN SETTING
    ===================================================== */

    if (
      settings[settingKey] === false
    ) {
      console.log(
        `🔕 Admin alert disabled for ${admin.email}`
      );

      console.log(
        `Setting "${settingKey}" is OFF`
      );
    } else {
      /* ===================================================
         ADMIN DATABASE NOTIFICATION
         
         IMPORTANT:
         Use `user`, NOT `userId`.
      =================================================== */

      try {
        const adminNotification =
          await Notification.create({
            user: admin._id,

            title:
              "New Incident Created",

            message:
              `A report has been accepted and converted ` +
              `into a new incident. Offense: ` +
              `"${report.offense}".`,

            type: "warning",

            priority:
              isHighRisk
                ? "high"
                : "medium",

            isRead: false,

            relatedId:
              incident._id,

            relatedType:
              "incident",

            data: {
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
                decision.action || null,
            },
          });

        console.log("");
        console.log(
          "✅ ADMIN DATABASE NOTIFICATION CREATED"
        );
        console.log(
          "Notification ID:",
          adminNotification._id.toString()
        );

        /* ===============================================
           REAL-TIME SOCKET
        =============================================== */

        io.to(
          admin._id.toString()
        ).emit(
          "newNotification",
          {
            ...adminNotification.toObject(),

            id:
              adminNotification._id.toString(),

            _id:
              adminNotification._id.toString(),

            user:
              admin._id.toString(),
          }
        );

        console.log(
          "🔔 ADMIN REALTIME NOTIFICATION SENT"
        );
      } catch (
        notificationError
      ) {
        console.error(
          "❌ ADMIN DATABASE NOTIFICATION ERROR:",
          notificationError?.message ||
            notificationError
        );
      }

      /* =================================================
         ADMIN PUSH NOTIFICATION
         
         NOTE:
         Admin web notifications are primarily handled
         through Firebase Web FCM / Socket.IO.
         
         We do not use Expo push here.
      ================================================= */

      const adminFcmTokens =
        Array.isArray(admin.pushTokens)
          ? admin.pushTokens.filter(
              (pushToken) =>
                pushToken?.token &&
                pushToken?.provider === "fcm"
            )
          : [];

      if (
        adminFcmTokens.length > 0
      ) {
        for (
          const pushToken of adminFcmTokens
        ) {
          try {
            await sendPushNotification({
              token:
                pushToken.token,

              title:
                "🚨 New Incident",

              body:
                `A report has been accepted and converted ` +
                `into a new incident. Offense: ` +
                `"${report.offense}".`,

              data: {
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
              },
            });

            console.log(
              "📱 Admin FCM push sent:",
              admin.email
            );
          } catch (pushError) {
            console.error(
              "❌ ADMIN FCM PUSH ERROR:",
              pushError?.message ||
                pushError
            );
          }
        }
      } else {
        console.log(
          "⚠️ Admin has no FCM push tokens:",
          admin.email
        );
      }

      /* =================================================
         ADMIN EMAIL
      ================================================= */

      if (
        settings.emailAlerts !== false &&
        admin.email
      ) {
        try {
          console.log("");
          console.log(
            "========================================"
          );
          console.log(
            "📧 ADMIN EMAIL ALERT"
          );
          console.log(
            "Recipient:",
            admin.email
          );
          console.log(
            "Email Setting:",
            settings.emailAlerts
          );
          console.log(
            "========================================"
          );

          const emailSubject =
            "🚨 New Incident Created - EduGuard";

          const emailHtml = `
            <div style="
              font-family: Arial, sans-serif;
              max-width: 600px;
              margin: 0 auto;
              padding: 24px;
              color: #111827;
            ">

              <div style="
                background: #f0fdf4;
                border: 1px solid #bbf7d0;
                border-radius: 12px;
                padding: 20px;
                margin-bottom: 20px;
              ">

                <h2 style="
                  margin: 0;
                  color: #166534;
                ">
                  New Incident Created
                </h2>

                <p style="
                  margin-top: 8px;
                  color: #4b5563;
                ">
                  A report has been accepted and
                  converted into a new incident.
                </p>

              </div>

              <div style="
                background: #ffffff;
                border: 1px solid #e5e7eb;
                border-radius: 12px;
                padding: 20px;
              ">

                <p>
                  <strong>Offense:</strong>
                  ${report.offense}
                </p>

                <p>
                  <strong>Incident ID:</strong>
                  ${incident._id}
                </p>

                <p>
                  <strong>Risk Level:</strong>
                  ${incident.level}
                </p>

                <p>
                  <strong>Status:</strong>
                  ${incident.status}
                </p>

                <p>
                  <strong>Action:</strong>
                  ${decision.action || "N/A"}
                </p>

              </div>

              <p style="
                margin-top: 20px;
                color: #6b7280;
                font-size: 13px;
              ">
                This notification was sent because
                email alerts are enabled for your
                administrator account.
              </p>

            </div>
          `;

          await sendNotificationEmail({
            to: admin.email,
            subject: emailSubject,
            html: emailHtml,
          });

          console.log(
            "========================================"
          );

          console.log(
            "✅ ADMIN EMAIL SENT SUCCESSFULLY"
          );

          console.log(
            "Recipient:",
            admin.email
          );

          console.log(
            "========================================"
          );
        } catch (
          emailError
        ) {
          console.error(
            "========================================"
          );

          console.error(
            "❌ ADMIN EMAIL FAILED"
          );

          console.error(
            "Recipient:",
            admin.email
          );

          console.error(
            "Error:",
            emailError?.message ||
              emailError
          );

          console.error(
            "========================================"
          );
        }
      } else {
        console.log(
          "🔕 ADMIN EMAIL NOT SENT"
        );

        console.log(
          "Email Alerts:",
          settings.emailAlerts
        );

        console.log(
          "Admin Email:",
          admin.email
        );
      }
    }

    /* =====================================================
       REAL-TIME REPORT UPDATE
    ===================================================== */

    io.emit(
      "reportUpdated",
      {
        reportId:
          report._id,

        status:
          "under_review",
      }
    );

    console.log(
      "🔄 reportUpdated emitted"
    );

    /* =====================================================
       REAL-TIME INCIDENT CREATED
    ===================================================== */

    io.emit(
      "caseCreated",
      incident
    );

    console.log(
      "🔄 caseCreated emitted"
    );

    /* =====================================================
       COMPLETED
    ===================================================== */

    console.log("");
    console.log("========================================");
    console.log("✅ ACCEPT REPORT COMPLETED");
    console.log("========================================");
    console.log(
      "Report:",
      report._id.toString()
    );
    console.log(
      "Report Status:",
      report.status
    );
    console.log(
      "Incident:",
      incident._id.toString()
    );
    console.log(
      "Incident Status:",
      incident.status
    );
    console.log(
      "Incident Level:",
      incident.level
    );
    console.log(
      "Admin Alert Recipient:",
      admin.email
    );
    console.log("========================================");
    console.log("");

    return res.json({
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
    console.error(
      "========================================"
    );
    console.error(
      "❌ ACCEPT REPORT ERROR"
    );
    console.error(
      "========================================"
    );
    console.error(
      "Message:",
      err?.message
    );
    console.error(
      "Error:",
      err
    );
    console.error(
      "========================================"
    );

    return res.status(500).json({
      message:
        err?.message ||
        "Failed to accept report",
    });
  }
});

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
      console.log("Report ID:", req.params.id);
      console.log("Logged-in User ID:", req.userId);

      /* =====================================================
         GET CURRENTLY LOGGED-IN ADMIN
      ===================================================== */

      const admin = await User.findById(req.userId).select(
        "_id email name firstName lastName role notificationSettings pushTokens"
      );

      if (!admin) {
        console.log(
          "❌ Logged-in user not found"
        );

        return res.status(401).json({
          message:
            "Logged-in user not found",
        });
      }

      if (admin.role !== "admin") {
        console.log(
          "❌ User is not an admin:",
          admin.role
        );

        return res.status(403).json({
          message:
            "Only administrators can reject reports",
        });
      }

      console.log("");
      console.log("👨‍💼 CURRENT ADMIN");
      console.log("----------------------------------------");
      console.log("Name:", admin.name);
      console.log("Email:", admin.email);
      console.log(
        "Admin ID:",
        admin._id.toString()
      );
      console.log("----------------------------------------");

      /* =====================================================
         GET REPORT
      ===================================================== */

      const report =
        await Report.findById(
          req.params.id
        );

      if (!report) {
        console.log(
          "❌ Report not found"
        );

        return res.status(404).json({
          message:
            "Report not found",
        });
      }

      console.log("");
      console.log("📄 REPORT FOUND");
      console.log("----------------------------------------");
      console.log(
        "Report ID:",
        report._id.toString()
      );
      console.log(
        "Offense:",
        report.offense
      );
      console.log(
        "Student ID:",
        report.studentId
      );
      console.log(
        "Reporter ID:",
        report.reporterId
      );
      console.log(
        "Current Status:",
        report.status
      );
      console.log("----------------------------------------");

      /* =====================================================
         UPDATE REPORT STATUS
      ===================================================== */

      report.status =
        "rejected";

      await report.save();

      console.log("");
      console.log(
        "✅ REPORT STATUS UPDATED"
      );
      console.log(
        "New Status:",
        report.status
      );

      /* =====================================================
         NOTIFY STUDENT
         
         IMPORTANT:
         - Notification.user = User._id
         - Native FCM tokens
         - No Expo push token
      ===================================================== */

      if (report.studentId) {
        try {
          console.log("");
          console.log(
            "========================================"
          );
          console.log(
            "🔔 STUDENT REJECTION NOTIFICATION"
          );
          console.log(
            "========================================"
          );

          /* =================================================
             FIND STUDENT
          ================================================= */

          const student =
            await Student.findById(
              report.studentId
            );

          if (!student) {
            console.log(
              "⚠️ Student record not found:",
              report.studentId
            );
          } else {
            console.log(
              "✅ Student record found"
            );

            console.log(
              "Student Mongo ID:",
              student._id.toString()
            );

            console.log(
              "Student ID:",
              student.studentId
            );

            /* ===============================================
               FIND STUDENT USER ACCOUNT
            =============================================== */

            const studentUser =
              await User.findOne({
                studentId:
                  student.studentId,
              }).select(
                "_id studentId email name firstName lastName pushTokens notificationSettings"
              );

            if (!studentUser) {
              console.log("");
              console.log(
                "❌ STUDENT USER ACCOUNT NOT FOUND"
              );

              console.log(
                "Searching using studentId:",
                student.studentId
              );
            } else {
              console.log("");
              console.log(
                "✅ STUDENT USER ACCOUNT FOUND"
              );

              console.log(
                "User ID:",
                studentUser._id.toString()
              );

              console.log(
                "Student ID:",
                studentUser.studentId
              );

              console.log(
                "Email:",
                studentUser.email
              );

              /* =============================================
                 CREATE DATABASE NOTIFICATION
                 
                 IMPORTANT:
                 Use `user`, NOT `userId`.
              ============================================= */

              const notification =
                await Notification.create({
                  user:
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

                  isRead:
                    false,

                  relatedId:
                    report._id,

                  relatedType:
                    "report",

                  data: {
                    type:
                      "report_rejected",

                    reportId:
                      report._id.toString(),

                    studentId:
                      student._id.toString(),

                    status:
                      "rejected",
                  },
                });

              console.log("");
              console.log(
                "========================================"
              );
              console.log(
                "✅ STUDENT REJECTION NOTIFICATION CREATED"
              );
              console.log(
                "========================================"
              );

              console.log(
                "Notification ID:",
                notification._id.toString()
              );

              console.log(
                "Notification User:",
                notification.user?.toString()
              );

              console.log(
                "Notification Type:",
                notification.type
              );

              console.log(
                "Notification Priority:",
                notification.priority
              );

              console.log(
                "Notification Data:",
                notification.data
              );

              console.log(
                "========================================"
              );

              /* =============================================
                 SOCKET.IO REALTIME
              ============================================= */

              const studentUserId =
                studentUser._id.toString();

              console.log("");
              console.log(
                "🔌 SENDING STUDENT SOCKET.IO NOTIFICATION"
              );

              console.log(
                "Target User Room:",
                studentUserId
              );

              io.to(
                studentUserId
              ).emit(
                "newNotification",
                {
                  ...notification.toObject(),

                  id:
                    notification._id.toString(),

                  _id:
                    notification._id.toString(),

                  user:
                    studentUserId,

                  data: {
                    ...notification.data,
                  },
                }
              );

              console.log(
                "✅ STUDENT SOCKET.IO NOTIFICATION EMITTED"
              );

              /* =============================================
                 NATIVE FCM PUSH
                 
                 Mobile uses Firebase Cloud Messaging.
                 NOT Expo Push.
              ============================================= */

              const fcmTokens =
                Array.isArray(
                  studentUser.pushTokens
                )
                  ? studentUser.pushTokens.filter(
                      (pushToken) =>
                        pushToken?.token &&
                        pushToken?.provider ===
                          "fcm"
                    )
                  : [];

              console.log("");
              console.log(
                "========================================"
              );
              console.log(
                "📱 STUDENT FCM PUSH"
              );
              console.log(
                "========================================"
              );

              console.log(
                "Total push tokens:",
                Array.isArray(
                  studentUser.pushTokens
                )
                  ? studentUser.pushTokens.length
                  : 0
              );

              console.log(
                "FCM tokens:",
                fcmTokens.length
              );

              if (
                fcmTokens.length > 0
              ) {
                for (
                  const pushToken of fcmTokens
                ) {
                  try {
                    console.log("");
                    console.log(
                      "📱 Sending FCM rejection push..."
                    );

                    console.log(
                      "Platform:",
                      pushToken.platform
                    );

                    console.log(
                      "Provider:",
                      pushToken.provider
                    );

                    console.log(
                      "Token:",
                      `${pushToken.token.substring(
                        0,
                        15
                      )}...`
                    );

                    const pushResult =
                      await sendPushNotification({
                        token:
                          pushToken.token,

                        title:
                          "❌ Report Rejected",

                        body:
                          `A report regarding "${report.offense}" ` +
                          `was reviewed and rejected.`,

                        data: {
                          type:
                            "report_rejected",

                          reportId:
                            report._id.toString(),

                          studentId:
                            student._id.toString(),

                          status:
                            "rejected",

                          notificationId:
                            notification._id.toString(),
                        },
                      });

                    console.log(
                      "✅ STUDENT FCM PUSH SENT"
                    );

                    console.log(
                      "Push Result:",
                      pushResult
                    );
                  } catch (
                    pushError
                  ) {
                    console.error("");
                    console.error(
                      "❌ STUDENT FCM PUSH FAILED"
                    );

                    console.error(
                      "Platform:",
                      pushToken.platform
                    );

                    console.error(
                      "Error:",
                      pushError?.message ||
                        pushError
                    );

                    console.error(
                      "Full Error:",
                      pushError
                    );
                  }
                }
              } else {
                console.log("");
                console.log(
                  "⚠️ NO FCM TOKENS FOUND FOR STUDENT"
                );

                console.log(
                  "Student User ID:",
                  studentUserId
                );

                console.log(
                  "pushTokens:",
                  studentUser.pushTokens
                );
              }

              console.log(
                "========================================"
              );
              console.log(
                "🔔 STUDENT REJECTION NOTIFICATION COMPLETED"
              );
              console.log(
                "========================================"
              );
            }
          }
        } catch (
          studentNotificationError
        ) {
          console.error("");
          console.error(
            "========================================"
          );
          console.error(
            "❌ STUDENT REJECTION NOTIFICATION ERROR"
          );
          console.error(
            "========================================"
          );

          console.error(
            "Message:",
            studentNotificationError?.message
          );

          console.error(
            "Error:",
            studentNotificationError
          );

          console.error(
            "========================================"
          );
        }
      } else {
        console.log(
          "⚠️ Report has no studentId"
        );
      }

      /* =====================================================
         NOTIFY REPORTER
         
         If the reporter is different from the student,
         notify their User account as well.
      ===================================================== */

      if (report.reporterId) {
        try {
          console.log("");
          console.log(
            "========================================"
          );
          console.log(
            "📢 REPORTER REJECTION NOTIFICATION"
          );
          console.log(
            "========================================"
          );

          const reporter =
            await User.findById(
              report.reporterId
            ).select(
              "_id email name firstName lastName pushTokens notificationSettings"
            );

          if (!reporter) {
            console.log(
              "⚠️ Reporter user not found:",
              report.reporterId.toString()
            );
          } else {
            console.log(
              "✅ Reporter found:",
              reporter.email
            );

            /* =============================================
               CREATE REPORTER DATABASE NOTIFICATION
            ============================================= */

            const reporterNotification =
              await Notification.create({
                user:
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

                isRead:
                  false,

                relatedId:
                  report._id,

                relatedType:
                  "report",

                data: {
                  type:
                    "report_rejected",

                  reportId:
                    report._id.toString(),

                  status:
                    "rejected",
                },
              });

            console.log(
              "✅ Reporter database notification created:",
              reporterNotification._id.toString()
            );

            /* =============================================
               SOCKET.IO
            ============================================= */

            io.to(
              reporter._id.toString()
            ).emit(
              "newNotification",
              {
                ...reporterNotification.toObject(),

                id:
                  reporterNotification._id.toString(),

                _id:
                  reporterNotification._id.toString(),

                user:
                  reporter._id.toString(),

                data: {
                  ...reporterNotification.data,
                },
              }
            );

            console.log(
              "🔌 Reporter realtime notification sent"
            );

            /* =============================================
               REPORTER FCM
            ============================================= */

            const reporterFcmTokens =
              Array.isArray(
                reporter.pushTokens
              )
                ? reporter.pushTokens.filter(
                    (pushToken) =>
                      pushToken?.token &&
                      pushToken?.provider ===
                        "fcm"
                  )
                : [];

            console.log(
              "Reporter FCM tokens:",
              reporterFcmTokens.length
            );

            if (
              reporterFcmTokens.length > 0
            ) {
              for (
                const pushToken of reporterFcmTokens
              ) {
                try {
                  await sendPushNotification({
                    token:
                      pushToken.token,

                    title:
                      "❌ Your Report Was Reviewed",

                    body:
                      `Your report about "${report.offense}" ` +
                      `was reviewed and rejected.`,

                    data: {
                      type:
                        "report_rejected",

                      reportId:
                        report._id.toString(),

                      status:
                        "rejected",

                      notificationId:
                        reporterNotification._id.toString(),
                    },
                  });

                  console.log(
                    "📱 Reporter FCM push sent:",
                    reporter.email
                  );
                } catch (
                  pushError
                ) {
                  console.error(
                    "⚠️ REPORTER FCM PUSH ERROR:",
                    pushError?.message ||
                      pushError
                  );
                }
              }
            } else {
              console.log(
                "⚠️ Reporter has no FCM push tokens"
              );
            }
          }
        } catch (
          reporterNotificationError
        ) {
          console.error(
            "❌ REPORTER NOTIFICATION ERROR:",
            reporterNotificationError?.message ||
              reporterNotificationError
          );
        }
      }

      /* =====================================================
         ADMIN ALERT FOR REJECTED REPORT
         
         Uses general emailAlerts.
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
        }
      );

      console.log(
        "🔄 reportUpdated emitted"
      );

      /* =====================================================
         COMPLETED
      ===================================================== */

      console.log("");
      console.log(
        "========================================"
      );
      console.log(
        "✅ REJECT REPORT COMPLETED"
      );
      console.log(
        "========================================"
      );

      console.log(
        "Report:",
        report._id.toString()
      );

      console.log(
        "Status:",
        report.status
      );

      console.log(
        "========================================"
      );
      console.log("");

      return res.json({
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
      console.error(
        "========================================"
      );
      console.error(
        "❌ REJECT REPORT ERROR"
      );
      console.error(
        "========================================"
      );

      console.error(
        "Message:",
        err?.message
      );

      console.error(
        "Error:",
        err
      );

      console.error(
        "========================================"
      );

      return res.status(500).json({
        message:
          err?.message ||
          "Failed to reject report",
      });
    }
  }
);

/* =========================================================
   GET REPORTS
========================================================= */

router.get(
  "/reports",
  getReports,
);

export default router;
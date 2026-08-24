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

/* ================= ACCEPT REPORT ================= */

router.put("/:id/accept", verifyToken, async (req, res) => {
  try {
    console.log("========================================");
    console.log("🚨 ACCEPT REPORT STARTED");
    console.log("Report ID:", req.params.id);
    console.log("Logged-in User ID:", req.userId);
    console.log("========================================");

    /* =====================================================
       GET CURRENTLY LOGGED-IN ADMIN
    ===================================================== */

    const admin = await User.findById(req.userId).select(
      "_id email name firstName lastName role notificationSettings expoPushToken"
    );

    if (!admin) {
      return res.status(401).json({
        message: "Logged-in user not found",
      });
    }

    if (admin.role !== "admin") {
      return res.status(403).json({
        message: "Only administrators can accept reports",
      });
    }

    console.log("👨‍💼 CURRENT ADMIN:");
    console.log("Name:", admin.name);
    console.log("Email:", admin.email);
    console.log("Admin ID:", admin._id.toString());

    /* =====================================================
       GET REPORT
    ===================================================== */

    const report = await Report.findById(req.params.id);

    if (!report) {
      return res.status(404).json({
        message: "Report not found",
      });
    }

    console.log("📄 Report found:", report._id.toString());
    console.log("Offense:", report.offense);

    /* =====================================================
       PREVENT DUPLICATE ACCEPTANCE
    ===================================================== */

    if (report.status === "under_review") {
      return res.status(400).json({
        message: "This report has already been accepted.",
      });
    }

    /* =====================================================
       UPDATE REPORT STATUS
    ===================================================== */

    report.status = "under_review";
    await report.save();

    console.log("✅ Report status updated → under_review");

    /* =====================================================
       DETERMINE DISCIPLINE ACTION
    ===================================================== */

    const studentId = report.studentId;

    const totalOffenses = await Report.countDocuments({
      studentId,
    });

    const severity = getOffenseSeverity(report.offense);

    const decision = getDisciplineAction({
      offenseCount: totalOffenses,
      offense: report.offense,
    });

    decision.level = severity;

    console.log("========================================");
    console.log("🧠 DISCIPLINE DECISION");
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

    console.log("========================================");
    console.log("✅ INCIDENT CREATED");
    console.log("Incident ID:", incident._id.toString());
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

    /* =====================================================
       NOTIFY STUDENT
    ===================================================== */

    try {
      const student = await Student.findById(studentId);

      if (student) {
        const studentUser = await User.findOne({
          studentId: student.studentId,
        }).select(
          "expoPushToken email name firstName lastName"
        );

        if (studentUser) {
          const notification =
            await Notification.create({
              userId: studentUser._id,
              title: "Report Accepted",
              message: `A report regarding "${report.offense}" was approved.`,
              type: "warning",
              priority: "high",
              isRead: false,
              data: {
                type: "report_accepted",
                reportId:
                  report._id.toString(),
                incidentId:
                  incident._id.toString(),
                studentId:
                  student._id.toString(),
              },
            });

          /* ================= SOCKET ================= */

          io.to(studentUser._id.toString()).emit(
            "newNotification",
            {
              ...notification.toObject(),
              id: notification._id.toString(),
            }
          );

          console.log(
            "🔔 Student notification sent:",
            studentUser.email ||
              studentUser._id.toString()
          );

          /* ================= EXPO PUSH ================= */

          if (studentUser.expoPushToken) {
            try {
              await sendPushNotification({
                token:
                  studentUser.expoPushToken,

                title: "⚠️ Report Accepted",

                body: `A report regarding "${report.offense}" was approved.`,

                data: {
                  type: "report_accepted",
                  reportId:
                    report._id.toString(),
                  incidentId:
                    incident._id.toString(),
                  studentId:
                    student._id.toString(),
                  notificationId:
                    notification._id.toString(),
                },
              });

              console.log(
                "📱 Student push notification sent"
              );
            } catch (pushError) {
              console.error(
                "⚠️ STUDENT PUSH ERROR:",
                pushError.message
              );
            }
          } else {
            console.log(
              "⚠️ Student has no Expo push token"
            );
          }
        } else {
          console.log(
            "⚠️ Student User account not found"
          );
        }
      }
    } catch (studentNotificationError) {
      console.error(
        "⚠️ STUDENT NOTIFICATION ERROR:",
        studentNotificationError.message
      );
    }

    /* =====================================================
       ADMIN ALERT
       
       IMPORTANT:
       ONLY THE CURRENTLY LOGGED-IN ADMIN
       RECEIVES THIS ALERT.
    ===================================================== */

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
       CHECK SETTING
    ===================================================== */

    if (settings[settingKey] === false) {
      console.log(
        `🔕 Admin alert disabled for ${admin.email}`
      );

      console.log(
        `Setting "${settingKey}" is OFF`
      );
    } else {
      /* ===================================================
         ADMIN DATABASE NOTIFICATION
      =================================================== */

      try {
        const adminNotification =
          await Notification.create({
            userId: admin._id,

            title: "New Incident Created",

            message:
              `A report has been accepted and converted into a new incident. ` +
              `Offense: "${report.offense}".`,

            /*
              IMPORTANT:
              Must match Notification.js enum.
            */
            type: "warning",

            priority: isHighRisk
              ? "high"
              : "medium",

            isRead: false,

            data: {
              type: "incident_created",
              reportId:
                report._id.toString(),
              incidentId:
                incident._id.toString(),
              status: "received",
              level: incident.level,
            },
          });

        console.log(
          "✅ Admin database notification created:",
          adminNotification._id.toString()
        );

        /* ===============================================
           REAL-TIME SOCKET
        =============================================== */

        io.to(admin._id.toString()).emit(
          "newNotification",
          {
            ...adminNotification.toObject(),
            id: adminNotification._id.toString(),
          }
        );

        console.log(
          "🔔 Admin realtime notification sent to:",
          admin.email
        );
      } catch (notificationError) {
        console.error(
          "❌ ADMIN DATABASE NOTIFICATION ERROR:",
          notificationError.message
        );
      }

      /* =================================================
         ADMIN PUSH NOTIFICATION
      ================================================= */

      if (admin.expoPushToken) {
        try {
          await sendPushNotification({
            token: admin.expoPushToken,

            title: "🚨 New Incident",

            body:
              `A report has been accepted and converted into a new incident. ` +
              `Offense: "${report.offense}".`,

            data: {
              type: "incident_created",
              reportId:
                report._id.toString(),
              incidentId:
                incident._id.toString(),
              status: "received",
              level: incident.level,
            },
          });

          console.log(
            "📱 Admin push notification sent to:",
            admin.email
          );
        } catch (pushError) {
          console.error(
            "❌ ADMIN PUSH ERROR:",
            pushError.message
          );
        }
      } else {
        console.log(
          "⚠️ Admin has no Expo push token:",
          admin.email
        );
      }

      /* =================================================
         ADMIN EMAIL
         
         THIS IS THE PART THAT WAS NOT WORKING.
      ================================================= */

      if (
        settings.emailAlerts !== false &&
        admin.email
      ) {
        try {
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
        } catch (emailError) {
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
            emailError.message
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

    io.emit("reportUpdated", {
      reportId: report._id,
      status: "under_review",
    });

    /* =====================================================
       REAL-TIME INCIDENT CREATED
    ===================================================== */

    io.emit("caseCreated", incident);

    console.log("========================================");
    console.log("✅ ACCEPT REPORT COMPLETED");
    console.log("Report:", report._id.toString());
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

    return res.json({
      message: "Report accepted & processed",
      decision,
      incident,
    });
  } catch (err) {
    console.error(
      "========================================"
    );

    console.error(
      "❌ ACCEPT REPORT ERROR:"
    );

    console.error(err);

    console.error(
      "========================================"
    );

    return res.status(500).json({
      message: err.message,
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
      const report =
        await Report.findByIdAndUpdate(
          req.params.id,
          {
            status:
              "rejected",
          },
          {
            new: true,
          },
        );

      if (!report) {
        return res.status(404).json({
          message:
            "Report not found",
        });
      }

      /* =====================================================
         NOTIFY STUDENT
      ===================================================== */

      if (report.studentId) {
        const student =
          await Student.findById(
            report.studentId,
          );

        if (student) {
          const user =
            await User.findOne({
              studentId:
                student.studentId,
            }).select(
              "expoPushToken email name firstName lastName",
            );

          if (user) {
            const notification =
              await Notification.create(
                {
                  userId:
                    user._id,

                  title:
                    "Report Rejected",

                  message: `A report regarding "${report.offense}" was rejected.`,

                  type:
                    "rejected",

                  priority:
                    "high",

                  isRead:
                    false,

                  data: {
                    type:
                      "report_rejected",

                    reportId:
                      report._id.toString(),

                    studentId:
                      student._id.toString(),
                  },
                },
              );

            io.to(
              user._id.toString(),
            ).emit(
              "newNotification",
              {
                ...notification.toObject(),

                id:
                  notification._id.toString(),
              },
            );

            console.log(
              "🔔 Student rejection notification sent:",
              user._id.toString(),
            );

            if (
              user.expoPushToken
            ) {
              try {
                await sendPushNotification(
                  {
                    token:
                      user.expoPushToken,

                    title:
                      "❌ Report Rejected",

                    body: `A report regarding "${report.offense}" was rejected.`,

                    data: {
                      type:
                        "report_rejected",

                      reportId:
                        report._id.toString(),

                      studentId:
                        student._id.toString(),

                      notificationId:
                        notification._id.toString(),
                    },
                  },
                );

                console.log(
                  "📱 Student rejection push sent:",
                  user.email ||
                    user._id.toString(),
                );
              } catch (
                pushError
              ) {
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

      if (
        report.reporterId
      ) {
        const reporter =
          await User.findById(
            report.reporterId,
          ).select(
            "expoPushToken email name firstName lastName",
          );

        const notification =
          await Notification.create(
            {
              userId:
                report.reporterId,

              title:
                "Your Report Was Reviewed",

              message: `Your report about "${report.offense}" was reviewed and rejected.`,

              type:
                "rejected",

              priority:
                "low",

              isRead:
                false,

              data: {
                type:
                  "report_rejected",

                reportId:
                  report._id.toString(),
              },
            },
          );

        io.to(
          report.reporterId.toString(),
        ).emit(
          "newNotification",
          {
            ...notification.toObject(),

            id:
              notification._id.toString(),
          },
        );

        console.log(
          "🔔 Reporter rejection notification sent:",
          report.reporterId.toString(),
        );

        if (
          reporter?.expoPushToken
        ) {
          try {
            await sendPushNotification(
              {
                token:
                  reporter.expoPushToken,

                title:
                  "❌ Your Report Was Reviewed",

                body: `Your report about "${report.offense}" was reviewed and rejected.`,

                data: {
                  type:
                    "report_rejected",

                  reportId:
                    report._id.toString(),

                  notificationId:
                    notification._id.toString(),
                },
              },
            );

            console.log(
              "📱 Reporter rejection push sent:",
              reporter.email ||
                report.reporterId.toString(),
            );
          } catch (
            pushError
          ) {
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

      /* =====================================================
         ADMIN ALERT FOR REJECTED REPORT
         
         Uses general emailAlerts.
      ===================================================== */

      await notifyAdmins({
        title:
          "Report Rejected",

        message: `A submitted report regarding "${report.offense}" has been rejected.`,

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
         REALTIME
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

      return res.json(
        report,
      );
    } catch (err) {
      console.error(
        "REJECT ERROR:",
        err,
      );

      return res.status(500).json({
        message:
          err.message,
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
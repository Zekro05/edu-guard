import Report from "../models/reportModel.js";
import Student from "../models/studentModel.js";
import User from "../models/userModel.js";
import Notification from "../models/Notification.js";
import Incident from "../models/incidentModel.js";

import { notifyAdmins } from "../utils/createNotification.js";
import { io } from "../server.js";
import { getDisciplineAction } from "../utils/disciplineEngine.js";

import { sendPushNotification } from "../services/notificationService.js";
import { sendWebPushNotification } from "../utils/webPushNotification.js";
import {
  sendFCMToUser,
  createRealtimeNotification,
} from "../utils/notificationHelpers.js";

/* =========================================================
   GET ALL REPORTS BY TYPE
========================================================= */

export const getReportsByType = async (req, res) => {
  const { type } = req.params;

  try {
    const reports = await Report.find({
      type,
    });

    res.json(reports);
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
};

/* =========================================================
   CREATE A NEW REPORT
========================================================= */

export const createReport = async (req, res) => {
  try {
    const {
      studentId,
      studentName,
      offense,
      location,
      description,
      date,
      time,
      reporter,
    } = req.body;

    const files = req.files || [];

    console.log("🔥 REPORT ROUTE HIT");
    console.log("BODY:", req.body);
    console.log("FILES:", files);

    /* =====================================================
       VALIDATE EVIDENCE
    ===================================================== */

    if (files.length === 0) {
      return res.status(400).json({
        message: "No evidence uploaded via multer",
      });
    }

    /* =====================================================
       PREVENT STUDENT FROM REPORTING THEMSELVES
    ===================================================== */

    if (req.userId && studentId) {
      const reporterUser = await User.findById(req.userId);

      if (reporterUser?.role === "student") {
        const reporterStudent = await Student.findOne({
          studentId: reporterUser.studentId,
        });

        if (
          reporterStudent &&
          reporterStudent._id.toString() === studentId.toString()
        ) {
          return res.status(400).json({
            message: "You cannot report yourself.",
          });
        }
      }
    }

    /* =====================================================
       PROCESS EVIDENCE
    ===================================================== */

    const evidence = files.map((file) => ({
      url: file.path,

      type: file.mimetype.startsWith("image") ? "image" : "document",

      uploadedAt: new Date(),
    }));

    /* =====================================================
       CREATE REPORT
    ===================================================== */

    const report = await Report.create({
      studentId,

      studentName,

      offense,

      location,

      description,

      date: new Date(date),

      time,

      reporter: reporter || "Guest",

      reporterId: req.userId || null,

      reporterType: req.userId ? "student" : "guest",

      evidence,
    });

    /* =====================================================
       NOTIFY ADMINS THROUGH DATABASE/SOCKET
    ===================================================== */

    await notifyAdmins({
      title: "New Report Submitted",

      message:
        "A new student report has been submitted and requires your attention.",

      type: "report",

      priority: "high",

      relatedId: report._id,

      relatedType: "Report",

      io: req.app.get("io"),
    });

    console.log("✅ REPORT CREATED:", report._id);

    /* =====================================================
       FIND ALL ADMIN USERS
    ===================================================== */

    const adminUsers = await User.find({
      role: "admin",
    }).select(
      "pushTokens email name firstName middleName lastName role notificationSettings",
    );

    console.log(`👑 Admin users found: ${adminUsers.length}`);

    if (adminUsers.length === 0) {
      console.log("⚠️ No admin users found to notify.");
    }

    /* =====================================================
       NOTIFICATION DATA
    ===================================================== */

    const notificationData = {
      type: "report",

      reportId: report._id.toString(),

      studentId: report.studentId ? report.studentId.toString() : "",

      studentName: report.studentName || "",

      offense: report.offense || "",

      location: report.location || "",
    };

    /* =====================================================
       NOTIFY EACH ADMIN
    ===================================================== */

    for (const admin of adminUsers) {
      try {
        console.log(`👑 Processing admin notification for: ${admin.email}`);

        /* ===============================================
           SAVE DATABASE NOTIFICATION
        =============================================== */

        const notification = await Notification.create({
          user: admin._id,

          title: "New Report Submitted",

          message: `${
            report.reporter || "Someone"
          } submitted a report against ${
            report.studentName
          } for "${report.offense}".`,

          type: "report",

          priority: "high",

          isRead: false,

          relatedId: report._id,

          relatedType: "Report",
        });

        console.log(
          "🔔 Report notification saved:",
          notification._id,
          "for",
          admin.email,
        );

        /* ===============================================
           REALTIME SOCKET.IO
        =============================================== */

        io.to(admin._id.toString()).emit("newNotification", {
          ...notification.toObject(),

          id: notification._id.toString(),
        });

        /* ===============================================
           GET NATIVE MOBILE FCM TOKENS
           
           Current architecture:
           Android/iOS = native FCM
           
           Expo push tokens are no longer used.
        =============================================== */

        const mobileFcmTokens = Array.isArray(admin.pushTokens)
          ? admin.pushTokens.filter(
              (pushToken) =>
                pushToken?.provider === "fcm" &&
                ["android", "ios"].includes(pushToken?.platform),
            )
          : [];

        /* ===============================================
           GET WEB FCM TOKENS
        =============================================== */

        const webTokens = Array.isArray(admin.pushTokens)
          ? admin.pushTokens.filter(
              (pushToken) =>
                pushToken?.provider === "fcm" && pushToken?.platform === "web",
            )
          : [];

        console.log(
          `📱 Native FCM tokens for ${admin.email}:`,
          mobileFcmTokens.length,
        );

        console.log(`🌐 Web FCM tokens for ${admin.email}:`, webTokens.length);

        /* ===============================================
           NATIVE MOBILE FCM PUSH
        =============================================== */

        for (const pushToken of mobileFcmTokens) {
          try {
            await sendPushNotification({
              token: pushToken.token,

              title: "⚠️ New Report Submitted",

              body: `${
                report.reporter || "Someone"
              } submitted a report against ${
                report.studentName
              } for "${report.offense}".`,

              /*
                This tells notificationService.js
                that this is a report notification.

                The service will check:
                - mute
                - systemAnnouncements
                - sound
                - vibration
              */
              notificationType: "report",

              data: {
                ...notificationData,

                notificationId: notification._id.toString(),
              },
            });

            console.log(
              "📱 Native FCM report notification processed for:",
              admin.email,
            );
          } catch (pushError) {
            console.error(
              `⚠️ NATIVE FCM REPORT PUSH ERROR (${admin.email}):`,
              pushError,
            );
          }
        }

        /* ===============================================
           WEB FCM PUSH
        =============================================== */

        for (const pushToken of webTokens) {
          try {
            await sendWebPushNotification({
              token: pushToken.token,

              title: "⚠️ New Report Submitted",

              body: `${
                report.reporter || "Someone"
              } submitted a report against ${
                report.studentName
              } for "${report.offense}".`,

              data: {
                ...notificationData,

                notificationId: notification._id.toString(),
              },
            });

            console.log("🌐 Web FCM report notification sent to:", admin.email);
          } catch (webPushError) {
            console.error(
              `⚠️ WEB FCM REPORT PUSH ERROR (${admin.email}):`,
              webPushError,
            );
          }
        }

        /* ===============================================
           NO PUSH TOKENS
        =============================================== */

        if (mobileFcmTokens.length === 0 && webTokens.length === 0) {
          console.log(`⚠️ Admin has no registered push tokens: ${admin.email}`);
        }
      } catch (adminNotificationError) {
        console.error(
          `❌ ADMIN NOTIFICATION ERROR (${admin.email}):`,
          adminNotificationError,
        );
      }
    }

    /* =====================================================
       GLOBAL REALTIME NOTIFICATION

       Kept for your existing dashboard activity.
    ===================================================== */

    const reporterName = report.reporter || "Anonymous";

    io.emit("newNotification", {
      id: report._id,

      title: "New Report Submitted",

      message: `${reporterName} submitted a report against ${report.studentName} for "${report.offense}"`,

      type: "warning",

      priority: "high",

      isRead: false,

      createdAt: new Date().toISOString(),
    });

    /* =====================================================
       RESPONSE
    ===================================================== */

    return res.status(201).json(report);
  } catch (err) {
    console.error("❌ CREATE REPORT ERROR:", err);

    return res.status(500).json({
      message: err.message,
    });
  }
};

/* =========================================================
   CREATE DIRECT INCIDENT
========================================================= */

export const createDirectIncident = async (req, res) => {
  try {
    const {
      studentId,
      studentName,
      offense,
      location,
      description,
      date,
      time,
      reporter,
    } = req.body;

    const files = req.files || [];

    console.log("");
    console.log("========================================");
    console.log("🚨 CREATE DIRECT INCIDENT");
    console.log("========================================");

    console.log("Logged-in User ID:", req.userId);
    console.log("Student ID:", studentId);
    console.log("Student Name:", studentName);
    console.log("Offense:", offense);
    console.log("Location:", location);
    console.log("Reporter:", reporter);
    console.log("Files:", files.length);

    /* =====================================================
       VALIDATE REQUIRED FIELDS
    ===================================================== */

    if (
      !studentId ||
      !studentName ||
      !offense ||
      !location ||
      !description?.trim()
    ) {
      return res.status(400).json({
        message:
          "Student, offense, location, and description are required.",
      });
    }

    /* =====================================================
       VALIDATE EVIDENCE
    ===================================================== */

    if (files.length === 0) {
      return res.status(400).json({
        message: "No evidence uploaded via multer",
      });
    }

    /* =====================================================
       GET LOGGED-IN USER
    ===================================================== */

    const loggedInUser = await User.findById(req.userId).select(
      "_id role email name firstName middleName lastName",
    );

    if (!loggedInUser) {
      return res.status(401).json({
        message: "Logged-in user not found.",
      });
    }

    /* =====================================================
       DETERMINE REPORTER TYPE
    ===================================================== */

    let reporterType = "teacher";

    if (loggedInUser.role === "admin") {
      reporterType = "admin";
    } else if (loggedInUser.role === "teacher") {
      reporterType = "teacher";
    } else {
      return res.status(403).json({
        message:
          "Only administrators and teachers can create direct incidents.",
      });
    }

    /* =====================================================
       PROCESS EVIDENCE
    ===================================================== */

    const evidence = files.map((file) => ({
      url: file.path,

      type: file.mimetype.startsWith("image")
        ? "image"
        : "document",

      uploadedAt: new Date(),
    }));

    /* =====================================================
       CREATE REPORT
       
       IMPORTANT:
       Direct incidents are automatically accepted.
       They do NOT go through the pending report workflow.
    ===================================================== */

    const report = await Report.create({
      studentId,

      studentName,

      offense,

      location,

      description,

      date: new Date(date),

      time,

      reporter:
        reporter ||
        (loggedInUser.role === "admin"
          ? "Admin"
          : "Teacher"),

      reporterId: req.userId,

      reporterType,

      status: "accepted",

      evidence,
    });

    console.log(
      "✅ DIRECT REPORT CREATED:",
      report._id.toString(),
    );

    console.log(
      "📌 Report Status:",
      report.status,
    );

    console.log(
      "👤 Reporter Type:",
      reporterType,
    );

    /* =====================================================
       CALCULATE DISCIPLINE INFORMATION
    ===================================================== */

    const totalOffenses =
      await Report.countDocuments({
        studentId,
      });

    const highCount =
      await Report.countDocuments({
        studentId,

        offense:
          /fighting|assault|violence/i,
      });

    const mediumCount =
      await Report.countDocuments({
        studentId,

        offense:
          /bullying|cheating|disrespect/i,
      });

    const decision =
      getDisciplineAction({
        offenseCount:
          totalOffenses,

        hasHigh:
          highCount,

        hasMedium:
          mediumCount,

        offense,
      });

    console.log("");
    console.log(
      "🧠 DIRECT INCIDENT DECISION",
    );

    console.log(
      "Total Offenses:",
      totalOffenses,
    );

    console.log(
      "High Count:",
      highCount,
    );

    console.log(
      "Medium Count:",
      mediumCount,
    );

    console.log(
      "Level:",
      decision.level,
    );

    console.log(
      "Action:",
      decision.action,
    );

    /* =====================================================
       CREATE INCIDENT IMMEDIATELY
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

    console.log(
      "✅ DIRECT INCIDENT CREATED:",
      incident._id.toString(),
    );

    console.log(
      "📌 Incident Status:",
      incident.status,
    );

    /* =====================================================
       UPDATE REPORT WITH INCIDENT ID
       
       This is useful if your Report schema supports
       incidentId.
    ===================================================== */

    if (
      Object.prototype.hasOwnProperty.call(
        report,
        "incidentId",
      )
    ) {
      report.incidentId =
        incident._id;

      await report.save();
    }

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

    console.log(
      "✅ STUDENT STATS UPDATED",
    );

    /* =====================================================
       FIND REPORTED STUDENT
       
       Student.studentId is used to find the matching
       User account.
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
       
       The direct incident is already accepted, so the
       student receives an "Incident Created" notification
       instead of a "Report Accepted" notification.
    ===================================================== */

    if (studentUser) {
      try {
        console.log("");
        console.log("========================================");
        console.log(
          "📢 DIRECT INCIDENT STUDENT NOTIFICATION",
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
              "incident_created",

            reportId:
              report._id.toString(),

            incidentId:
              incident._id.toString(),

            studentId:
              student?._id?.toString() ||
              "",

            status:
              incident.status,

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
              "You have been reported.",

            message:
              `An incident report regarding "${report.offense}" ` +
              `has been recorded and is now under review.`,

            type:
              "warning",

            priority:
              "high",

            relatedId:
              incident._id,

            relatedType:
              "incident",

            data:
              studentNotificationData,

            logPrefix:
              "DIRECT INCIDENT STUDENT NOTIFICATION",
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
            "⚠️ New Incident Recorded",

          body:
            `An incident regarding "${report.offense}" ` +
            `has been recorded and is now under review.`,

          data: {
            ...studentNotificationData,

            notificationId:
              studentNotification?._id?.toString() ||
              "",
          },

          logPrefix:
            "DIRECT INCIDENT STUDENT FCM",
        });

        console.log(
          "✅ DIRECT INCIDENT STUDENT NOTIFICATION COMPLETED",
        );

        console.log(
          "========================================",
        );
      } catch (
        studentNotificationError
      ) {
        console.error("");
        console.error(
          "❌ DIRECT INCIDENT STUDENT NOTIFICATION ERROR:",
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

        console.error(
          "========================================",
        );
      }
    } else {
      console.log("");
      console.log(
        "⚠️ DIRECT INCIDENT STUDENT NOTIFICATION SKIPPED",
      );

      console.log(
        "Reason: Student User account not found.",
      );
    }

    /* =====================================================
       REALTIME INCIDENT EVENT
       
       Notify currently connected admin web clients.
    ===================================================== */

    io.emit(
      "caseCreated",
      incident,
    );

    io.emit(
      "reportUpdated",
      {
        reportId:
          report._id,

        status:
          "accepted",
      },
    );

    console.log("");
    console.log("========================================");
    console.log(
      "✅ DIRECT INCIDENT COMPLETED",
    );
    console.log("========================================");

    return res.status(201).json({
      success: true,

      message:
        "Incident created successfully.",

      report: {
        _id:
          report._id,

        status:
          report.status,

        reporterType:
          report.reporterType,
      },

      incident: {
        _id:
          incident._id,

        status:
          incident.status,

        level:
          incident.level,

        action:
          incident.action,
      },

      decision,
    });
  } catch (err) {
    console.error("");
    console.error("========================================");
    console.error(
      "❌ CREATE DIRECT INCIDENT ERROR",
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

    return res.status(500).json({
      success: false,

      message:
        err?.message ||
        "Failed to create incident.",
    });
  }
};

/* =========================================================
   CREATE GUEST REPORT
========================================================= */

export const createGuestReport = async (req, res) => {
  try {
    console.log("🔥 GUEST REPORT HIT");

    console.log("BODY:", req.body);

    console.log("FILES:", req.files);

    const {
      studentId,
      studentName,
      offense,
      location,
      description,
      date,
      time,
      reporter,
    } = req.body;

    const files = req.files || [];

    if (files.length === 0) {
      return res.status(400).json({
        message: "No evidence uploaded via multer",
      });
    }

    const evidence = files.map((file) => ({
      url: file.path,

      type: file.mimetype.startsWith("image") ? "image" : "document",

      uploadedAt: new Date(),
    }));

    const newReport = await Report.create({
      studentId: studentId || null,

      studentName,

      offense,

      location,

      description,

      date: new Date(date),

      time,

      reporter: reporter || "Guest",

      reporterId: null,

      reporterType: "guest",

      evidence,
    });

    /* ===================================================
       FIND ADMINS
    =================================================== */

    const adminUsers = await User.find({
      role: "admin",
    }).select(
      "pushTokens email name firstName middleName lastName role notificationSettings",
    );

    console.log(`👑 Admin users found for guest report: ${adminUsers.length}`);

    /* ===================================================
       NOTIFY ADMINS
    =================================================== */

    for (const admin of adminUsers) {
      try {
        /* ===============================================
           SAVE DATABASE NOTIFICATION
        =============================================== */

        const notification = await Notification.create({
          user: admin._id,

          title: "New Guest Report Submitted",

          message: `A guest submitted a report against ${studentName} for "${offense}".`,

          type: "report",

          priority: "high",

          isRead: false,

          relatedId: newReport._id,

          relatedType: "Report",
        });

        console.log(
          "🔔 Guest report notification saved:",
          notification._id,
          "for",
          admin.email,
        );

        /* ===============================================
           SOCKET.IO
        =============================================== */

        io.to(admin._id.toString()).emit("newNotification", {
          ...notification.toObject(),

          id: notification._id.toString(),
        });

        /* ===============================================
           NATIVE MOBILE FCM TOKENS
        =============================================== */

        const mobileFcmTokens = Array.isArray(admin.pushTokens)
          ? admin.pushTokens.filter(
              (pushToken) =>
                pushToken?.provider === "fcm" &&
                ["android", "ios"].includes(pushToken?.platform),
            )
          : [];

        /* ===============================================
           WEB FCM TOKENS
        =============================================== */

        const webTokens = Array.isArray(admin.pushTokens)
          ? admin.pushTokens.filter(
              (pushToken) =>
                pushToken?.provider === "fcm" && pushToken?.platform === "web",
            )
          : [];

        console.log(
          `📱 Native FCM tokens for ${admin.email}:`,
          mobileFcmTokens.length,
        );

        console.log(`🌐 Web FCM tokens for ${admin.email}:`, webTokens.length);

        /* ===============================================
           NATIVE MOBILE FCM PUSH
        =============================================== */

        for (const pushToken of mobileFcmTokens) {
          try {
            await sendPushNotification({
              token: pushToken.token,

              title: "⚠️ New Guest Report",

              body: `A guest submitted a report against ${studentName} for "${offense}".`,

              notificationType: "report",

              data: {
                type: "report",

                reportId: newReport._id.toString(),

                studentId: studentId ? studentId.toString() : "",

                notificationId: notification._id.toString(),
              },
            });

            console.log(
              "📱 Native FCM guest report notification processed for:",
              admin.email,
            );
          } catch (pushError) {
            console.error(
              `⚠️ NATIVE FCM GUEST REPORT PUSH ERROR (${admin.email}):`,
              pushError,
            );
          }
        }

        /* ===============================================
           WEB FCM PUSH
        =============================================== */

        for (const pushToken of webTokens) {
          try {
            await sendWebPushNotification({
              token: pushToken.token,

              title: "⚠️ New Guest Report",

              body: `A guest submitted a report against ${studentName} for "${offense}".`,

              data: {
                type: "report",

                reportId: newReport._id.toString(),

                studentId: studentId ? studentId.toString() : "",

                notificationId: notification._id.toString(),
              },
            });

            console.log(
              "🌐 Guest report Web FCM notification sent to:",
              admin.email,
            );
          } catch (webPushError) {
            console.error(
              `⚠️ GUEST REPORT WEB FCM ERROR (${admin.email}):`,
              webPushError,
            );
          }
        }

        /* ===============================================
           NO PUSH TOKENS
        =============================================== */

        if (mobileFcmTokens.length === 0 && webTokens.length === 0) {
          console.log(`⚠️ Admin has no registered push tokens: ${admin.email}`);
        }
      } catch (adminError) {
        console.error(
          `❌ GUEST ADMIN NOTIFICATION ERROR (${admin.email}):`,
          adminError,
        );
      }
    }

    return res.status(201).json({
      message: "Guest report submitted successfully",

      report: newReport,
    });
  } catch (err) {
    console.error("❌ GUEST REPORT ERROR:", err);

    return res.status(500).json({
      message: err.message,
    });
  }
};

/* =========================================================
   DELETE A REPORT
========================================================= */

export const deleteReport = async (req, res) => {
  const { id } = req.params;

  try {
    await Report.findByIdAndDelete(id);

    res.json({
      message: "Report deleted",
    });
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
};

/* =========================================================
   GET MY REPORTS
========================================================= */

export const getMyReports = async (req, res) => {
  try {
    const userId = req.userId;

    const reports = await Report.find({
      reporterId: userId,
    }).sort({
      createdAt: -1,
    });

    res.status(200).json(reports);
  } catch (err) {
    console.error("Get My Reports Error:", err);

    res.status(500).json({
      message: "Server error",
    });
  }
};

/* =========================================================
   GET REPORT BY ID
========================================================= */

export const getReportById = async (req, res) => {
  try {
    const report = await Report.findById(req.params.id)
      .populate("studentId", "name")
      .populate("reporterId", "firstName lastName name email");

    if (!report) {
      return res.status(404).json({
        message: "Report not found",
      });
    }

    res.json(report);
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
};

/* =========================================================
   GET ALL REPORTS
========================================================= */

export const getReports = async (req, res) => {
  try {
    const reports = await Report.find()
      .populate("studentId", "name section age gender")
      .populate("reporterId", "firstName lastName name email")
      .populate({
        path: "incidentId",

        select: "status",
      })
      .sort({
        createdAt: -1,
      });

    res.status(200).json(reports);
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
};

/* =========================================================
   GET PRINTABLE REPORTS
========================================================= */

export const getPrintableReports = async (req, res) => {
  try {
    const { status = "all", period = "monthly", date } = req.query;

    /* =====================================================
       DETERMINE DATE RANGE
    ===================================================== */

    const selectedDate = date ? new Date(`${date}T00:00:00`) : new Date();

    if (Number.isNaN(selectedDate.getTime())) {
      return res.status(400).json({
        message: "Invalid date.",
      });
    }

    let startDate;
    let endDate;

    /* =====================================================
       DAILY
    ===================================================== */

    if (period === "daily") {
      startDate = new Date(selectedDate);

      startDate.setHours(0, 0, 0, 0);

      endDate = new Date(selectedDate);

      endDate.setHours(23, 59, 59, 999);
    } else if (period === "weekly") {

    /* =====================================================
       WEEKLY
       Monday → Sunday
    ===================================================== */
      startDate = new Date(selectedDate);

      startDate.setHours(0, 0, 0, 0);

      const day = startDate.getDay();

      // Convert Sunday=0 to Monday-based week
      const difference = day === 0 ? 6 : day - 1;

      startDate.setDate(startDate.getDate() - difference);

      endDate = new Date(startDate);

      endDate.setDate(endDate.getDate() + 6);

      endDate.setHours(23, 59, 59, 999);
    } else if (period === "monthly") {

    /* =====================================================
       MONTHLY
    ===================================================== */
      startDate = new Date(
        selectedDate.getFullYear(),
        selectedDate.getMonth(),
        1,
        0,
        0,
        0,
        0,
      );

      endDate = new Date(
        selectedDate.getFullYear(),
        selectedDate.getMonth() + 1,
        0,
        23,
        59,
        59,
        999,
      );
    } else if (period === "yearly") {

    /* =====================================================
       YEARLY
    ===================================================== */
      startDate = new Date(selectedDate.getFullYear(), 0, 1, 0, 0, 0, 0);

      endDate = new Date(selectedDate.getFullYear(), 11, 31, 23, 59, 59, 999);
    } else {
      return res.status(400).json({
        message: "Invalid period. Use daily, weekly, monthly, or yearly.",
      });
    }

    /* =====================================================
       BUILD QUERY
    ===================================================== */

    const query = {
      date: {
        $gte: startDate,

        $lte: endDate,
      },

      /*
        Only reviewed reports should appear.

        Accepted reports can have:
        - accepted
        - under_review

        Rejected reports:
        - rejected
      */

      status: {
        $in: ["accepted", "under_review", "rejected"],
      },
    };

    /* =====================================================
       STATUS FILTER
    ===================================================== */

    if (status === "accepted") {
      query.status = {
        $in: ["accepted", "under_review"],
      };
    }

    if (status === "rejected") {
      query.status = "rejected";
    }

    /* =====================================================
       GET REPORTS
    ===================================================== */

    const reports = await Report.find(query)
      .populate(
        "studentId",
        "name firstName middleName lastName section grade gender age",
      )
      .populate("reporterId", "name firstName middleName lastName email")
      .sort({
        date: -1,

        createdAt: -1,
      });

    /* =====================================================
       SUMMARY
    ===================================================== */

    const accepted = reports.filter(
      (report) =>
        report.status === "accepted" || report.status === "under_review",
    ).length;

    const rejected = reports.filter(
      (report) => report.status === "rejected",
    ).length;

    return res.status(200).json({
      reports,

      summary: {
        total: reports.length,

        accepted,

        rejected,
      },

      period: {
        type: period,

        start: startDate,

        end: endDate,
      },

      filters: {
        status,
      },
    });
  } catch (err) {
    console.error("GET PRINTABLE REPORTS ERROR:", err);

    return res.status(500).json({
      message: err.message,
    });
  }
};

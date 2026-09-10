// backend/controllers/reportController.js

import Report from "../models/reportModel.js";
import Student from "../models/studentModel.js";
import User from "../models/userModel.js";
import Notification from "../models/Notification.js";
import Incident from "../models/incidentModel.js";
import { notifyAdmins } from "../utils/createNotification.js";

import { io } from "../server.js";

import { getDisciplineAction } from "../utils/disciplineEngine.js";

import { sendPushNotification } from "../utils/pushNotification.js";

import { sendWebPushNotification } from "../utils/webPushNotification.js";

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
    }).select("pushTokens email name firstName middleName lastName role");

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
          } submitted a report against ${report.studentName} for "${
            report.offense
          }".`,

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
           GET ADMIN EXPO TOKENS

           Android / iOS
        =============================================== */

        const expoTokens = Array.isArray(admin.pushTokens)
          ? admin.pushTokens.filter(
              (pushToken) =>
                pushToken?.provider === "expo" &&
                ["android", "ios"].includes(pushToken?.platform),
            )
          : [];

        /* ===============================================
           GET ADMIN WEB FCM TOKENS
        =============================================== */

        const webTokens = Array.isArray(admin.pushTokens)
          ? admin.pushTokens.filter(
              (pushToken) =>
                pushToken?.provider === "fcm" && pushToken?.platform === "web",
            )
          : [];

        console.log(`📱 Expo tokens for ${admin.email}:`, expoTokens.length);

        console.log(`🌐 Web FCM tokens for ${admin.email}:`, webTokens.length);

        /* ===============================================
           EXPO PUSH
        =============================================== */

        for (const pushToken of expoTokens) {
          try {
            await sendPushNotification({
              token: pushToken.token,

              title: "⚠️ New Report Submitted",

              body: `${
                report.reporter || "Someone"
              } submitted a report against ${report.studentName} for "${
                report.offense
              }".`,

              data: {
                ...notificationData,

                notificationId: notification._id.toString(),
              },
            });

            console.log("📱 Expo report notification sent to:", admin.email);
          } catch (pushError) {
            console.error(
              `⚠️ EXPO REPORT PUSH ERROR (${admin.email}):`,
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
              } submitted a report against ${report.studentName} for "${
                report.offense
              }".`,

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

        if (expoTokens.length === 0 && webTokens.length === 0) {
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

    const evidence = files.map((file) => ({
      url: file.path,

      type: file.mimetype.startsWith("image") ? "image" : "document",

      uploadedAt: new Date(),
    }));

    const report = await Report.create({
      studentId,

      studentName,

      offense,

      location,

      description,

      date: new Date(date),

      time,

      reporter: reporter || "Teacher",

      reporterId: req.userId,

      reporterType: "teacher",

      status: "accepted",

      evidence,
    });

    const totalOffenses = await Report.countDocuments({
      studentId,
    });

    const highCount = await Report.countDocuments({
      studentId,

      offense: /fighting|assault|violence/i,
    });

    const mediumCount = await Report.countDocuments({
      studentId,

      offense: /bullying|cheating|disrespect/i,
    });

    const decision = getDisciplineAction({
      offenseCount: totalOffenses,

      hasHigh: highCount,

      hasMedium: mediumCount,

      offense,
    });

    await Incident.create({
      studentId,

      reportId: report._id,

      title: offense,

      category: offense,

      action: decision.action,

      level: decision.level,

      status: "received",

      evidence,
    });

    await Student.findByIdAndUpdate(studentId, {
      totalIncidents: totalOffenses,

      riskLevel: decision.level,
    });

    return res.status(201).json({
      message: "Incident created successfully",
    });
  } catch (err) {
    console.error("❌ CREATE DIRECT INCIDENT ERROR:", err);

    return res.status(500).json({
      message: err.message,
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
    }).select("pushTokens email name firstName middleName lastName role");

    console.log(`👑 Admin users found for guest report: ${adminUsers.length}`);

    /* ===================================================
         NOTIFY ADMINS
      =================================================== */

    for (const admin of adminUsers) {
      try {
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
             EXPO TOKENS
          =============================================== */

        const expoTokens = Array.isArray(admin.pushTokens)
          ? admin.pushTokens.filter(
              (pushToken) =>
                pushToken?.provider === "expo" &&
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

        /* ===============================================
             EXPO PUSH
          =============================================== */

        for (const pushToken of expoTokens) {
          try {
            await sendPushNotification({
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
              "📱 Guest report Expo notification sent to:",
              admin.email,
            );
          } catch (pushError) {
            console.error("⚠️ GUEST REPORT EXPO PUSH ERROR:", pushError);
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
            console.error("⚠️ GUEST REPORT WEB FCM ERROR:", webPushError);
          }
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
    const {
      status = "all",
      period = "monthly",
      date,
    } = req.query;

    /* =====================================================
       DETERMINE DATE RANGE
    ===================================================== */

    const selectedDate = date
      ? new Date(`${date}T00:00:00`)
      : new Date();

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
    }

    /* =====================================================
       WEEKLY
       Monday → Sunday
    ===================================================== */

    else if (period === "weekly") {
      startDate = new Date(selectedDate);
      startDate.setHours(0, 0, 0, 0);

      const day = startDate.getDay();

      // Convert Sunday=0 to Monday-based week
      const difference = day === 0 ? 6 : day - 1;

      startDate.setDate(
        startDate.getDate() - difference,
      );

      endDate = new Date(startDate);
      endDate.setDate(
        endDate.getDate() + 6,
      );
      endDate.setHours(
        23,
        59,
        59,
        999,
      );
    }

    /* =====================================================
       MONTHLY
    ===================================================== */

    else if (period === "monthly") {
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
    }

    /* =====================================================
       YEARLY
    ===================================================== */

    else if (period === "yearly") {
      startDate = new Date(
        selectedDate.getFullYear(),
        0,
        1,
        0,
        0,
        0,
        0,
      );

      endDate = new Date(
        selectedDate.getFullYear(),
        11,
        31,
        23,
        59,
        59,
        999,
      );
    }

    else {
      return res.status(400).json({
        message:
          "Invalid period. Use daily, weekly, monthly, or yearly.",
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
        $in: [
          "accepted",
          "under_review",
          "rejected",
        ],
      },
    };

    /* =====================================================
       STATUS FILTER
    ===================================================== */

    if (status === "accepted") {
      query.status = {
        $in: [
          "accepted",
          "under_review",
        ],
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
      .populate(
        "reporterId",
        "name firstName middleName lastName email",
      )
      .sort({
        date: -1,
        createdAt: -1,
      });

    /* =====================================================
       SUMMARY
    ===================================================== */

    const accepted = reports.filter(
      (report) =>
        report.status === "accepted" ||
        report.status === "under_review",
    ).length;

    const rejected = reports.filter(
      (report) =>
        report.status === "rejected",
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
    console.error(
      "GET PRINTABLE REPORTS ERROR:",
      err,
    );

    return res.status(500).json({
      message: err.message,
    });
  }
};
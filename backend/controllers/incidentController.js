import mongoose from "mongoose";
import Incident from "../models/incidentModel.js";
import Student from "../models/studentModel.js";
import Intervention from "../models/interventionModel.js";
import Notification from "../models/Notification.js";
import User from "../models/userModel.js";
import Report from "../models/reportModel.js";

import { sendPushNotification } from "../services/notificationService.js";
import { io } from "../server.js";
import { sendNotificationEmail } from "../mailer/emails.js";

/* =========================================================
   STUDENT NOTIFICATION HELPER
   NATIVE FCM ONLY
========================================================= */

const notifyStudent = async ({
  studentId,
  title,
  message,
  type = "update",
  priority = "low",
  data = {},
}) => {
  try {
    const student = await Student.findById(studentId);

    if (!student) {
      console.log(
        "⚠️ Student not found for notification:",
        studentId
      );
      return;
    }

    const user = await User.findOne({
      studentId: student.studentId,
    });

    if (!user) {
      console.log(
        "⚠️ User account not found for student:",
        student.studentId
      );
      return;
    }

    /* =====================================================
       DETERMINE IF THIS IS A HIGH-RISK NOTIFICATION
    ===================================================== */

    const incidentLevel =
      String(
        data?.level ||
          incidentLevelFromPriority(priority)
      ).toLowerCase();

    const isHighRisk =
      incidentLevel === "high" ||
      priority === "high" ||
      data?.status ===
        "refer-for-intervention";

    /*
      The notification service itself also checks the
      user's notificationSettings.

      Here we only pass the correct notification type
      and metadata so notificationService.js knows what
      category this belongs to.
    */

    const notificationType = isHighRisk
      ? "high-risk"
      : "incident";

    /* =====================================================
       DATABASE NOTIFICATION
    ===================================================== */

    let savedNotification = null;

    try {
      savedNotification =
        await Notification.create({
          user: user._id,
          title,
          message,
          type,
          priority,
          isRead: false,
          relatedId:
            data?.incidentId || null,
          relatedType:
            data?.incidentId
              ? "Incident"
              : undefined,
        });

      console.log(
        `✅ Database notification created for ${user.email}`
      );

      console.log(
        "🔔 Notification ID:",
        savedNotification._id.toString()
      );
    } catch (notificationError) {
      console.error(
        `❌ Database notification failed for ${user.email}:`,
        notificationError.message
      );
    }

    /* =====================================================
       SOCKET.IO
    ===================================================== */

    try {
      io.to(user._id.toString()).emit(
        "newNotification",
        {
          id:
            savedNotification?._id?.toString() ||
            Date.now().toString(),

          title,

          message,

          type,

          priority,

          isRead: false,

          createdAt:
            new Date().toISOString(),

          data,
        }
      );

      console.log(
        `📡 Socket notification emitted to ${user.email}`
      );
    } catch (socketError) {
      console.error(
        `❌ Socket notification failed for ${user.email}:`,
        socketError.message
      );
    }

    /* =====================================================
       FCM PUSH NOTIFICATION
    ===================================================== */

    console.log("");
    console.log("========================================");
    console.log("📱 FCM STUDENT PUSH DEBUG");
    console.log("========================================");

    console.log(
      "Notification Title:",
      title
    );

    console.log(
      "Notification Message:",
      message
    );

    console.log(
      "Notification Type:",
      notificationType
    );

    console.log(
      "Original App Type:",
      type
    );

    console.log(
      "Priority:",
      priority
    );

    console.log(
      "Incident ID:",
      data?.incidentId || "N/A"
    );

    console.log(
      "Incident Status:",
      data?.status || "N/A"
    );

    console.log(
      "Incident Level:",
      data?.level || "N/A"
    );

    console.log(
      "Student User:",
      user.email
    );

    console.log(
      "User Notification Settings:",
      user.notificationSettings || {}
    );

    /* =====================================================
       ONLY NATIVE FCM ANDROID / IOS TOKENS

       Expo tokens are intentionally ignored.
    ===================================================== */

    const fcmTokens =
      Array.isArray(
        user.pushTokens
      )
        ? user.pushTokens.filter(
            (pushToken) =>
              pushToken?.token &&
              pushToken?.provider ===
                "fcm" &&
              [
                "android",
                "ios",
              ].includes(
                pushToken?.platform
              )
          )
        : [];

    console.log(
      "Native FCM Token Count:",
      fcmTokens.length
    );

    console.log(
      "Native FCM Platforms:",
      fcmTokens.map(
        (pushToken) =>
          pushToken.platform
      )
    );

    console.log(
      "========================================"
    );

    if (!fcmTokens.length) {
      console.log(
        `⚠️ No native FCM push token for ${user.email}`
      );
    } else {
      for (const pushToken of fcmTokens) {
        try {
          console.log("");
          console.log(
            `📱 Sending native FCM push to ${user.email}`
          );

          console.log(
            "Platform:",
            pushToken.platform
          );

          console.log(
            "Provider:",
            pushToken.provider
          );

          /*
            IMPORTANT:

            notificationService.js will now check:
              - mute
              - incidentUpdates
              - highRiskAlerts
              - sound
              - vibration

            We pass notificationType so the service knows
            which setting controls this notification.
          */

          const pushResult =
            await sendPushNotification({
              token:
                pushToken.token,

              title:
                "GuidEd 🔔",

              body:
                `${title}: ${message}`,

              notificationType,

              data: {
                type,

                notificationType,

                ...data,

                notificationId:
                  savedNotification?._id
                    ?.toString() || "",

                soundEnabled:
                  user.notificationSettings
                    ?.sound !== false,

                vibrationEnabled:
                  user.notificationSettings
                    ?.vibration !== false,
              },
            });

          console.log(
            `✅ Student native FCM push processed for ${user.email}`
          );

          console.log(
            "📨 FCM Result:",
            pushResult
          );
        } catch (pushError) {
          console.error(
            `❌ Student FCM push failed for ${user.email}:`,
            pushError.message
          );
        }
      }
    }

    console.log("");
    console.log(
      `✅ Student notification processing completed for ${user.email}`
    );
    console.log("========================================");
    console.log("");
  } catch (error) {
    console.error(
      "❌ Student notification error:",
      error.message
    );
  }
};

/* =========================================================
   HELPER FOR PRIORITY / INCIDENT LEVEL
========================================================= */

const incidentLevelFromPriority = (
  priority
) => {
  if (
    String(priority).toLowerCase() ===
    "high"
  ) {
    return "high";
  }

  return "low";
};

/* =========================================================
   ADMIN NOTIFICATION HELPER
   FCM ONLY
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
    console.log("🔔 ADMIN NOTIFICATION");
    console.log("========================================");
    console.log("Title:", title);
    console.log("Message:", message);
    console.log("Setting Key:", settingKey);
    console.log("Type:", type);
    console.log("Priority:", priority);

    /* =====================================================
       GET ADMIN USERS
    ===================================================== */

    const admins =
      await User.find({
        role: "admin",
      }).select(
        "_id email name firstName lastName notificationSettings pushTokens"
      );

    if (!admins.length) {
      console.log(
        "⚠️ No admin users found."
      );

      console.log(
        "========================================"
      );

      return;
    }

    console.log(
      `👤 Found ${admins.length} admin user(s).`
    );

    /* =====================================================
       PROCESS EACH ADMIN
    ===================================================== */

    for (const admin of admins) {
      try {
        const settings =
          admin.notificationSettings ||
          {};

        console.log("");
        console.log(
          "----------------------------------------"
        );

        console.log(
          "👤 ADMIN:",
          admin.email
        );

        console.log(
          "Notification Settings:",
          settings
        );

        /* =================================================
           CHECK WHETHER THIS ALERT TYPE IS ENABLED
        ================================================= */

        if (
          settingKey &&
          settings[settingKey] === false
        ) {
          console.log(
            `🔕 ${settingKey} is disabled for ${admin.email}`
          );

          continue;
        }

        /* =================================================
           DATABASE NOTIFICATION
        ================================================= */

        try {
          await Notification.create({
            user: admin._id,
            title,
            message,
            type,
            priority,
          });

          console.log(
            `✅ Database notification created for ${admin.email}`
          );
        } catch (
          notificationError
        ) {
          console.error(
            `❌ Database notification failed for ${admin.email}:`,
            notificationError.message
          );
        }

        /* =================================================
           SOCKET.IO
        ================================================= */

        try {
          io.to(
            admin._id.toString()
          ).emit(
            "newNotification",
            {
              id: Date.now(),
              title,
              message,
              type,
              priority,
              isRead: false,
              createdAt:
                new Date().toISOString(),
              data,
            }
          );

          console.log(
            `📡 Socket notification emitted to ${admin.email}`
          );
        } catch (
          socketError
        ) {
          console.error(
            `❌ Socket notification failed for ${admin.email}:`,
            socketError.message
          );
        }

        /* =================================================
           FCM PUSH NOTIFICATION
        ================================================= */

        console.log("");
        console.log(
          "📱 ADMIN FCM PUSH"
        );

        /*
          Only native Android/iOS FCM tokens are sent here.

          Web FCM is handled separately by the report
          controller / web notification system.
        */

        const fcmTokens =
          Array.isArray(
            admin.pushTokens
          )
            ? admin.pushTokens.filter(
                (pushToken) =>
                  pushToken?.token &&
                  pushToken?.provider ===
                    "fcm" &&
                  [
                    "android",
                    "ios",
                  ].includes(
                    pushToken?.platform
                  )
              )
            : [];

        console.log(
          `FCM Token Count for ${admin.email}:`,
          fcmTokens.length
        );

        if (!fcmTokens.length) {
          console.log(
            `⚠️ No native FCM push token for ${admin.email}`
          );
        } else {
          for (const pushToken of fcmTokens) {
            try {
              console.log(
                `📱 Sending FCM push to ${admin.email}...`
              );

              const pushResult =
                await sendPushNotification({
                  token:
                    pushToken.token,

                  title:
                    "GuidEd Admin Alert 🔔",

                  body:
                    `${title}: ${message}`,

                  notificationType:
                    type ===
                    "incident"
                      ? "incident"
                      : type ===
                        "high-risk"
                      ? "high-risk"
                      : "report",

                  data: {
                    type,
                    ...data,
                  },
                });

              console.log(
                `✅ Admin FCM push sent to ${admin.email}`
              );

              console.log(
                "📨 FCM Result:",
                pushResult
              );
            } catch (
              pushError
            ) {
              console.error(
                `❌ Admin FCM push failed for ${admin.email}:`,
                pushError.message
              );
            }
          }
        }

        /* =================================================
           ADMIN EMAIL NOTIFICATION
        ================================================= */

        if (
          settings.emailAlerts !==
            false &&
          admin.email
        ) {
          console.log(
            `📧 Preparing admin email for ${admin.email}...`
          );

          const emailHtml = `
            <!DOCTYPE html>
            <html>
              <head>
                <meta charset="UTF-8" />
                <meta
                  name="viewport"
                  content="width=device-width, initial-scale=1.0"
                />
                <title>${title}</title>
              </head>

              <body
                style="
                  margin: 0;
                  padding: 0;
                  background: #f4f7fb;
                  font-family: Arial, Helvetica, sans-serif;
                  color: #111827;
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
                      color: #ffffff;
                    "
                  >
                    <h1
                      style="
                        margin: 0;
                        font-size: 22px;
                      "
                    >
                      GuidEd Admin Alert
                    </h1>

                    <p
                      style="
                        margin: 6px 0 0;
                        font-size: 14px;
                        opacity: 0.9;
                      "
                    >
                      System Notification
                    </p>
                  </div>

                  <div
                    style="
                      padding: 28px 24px;
                    "
                  >
                    <h2
                      style="
                        margin: 0 0 12px;
                        font-size: 20px;
                        color: #111827;
                      "
                    >
                      ${title}
                    </h2>

                    <p
                      style="
                        margin: 0 0 20px;
                        font-size: 15px;
                        line-height: 1.6;
                        color: #4b5563;
                      "
                    >
                      ${message}
                    </p>

                    <div
                      style="
                        background: #f9fafb;
                        border: 1px solid #e5e7eb;
                        border-radius: 12px;
                        padding: 16px;
                        margin-top: 20px;
                      "
                    >
                      <p
                        style="
                          margin: 0 0 8px;
                          font-size: 12px;
                          color: #9ca3af;
                          text-transform: uppercase;
                          letter-spacing: 0.5px;
                        "
                      >
                        Notification Details
                      </p>

                      <p
                        style="
                          margin: 5px 0;
                          font-size: 14px;
                          color: #374151;
                        "
                      >
                        <strong>Type:</strong>
                        ${type}
                      </p>

                      <p
                        style="
                          margin: 5px 0;
                          font-size: 14px;
                          color: #374151;
                        "
                      >
                        <strong>Priority:</strong>
                        ${priority}
                      </p>

                      ${
                        data?.incidentId
                          ? `
                            <p
                              style="
                                margin: 5px 0;
                                font-size: 14px;
                                color: #374151;
                              "
                            >
                              <strong>Incident ID:</strong>
                              ${data.incidentId}
                            </p>
                          `
                          : ""
                      }

                      ${
                        data?.status
                          ? `
                            <p
                              style="
                                margin: 5px 0;
                                font-size: 14px;
                                color: #374151;
                              "
                            >
                              <strong>Status:</strong>
                              ${data.status}
                            </p>
                          `
                          : ""
                      }

                      ${
                        data?.level
                          ? `
                            <p
                              style="
                                margin: 5px 0;
                                font-size: 14px;
                                color: #374151;
                              "
                            >
                              <strong>Risk Level:</strong>
                              ${data.level}
                            </p>
                          `
                          : ""
                      }
                    </div>

                    <p
                      style="
                        margin: 24px 0 0;
                        font-size: 12px;
                        line-height: 1.5;
                        color: #9ca3af;
                      "
                    >
                      This is an automated notification from
                      the GuidEd system. Please do not reply
                      directly to this email.
                    </p>
                  </div>
                </div>
              </body>
            </html>
          `;

          try {
            await sendNotificationEmail({
              to: admin.email,
              subject:
                `GuidEd Admin Alert: ${title}`,
              html: emailHtml,
            });

            console.log(
              `✅ ADMIN EMAIL SENT SUCCESSFULLY TO ${admin.email}`
            );
          } catch (
            emailError
          ) {
            console.error(
              `❌ ADMIN EMAIL FAILED FOR ${admin.email}:`
            );

            console.error(
              emailError?.response?.body ||
                emailError?.message ||
                emailError
            );
          }
        } else {
          if (
            settings.emailAlerts ===
            false
          ) {
            console.log(
              `🔕 Email alerts disabled for ${admin.email}`
            );
          }

          if (!admin.email) {
            console.log(
              `⚠️ Admin has no email address`
            );
          }
        }

        console.log(
          `✅ Admin notification processing completed for ${admin.email}`
        );
      } catch (adminError) {
        console.error(
          `❌ Failed processing admin ${admin.email}:`,
          adminError.message
        );
      }
    }

    console.log(
      "========================================"
    );

    console.log(
      "🔔 ADMIN NOTIFICATION COMPLETE"
    );

    console.log(
      "========================================"
    );

    console.log("");
  } catch (error) {
    console.error(
      "❌ Admin notification error:",
      error.message
    );
  }
};

/* =========================================================
   GET INCIDENTS
========================================================= */

export const getIncidents = async (
  req,
  res
) => {
  try {
    if (!req.userId) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    const user =
      await User.findById(
        req.userId
      ).select(
        "role studentId email"
      );

    if (!user) {
      return res.status(404).json({
        message:
          "User not found",
      });
    }

    let query = {};

    /* =====================================================
       STUDENT → ONLY THEIR OWN INCIDENTS
    ===================================================== */

    if (
      user.role === "student"
    ) {
      const student =
        await Student.findOne({
          studentId:
            user.studentId,
        });

      if (!student) {
        return res.status(404).json({
          message:
            "Student profile not found",
        });
      }

      query.studentId =
        student._id;
    }

    const incidents =
      await Incident.find(query)
        .populate(
          "studentId",
          "firstName middleName lastName studentId grade gender phone profilePhoto"
        )
        .populate({
          path: "reportId",
          populate: {
            path: "reporterId",
            model: "User",
            select:
              "firstName lastName name email",
          },
        })
        .sort({
          createdAt: -1,
        })
        .lean();

    const incidentIds =
      incidents.map(
        (incident) =>
          incident._id
      );

    const interventions =
      await Intervention.find({
        incidentId: {
          $in: incidentIds,
        },
      })
        .sort({
          createdAt: -1,
        })
        .lean();

    const formattedIncidents =
      incidents.map(
        (incident) => {
          const intervention =
            interventions.find(
              (item) =>
                String(
                  item.incidentId
                ) ===
                String(
                  incident._id
                )
            );

          return {
            ...incident,

            intervention:
              intervention ||
              null,

            effectiveStatus:
              intervention
                ? intervention.status
                : incident.status,
          };
        }
      );

    return res
      .status(200)
      .json(
        formattedIncidents
      );
  } catch (err) {
    console.error(
      "Get Incidents Error:",
      err
    );

    return res.status(500).json({
      message:
        err.message ||
        "Server error",
    });
  }
};

/* =========================================================
   CREATE INCIDENT
========================================================= */

export const createIncident = async (
  req,
  res
) => {
  try {
    const {
      title,
      date,
      category,
      action,
      level,
      studentId:
        adminStudentId,
    } = req.body;

    let studentId;

    /* =====================================================
       STUDENT CREATION
    ===================================================== */

    if (
      req.user.role ===
      "student"
    ) {
      const student =
        await Student.findOne({
          createdBy:
            req.userId,
        });

      if (!student) {
        return res.status(404).json({
          message:
            "Student profile not found",
        });
      }

      studentId =
        student._id;
    }

    /* =====================================================
       ADMIN CREATION
    ===================================================== */

    else if (
      req.user.role ===
      "admin"
    ) {
      if (!adminStudentId) {
        return res.status(400).json({
          message:
            "studentId required",
        });
      }

      studentId =
        adminStudentId;
    } else {
      return res.status(403).json({
        message:
          "Forbidden",
      });
    }

    /* =====================================================
       CREATE INCIDENT
    ===================================================== */

    const incident =
      await Incident.create({
        studentId,
        title,
        date,
        category,
        action,
        level,
        status:
          "received",
        evidence: [],
        caseLogs: [],
      });

    /* =====================================================
       UPDATE STUDENT STATS
    ===================================================== */

    const totalIncidents =
      await Incident.countDocuments({
        studentId,
      });

    const highCount =
      await Incident.countDocuments({
        studentId,
        level: "High",
      });

    const medCount =
      await Incident.countDocuments({
        studentId,
        level: "Medium",
      });

    let riskLevel =
      "Low";

    if (highCount > 0) {
      riskLevel = "High";
    } else if (
      medCount > 0
    ) {
      riskLevel =
        "Medium";
    }

    await Student.findByIdAndUpdate(
      studentId,
      {
        totalIncidents,
        riskLevel,
      }
    );

    /* =====================================================
       STUDENT NOTIFICATION
    ===================================================== */

    await notifyStudent({
      studentId,

      title:
        "Incident Notice",

      message:
        `A new incident has been recorded: "${title}".`,

      type:
        "warning",

      priority:
        level?.toLowerCase() ===
        "high"
          ? "high"
          : "medium",

      data: {
        type:
          "incident",

        incidentId:
          incident._id.toString(),

        status:
          "received",

        level,
      },
    });

    /* =====================================================
       ADMIN ALERT
    ===================================================== */

    const adminAlertSetting =
      level?.toLowerCase() ===
      "high"
        ? "highRiskAlerts"
        : "emailAlerts";

    await notifyAdmins({
      title:
        "New Incident Report",

      message:
        `A new incident has been recorded for a student: "${title}".`,

      type:
        "warning",

      priority:
        level?.toLowerCase() ===
        "high"
          ? "high"
          : "medium",

      settingKey:
        adminAlertSetting,

      data: {
        type:
          "incident_created",

        incidentId:
          incident._id.toString(),

        status:
          "received",

        level,
      },
    });

    /* =====================================================
       REAL-TIME
    ===================================================== */

    io.emit(
      "caseCreated",
      incident
    );

    return res
      .status(201)
      .json(incident);
  } catch (err) {
    console.error(
      "createIncident error:",
      err
    );

    return res.status(500).json({
      message:
        err.message,
    });
  }
};

/* =========================================================
   GET INCIDENT BY ID
========================================================= */

export const getIncidentById =
  async (req, res) => {
    try {
      const incident =
        await Incident.findById(
          req.params.id
        )
          .populate(
            "studentId",
            "firstName middleName lastName grade gender studentId profilePhoto"
          )
          .populate({
            path: "reportId",
            populate: {
              path: "reporterId",
              model: "User",
              select:
                "firstName lastName name email",
            },
          })
          .lean();

      if (!incident) {
        return res.status(404).json({
          message:
            "Incident not found",
        });
      }

      const intervention =
        await Intervention.findOne({
          incidentId:
            incident._id,
        })
          .sort({
            createdAt: -1,
          })
          .lean();

      const effectiveStatus =
        intervention
          ? intervention.status
          : incident.status;

      return res.json({
        ...incident,

        intervention:
          intervention ||
          null,

        effectiveStatus,
      });
    } catch (err) {
      console.error(
        "getIncidentById error:",
        err
      );

      return res.status(500).json({
        message:
          err.message,
      });
    }
  };

/* =========================================================
   COMPLETE INCIDENT
========================================================= */

export const completeIncident =
  async (req, res) => {
    try {
      const incident =
        await Incident.findById(
          req.params.id
        );

      if (!incident) {
        return res.status(404).json({
          message:
            "Incident not found",
        });
      }

      const user =
        req.user;

      const log = {
        stage:
          "completed",

        note:
          "Incident marked as completed",

        time:
          new Date(),

        changedBy:
          user?._id ||
          null,

        changedByName:
          user?.name ||
          "Admin",
      };

      incident.status =
        "completed";

      incident.completedAt =
        new Date();

      incident.caseLogs.push(
        log
      );

      await incident.save();

      /* =====================================================
         STUDENT
      ===================================================== */

      await notifyStudent({
        studentId:
          incident.studentId,

        title:
          "Incident Completed",

        message:
          "Your incident has been marked as completed.",

        type:
          "incident_completed",

        priority:
          "low",

        data: {
          type:
            "incident_completed",

          incidentId:
            incident._id.toString(),

          status:
            "completed",

          level:
            incident.level,
        },
      });

      /* =====================================================
         REPORT
      ===================================================== */

      if (
        incident.reportId
      ) {
        const report =
          await Report.findByIdAndUpdate(
            incident.reportId,
            {
              status:
                "completed",
            },
            {
              new: true,
            }
          );

        io.emit(
          "reportUpdated",
          {
            reportId:
              incident.reportId,

            status:
              "completed",
          }
        );

        console.log(
          "✅ Connected report updated:",
          report?._id,
          "→",
          report?.status
        );
      }

      /* =====================================================
         ADMIN ALERT
      ===================================================== */

      await notifyAdmins({
        title:
          "Incident Completed",

        message:
          "An incident has been marked as completed.",

        type:
          "success",

        priority:
          "low",

        settingKey:
          "emailAlerts",

        data: {
          type:
            "incident_completed",

          incidentId:
            incident._id.toString(),

          status:
            "completed",
        },
      });

      /* =====================================================
         REAL-TIME
      ===================================================== */

      io.emit(
        "caseUpdated",
        incident
      );

      io.emit(
        "caseLogAdded",
        {
          caseId:
            incident._id,

          log,
        }
      );

      return res.json({
        message:
          "Incident and connected report marked as completed",

        incident,
      });
    } catch (err) {
      console.error(
        "completeIncident error:",
        err
      );

      return res.status(500).json({
        message:
          err.message,
      });
    }
  };

/* =========================================================
   DELETE INCIDENT
========================================================= */

export const deleteIncident =
  async (req, res) => {
    try {
      if (
        req.user.role !==
        "admin"
      ) {
        return res.status(403).json({
          message:
            "Forbidden",
        });
      }

      const incident =
        await Incident.findById(
          req.params.id
        );

      if (!incident) {
        return res.status(404).json({
          message:
            "Incident not found",
        });
      }

      const studentId =
        incident.studentId;

      await Incident.findByIdAndDelete(
        req.params.id
      );

      const totalIncidents =
        await Incident.countDocuments({
          studentId,
        });

      const highCount =
        await Incident.countDocuments({
          studentId,
          level: "High",
        });

      const medCount =
        await Incident.countDocuments({
          studentId,
          level: "Medium",
        });

      let riskLevel =
        "Low";

      if (highCount > 0) {
        riskLevel =
          "High";
      } else if (
        medCount > 0
      ) {
        riskLevel =
          "Medium";
      }

      await Student.findByIdAndUpdate(
        studentId,
        {
          totalIncidents,
          riskLevel,
        }
      );

      io.emit(
        "caseDeleted",
        {
          caseId:
            req.params.id,
        }
      );

      return res.json({
        message:
          "Incident deleted",
      });
    } catch (err) {
      console.error(
        "deleteIncident error:",
        err
      );

      return res.status(500).json({
        message:
          err.message,
      });
    }
  };

/* =========================================================
   GET INCIDENTS BY STUDENT
========================================================= */

export const getIncidentsByStudent =
  async (req, res) => {
    try {
      const studentId =
        req.params.id;

      if (
        !studentId ||
        !mongoose.Types.ObjectId.isValid(
          studentId
        )
      ) {
        return res.status(400).json({
          message:
            "Invalid or missing studentId",

          received:
            studentId,
        });
      }

      const incidents =
        await Incident.find({
          studentId:
            new mongoose.Types.ObjectId(
              studentId
            ),
        })
          .populate(
            "studentId",
            "firstName middleName lastName studentId grade gender profilePhoto"
          )
          .sort({
            createdAt: -1,
          });

      return res.json(
        incidents
      );
    } catch (err) {
      return res.status(500).json({
        message:
          err.message,
      });
    }
  };

/* =========================================================
   REQUEST STUDENT STATEMENT
========================================================= */

export const requestStudentStatement =
  async (req, res) => {
    try {
      const { note } =
        req.body;

      const incident =
        await Incident.findById(
          req.params.id
        );

      if (!incident) {
        return res.status(404).json({
          message:
            "Incident not found",
        });
      }

      const log = {
        stage:
          "STATEMENT REQUESTED",

        note:
          note ||
          "Student statement requested",

        time:
          new Date(),
      };

      incident.statementStatus =
        "waiting_for_response";

      incident.statementRequestedAt =
        new Date();

      incident.caseLogs.push(
        log
      );

      await incident.save();

      /* ===================================================
         STUDENT
      =================================================== */

      await notifyStudent({
        studentId:
          incident.studentId,

        title:
          "Statement Requested",

        message:
          "A statement has been requested for your incident.",

        type:
          "statement_request",

        priority:
          "medium",

        data: {
          type:
            "statement_request",

          incidentId:
            incident._id.toString(),

          status:
            incident.status,

          level:
            incident.level,
        },
      });

      /* ===================================================
         ADMIN
      =================================================== */

      await notifyAdmins({
        title:
          "Student Statement Requested",

        message:
          "A student statement has been requested for an incident.",

        type:
          "update",

        priority:
          "low",

        settingKey:
          "emailAlerts",

        data: {
          type:
            "statement_requested",

          incidentId:
            incident._id.toString(),
        },
      });

      io.emit(
        "caseUpdated",
        incident
      );

      io.emit(
        "caseLogAdded",
        {
          caseId:
            incident._id,

          log,
        }
      );

      return res.json({
        message:
          "Statement request sent",

        incident,
      });
    } catch (err) {
      console.error(
        "requestStudentStatement error:",
        err
      );

      return res.status(500).json({
        message:
          err.message,
      });
    }
  };

/* =========================================================
   SUBMIT STUDENT STATEMENT
========================================================= */

export const submitStudentStatement =
  async (req, res) => {
    try {
      const { statement } =
        req.body;

      const incident =
        await Incident.findById(
          req.params.id
        );

      if (!incident) {
        return res.status(404).json({
          message:
            "Incident not found",
        });
      }

      const log = {
        stage:
          "STUDENT STATEMENT SUBMITTED",

        note:
          statement,

        time:
          new Date(),

        changedBy:
          req.user._id,

        changedByName:
          req.user.name,
      };

      incident.studentStatement =
        statement;

      incident.statementStatus =
        "submitted";

      incident.statementSubmittedAt =
        new Date();

      incident.caseLogs.push(
        log
      );

      await incident.save();

      /* ===================================================
         ADMIN ALERT
      =================================================== */

      await notifyAdmins({
        title:
          "Student Statement Submitted",

        message:
          "A student has submitted a statement for an incident.",

        type:
          "update",

        priority:
          "medium",

        settingKey:
          "emailAlerts",

        data: {
          type:
            "statement_submitted",

          incidentId:
            incident._id.toString(),
        },
      });

      /* ===================================================
         REAL-TIME
      =================================================== */

      io.emit(
        "caseUpdated",
        incident
      );

      io.emit(
        "caseLogAdded",
        {
          caseId:
            incident._id,

          log,
        }
      );

      return res.json({
        message:
          "Statement submitted",

        incident,
      });
    } catch (err) {
      console.error(
        "submitStudentStatement error:",
        err
      );

      return res.status(500).json({
        message:
          err.message,
      });
    }
  };

/* =========================================================
   MANUAL STUDENT STATEMENT
========================================================= */

export const manualStudentStatement =
  async (req, res) => {
    try {
      const { statement } =
        req.body;

      const incident =
        await Incident.findById(
          req.params.id
        );

      if (!incident) {
        return res.status(404).json({
          message:
            "Incident not found",
        });
      }

      const user =
        req.user;

      if (!user) {
        return res.status(401).json({
          message:
            "Unauthorized",
        });
      }

      incident.studentStatement =
        statement;

      incident.status =
        "saved-student-statement";

      incident.statementStatus =
        "manual_entry";

      incident.statementSubmittedAt =
        new Date();

      const log = {
        stage:
          "saved-student-statement",

        note:
          statement,

        time:
          new Date(),

        changedBy:
          user._id,

        changedByName:
          user.name,
      };

      incident.caseLogs.push(
        log
      );

      await incident.save();

      /* ===================================================
         STUDENT NOTIFICATION
      =================================================== */

      await notifyStudent({
        studentId:
          incident.studentId,

        title:
          "Incident Update",

        message:
          'Your incident status is now "saved-student-statement".',

        type:
          "update",

        priority:
          "low",

        data: {
          type:
            "incident_update",

          incidentId:
            incident._id.toString(),

          status:
            "saved-student-statement",

          level:
            incident.level,
        },
      });

      /* ===================================================
         ADMIN ALERT
      =================================================== */

      await notifyAdmins({
        title:
          "Student Statement Updated",

        message:
          "A student statement has been added to an incident.",

        type:
          "update",

        priority:
          "medium",

        settingKey:
          "emailAlerts",

        data: {
          type:
            "incident_update",

          incidentId:
            incident._id.toString(),

          status:
            "saved-student-statement",
        },
      });

      const populated =
        await Incident.findById(
          incident._id
        ).populate(
          "studentId",
          "firstName middleName lastName studentId grade gender profilePhoto"
        );

      io.emit(
        "caseUpdated",
        populated
      );

      return res.json({
        message:
          "Manual statement saved",

        incident:
          populated,
      });
    } catch (err) {
      console.error(
        "manualStudentStatement error:",
        err
      );

      return res.status(500).json({
        message:
          err.message,
      });
    }
  };

/* =========================================================
   UPDATE STATUS
========================================================= */

export const updateIncidentStatus =
  async (req, res) => {
    console.log(
      "================================="
    );

    console.log(
      "🚨 UPDATE INCIDENT STATUS CALLED"
    );

    console.log(
      "Incident ID:",
      req.params.id
    );

    console.log(
      "Requested status:",
      req.body.status
    );

    console.log(
      "================================="
    );

    try {
      const {
        status,
        note,
        escalationInfo,
      } = req.body;

      const incident =
        await Incident.findById(
          req.params.id
        );

      if (!incident) {
        return res.status(404).json({
          message:
            "Incident not found",
        });
      }

      console.log(
        "📌 CURRENT INCIDENT STATUS:",
        incident.status
      );

      console.log(
        "📌 REQUESTED NEW STATUS:",
        status
      );

      const user =
        req.user;

      if (!user) {
        return res.status(401).json({
          message:
            "Unauthorized",
        });
      }

      /* ===================================================
         FLOW ENFORCEMENT
      =================================================== */

      const flow = [
        "received",
        "saved-student-statement",
        "reviewing",
        "refer-for-intervention",
        "intervention-ready",
        "completed",
      ];

      const currentIndex =
        flow.indexOf(
          incident.status
        );

      const nextIndex =
        flow.indexOf(
          status
        );

      if (nextIndex === -1) {
        return res.status(400).json({
          message:
            "Invalid status value",

          attempted:
            status,
        });
      }

      const allowedTransitions =
        {
          received: [
            "reviewing",
          ],

          reviewing: [
            "saved-student-statement",
            "refer-for-intervention",
          ],

          "saved-student-statement":
            [
              "reviewing",
              "refer-for-intervention",
            ],

          "refer-for-intervention":
            [
              "intervention-ready",
            ],

          "intervention-ready":
            [
              "completed",
            ],

          completed: [],
        };

      if (
        !allowedTransitions[
          incident.status
        ]?.includes(
          status
        ) &&
        status !==
          incident.status
      ) {
        return res.status(400).json({
          message:
            "Invalid status transition",

          current:
            incident.status,

          attempted:
            status,
        });
      }

      /* ===================================================
         REVIEWER TRACKING
      =================================================== */

      if (
        status ===
          "reviewing" &&
        !incident.reviewedBy
      ) {
        incident.reviewedBy =
          user._id;

        incident.reviewedByName =
          user.name;
      }

      const previousStatus =
        incident.status;

      /* ===================================================
         UPDATE STATUS
      =================================================== */

      incident.status =
        status;

      if (
        status ===
        "completed"
      ) {
        incident.completedAt =
          new Date();
      }

      /* ===================================================
         AUDIT LOG
      =================================================== */

      const log = {
        stage:
          status,

        note:
          note || "",

        changedBy:
          user._id,

        changedByName:
          user.name,

        time:
          new Date(),
      };

      incident.caseLogs.push(
        log
      );

      if (
        escalationInfo
      ) {
        incident.escalationInfo =
          escalationInfo;
      }

      await incident.save();

      /* ===================================================
         CONNECTED REPORT
      =================================================== */

      if (
        status ===
          "completed" &&
        incident.reportId
      ) {
        const report =
          await Report.findByIdAndUpdate(
            incident.reportId,
            {
              status:
                "completed",
            },
            {
              new: true,
            }
          );

        console.log(
          "✅ Report synchronized:",
          report?._id,
          "→",
          report?.status
        );

        io.emit(
          "reportUpdated",
          {
            reportId:
              incident.reportId,

            status:
              "completed",
          }
        );
      }

      /* ===================================================
         STUDENT NOTIFICATION
         
         IMPORTANT:
         Every incident status uses notificationType
         "incident", except High-risk notifications.

         notificationService.js will check:
         - mute
         - incidentUpdates
         - highRiskAlerts
         - sound
         - vibration
      =================================================== */

      const isHighRiskIncident =
        incident.level?.toLowerCase() ===
        "high";

      const studentNotificationType =
        isHighRiskIncident
          ? "high-risk"
          : "incident";

      await notifyStudent({
        studentId:
          incident.studentId,

        title:
          status ===
          "completed"
            ? "Incident Completed"
            : "Incident Update",

        message:
          status ===
          "completed"
            ? "Your incident has been marked as completed."
            : `Your incident status is now "${status}".`,

        type:
          status ===
          "completed"
            ? "incident_completed"
            : "update",

        priority:
          isHighRiskIncident
            ? "high"
            : status ===
              "completed"
            ? "low"
            : "medium",

        data: {
          type:
            "incident_update",

          notificationType:
            studentNotificationType,

          incidentId:
            incident._id.toString(),

          previousStatus,

          status,

          level:
            incident.level,
        },
      });

      /* ===================================================
         ADMIN NOTIFICATION
      =================================================== */

      let adminSettingKey =
        "emailAlerts";

      if (
        incident.level?.toLowerCase() ===
          "high" ||
        status ===
          "refer-for-intervention"
      ) {
        adminSettingKey =
          "highRiskAlerts";
      }

      await notifyAdmins({
        title:
          "Incident Status Updated",

        message:
          `An incident status changed from "${previousStatus}" to "${status}".`,

        type:
          "update",

        priority:
          status ===
          "completed"
            ? "low"
            : "medium",

        settingKey:
          adminSettingKey,

        data: {
          type:
            "incident_status_update",

          incidentId:
            incident._id.toString(),

          previousStatus,

          status,

          level:
            incident.level,
        },
      });

      /* ===================================================
         REAL-TIME INCIDENT UPDATE
      =================================================== */

      const populated =
        await Incident.findById(
          incident._id
        ).populate(
          "studentId",
          "firstName middleName lastName studentId grade gender profilePhoto"
        );

      io.emit(
        "caseUpdated",
        populated
      );

      io.emit(
        "caseLogAdded",
        {
          caseId:
            incident._id,

          log,
        }
      );

      return res.json({
        message:
          "Incident status updated successfully",

        incident:
          populated,
      });
    } catch (err) {
      console.error(
        "updateIncidentStatus error:",
        err
      );

      return res.status(500).json({
        message:
          err.message,
      });
    }
  };


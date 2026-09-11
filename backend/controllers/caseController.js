import Case from "../models/Case.js";
import Intervention from "../models/interventionModel.js";
import Student from "../models/studentModel.js";
import User from "../models/userModel.js";
import Notification from "../models/Notification.js";

import { io } from "../server.js";
import { sendPushNotification } from "../services/notificationService.js";

/* ================= CREATE CASE ================= */
export const createCase = async (req, res) => {
  try {
    const newCase = await Case.create(req.body);

    res.status(201).json(newCase);
  } catch (err) {
    console.error("createCase error:", err);

    res.status(500).json({
      message: err.message,
    });
  }
};

/* ================= GET ALL CASES ================= */
export const getCases = async (req, res) => {
  try {
    const cases = await Case.find()
      .populate("studentId");

    res.json(cases);
  } catch (err) {
    console.error("getCases error:", err);

    res.status(500).json({
      message: err.message,
    });
  }
};

/* ================= UPDATE CASE (REVIEW) ================= */
export const updateCase = async (req, res) => {
  try {
    const updated = await Case.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!updated) {
      return res.status(404).json({
        message: "Case not found",
      });
    }

    res.json(updated);
  } catch (err) {
    console.error("updateCase error:", err);

    res.status(500).json({
      message: err.message,
    });
  }
};

/* ================= ESCALATE TO INTERVENTION ================= */
export const escalateCase = async (req, res) => {
  try {
    const c = await Case.findById(req.params.id);

    if (!c) {
      return res.status(404).json({
        message: "Case not found",
      });
    }

    // ============================================
    // CREATE INTERVENTION
    // ============================================

    const intervention = await Intervention.create({
      studentId: c.studentId,
      type: c.recommendation,
      description: c.notes,
      status: "active",
      createdBy: req.userId,
      interventionBy: req.user?.name || "Guidance Admin",
      approvedBy: req.user?.name || "Guidance Admin",
      auditLogs: [
        {
          action: "Case Escalated to Intervention",
          note:
            c.notes ||
            `Case escalated to intervention: ${c.recommendation}`,
          by: req.user?.name || "Guidance Admin",
          time: new Date(),
        },
      ],
    });

    // ============================================
    // UPDATE CASE STATUS
    // ============================================

    c.status = "escalated";

    await c.save();

    console.log(
      "✅ Case escalated:",
      c._id,
      "→ Intervention:",
      intervention._id
    );

    // ============================================
    // FIND STUDENT USER
    // ============================================

    let targetUser = null;

    if (c.studentId) {
      const student = await Student.findById(c.studentId);

      if (student) {
        targetUser = await User.findOne({
          studentId: student.studentId,
          role: "student",
        }).select(
          "pushTokens email name firstName lastName notificationSettings"
        );
      }
    }

    // ============================================
    // STUDENT NOTIFICATION
    // ============================================

    if (targetUser) {
      const interventionType = c.recommendation || "intervention";

      const notificationMessage =
        c.notes
          ? `A guidance intervention has been assigned to you: ${c.notes}`
          : `A ${interventionType} intervention has been assigned to you.`;

      // ============================================
      // SAVE NOTIFICATION
      // ============================================

      const notification = await Notification.create({
        user: targetUser._id,

        title: "New Guidance Intervention",

        message: notificationMessage,

        type: "warning",

        priority: "high",

        isRead: false,

        data: {
          type: "intervention",
          notificationType: "message",
          caseId: c._id.toString(),
          interventionId: intervention._id.toString(),
          studentId: c.studentId.toString(),
        },
      });

      console.log(
        "🔔 Case intervention notification saved:",
        notification._id
      );

      // ============================================
      // REALTIME SOCKET NOTIFICATION
      // ============================================

      io.to(targetUser._id.toString()).emit("newNotification", {
        ...notification.toObject(),
        id: notification._id.toString(),
      });

      console.log(
        "🔔 Realtime case intervention notification sent to:",
        targetUser._id.toString()
      );

      // ============================================
      // NATIVE FCM PUSH NOTIFICATION
      // ============================================
      //
      // IMPORTANT:
      // We no longer use expoPushToken.
      //
      // notificationType: "message"
      // maps to:
      //
      // notificationSettings.guidanceMessages
      //
      // notificationService.js will also handle:
      // - mute
      // - sound
      // - vibration
      // - dead FCM tokens
      //
      // ============================================

      const fcmTokens = (targetUser.pushTokens || [])
        .filter(
          (pushToken) =>
            pushToken?.token &&
            pushToken?.provider === "fcm" &&
            ["android", "ios"].includes(pushToken?.platform)
        )
        .map((pushToken) => pushToken.token);

      if (fcmTokens.length > 0) {
        for (const token of fcmTokens) {
          try {
            await sendPushNotification({
              token,

              title: "⚠️ New Guidance Intervention",

              body: notificationMessage,

              notificationType: "message",

              data: {
                type: "intervention",
                notificationType: "message",
                caseId: c._id.toString(),
                interventionId: intervention._id.toString(),
                studentId: c.studentId.toString(),
                notificationId: notification._id.toString(),
              },
            });

            console.log(
              "📱 Case intervention FCM notification sent to:",
              targetUser.email
            );
          } catch (pushError) {
            console.error(
              "⚠️ CASE INTERVENTION FCM PUSH ERROR:",
              pushError?.message || pushError
            );
          }
        }
      } else {
        console.log(
          "⚠️ Student has no native FCM tokens:",
          targetUser._id.toString()
        );
      }
    } else {
      console.log(
        "⚠️ No student User account found for case:",
        c._id.toString()
      );
    }

    // ============================================
    // RESPONSE
    // ============================================

    return res.json({
      message: "Case escalated to intervention",
      case: c,
      intervention,
    });
  } catch (err) {
    console.error("escalateCase error:", err);

    return res.status(500).json({
      message: err.message,
    });
  }
};


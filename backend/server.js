import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import http from "http";
import { Server } from "socket.io";
import path from "path";
import helmet from "helmet";
import rateLimit from "express-rate-limit";

import { connectDB } from "./db/connectDB.js";
import Message from "./models/message.js";
import Notification from "./models/Notification.js";

import authRoutes from "./routes/auth.js";
import studentRoutes from "./routes/studentRoutes.js";
import incidentRoutes from "./routes/incidentRoutes.js";
import reportRoutes from "./routes/reportRoutes.js";
import historyRoutes from "./routes/historyRoutes.js";
import geminiRoutes from "./routes/gemini.js";
import messageRoutes from "./routes/messageRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import teacherReportRoutes from "./routes/teacherRoutes.js";
import interventionRoutes from "./routes/interventionRoutes.js";
import caseRoutes from "./routes/caseRoutes.js";
import uploadRoutes from "./routes/uploadRoutes.js";
import notificationSettingsRoutes from "./routes/notificationSettings.js";
import pushNotificationRoutes from "./routes/pushNotificationRoutes.js";

import { User } from "./models/userModel.js";
import { sendPushNotification } from "./utils/pushNotification.js";

import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();
const server = http.createServer(app);

const PORT = process.env.PORT || 5000;

/* =========================================================
   TRUST PROXY
   Required when deployed behind Render's proxy.
========================================================= */

app.set("trust proxy", 1);

/* =========================================================
   SECURITY HEADERS
========================================================= */

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],

        scriptSrc: ["'self'"],

        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],

        fontSrc: ["'self'", "https://fonts.gstatic.com", "data:"],

        imgSrc: [
          "'self'",
          "data:",
          "blob:",
          "https:",
          "https://res.cloudinary.com",
        ],

        connectSrc: [
          "'self'",
          "https://edu-guard-backend.onrender.com",
          "wss://edu-guard-backend.onrender.com",
          "http://localhost:5000",
          "ws://localhost:5000",
          "http://localhost:5173",
          "http://localhost:5174",
          "http://localhost:8081",
        ],

        objectSrc: ["'none'"],

        frameAncestors: ["'none'"],

        baseUri: ["'self'"],

        formAction: ["'self'"],

        upgradeInsecureRequests:
          process.env.NODE_ENV === "production" ? [] : null,
      },
    },

    /* Prevent clickjacking */
    frameguard: {
      action: "deny",
    },

    /* Prevent MIME sniffing */
    noSniff: true,

    /* HSTS */
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },

    /* Referrer protection */
    referrerPolicy: {
      policy: "strict-origin-when-cross-origin",
    },

    /* We don't need COEP because of Cloudinary/external resources */
    crossOriginEmbedderPolicy: false,

    /* Cross-origin isolation */
    crossOriginOpenerPolicy: {
      policy: "same-origin",
    },

    crossOriginResourcePolicy: {
      policy: "cross-origin",
    },
  }),
);

/* =========================================================
   ADDITIONAL SECURITY HEADERS
========================================================= */

app.use((req, res, next) => {
  /* Disable browser features that your API doesn't need */
  res.setHeader(
    "Permissions-Policy",
    [
      "camera=()",
      "microphone=()",
      "geolocation=()",
      "payment=()",
      "usb=()",
      "magnetometer=()",
      "gyroscope=()",
      "accelerometer=()",
    ].join(", "),
  );

  /* Prevent DNS prefetching */
  res.setHeader("X-DNS-Prefetch-Control", "off");

  /* Don't expose server technology */
  res.removeHeader("X-Powered-By");

  next();
});

/* =========================================================
   BODY SIZE LIMITS
========================================================= */

app.use(
  express.json({
    limit: "10mb",
  }),
);

app.use(
  express.urlencoded({
    extended: true,
    limit: "10mb",
  }),
);

app.use(cookieParser());

/* =========================================================
   CORS
========================================================= */

const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:8081",
  "http://localhost:19000",
  "exp://localhost:8081",
  "exp://localhost:19000",
  "https://edu-guard-backend.onrender.com",
  "https://guide-ed-mu.vercel.app",
];

const isAllowedOrigin = (origin) => {
  if (!origin) return true;

  return allowedOrigins.includes(origin);
};

app.use(
  cors({
    origin: function (origin, callback) {
      if (isAllowedOrigin(origin)) {
        return callback(null, true);
      }

      console.warn("🚫 CORS blocked:", origin);

      return callback(new Error("Not allowed by CORS"));
    },

    credentials: true,

    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],

    allowedHeaders: ["Content-Type", "Authorization"],

    exposedHeaders: [],
  }),
);

/* =========================================================
   GENERAL API RATE LIMIT
========================================================= */

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,

  max: 500,

  standardHeaders: true,

  legacyHeaders: false,

  message: {
    success: false,
    message: "Too many requests. Please try again later.",
  },

  skip: (req) => {
    /* Don't rate-limit health checks */
    return req.path === "/ping";
  },
});

app.use("/api", generalLimiter);

/* =========================================================
   STRICT AUTH RATE LIMIT
========================================================= */

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,

  max: 20,

  standardHeaders: true,

  legacyHeaders: false,

  message: {
    success: false,
    message: "Too many authentication attempts. Please try again later.",
  },
});

/*
  Apply stricter limits to authentication endpoints.
*/
app.use("/api/auth", authLimiter);

/* =========================================================
   ROUTES
========================================================= */

app.use("/api/auth", authRoutes);

app.use("/api/students", studentRoutes);

app.use("/api/incidents", incidentRoutes);

app.use("/api/reports", reportRoutes);

app.use("/api/history", historyRoutes);

app.use("/api/gemini", geminiRoutes);

app.use("/api/messages", messageRoutes);

app.use("/api/notifications", notificationRoutes);

app.use("/api/teacher-reports", teacherReportRoutes);

app.use("/api/interventions", interventionRoutes);

app.use("/api/cases", caseRoutes);

app.use("/api/upload", uploadRoutes);

app.use("/api/notification-settings", notificationSettingsRoutes);

app.use("/api/push-notifications", pushNotificationRoutes);

/* =========================================================
   USERS
========================================================= */

app.get("/api/users", async (req, res) => {
  try {
    const users = await User.find();

    res.json(users);
  } catch (err) {
    console.error("❌ GET USERS ERROR:", err);

    res.status(500).json({
      success: false,
      message: "Failed to retrieve users.",
    });
  }
});

/* =========================================================
   HEALTH CHECK
========================================================= */

app.get("/ping", (req, res) => {
  res.status(200).json({
    ok: true,
    message: "alive",
  });
});

/* =========================================================
   SOCKET.IO
========================================================= */

export const io = new Server(server, {
  cors: {
    origin: function (origin, callback) {
      if (isAllowedOrigin(origin)) {
        return callback(null, true);
      }

      console.warn("🚫 Socket.IO CORS blocked:", origin);

      return callback(new Error("Not allowed by Socket.IO CORS"));
    },

    methods: ["GET", "POST"],

    credentials: true,
  },

  transports: ["websocket", "polling"],
});

/* =========================================================
   TEST NOTIFICATION
========================================================= */

app.get("/api/test-notif", (req, res) => {
  io.emit("newNotification", {
    id: Date.now(),

    title: "🔥 Test Notification",

    message: "Dashboard socket is working",

    createdAt: new Date().toISOString(),
  });

  res.json({
    ok: true,
  });
});

/* =========================================================
   ONLINE USERS
========================================================= */

const onlineUsers = new Map();

/* =========================================================
   SEND NOTIFICATION
========================================================= */

export const sendNotification = (userId, payload) => {
  if (!userId) return;

  io.to(String(userId)).emit("newNotification", payload);
};

/* =========================================================
   SOCKET LOGIC
========================================================= */

io.on("connection", (socket) => {
  console.log("🟢 Socket connected:", socket.id);

  /* =======================================================
     REGISTER USER
  ======================================================= */

  socket.on("register", (userId) => {
    if (!userId) {
      console.log("⚠️ No user ID received");
      return;
    }

    const userIdString = String(userId);

    socket.join(userIdString);

    onlineUsers.set(userIdString, socket.id);

    console.log(`👤 User registered: ${userIdString}`);
  });

  /* =======================================================
     SEND MESSAGE
  ======================================================= */

  socket.on("send_message", async (msg, callback) => {
    try {
      console.log("📨 Socket message received:", msg);

      const { sender, receiver, text } = msg;

      if (!sender || !receiver || !text?.trim()) {
        console.log("⚠️ Invalid message data");

        if (typeof callback === "function") {
          callback({
            error: true,
            message: "Missing sender, receiver, or message text.",
          });
        }

        return;
      }

      /* =====================================================
       CREATE CHAT ID
    ===================================================== */

      const chatId = [String(sender), String(receiver)].sort().join("-");

      console.log("💬 Chat ID:", chatId);

      /* =====================================================
       SAVE MESSAGE
    ===================================================== */

      const message = await Message.create({
        chatId,
        sender,
        receiver,
        text: text.trim(),
        seen: false,
      });

      console.log("💾 Message saved:", message._id);

      /* =====================================================
       GET SENDER + RECEIVER
    ===================================================== */

      const senderUser = await User.findById(sender).select(
        "name firstName lastName email",
      );

      const receiverUser = await User.findById(receiver).select(
        "expoPushToken email name firstName lastName",
      );

      const senderName =
        senderUser?.name ||
        `${senderUser?.firstName || ""} ${senderUser?.lastName || ""}`.trim() ||
        "User";

      /* =====================================================
       SAVE MESSAGE NOTIFICATION
    ===================================================== */

      const notification = await Notification.create({
        userId: receiver,
        title: `New message from ${senderName}`,
        message: text.trim(),
        type: "message",
        priority: "low",
        isRead: false,
        data: {
          type: "message",
          chatId,
          senderId: sender,
          receiverId: receiver,
          messageId: message._id.toString(),
        },
      });

      console.log("🔔 Message notification saved:", notification._id);

      /* =====================================================
       SEND MESSAGE TO RECEIVER
    ===================================================== */

      io.to(String(receiver)).emit("receive_message", message);

      console.log("📩 receive_message sent to:", receiver);

      /* =====================================================
       SEND MESSAGE BACK TO SENDER
    ===================================================== */

      io.to(String(sender)).emit("receive_message", message);

      console.log("📤 receive_message sent back to sender:", sender);

      /* =====================================================
       REALTIME NOTIFICATION
    ===================================================== */

      io.to(String(receiver)).emit("newNotification", {
        ...notification.toObject(),
        id: notification._id.toString(),
      });

      console.log("🔔 Realtime notification sent to:", receiver);

      /* =====================================================
       PHONE PUSH NOTIFICATION
    ===================================================== */

      if (receiverUser?.expoPushToken) {
        try {
          await sendPushNotification({
            token: receiverUser.expoPushToken,

            title: `💬 ${senderName}`,

            body: text.trim(),

            data: {
              type: "message",
              chatId,
              senderId: sender,
              receiverId: receiver,
              messageId: message._id.toString(),
            },
          });

          console.log(
            "📱 Socket message push notification sent to:",
            receiverUser.email,
          );
        } catch (pushError) {
          console.error("⚠️ SOCKET MESSAGE PUSH ERROR:", pushError);
        }
      } else {
        console.log("⚠️ Receiver has no Expo push token:", receiver);
      }

      /* =====================================================
       ACTIVITY FEED
    ===================================================== */

      io.emit("activity_feed", {
        type: "message",

        message: `💬 ${senderName}: ${text.trim()}`,

        time: new Date(),
      });

      console.log("🔥 Activity feed emitted");

      /* =====================================================
       CALLBACK
    ===================================================== */

      if (typeof callback === "function") {
        callback({
          success: true,
          message,
        });
      }
    } catch (err) {
      console.error("❌ SOCKET SEND MESSAGE ERROR:", err);

      if (typeof callback === "function") {
        callback({
          error: true,
          message:
            process.env.NODE_ENV === "production"
              ? "Failed to send message."
              : err.message,
        });
      }
    }
  });

  /* =======================================================
     DISCONNECT
  ======================================================= */

  socket.on("disconnect", () => {
    console.log("🔴 Socket disconnected:", socket.id);

    for (const [userId, socketId] of onlineUsers.entries()) {
      if (socketId === socket.id) {
        onlineUsers.delete(userId);

        console.log(`👤 User offline: ${userId}`);

        break;
      }
    }
  });
});

/* =========================================================
   EXPRESS ERROR HANDLER
========================================================= */

app.use((err, req, res, next) => {
  console.error("❌ SERVER ERROR:", err);

  if (err.message === "Not allowed by CORS") {
    return res.status(403).json({
      success: false,
      message: "Origin not allowed.",
    });
  }

  if (err.message === "Not allowed by Socket.IO CORS") {
    return res.status(403).json({
      success: false,
      message: "Socket origin not allowed.",
    });
  }

  res.status(err.status || 500).json({
    success: false,

    message:
      process.env.NODE_ENV === "production"
        ? "Internal server error."
        : err.message,
  });
});

/* =========================================================
   SET SOCKET.IO INSTANCE
========================================================= */

app.set("io", io);

/* =========================================================
   START SERVER
========================================================= */

server.listen(PORT, "0.0.0.0", async () => {
  try {
    await connectDB();

    console.log("🚀 Server running on port:", PORT);

    console.log(`🔐 Environment: ${process.env.NODE_ENV || "development"}`);
  } catch (error) {
    console.error("❌ Database connection failed:", error);
  }
});

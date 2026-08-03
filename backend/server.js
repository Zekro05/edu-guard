import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import http from "http";
import { Server } from "socket.io";
import path from "path";

import { connectDB } from "./db/connectDB.js";
import Message from "./models/message.js";

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




import { User } from "./models/userModel.js";

import { fileURLToPath } from "url";


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


dotenv.config();

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 5000;

/* ================= MIDDLEWARE ================= */

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:8081",
  "exp://localhost:8081",
  "https://edu-guard-backend.onrender.com",
  "https://guide-ed-mu.vercel.app",
];

app.use(
  cors({
    origin: function (origin, callback) {
  if (!origin) return callback(null, true);

  const isAllowed = allowedOrigins.some((o) =>
    origin.startsWith(o)
  );

  if (isAllowed) {
    return callback(null, true);
  }

  return callback(new Error("Not allowed by CORS"));
},
    credentials: true, // 🔥 REQUIRED FOR COOKIES
     allowedHeaders: ["Content-Type", "Authorization"]
  })
);


/* ================= ROUTES ================= */

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
app.use("/api/notification-settings",notificationSettingsRoutes);



/* USERS */
app.get("/api/users", async (req, res) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
app.get("/ping", (req, res) => {
  res.json({ ok: true, message: "alive" });
});
/* ================= SOCKET.IO ================= */

export const io = new Server(server, {
  cors: {
    origin: [
      "http://localhost:8081",
      "http://localhost:5173",
      "http://localhost:5174",
      "exp://localhost:19000",
      "https://edu-guard-backend.onrender.com",
      "https://guide-ed-mu.vercel.app",
    ],
    methods: ["GET", "POST"],
    credentials: true,
  },
});


app.get("/api/test-notif", (req, res) => {
  io.emit("newNotification", {
    id: Date.now(),
    title: "🔥 Test Notification",
    message: "Dashboard socket is working",
    createdAt: new Date().toISOString(),
  });

  res.json({ ok: true });
});

/* ================= ONLINE USERS ================= */

const onlineUsers = new Map();

/* ================= SOCKET LOGIC ================= */
export const sendNotification = (userId, payload) => {
  if (!userId) return;

  io.to(String(userId)).emit("newNotification", payload);
};
io.on("connection", (socket) => {
  console.log("🟢 Connected:", socket.id);

  socket.onAny((event, data) => {
    console.log("📥 EVENT:", event, data);
  });

  socket.on("join", (userId) => {
  socket.join(userId);
  console.log("User joined room:", userId);
});

  socket.on("send_message", async (msg, callback) => {
  try {
    const chatId = [msg.sender, msg.receiver].sort().join("-");

    const saved = await Message.create({
      chatId,
      sender: msg.sender,
      receiver: msg.receiver,
      text: msg.text,
      seen: false,
    });

    const receiverSocket = onlineUsers.get(msg.receiver);

    if (receiverSocket) {
      io.to(receiverSocket).emit("receive_message", saved);
    }

    socket.emit("receive_message", saved);

    console.log("📩 SOCKET send_message HIT:", msg);


    io.emit("activity_feed", {
      type: "message",
      message: `💬 New message from ${msg.sender}`,
      time: new Date(),
    });

    console.log("🚀 activity_feed EMITTED");

    if (callback) callback(saved);
  } catch (err) {
    console.log(err);
  }
});

  

  socket.on("disconnect", () => {
    for (const [userId, sockId] of onlineUsers.entries()) {
      if (sockId === socket.id) {
        onlineUsers.delete(userId);
        break;
      }
    }

    io.emit("online_users", Array.from(onlineUsers.keys()));
    console.log("🔴 Disconnected:", socket.id);
  });

});

app.set("io", io);

/* ================= START SERVER ================= */

server.listen(PORT, "0.0.0.0", async () => {
  await connectDB();
  console.log("🚀 Server running on port:", PORT);
});
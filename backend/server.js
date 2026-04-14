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
import reportRoutes from "./routes/reports.js";
import historyRoutes from "./routes/historyRoutes.js";
import geminiRoutes from "./routes/gemini.js";
import messageRoutes from "./routes/messageRoutes.js";

import { User } from "./models/userModel.js";

dotenv.config();

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 5000;

/* ================= SOCKET.IO ================= */

export const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },

  path: "/socket.io",
  transports: ["websocket", "polling"],
  pingTimeout: 60000,
  pingInterval: 25000,
});

/* ================= ONLINE USERS ================= */

const onlineUsers = new Map(); // userId -> socketId

const getChatId = (a, b) => [a, b].sort().join("-");

/* ================= SOCKET LOGIC ================= */

io.on("connection", (socket) => {
  console.log("🟢 Connected:", socket.id);

  /* REGISTER USER */
  socket.on("register", (userId) => {
    
    if (!userId) return;

    onlineUsers.set(userId, socket.id);

    console.log("👤 REGISTER:", userId);

    io.emit("online_users", Array.from(onlineUsers.keys()));
  });

  /* SEND MESSAGE (REALTIME + DB SAVE) */
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

    // send to receiver in real-time
    if (receiverSocket) {
      io.to(receiverSocket).emit("receive_message", saved);
    }

    // also send back to sender
    socket.emit("receive_message", saved);

    // IMPORTANT: return saved message to frontend callback
    if (callback) callback(saved);

  } catch (err) {
    console.log("SEND MESSAGE ERROR:", err);
  }
});

  /* TYPING */
  socket.on("typing", ({ sender, receiver }) => {
    const receiverSocket = onlineUsers.get(receiver);

    if (receiverSocket) {
      io.to(receiverSocket).emit("typing", { sender });
    }
  });

  socket.on("stop_typing", ({ sender, receiver }) => {
    const receiverSocket = onlineUsers.get(receiver);

    if (receiverSocket) {
      io.to(receiverSocket).emit("stop_typing", { sender });
    }
  });

  /* SEEN MESSAGES */
  socket.on("mark_seen", async ({ chatId, userId }) => {
  await Message.updateMany(
    { chatId, receiver: userId },
    { status: "seen", seen: true }
  );

  io.emit("messages_seen", { chatId, userId });
});

  /* DISCONNECT */
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

/* ================= MIDDLEWARE ================= */

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://localhost:5174",
      "http://localhost:8081",
      "exp://localhost:8081",
      "https://edu-guard-backend.onrender.com",
    ],
    credentials: true,
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

app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

/* USERS */
app.get("/api/users", async (req, res) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.get("/test-db", async (req, res) => {
  const msg = await Message.create({
    chatId: "test",
    sender: "a",
    receiver: "b",
    text: "hello",
  });

  res.json(msg);
});

/* ================= START SERVER ================= */

server.listen(PORT, "0.0.0.0", async () => {
  await connectDB();
  console.log("🚀 Server running on port:", PORT);
});
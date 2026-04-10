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
  transports: ["websocket", "polling"],
  pingTimeout: 60000,
  pingInterval: 25000,
});

/* ================= PRODUCTION SOCKET STORAGE ================= */

const onlineUsers = new Map();      // userId → socketId
const socketToUser = new Map();     // socketId → userId
const messageQueue = new Map();     // userId → pending messages

/* ================= SOCKET LOGIC ================= */

io.on("connection", (socket) => {
  console.log("⚡ Connected:", socket.id);

  socket.isReady = false;

  /* ================= REGISTER ================= */
  socket.on("register", async (userId, callback) => {
    if (!userId) return;

    const id = String(userId);

    socket.userId = id;
    socket.isReady = true;

    onlineUsers.set(id, socket.id);
    socketToUser.set(socket.id, id);

    console.log("👤 REGISTERED:", id);

    /* 🔥 DELIVER OFFLINE MESSAGES */
    if (messageQueue.has(id)) {
      const queued = messageQueue.get(id);

      queued.forEach((msg) => {
        socket.emit("receive_message", msg);
      });

      messageQueue.delete(id);
    }

    io.emit("online_users", Array.from(onlineUsers.keys()));

    if (callback) callback({ success: true, socketId: socket.id });
  });

  /* ================= SEND MESSAGE ================= */
  socket.on("send_message", async (data) => {
    try {
      const { sender, receiver, text, file } = data;

      if (!socket.isReady) return;

      const chatId = [String(sender), String(receiver)].sort().join("-");

      const newMessage = await Message.create({
        chatId,
        sender: String(sender),
        receiver: String(receiver),
        text,
        file,
        seen: false,
        delivered: false,
      });

      const receiverSocketId = onlineUsers.get(String(receiver));
      const senderSocketId = onlineUsers.get(String(sender));

      const payload = newMessage;

      /* ================= DELIVER ================= */
      if (receiverSocketId) {
        io.to(receiverSocketId).emit("receive_message", payload);

        await Message.findByIdAndUpdate(newMessage._id, {
          delivered: true,
        });
      } else {
        /* OFFLINE QUEUE */
        if (!messageQueue.has(String(receiver))) {
          messageQueue.set(String(receiver), []);
        }

        messageQueue.get(String(receiver)).push(payload);
      }

      /* SYNC SENDER */
      if (senderSocketId) {
        io.to(senderSocketId).emit("receive_message", payload);
      }
    } catch (err) {
      console.error("❌ send_message error:", err);
    }
  });

  /* ================= TYPING ================= */
  socket.on("typing", ({ sender, receiver }) => {
    const receiverSocketId = onlineUsers.get(String(receiver));
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("typing", sender);
    }
  });

  socket.on("stop_typing", ({ receiver }) => {
    const receiverSocketId = onlineUsers.get(String(receiver));
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("stop_typing");
    }
  });

  /* ================= MESSAGE SEEN ================= */
  socket.on("message_seen", async ({ messageId, userId }) => {
    try {
      await Message.findByIdAndUpdate(messageId, {
        seen: true,
      });

      const senderSocketId = onlineUsers.get(String(userId));

      if (senderSocketId) {
        io.to(senderSocketId).emit("message_seen", {
          messageId,
        });
      }
    } catch (err) {
      console.error("❌ seen error:", err);
    }
  });

  /* ================= DISCONNECT ================= */
  socket.on("disconnect", () => {
    const userId = socketToUser.get(socket.id);

    if (userId) {
      onlineUsers.delete(userId);
      socketToUser.delete(socket.id);
    }

    io.emit("online_users", Array.from(onlineUsers.keys()));

    console.log("❌ Disconnected:", socket.id);
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

/* USERS LIST */
app.get("/api/users", async (req, res) => {
  const users = await User.find();
  res.json(users);
});

/* ================= START SERVER ================= */

server.listen(PORT, "0.0.0.0", async () => {
  await connectDB();
  console.log("🚀 Server running on port:", PORT);
});
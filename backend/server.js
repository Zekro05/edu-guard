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
});

// 🔥 FIXED ONLINE USERS (SAFE MAP)
const onlineUsers = new Map();

io.on("connection", (socket) => {
  console.log("⚡ Connected:", socket.id);

  /* REGISTER USER */
  socket.on("register", (userId) => {
    if (!userId) return;

    onlineUsers.set(String(userId), socket.id);

    io.emit("online_users", Array.from(onlineUsers.keys()));
  });

  /* SEND MESSAGE (FIXED REALTIME + DB SYNC) */
  socket.on("send_message", async (data) => {
    try {
      const { sender, receiver, text, file } = data;

      const chatId = [String(sender), String(receiver)].sort().join("-");

      const newMessage = await Message.create({
        chatId,
        sender: String(sender),
        receiver: String(receiver),
        text,
        file,
        seen: false,
      });

      const receiverSocket = onlineUsers.get(String(receiver));
      const senderSocket = onlineUsers.get(String(sender));

      // send to receiver
      if (receiverSocket) {
        io.to(receiverSocket).emit("receive_message", newMessage);
      }

      // send to sender (sync)
      if (senderSocket) {
        io.to(senderSocket).emit("receive_message", newMessage);
      }
    } catch (err) {
      console.error("❌ send_message error:", err);
    }
  });

  /* TYPING */
  socket.on("typing", ({ sender, receiver }) => {
    const receiverSocket = onlineUsers.get(String(receiver));
    if (receiverSocket) {
      io.to(receiverSocket).emit("typing", sender);
    }
  });

  socket.on("stop_typing", ({ receiver }) => {
    const receiverSocket = onlineUsers.get(String(receiver));
    if (receiverSocket) {
      io.to(receiverSocket).emit("stop_typing");
    }
  });

  /* DISCONNECT FIX */
  socket.on("disconnect", () => {
    for (let [userId, sockId] of onlineUsers.entries()) {
      if (sockId === socket.id) {
        onlineUsers.delete(userId);
        break;
      }
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
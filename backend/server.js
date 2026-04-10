import express from 'express';
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from 'cookie-parser';
import { connectDB } from './db/connectDB.js';
import authRoutes from "./routes/auth.js";
import studentRoutes from "./routes/studentRoutes.js";
import incidentRoutes from "./routes/incidentRoutes.js";
import reportRoutes from "./routes/reports.js";
import historyRoutes from "./routes/historyRoutes.js";
import geminiRoutes from "./routes/gemini.js";
import path from "path";

// 🔥 NEW
import http from "http";
import { Server } from "socket.io";

// 🔥 CHAT MODEL
import Message from "./models/message.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// 🔥 CREATE HTTP SERVER
const server = http.createServer(app);

// 🔥 SOCKET.IO SETUP
export const io = new Server(server, {
  cors: {
    origin: [
      "http://localhost:5173",
      "http://localhost:5174",
      "http://localhost:8081",
      "exp://localhost:8081",
    ],
    credentials: true,
  }
});

// 🔥 ================= CHAT SYSTEM =================

// 🟢 Track online users
let onlineUsers = {};

// 🔥 SOCKET CONNECTION
io.on("connection", (socket) => {
  console.log("⚡ Client connected:", socket.id);

  // ✅ REGISTER USER
  socket.on("register", (userId) => {
    onlineUsers[userId] = socket.id;

    // send updated list
    io.emit("online_users", Object.keys(onlineUsers));
  });

  // ✅ SEND MESSAGE
  socket.on("send_message", async (data) => {
    try {
      const { chatId, sender, receiver, text, file } = data;

      const newMessage = await Message.create({
        chatId,
        sender,
        receiver,
        text,
        file,
        seen: false
      });

      // 📤 send to receiver if online
      const receiverSocket = onlineUsers[receiver];

      if (receiverSocket) {
        io.to(receiverSocket).emit("receive_message", newMessage);
      }

      // 📤 send back to sender
      socket.emit("receive_message", newMessage);

    } catch (err) {
      console.error("❌ Message send error:", err);
    }
  });

  // ✅ TYPING INDICATOR
  socket.on("typing", ({ sender, receiver }) => {
    const receiverSocket = onlineUsers[receiver];
    if (receiverSocket) {
      io.to(receiverSocket).emit("typing", sender);
    }
  });

  socket.on("stop_typing", ({ receiver }) => {
    const receiverSocket = onlineUsers[receiver];
    if (receiverSocket) {
      io.to(receiverSocket).emit("stop_typing");
    }
  });

  // ✅ MARK AS SEEN
  socket.on("mark_seen", async ({ chatId, userId }) => {
    try {
      await Message.updateMany(
        { chatId, sender: { $ne: userId } },
        { seen: true }
      );

      io.emit("messages_seen", chatId);

    } catch (err) {
      console.error("❌ Seen update error:", err);
    }
  });

  // ❌ DISCONNECT
  socket.on("disconnect", () => {
    console.log("❌ Client disconnected:", socket.id);

    for (let userId in onlineUsers) {
      if (onlineUsers[userId] === socket.id) {
        delete onlineUsers[userId];
        break;
      }
    }

    io.emit("online_users", Object.keys(onlineUsers));
  });
});

// ================= MIDDLEWARE =================
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

// ================= ROUTES =================
app.use("/api/auth", authRoutes);
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));
app.use("/api/students", studentRoutes);
app.use("/api/incidents", incidentRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/history", historyRoutes);
app.use("/api/gemini", geminiRoutes);


// 🔥 ADD THIS (CHAT HISTORY ROUTE)
import messageRoutes from "./routes/messageRoutes.js";
app.use("/api/messages", messageRoutes);

// 🔥 OPTIONAL: USERS LIST (FOR CHAT LIST)
import { User } from "./models/userModel.js";
app.get("/api/users", async (req, res) => {
  const users = await User.find();
  res.json(users);
});

// ================= START SERVER =================
server.listen(PORT, '0.0.0.0', async () => {
  await connectDB();
  console.log("🚀 Server running on port:", PORT);
})
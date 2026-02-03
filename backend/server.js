import express from 'express';
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from 'cookie-parser';
import { connectDB } from './db/connectDB.js';
import authRoutes from "./routes/auth.js";
import studentRoutes from "./routes/studentRoutes.js";
import incidentRoutes from "./routes/incidentRoutes.js";
import geminiRoutes from "./routes/gemini.js";
dotenv.config();


const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());
app.use(cookieParser()); 

app.use(
  cors({
    origin: [
      "http://localhost:5173",              
      "http://localhost:8081",           
      "exp://localhost:8081",            
    ],
    credentials: true,
  })
);

app.use("/api/auth", authRoutes);
app.use("/api/students", studentRoutes);
app.use("/api/incidents", incidentRoutes);
app.use("/api/gemini", geminiRoutes);



app.listen(PORT, '0.0.0.0',() => {
    connectDB();
    console.log("Server is running on port: ", PORT);
});

//45AHFHb1dXx7fRbt
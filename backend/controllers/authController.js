import { User } from "../models/userModel.js";
import Student from "../models/studentModel.js";
import fs from "fs";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { generateTokenAndSetCookie } from "../utils/generateTokenAndSetCookie.js";
import { mapRoleForHistory } from "../utils/roleMapper.js";
import { createHistoryLog } from "../utils/createHistoryLog.js";
import {
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendResetSuccessEmail,
} from "../mailer/emails.js";

// SIGNUP 
export const signup = async (req, res) => {
  try {
    const {
      firstName,
      middleName,
      lastName,
      email,
      password,
      confirmPassword,
      studentId,
      grade,
      gender,
    } = req.body;

    const normalizedEmail = email.toLowerCase();
    
    if (
      !firstName ||
      !lastName ||
      !email ||
      !studentId ||
      !password ||
      !confirmPassword ||
      !grade ||
      !gender
    ) {
      return res
        .status(400)
        .json({ message: "All required fields must be filled" });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ message: "Passwords do not match" });
    }

    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser)
      return res.status(400).json({ message: "User already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);

    let profilePhotoPath = "";
    if (req.file) profilePhotoPath = `http://localhost:5000/uploads/${req.file.filename}`;

    const verificationToken = Math.floor(
      100000 + Math.random() * 900000
    ).toString();

    const fullName = `${firstName} ${
      middleName ? middleName + " " : ""
    }${lastName}`.trim();

    const user = new User({
      firstName,
      middleName: middleName || undefined,
      lastName,
      name: fullName,
      email: normalizedEmail,
      password: hashedPassword,
      studentId,
      role: "student",
      profilePhoto: profilePhotoPath,
      verificationToken,
      verificationTokenExpiresAt: Date.now() + 24 * 60 * 60 * 1000,
      isVerified: false,
    });

    await user.save();

    const student = new Student({
      firstName,
      middleName: middleName || "",
      lastName,
      email: normalizedEmail,
      profilePhoto: profilePhotoPath,
      studentId,
      grade,
      gender,
      createdBy: user._id,
    });

    await student.save();

    await createHistoryLog({
      userId: user._id,
      role: mapRoleForHistory(user.role),
      action: "Signup",
      category: "Auth",
      details: `Student account created (Student ID: ${student.studentId})`,
      ipAddress: req.ip,
    });

    try {
      await sendVerificationEmail(email, verificationToken);
    } catch (err) {
      console.error("OTP Email failed:", err);
    }

    res.status(201).json({
      success: true,
      message: "Signup successful. Verification code sent to your email.",
    });
  } catch (err) {
    console.error("Signup Error:", err);
    res.status(500).json({ message: err.message || "Server error" });
  }
};





//  VERIFY SIGNUP OTP 
export const verifyEmail = async (req, res) => {
  const { email, code } = req.body;
  const client = req.headers["x-client-type"] || req.body.client;

  if (!email || !code)
    return res.status(400).json({ message: "Email and code are required" });

  try {
    const user = await User.findOne({
      email,
      verificationToken: code,
      verificationTokenExpiresAt: { $gt: Date.now() },
    });

    if (!user)
      return res
        .status(400)
        .json({ message: "Invalid or expired verification code" });

    user.isVerified = true;
    user.verificationToken = undefined;
    user.verificationTokenExpiresAt = undefined;
    await user.save();

    await createHistoryLog({
      userId: user._id,
      role: mapRoleForHistory(user.role),
      action: "Email Verification",
      category: "Auth",
      details: "Account email verified via OTP",
      ipAddress: req.ip,
    });

    if (client === "mobile") {
      const student = await Student.findOne({ email });

      const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
        expiresIn: "7d",
      });

      return res.status(200).json({
        success: true,
        message: "Signup verified! You are now logged in.",
        user: {
          _id: user._id,
          firstName: user.firstName,
          middleName: user.middleName || "",
          lastName: user.lastName,
          email: user.email,
          profilePhoto: student?.profilePhoto || user.profilePhoto || "",
          studentId: student?.studentId || "Not Available",
          gradeCourse: student?.grade || "Not Available",
          contactNumber: student?.phone || "Not Available",
        },
        token,
      });
    }

    res.status(200).json({
      success: true,
      message: "Signup verified! You can now login.",
    });
  } catch (error) {
    console.error("Verify Email Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};


//  LOGIN 
export const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    if (!email || !password)
      return res.status(400).json({ message: "All fields are required" });

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "Invalid credentials" });

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid)
      return res.status(400).json({ message: "Wrong password" });

    if (user.role !== "admin")
      return res.status(403).json({
        message: "Access denied. Only admin accounts are allowed to log in.",
      });

    if (!user.isVerified)
      return res
        .status(401)
        .json({ message: "Email not verified", requiresOTP: true });

    const loginOTP = Math.floor(100000 + Math.random() * 900000).toString();
    user.loginOTP = loginOTP;
    user.loginOTPExpiresAt = Date.now() + 15 * 60 * 1000;
    await user.save();

    await sendVerificationEmail(email, loginOTP);

    await createHistoryLog({
      userId: user._id,
      role: mapRoleForHistory(user.role),
      action: "Login OTP Sent",
      category: "Auth",
      details: "Login OTP sent to email",
      ipAddress: req.ip,
    });

    res
      .status(200)
      .json({ success: true, requiresOTP: true, message: "OTP sent to your email" });
  } catch (err) {
    console.error("Login Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

export const mobileLogin = async (req, res) => {
  const { email, password } = req.body;

  try {
    if (!email || !password)
      return res.status(400).json({ message: "All fields are required" });

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "Invalid credentials" });

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid)
      return res.status(400).json({ message: "Wrong password" });

    if (!user.isVerified)
      return res.status(401).json({ message: "Email not verified" });

    // ✅ ALWAYS GENERATE LOGIN OTP
    const loginOTP = Math.floor(100000 + Math.random() * 900000).toString();
    user.loginOTP = loginOTP;
    user.loginOTPExpiresAt = Date.now() + 15 * 60 * 1000;
    await user.save();

    await sendVerificationEmail(email, loginOTP);

    await createHistoryLog({
      userId: user._id,
      role: mapRoleForHistory(user.role),
      action: "Mobile Login OTP Sent",
      category: "Auth",
      details: "Mobile login OTP sent",
      ipAddress: req.ip,
    });

    // 🔑 VERY IMPORTANT
    return res.status(200).json({
      success: true,
      requiresOTP: true,
      message: "OTP sent to your email",
    });
  } catch (err) {
    console.error("Mobile login error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// MOBILE VERIFY LOGIN OTP (no admin restriction)
export const verifyMobileLoginOTP = async (req, res) => {
  const { email, code } = req.body;

  try {
    const user = await User.findOne({
      email,
      loginOTP: code,
      loginOTPExpiresAt: { $gt: Date.now() },
    });

    if (!user) return res.status(400).json({ message: "Invalid or expired OTP" });

    // Remove OTP after verification
    user.loginOTP = undefined;
    user.loginOTPExpiresAt = undefined;
    await user.save();

    await createHistoryLog({
        userId: user._id,
        role: mapRoleForHistory(user.role),
        action: "Mobile Login",
        category: "Auth",
        details: "Mobile login verified via OTP",
        ipAddress: req.ip,
      });

    // ✅ Get student info
    const student = await Student.findOne({ email });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    // Return merged data
    res.status(200).json({
      success: true,
      user: {
        _id: user._id,
        firstName: user.firstName,
        middleName: user.middleName,
        lastName: user.lastName,
        email: user.email,
        profilePhoto: student?.profilePhoto || user.profilePhoto || "",
        studentId: student?.studentId || "Not Available",
        gradeCourse: student?.grade || "Not Available",
        contactNumber: student?.phone || "Not Available",
      },
      token,
    });
  } catch (err) {
    console.error("Verify Mobile Login OTP Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// VERIFY LOGIN OTP 
export const verifyLoginOTP = async (req, res) => {
  const { email, code } = req.body;

  try {
    const user = await User.findOne({
      email,
      loginOTP: code,
      loginOTPExpiresAt: { $gt: Date.now() },
    });

    if (!user)
      return res.status(400).json({ message: "Invalid or expired OTP" });

    user.loginOTP = undefined;
    user.loginOTPExpiresAt = undefined;
    await user.save();

    generateTokenAndSetCookie(res, user._id);

    await createHistoryLog({
      userId: user._id,
      role: mapRoleForHistory(user.role),
      action: "Login",
      category: "Auth",
      details: "Admin logged in successfully",
      ipAddress: req.ip,
    });

    res
      .status(200)
      .json({ success: true, user: { ...user._doc, password: undefined } });
  } catch (err) {
    console.error("Verify Login OTP Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

export const resendSignupOTP = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email is required" });

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });
    if (user.isVerified) return res.status(400).json({ message: "Email already verified" });

    // Generate new OTP
    const verificationToken = Math.floor(100000 + Math.random() * 900000).toString();
    user.verificationToken = verificationToken;
    user.verificationTokenExpiresAt = Date.now() + 24 * 60 * 60 * 1000; // 24h
    await user.save();

    await sendVerificationEmail(email, verificationToken);

    res.status(200).json({ message: "Signup OTP resent successfully" });
  } catch (err) {
    console.error("Resend Signup OTP Error:", err);
    res.status(500).json({ message: "Failed to resend OTP" });
  }
};

//resending login 
export const resendLoginOTP = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email is required" });

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    if (!user.isVerified)
      return res.status(400).json({ message: "Email not verified. Cannot resend login OTP." });

    
    const loginOTP = Math.floor(100000 + Math.random() * 900000).toString();
    user.loginOTP = loginOTP;
    user.loginOTPExpiresAt = Date.now() + 15 * 60 * 1000; // 15 minutes
    await user.save();

    await sendVerificationEmail(email, loginOTP);

    res.status(200).json({ message: "Login OTP resent successfully" });
  } catch (err) {
    console.error("Resend Login OTP Error:", err);
    res.status(500).json({ message: "Failed to resend login OTP" });
  }
};
// CHECK AUTH 
export const checkAuth = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select("-password");
    if (!user) return res.status(400).json({ message: "User not found" });

    res.status(200).json({ authenticated: true, user });
  } catch (err) {
    console.error("Check Auth Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

//  LOGOUT 
export const logout = async (req, res) => {
  if (req.userId) {
    await createHistoryLog({
      userId: req.userId,
      role: "Admin",
      action: "Logout",
      category: "Auth",
      details: "User logged out",
      ipAddress: req.ip,
    });
  }

  res.clearCookie("token", { httpOnly: true, sameSite: "lax" });
  res.status(200).json({ success: true, message: "Logged out successfully" });
};

//  FORGOT PASSWORD 
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) return res.status(400).json({ message: "Email is required" });

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    user.resetPasswordToken = otp;
    user.resetPasswordExpiresAt = Date.now() + 10 * 60 * 1000; 
    await user.save();

    await createHistoryLog({
        userId: user._id,
        role: mapRoleForHistory(user.role),
        action: "Forgot Password",
        category: "Auth",
        details: "Password reset OTP requested",
        ipAddress: req.ip,
      });

    
    await sendPasswordResetEmail(email, `<h3>Your OTP is:</h3><h2>${otp}</h2>`);

    res.json({ message: "OTP sent to your email" });
  } catch (error) {
    console.error("Forgot Password Error:", error);
    res.status(500).json({ message: "Failed to send OTP" });
  }
};

export const verifyForgotPasswordOTP = async (req, res) => {
  const { email, code } = req.body;

  if (!email || !code) {
    return res.status(400).json({ message: "Email and OTP code are required" });
  }

  try {
    const user = await User.findOne({
      email,
      resetPasswordToken: code,
      resetPasswordExpiresAt: { $gt: Date.now() }, 
    });

    if (!user) {
      return res.status(401).json({ message: "Invalid or expired OTP" });
    }

    return res.status(200).json({ message: "OTP verified" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
};

export const resendForgotPasswordOTP = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email)
      return res.status(400).json({ message: "Email is required" });

    const user = await User.findOne({ email });
    if (!user)
      return res.status(404).json({ message: "User not found" });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    user.resetPasswordToken = otp;
    user.resetPasswordExpiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes
    await user.save();

    await sendPasswordResetEmail(
      email,
      `<h3>Your OTP is:</h3><h2>${otp}</h2>`
    );

    res.status(200).json({ message: "Password reset OTP resent successfully" });
  } catch (err) {
    console.error("Resend Forgot OTP Error:", err);
    res.status(500).json({ message: "Failed to resend OTP" });
  }
};


//RESET PASSWORD 
export const resetPassword = async (req, res) => {
  try {
    const { email, newPassword, code } = req.body;

    if (!email || !newPassword || !code)
      return res.status(400).json({ message: "All fields are required" });

    const user = await User.findOne({
      email,
      resetPasswordToken: code,
      resetPasswordExpiresAt: { $gt: Date.now() },
    });

    if (!user)
      return res.status(400).json({ message: "Invalid or expired OTP" });

    const isSameAsOld = await bcrypt.compare(newPassword, user.password);
    if (isSameAsOld)
      return res
        .status(400)
        .json({ message: "New password cannot be the same as the old password" });

    user.password = await bcrypt.hash(newPassword, 10);

    // ✅ clear OTP
    user.resetPasswordToken = undefined;
    user.resetPasswordExpiresAt = undefined;

    await user.save();

    await createHistoryLog({
      userId: user._id,
      role: mapRoleForHistory(user.role),
      action: "Password Reset",
      category: "Auth",
      details: "User successfully reset password",
      ipAddress: req.ip,
    });

    await sendResetSuccessEmail(email);

    res.json({ message: "Password reset successful" });
  } catch (error) {
    console.error("Reset Password Error:", error);
    res.status(500).json({ message: "Password reset failed" });
  }
};





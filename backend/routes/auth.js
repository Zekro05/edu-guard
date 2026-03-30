import express from "express";
import {
  login,
  mobileLogin,
  logout,
  signup,
  verifyEmail,
  verifyLoginOTP,
  forgotPassword,
  resetPassword,
  checkAuth,
  verifyForgotPasswordOTP,
  resendSignupOTP,
  resendLoginOTP,
  resendForgotPasswordOTP
} from "../controllers/authController.js";
import { verifyToken } from "../middleware/verifyToken.js";
import { upload } from "../middleware/upload.js";

const router = express.Router();

// ---------------- AUTH CHECK ----------------
router.get("/check-auth", verifyToken, checkAuth);

// ---------------- SIGNUP ----------------
router.post("/signup", upload.single("profilePhoto"), signup);

// ---------------- LOGIN ----------------
router.post("/login", login);
router.post ("/mobile-login", mobileLogin);

// ---------------- LOGOUT ----------------
router.post("/logout", logout);

// ---------------- EMAIL VERIFICATION (SIGNUP) ----------------
router.post("/verify-email", verifyEmail);

// ---------------- LOGIN OTP VERIFICATION ----------------
router.post("/verify-login-otp", verifyLoginOTP);


// ---------------- FORGOT PASSWORD ----------------
router.post("/forgot-password", forgotPassword);

// ---------------- RESET PASSWORD ----------------
router.post("/reset-password", resetPassword);

router.post("/verify-forgot-password-otp", verifyForgotPasswordOTP);

router.post("/resend-signup-otp", resendSignupOTP);
router.post("/resend-login-otp", resendLoginOTP);
router.post("/resend-forgot-password-otp", resendForgotPasswordOTP);




export default router;

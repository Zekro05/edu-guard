import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },

  password: {
    type: String,
    required: true,
  },

  role: {
    type: String,
    enum: ["admin", "student"],
    default: "student", 
  },

  profilePhoto: {
  type: String, 
  default: "",  
},

  studentId: {
    type: String,
    required: function () {
      return this.role === "student"; 
    },
  },

  lastLogin: {
    type: Date,
    default: Date.now,
  },

  isVerified: {
    type: Boolean,
    default: false,
  },

  // SIGNUP EMAIL VERIFICATION
  verificationToken: String,
  verificationTokenExpiresAt: Date,

  // LOGIN OTP
  loginOTP: String,
  loginOTPExpiresAt: Date,

  forgotPasswordOTP: String,
  

  // PASSWORD RESET
  resetPasswordToken: String,
  resetPasswordExpiresAt: Date,

}, { timestamps: true });

export const User = mongoose.model("User", userSchema);
export default User;
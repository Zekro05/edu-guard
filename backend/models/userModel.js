import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    firstName: { type: String },
    middleName: { type: String },
    lastName: { type: String },
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
      enum: ["admin", "student", "teacher"],
      default: "student",
    },

    expoPushToken: {
      type: String,
      default: null,
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

    employeeId: {
      type: String,
      required: function () {
        return this.role === "teacher";
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

    notificationSettings: {
      mute: {
        type: Boolean,
        default: false,
      },
      incidentUpdates: {
        type: Boolean,
        default: true,
      },
      guidanceMessages: {
        type: Boolean,
        default: true,
      },
      systemAnnouncements: {
        type: Boolean,
        default: true,
      },
      highRiskAlerts: {
        type: Boolean,
        default: true,
      },
      quietHours: {
        type: Boolean,
        default: false,
      },
      sound: {
        type: Boolean,
        default: true,
      },
      vibration: {
        type: Boolean,
        default: true,
      },

      emailAlerts: {
        type: Boolean,
        default: true,
      },

      highRiskAlerts: {
        type: Boolean,
        default: true,
      },

      aiPredictionAlerts: {
        type: Boolean,
        default: false,
      },

      securityWarnings: {
        type: Boolean,
        default: false,
      },

      adminEmail: {
        type: String,
        default: "",
        trim: true,
        lowercase: true,
      },

      guidanceEmail: {
        type: String,
        default: "",
        trim: true,
        lowercase: true,
      },
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
  },
  { timestamps: true },
);

export const User = mongoose.model("User", userSchema);
export default User;

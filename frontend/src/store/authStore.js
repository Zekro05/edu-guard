import { create } from "zustand";
import { toast } from "react-hot-toast";
import { API } from "../lib/api";
import { registerWebFCM } from "../services/fcmService";

/* =========================================================
   ATTACH TOKEN AUTOMATICALLY
========================================================= */

API.interceptors.request.use((config) => {
  try {
    const user = JSON.parse(localStorage.getItem("user"));

    if (user?.token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${user.token}`;
    }
  } catch (error) {
    console.error("AUTH INTERCEPTOR ERROR:", error);
  }

  return config;
});

/* =========================================================
   REMOVE WEB FCM TOKEN
========================================================= */

const removeWebPushToken = async () => {
  try {
    const storedUser = JSON.parse(localStorage.getItem("user") || "null");

    if (!storedUser?.token) {
      console.log("⚠️ No authentication token. FCM removal skipped.");

      return true;
    }

    const fcmToken = localStorage.getItem("webFCMToken");

    if (!fcmToken) {
      console.log("⚠️ No stored Web FCM token. FCM removal skipped.");

      return true;
    }

    console.log("====================================");

    console.log("🗑️ REMOVING WEB FCM TOKEN");

    console.log("Token:", fcmToken.substring(0, 20) + "...");

    console.log("====================================");

    const response = await API.delete("/api/auth/remove-push-token", {
      data: {
        token: fcmToken,
      },
    });

    console.log("====================================");

    console.log("✅ WEB FCM TOKEN REMOVED");

    console.log(response.data);

    console.log("====================================");

    /*
    Remove the local copy only after
    the backend successfully removed it.
    */
    localStorage.removeItem("webFCMToken");

    return true;
  } catch (error) {
    console.error("====================================");

    console.error("❌ WEB FCM TOKEN REMOVAL ERROR");

    console.error(error?.response?.data || error?.message || error);

    console.error("====================================");

    return false;
  }
};

/* =========================================================
   AUTH STORE
========================================================= */

export const useAuthStore = create((set, get) => ({
  /* =====================================================
       STATE
    ===================================================== */

  user: null,

  tempEmail: null,

  otpRequired: false,

  otpType: null,

  otpCode: null,

  error: null,

  isLoading: false,

  isAuthenticated: false,

  isCheckingAuth: true,

  autoLogoutTimer: null,

  countdownInterval: null,

  inactivityTimer: null,

  countdown: 0,

  warningActive: false,

  /* =====================================================
       PUSH NOTIFICATIONS
    ===================================================== */

  registerPushNotifications: async () => {
    try {
      console.log("====================================");

      console.log("🔥 REGISTERING WEB FCM FROM AUTH STORE");

      console.log("====================================");

      const token = await registerWebFCM();

      if (token) {
        console.log("✅ WEB FCM REGISTRATION SUCCESSFUL");

        return {
          success: true,
          token,
        };
      }

      console.warn("⚠️ WEB FCM REGISTRATION FAILED");

      return {
        success: false,
        error: "Failed to register web push notifications.",
      };
    } catch (error) {
      console.error("❌ WEB FCM REGISTRATION ERROR:", error);

      return {
        success: false,
        error: error?.message || "Failed to register web push notifications.",
      };
    }
  },

  removePushToken: async () => {
    const success = await removeWebPushToken();

    return {
      success,
      ...(success
        ? {}
        : {
            error: "Failed to remove web push token.",
          }),
    };
  },

  /* =====================================================
       INACTIVITY TIMER
    ===================================================== */

  startInactivityTimer: (onLogoutCallback) => {
    clearTimeout(get().inactivityTimer);

    const inactivityMinutes = 10;
    const warningSeconds = 30;

    let remaining = inactivityMinutes * 60;

    const tick = () => {
      if (remaining === warningSeconds) {
        toast("You will be logged out in 30 seconds due to inactivity", {
          style: {
            background: "#FBBF24",
            color: "#000",
          },
        });
      }

      if (remaining <= 0) {
        get().logout();

        if (onLogoutCallback) {
          onLogoutCallback();
        }

        return;
      }

      set({
        countdown: remaining,
      });

      remaining -= 1;

      const timer = setTimeout(tick, 1000);

      set({
        inactivityTimer: timer,
      });
    };

    tick();
  },

  resetInactivityTimer: () => {
    clearTimeout(get().inactivityTimer);

    get().startInactivityTimer();
  },

  clearInactivityTimer: () => {
    clearTimeout(get().inactivityTimer);

    set({
      inactivityTimer: null,
      countdown: 0,
    });
  },

  /* =====================================================
       CHECK AUTH
    ===================================================== */

  checkAuth: async () => {
    try {
      set({
        isCheckingAuth: true,
      });

      const { data } = await API.get("/api/auth/check-auth");

      if (data.authenticated && data.user) {
        const storedUser = JSON.parse(localStorage.getItem("user") || "null");

        const userData = {
          ...data.user,

          ...(storedUser?.token
            ? {
                token: storedUser.token,
              }
            : {}),
        };

        set({
          user: userData,
          isAuthenticated: true,
        });

        localStorage.setItem("user", JSON.stringify(userData));

        /* ===============================================
             RE-REGISTER WEB FCM TOKEN
          =============================================== */

        setTimeout(async () => {
          try {
            console.log("🔄 Re-registering Web FCM after auth check...");

            const token = await registerWebFCM();

            if (token) {
              console.log("✅ Web FCM re-registered successfully.");
            }
          } catch (error) {
            console.error("❌ Web FCM re-registration failed:", error);
          }
        }, 500);
      } else {
        set({
          user: null,
          isAuthenticated: false,
        });

        localStorage.removeItem("user");
      }
    } catch (err) {
      console.error("CHECK AUTH ERROR:", err?.response?.data || err?.message);

      set({
        user: null,
        isAuthenticated: false,
      });
    } finally {
      set({
        isCheckingAuth: false,
      });
    }
  },

  /* =====================================================
       SIGNUP
    ===================================================== */

  signup: async (formData) => {
    set({
      isLoading: true,
      error: null,
    });

    try {
      const { data } = await API.post("/api/auth/signup", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      set({
        tempEmail: formData.get("email"),

        otpRequired: true,

        otpType: "signup",
      });

      toast.success(data.message);
    } catch (err) {
      set({
        error: err.response?.data?.message || err.message,
      });

      throw err;
    } finally {
      set({
        isLoading: false,
      });
    }
  },

  /* =====================================================
       LOGIN
    ===================================================== */

  login: async (email, password) => {
    set({
      isLoading: true,
      error: null,
    });

    try {
      const { data } = await API.post("/api/auth/login", {
        email,
        password,
      });

      if (data.requiresOTP) {
        set({
          tempEmail: email,

          otpRequired: true,

          otpType: "login",
        });

        toast.success("OTP sent to your email");

        return {
          success: true,
          requiresOTP: true,
        };
      }

      /* ===============================================
           SAVE AUTH
        =============================================== */

      const userData = {
        ...data.user,
        token: data.token,
      };

      set({
        user: userData,

        isAuthenticated: true,

        otpRequired: false,

        tempEmail: null,

        otpType: null,
      });

      localStorage.setItem("user", JSON.stringify(userData));

      toast.success("Logged in successfully");

      /* ===============================================
           REGISTER WEB FCM
        =============================================== */

      setTimeout(async () => {
        try {
          console.log("🔥 Registering Web FCM after login...");

          const token = await registerWebFCM();

          if (token) {
            console.log("✅ Web FCM registered after login.");
          }
        } catch (error) {
          console.error("❌ Web FCM registration after login failed:", error);
        }
      }, 500);

      return {
        success: true,
      };
    } catch (err) {
      set({
        error: err.response?.data?.message || err.message,
      });

      throw err;
    } finally {
      set({
        isLoading: false,
      });
    }
  },

  /* =====================================================
       VERIFY OTP
    ===================================================== */

  verifyOTP: async (code) => {
    set({
      isLoading: true,
      error: null,
    });

    try {
      const { tempEmail, otpType } = get();

      if (!tempEmail) {
        throw new Error("No email found for OTP verification");
      }

      const url =
        otpType === "signup"
          ? "/api/auth/verify-email"
          : "/api/auth/verify-login-otp";

      const { data } = await API.post(url, {
        email: tempEmail,
        code,
      });

      /* ===============================================
           LOGIN OTP
        =============================================== */

      if (otpType === "login") {
        const userData = {
          ...data.user,
          token: data.token,
        };

        set({
          user: userData,

          isAuthenticated: true,

          otpRequired: false,

          tempEmail: null,

          otpType: null,
        });

        localStorage.setItem("user", JSON.stringify(userData));

        toast.success("Logged in successfully");

        /* =============================================
             REGISTER WEB FCM
          ============================================= */

        setTimeout(async () => {
          try {
            console.log("🔥 Registering Web FCM after OTP login...");

            const token = await registerWebFCM();

            if (token) {
              console.log("✅ Web FCM registered after OTP login.");
            }
          } catch (error) {
            console.error(
              "❌ Web FCM registration after OTP login failed:",
              error,
            );
          }
        }, 500);

        return {
          success: true,
          verified: true,
        };
      }

      /* ===============================================
           SIGNUP OTP
        =============================================== */

      if (otpType === "signup") {
        set({
          otpRequired: false,

          tempEmail: null,

          otpType: null,
        });

        toast.success("Signup verified! You can now login.");

        return {
          success: true,
          verified: true,
        };
      }
    } catch (err) {
      set({
        error: err.response?.data?.message || err.message,
      });

      throw err;
    } finally {
      set({
        isLoading: false,
      });
    }
  },

  /* =====================================================
       RESEND OTP
    ===================================================== */

  resendOTP: async () => {
    set({
      isLoading: true,
      error: null,
    });

    try {
      const { tempEmail, otpType } = get();

      if (!tempEmail) {
        throw new Error("No email found for OTP");
      }

      let url;

      switch (otpType) {
        case "signup":
          url = "/api/auth/resend-signup-otp";
          break;

        case "login":
          url = "/api/auth/resend-login-otp";
          break;

        case "forgot":
          url = "/api/auth/resend-forgot-password-otp";
          break;

        default:
          throw new Error("Invalid OTP type");
      }

      const { data } = await API.post(url, {
        email: tempEmail,
      });

      toast.success(data.message);

      return {
        success: true,
      };
    } catch (err) {
      const message = err.response?.data?.message || err.message;

      set({
        error: message,
      });

      toast.error(message);

      throw err;
    } finally {
      set({
        isLoading: false,
      });
    }
  },

  /* =====================================================
       FORGOT PASSWORD
    ===================================================== */

  forgotPassword: async (email) => {
    set({
      isLoading: true,
      error: null,
    });

    try {
      await API.post("/api/auth/forgot-password", {
        email,
      });

      set({
        tempEmail: email,

        otpRequired: true,

        otpType: "forgot",
      });

      return {
        success: true,
      };
    } catch (err) {
      const message = err.response?.data?.message || err.message;

      set({
        error: message,
      });

      toast.error(message);

      throw err;
    } finally {
      set({
        isLoading: false,
      });
    }
  },

  /* =====================================================
       VERIFY FORGOT PASSWORD OTP
    ===================================================== */

  verifyForgotPasswordOTP: async (code) => {
    set({
      isLoading: true,
      error: null,
    });

    try {
      const { tempEmail } = get();

      if (!tempEmail) {
        throw new Error("No email found for OTP verification");
      }

      await API.post("/api/auth/verify-forgot-password-otp", {
        email: tempEmail,
        code,
      });

      set({
        otpRequired: false,
        otpCode: code,
      });

      toast.success("OTP verified! You can now set your new password.");

      return {
        success: true,
      };
    } catch (err) {
      const message = err.response?.data?.message || err.message;

      set({
        error: message,
      });

      toast.error(message);

      throw err;
    } finally {
      set({
        isLoading: false,
      });
    }
  },

  /* =====================================================
       RESET PASSWORD
    ===================================================== */

  resetPassword: async (newPassword) => {
    const { tempEmail, otpCode } = get();

    set({
      isLoading: true,
      error: null,
    });

    try {
      if (!otpCode) {
        throw new Error("OTP not found. Please verify OTP first.");
      }

      await API.post("/api/auth/reset-password", {
        email: tempEmail,

        newPassword,

        code: otpCode,
      });

      set({
        tempEmail: null,

        otpCode: null,

        otpRequired: false,

        otpType: null,
      });

      toast.success("Password reset successfully");

      return {
        success: true,
      };
    } catch (err) {
      const message = err.response?.data?.message || err.message;

      set({
        error: message,
      });

      toast.error(message);

      throw err;
    } finally {
      set({
        isLoading: false,
      });
    }
  },

  /* =====================================================
       CHANGE PASSWORD
    ===================================================== */

  changePassword: async (oldPassword, newPassword) => {
    set({
      isLoading: true,
      error: null,
    });

    try {
      const { data } = await API.post("/api/auth/change-password", {
        oldPassword,
        newPassword,
      });

      toast.success(data.message);

      return data;
    } catch (err) {
      const message =
        err.response?.data?.message || "Failed to change password";

      set({
        error: message,
      });

      toast.error(message);

      throw err;
    } finally {
      set({
        isLoading: false,
      });
    }
  },

  /* =====================================================
       LOGOUT
    ===================================================== */

  logout: async (callback) => {
    try {
      /* ===============================================
           IMPORTANT:
           Remove FCM token BEFORE clearing local JWT.
        =============================================== */

      const pushRemoved = await removeWebPushToken();

      if (pushRemoved) {
        console.log("✅ Web FCM token removed before logout.");
      } else {
        console.warn("⚠️ Web FCM token could not be removed.");
      }

      /* ===============================================
           BACKEND LOGOUT
        =============================================== */

      try {
        await API.post("/api/auth/logout");
      } catch (error) {
        console.log(
          "BACKEND LOGOUT ERROR:",
          error?.response?.data || error?.message,
        );
      }

      /* ===============================================
           CLEAR LOCAL AUTH
        =============================================== */

      set({
        user: null,

        isAuthenticated: false,

        countdown: 0,

        warningActive: false,

        tempEmail: null,

        otpRequired: false,

        otpType: null,

        otpCode: null,

        error: null,
      });

      localStorage.removeItem("user");

      if (typeof callback === "function") {
        callback();
      }

      toast.success("Logged out successfully");

      return {
        success: true,

        pushTokenRemoved: pushRemoved,
      };
    } catch (error) {
      console.error("LOGOUT ERROR:", error);

      /* ===============================================
           ALWAYS CLEAR LOCAL AUTH
        =============================================== */

      set({
        user: null,

        isAuthenticated: false,

        countdown: 0,

        warningActive: false,

        tempEmail: null,

        otpRequired: false,

        otpType: null,

        otpCode: null,

        error: null,
      });

      localStorage.removeItem("user");

      if (typeof callback === "function") {
        callback();
      }

      return {
        success: false,

        error: error?.message || "Logout failed.",
      };
    }
  },
}));

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

  clearError: () => {
    set({
      error: null,
    });
  },

  isLoading: false,

  isAuthenticated: false,

  isCheckingAuth: true,

  autoLogoutTimer: null,

  countdownInterval: null,

  inactivityTimer: null,

  countdown: 0,

  warningActive: false,

  /* =====================================================
       SECURITY SETTINGS
  ===================================================== */

  securitySettings: {
    twoFactorEnabled: true,
    sessionTimeoutEnabled: true,
  },

  /* =====================================================
       GET SECURITY SETTINGS
  ===================================================== */

  getSecuritySettings: async () => {
    try {
      const { data } = await API.get("/api/settings/security");

      if (data?.success && data?.settings) {
        set({
          securitySettings: {
            twoFactorEnabled: data.settings.twoFactorEnabled !== false,

            sessionTimeoutEnabled:
              data.settings.sessionTimeoutEnabled !== false,
          },
        });
      }

      return data;
    } catch (err) {
      const message =
        err.response?.data?.message || "Failed to load security settings";

      console.error("GET SECURITY SETTINGS ERROR:", message);

      /*
        Keep secure defaults if the request fails.
      */
      set({
        securitySettings: {
          twoFactorEnabled: true,
          sessionTimeoutEnabled: true,
        },
      });

      throw err;
    }
  },

  /* =====================================================
       UPDATE SECURITY SETTINGS
  ===================================================== */

  updateSecuritySettings: async (settings) => {
    set({
      isLoading: true,
      error: null,
    });

    try {
      const { data } = await API.put("/api/settings/security", settings);

      if (data?.success && data?.settings) {
        const updatedSettings = {
          twoFactorEnabled: data.settings.twoFactorEnabled !== false,

          sessionTimeoutEnabled: data.settings.sessionTimeoutEnabled !== false,
        };

        set({
          securitySettings: updatedSettings,
        });

        /*
          If session timeout was turned OFF,
          immediately stop the existing timer.
        */
        if (updatedSettings.sessionTimeoutEnabled === false) {
          console.log("🔓 Session timeout disabled. Clearing timer...");

          get().clearInactivityTimer();
        }

        /*
          If session timeout was turned ON,
          start a fresh timer.
        */
        if (updatedSettings.sessionTimeoutEnabled === true) {
          console.log("🔒 Session timeout enabled. Starting timer...");

          get().startInactivityTimer();
        }
      }

      toast.success(data?.message || "Security settings updated successfully");

      return data;
    } catch (err) {
      const message =
        err.response?.data?.message || "Failed to update security settings";

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
    /*
      Always clear the previous timer first.
    */
    clearTimeout(get().inactivityTimer);

    /*
      Check the current security setting.
    */
    const { securitySettings } = get();

    /*
      If session timeout protection is disabled,
      do not start an inactivity timer.
    */
    if (securitySettings?.sessionTimeoutEnabled === false) {
      console.log("🔓 Session timeout protection is disabled.");

      set({
        inactivityTimer: null,
        countdown: 0,
        warningActive: false,
      });

      return;
    }

    console.log("🔒 Session timeout protection is enabled.");

    /*
      =====================================================
      TEST MODE
      =====================================================

      10 seconds = logout timeout
      5 seconds  = warning

      AFTER TESTING, CHANGE TO:

      const inactivityMinutes = 10;
      const warningSeconds = 30;
      let remaining = inactivityMinutes * 60;
    */

    const inactivitySeconds = 10 * 60;
    const warningSeconds = 30;

    let remaining = inactivitySeconds;

    console.log(`⏱️ Inactivity timer started: ${remaining} seconds`);

    const tick = () => {
      /*
        Check the setting again while the timer is running.
      */
      const currentSettings = get().securitySettings;

      if (currentSettings?.sessionTimeoutEnabled === false) {
        console.log("🔓 Session timeout disabled while timer was running.");

        clearTimeout(get().inactivityTimer);

        set({
          inactivityTimer: null,
          countdown: 0,
          warningActive: false,
        });

        return;
      }

      /*
        Show warning.
      */
      if (remaining === warningSeconds) {
        set({
          warningActive: true,
        });

        toast("You will be logged out in 5 seconds due to inactivity", {
          style: {
            background: "#FBBF24",
            color: "#000",
          },
        });
      }

      /*
        Logout when countdown reaches zero.
      */
      if (remaining <= 0) {
        console.log("⏰ SESSION TIMEOUT REACHED");

        set({
          warningActive: false,
          countdown: 0,
        });

        get().logout();

        if (onLogoutCallback) {
          onLogoutCallback();
        }

        return;
      }

      set({
        countdown: remaining,
      });

      console.log(`⏱️ Session timeout countdown: ${remaining}s`);

      remaining -= 1;

      const timer = setTimeout(tick, 1000);

      set({
        inactivityTimer: timer,
      });
    };

    tick();
  },

  /* =====================================================
       RESET INACTIVITY TIMER
  ===================================================== */

  resetInactivityTimer: () => {
    const { securitySettings } = get();

    /*
      Do nothing when session timeout is disabled.
    */
    if (securitySettings?.sessionTimeoutEnabled === false) {
      clearTimeout(get().inactivityTimer);

      set({
        inactivityTimer: null,
        countdown: 0,
        warningActive: false,
      });

      return;
    }

    console.log("🔄 User activity detected. Resetting session timeout.");

    clearTimeout(get().inactivityTimer);

    set({
      countdown: 0,
      warningActive: false,
    });

    get().startInactivityTimer();
  },

  /* =====================================================
       CLEAR INACTIVITY TIMER
  ===================================================== */

  clearInactivityTimer: () => {
    console.log("🧹 Clearing inactivity timer...");

    clearTimeout(get().inactivityTimer);

    set({
      inactivityTimer: null,
      countdown: 0,
      warningActive: false,
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
             LOAD SECURITY SETTINGS
        =============================================== */

        try {
          console.log("🔐 Loading security settings...");

          const securityResponse = await API.get("/api/settings/security");

          if (
            securityResponse.data?.success &&
            securityResponse.data?.settings
          ) {
            const settings = securityResponse.data.settings;

            set({
              securitySettings: {
                twoFactorEnabled: settings.twoFactorEnabled !== false,

                sessionTimeoutEnabled: settings.sessionTimeoutEnabled !== false,
              },
            });

            console.log("✅ Security settings loaded:", settings);

            /*
              Start inactivity timer after the actual
              security settings have been loaded.
            */
            console.log("🔐 Starting inactivity timer after auth check...");

            get().startInactivityTimer();
          }
        } catch (securityError) {
          console.error(
            "❌ Failed to load security settings:",
            securityError?.response?.data || securityError?.message,
          );

          /*
            Secure defaults remain active.
          */
          set({
            securitySettings: {
              twoFactorEnabled: true,
              sessionTimeoutEnabled: true,
            },
          });

          /*
            Start timer using secure defaults.
          */
          get().startInactivityTimer();
        }

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

          securitySettings: {
            twoFactorEnabled: true,
            sessionTimeoutEnabled: true,
          },
        });

        localStorage.removeItem("user");
      }
    } catch (err) {
      console.error("CHECK AUTH ERROR:", err?.response?.data || err?.message);

      set({
        user: null,

        isAuthenticated: false,

        securitySettings: {
          twoFactorEnabled: true,
          sessionTimeoutEnabled: true,
        },
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

      /*
        Backend decides whether OTP is required.

        If Security > Two-Factor Authentication
        is enabled:
          password → OTP → dashboard

        If disabled:
          password → dashboard
      */

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
           DIRECT LOGIN WHEN 2FA IS DISABLED
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

        otpCode: null,
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

      /*
        Load latest security settings and start
        the inactivity timer.
      */
      try {
        await get().getSecuritySettings();

        console.log("🔐 Starting inactivity timer after login...");

        get().startInactivityTimer();
      } catch (error) {
        console.error(
          "❌ Failed to refresh security settings after login:",
          error,
        );
      }

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

          otpCode: null,
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

        /*
          Refresh security settings and start
          inactivity timer after OTP login.
        */
        try {
          await get().getSecuritySettings();

          console.log("🔐 Starting inactivity timer after OTP login...");

          get().startInactivityTimer();
        } catch (error) {
          console.error(
            "❌ Failed to refresh security settings after OTP login:",
            error,
          );
        }

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
      /*
        IMPORTANT:
        Remove FCM token BEFORE clearing local JWT.
      */

      const pushRemoved = await removeWebPushToken();

      if (pushRemoved) {
        console.log("✅ Web FCM token removed before logout.");
      } else {
        console.warn("⚠️ Web FCM token could not be removed.");
      }

      /* ===============================================
           CLEAR INACTIVITY TIMER
      =============================================== */

      clearTimeout(get().inactivityTimer);

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

        inactivityTimer: null,

        tempEmail: null,

        otpRequired: false,

        otpType: null,

        otpCode: null,

        error: null,

        securitySettings: {
          twoFactorEnabled: true,

          sessionTimeoutEnabled: true,
        },
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

      /*
        ALWAYS CLEAR LOCAL AUTH
      */

      clearTimeout(get().inactivityTimer);

      set({
        user: null,

        isAuthenticated: false,

        countdown: 0,

        warningActive: false,

        inactivityTimer: null,

        tempEmail: null,

        otpRequired: false,

        otpType: null,

        otpCode: null,

        error: null,

        securitySettings: {
          twoFactorEnabled: true,

          sessionTimeoutEnabled: true,
        },
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

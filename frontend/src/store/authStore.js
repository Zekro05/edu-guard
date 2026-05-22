import { create } from "zustand";
import axios from "axios";
import { toast } from "react-hot-toast";



//  ATTACH TOKEN AUTOMATICALLY 
API.interceptors.request.use((config) => {
  const user = JSON.parse(localStorage.getItem("user"));

  if (user?.token) {
    config.headers.Authorization = `Bearer ${user.token}`;
  }

  return config;
});

export const useAuthStore = create((set, get) => ({
  user: null,
  tempEmail: null,
  otpRequired: false,
  otpType: null,
  error: null,
  isLoading: false,

  isAuthenticated: false,
  isCheckingAuth: true,

 autoLogoutTimer: null,
  countdownInterval: null,
  countdown: 0,
  warningActive: false, // NEW: signal to React

 startInactivityTimer: (onLogoutCallback) => {
  clearTimeout(get().inactivityTimer);

  const inactivityMinutes = 10; // 10 minutes
  const warningSeconds = 30;   // show toast when 30 sec left
  let remaining = inactivityMinutes * 60;

  const tick = () => {
    if (remaining === warningSeconds) {
      toast("You will be logged out in 30 seconds due to inactivity", {
        style: { background: "#FBBF24", color: "#000" }
      });
    }

    if (remaining <= 0) {
      get().logout();
      if (onLogoutCallback) onLogoutCallback();
      return;
    }

    set({ countdown: remaining });
    remaining -= 1;
    get().inactivityTimer = setTimeout(tick, 1000);
  };

  tick();
},

  resetInactivityTimer: () => {
    clearTimeout(get().inactivityTimer);
    get().startInactivityTimer();
  },

  clearInactivityTimer: () => {
    const { inactivityInterval } = get();
    if (inactivityInterval) clearInterval(inactivityInterval);
  },

  logout: (callback) => {
    set({ user: null, isAuthenticated: false, countdown: 0, warningActive: false });
    localStorage.removeItem("user");
    if (callback) callback(); // navigate after logout
    toast.success("You have been logged out due to inactivity");
  },

  checkAuth: async () => {
    try {
      set({ isCheckingAuth: true });

      const { data } = await API.get("/api/auth/check-auth");

      if (data.authenticated) {
        set({
          user: data.user,
          isAuthenticated: true,
        });
      } else {
        set({
          user: null,
          isAuthenticated: false,
        });
      }
    } catch (err) {
      set({
        user: null,
        isAuthenticated: false,
      });
    } finally {
      set({ isCheckingAuth: false });
    }
  },

 signup: async (formData) => {
  set({ isLoading: true, error: null });
  try {
    const { data } = await API.post("/api/auth/signup", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    set({
      tempEmail: formData.get("email"),
      otpRequired: true,
      otpType: "signup",
    });
    toast.success(data.message);
  } catch (err) {
    set({ error: err.response?.data?.message || err.message });
    throw err;
  } finally {
    set({ isLoading: false });
  }
},


  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await API.post("/api/auth/login", { email, password });

      if (data.requiresOTP) {
        set({
          tempEmail: email,
          otpRequired: true,
          otpType: "login",
        });
        toast.success("OTP sent to your email");
      } else {
        // ✅ Save both user info AND token
        set({
          user: { ...data.user, token: data.token },
          isAuthenticated: true,
        });
        localStorage.setItem("user", JSON.stringify({ ...data.user, token: data.token }));
        toast.success("Logged in successfully");
      }
    } catch (err) {
      set({ error: err.response?.data?.message || err.message });
      throw err;
    } finally {
      set({ isLoading: false });
    }
  },

  verifyOTP: async (code) => {
    set({ isLoading: true, error: null });
    try {
      const { tempEmail, otpType } = get();
      if (!tempEmail) throw new Error("No email found for OTP verification");

      const url =
        otpType === "signup"
          ? "/api/auth/verify-email"
          : "/api/auth/verify-login-otp";

      const { data } = await API.post(url, { email: tempEmail, code });

      if (otpType === "login") {
        // Only login OTP → set user as authenticated
        set({
          user: { ...data.user, token: data.token },
          isAuthenticated: true,
          otpRequired: false,
          tempEmail: null,
          otpType: null,
        });
        localStorage.setItem("user", JSON.stringify({ ...data.user, token: data.token }));
      } else if (otpType === "signup") {
        set({
          otpRequired: false,
          tempEmail: null,
          otpType: null,
        });
        toast.success("Signup verified! You can now login.");
      }
    } catch (err) {
      set({ error: err.response?.data?.message || err.message });
      throw err;
    } finally {
      set({ isLoading: false });
    }
  },

  logout: async (callback) => {
  try {
    await API.post("/api/auth/logout");
  } catch {}

  set({
    user: null,
    isAuthenticated: false,
    countdown: 0,
    warningActive: false,
  });

  localStorage.removeItem("user");

  if (callback) callback();
  toast.success("Logged out successfully");
},

  resendOTP: async () => {
  set({ isLoading: true, error: null });
  try {
    const { tempEmail, otpType } = get();
    if (!tempEmail) throw new Error("No email found for OTP");

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

    const { data } = await API.post(url, { email: tempEmail });

    toast.success(data.message);
  } catch (err) {
    set({ error: err.response?.data?.message || err.message });
    toast.error(err.response?.data?.message || err.message);
    throw err;
  } finally {
    set({ isLoading: false });
  }
},

  forgotPassword: async (email) => {
    set({ isLoading: true, error: null });
    try {
      await API.post("/api/auth/forgot-password", { email });
      set({ 
      tempEmail: email,
      otpRequired: true,
      otpType: "forgot"   // 🔥 ADD THIS
    });
    } catch (err) {
      toast.error(err.response?.data?.message || err.message);
      throw err;
    } finally {
      set({ isLoading: false });
    }
  },

  verifyForgotPasswordOTP: async (code) => {
  set({ isLoading: true, error: null });
  try {
    const { tempEmail } = get();
    if (!tempEmail) throw new Error("No email found for OTP verification");

    await API.post("/api/auth/verify-forgot-password-otp", {
      email: tempEmail,
      code,
    });

    // store OTP temporarily for reset
    set({ otpRequired: false, otpCode: code });

    toast.success("OTP verified! You can now set your new password.");
  } catch (err) {
    set({ error: err.response?.data?.message || err.message });
    toast.error(err.response?.data?.message || err.message);
    throw err;
  } finally {
    set({ isLoading: false });
  }
},

  resetPassword: async (newPassword) => {
  const { tempEmail, otpCode } = get();

  set({ isLoading: true, error: null });
  try {
    if (!otpCode) throw new Error("OTP not found. Please verify OTP first.");

    await API.post("/api/auth/reset-password", {
      email: tempEmail,
      newPassword,
      code: otpCode,
    });

    // Clear temp data after reset
    set({ tempEmail: null, otpCode: null });

    toast.success("Password reset successfully");
  } catch (err) {
    toast.error(err.response?.data?.message || err.message);
    throw err;
  } finally {
    set({ isLoading: false });
  }
},
}));

import { create } from "zustand";
import { useSocketStore } from "./socketStore";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Alert } from "react-native";
import { Platform } from "react-native";

/* ================= API ================= */
export const API = axios.create({
  baseURL: "https://edu-guard-backend.onrender.com",
});

/* ================= TOKEN CACHE ================= */
let cachedToken = null;

/* ================= SAFE TOKEN SETTER ================= */
const setToken = async (token) => {
  cachedToken = token || null;

  try {
    const storedUser = await AsyncStorage.getItem("user");
    let user = storedUser ? JSON.parse(storedUser) : {};

    const updatedUser = { ...user, token };

    await AsyncStorage.setItem("user", JSON.stringify(updatedUser));

    if (Platform.OS === "web") {
      localStorage.setItem("user", JSON.stringify(updatedUser));
    }
  } catch (err) {
    console.log("setToken error:", err.message);
  }
};

/* ================= TOKEN INTERCEPTOR ================= */
API.interceptors.request.use(async (config) => {
  try {
    if (!config.headers) config.headers = {};

    let token = null;

    const storedUser = await AsyncStorage.getItem("user");

    if (storedUser) {
      const user = JSON.parse(storedUser);
      token = user?.token;
    }

    if (!token) token = cachedToken;

    if (!token && Platform.OS === "web") {
      const storedUserWeb = localStorage.getItem("user");
      const user = storedUserWeb ? JSON.parse(storedUserWeb) : null;
      token = user?.token;
    }

    if (token) {
      cachedToken = token;
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  } catch (err) {
    console.log("Interceptor error:", err.message);
    return config;
  }
});

/* ================= SOCKET SAFE ================= */
let socketConnected = false;

const connectSocketSafely = (userId) => {
  try {
    const socketStore = useSocketStore?.getState?.();
    if (!socketStore?.connectSocket) return;

    if (!socketConnected && userId) {
      socketConnected = true;
      socketStore.connectSocket(userId);
    }
  } catch (err) {
    console.log("Socket error:", err.message);
  }
};

/* ================= STORE ================= */
export const useAuthStore = create((set, get) => ({
  user: null,
  tempEmail: null,
  otpRequired: false,
  otpType: null,
  error: null,
  isLoading: false,
  isAuthenticated: false,
  isCheckingAuth: true,
  studentData: null,
  otpCode: null,

  /* ================= CHECK AUTH ================= */
  checkAuth: async () => {
    try {
      set({ isCheckingAuth: true });

      const storedUser = await AsyncStorage.getItem("user");

      if (!storedUser) {
        cachedToken = null;
        set({ user: null, isAuthenticated: false });
        return;
      }

      const parsedUser = JSON.parse(storedUser);
      cachedToken = parsedUser?.token || null;

      const { data } = await API.get("/api/auth/check-auth");

      if (data.authenticated) {
        let userData = {
          _id: data.user._id,
          email: data.user.email,
          role: data.user.role,
          token: data.token,
        };

        // Only students have a Student document
        if (data.user.role === "student") {
          try {
            const { data: student } = await API.get(
              `/api/students/${data.user.studentId}`,
            );

            userData = {
              ...userData,

              firstName: student.firstName,
              middleName: student.middleName,
              lastName: student.lastName,
              name: `${student.firstName} ${student.lastName}`,

              studentId: student.studentId,
              grade: student.grade,
              phone: student.phone,
              profilePhoto: student.profilePhoto || "",
            };
          } catch (err) {
            console.log("Student fetch failed:", err.message);
          }
        } else {
          // Admin / Teacher
          userData = {
            ...userData,

            firstName: data.user.firstName,
            middleName: data.user.middleName,
            lastName: data.user.lastName,
            name: data.user.name,

            profilePhoto: data.user.profilePhoto || "",
            employeeId: data.user.employeeId || null,
            department: data.user.department || null,
          };
        }

        set({
          user: userData,
          isAuthenticated: true,
        });

        await AsyncStorage.setItem("user", JSON.stringify(userData));
        connectSocketSafely(userData._id);
      } else {
        cachedToken = null;
        await AsyncStorage.removeItem("user");
        set({ user: null, isAuthenticated: false });
      }
    } catch (err) {
      cachedToken = null;
      await AsyncStorage.removeItem("user");
      set({ user: null, isAuthenticated: false });
    } finally {
      set({ isCheckingAuth: false });
    }
  },

  /* ================= LOGIN ================= */
  mobileLogin: async (email, password, accountType) => {
    set({ isLoading: true, error: null });

    try {
      const { data } = await API.post("/api/auth/mobile-login", {
        email,
        password,
        accountType,
      });

      if (data.requiresOTP && data.success !== false) {
        set({
          tempEmail: email,
          otpRequired: true,
          otpType: "login",
        });

        return { success: true, requiresOTP: true };
      }

      let userData = {
        _id: data.user._id,
        email: data.user.email,
        role: data.user.role,
        token: data.token,
      };

      if (data.user.role === "student") {
        try {
          const studentRes = await API.get(
            `/api/students/${data.user.studentId}`,
          );

          const student = studentRes.data;

          userData = {
            ...userData,

            firstName: student.firstName,
            middleName: student.middleName,
            lastName: student.lastName,

            name: `${student.firstName} ${student.lastName}`,

            studentId: student.studentId,
            grade: student.grade,
            phone: student.phone,
            profilePhoto: student.profilePhoto || "",
          };
        } catch (err) {
          console.log(err.message);
        }
      }

      cachedToken = data.token;

      await setToken(data.token);

      set({
        user: userData,
        isAuthenticated: true,
        otpRequired: false,
        tempEmail: null,
      });

      await AsyncStorage.setItem("user", JSON.stringify(userData));

      connectSocketSafely(userData._id);

      return { success: true };
    } catch (err) {
      return {
        success: false,
        error: err.response?.data?.message || err.message,
      };
    } finally {
      set({ isLoading: false });
    }
  },

  /* ================= VERIFY OTP ================= */
  verifyOTP: async (code) => {
    set({ isLoading: true, error: null });

    try {
      const { tempEmail, otpType } = get();

      if (!tempEmail) throw new Error("No email found.");

      const url =
        otpType === "signup"
          ? "/api/auth/verify-email"
          : "/api/auth/verify-mobile-login-otp";

      const payload =
        otpType === "signup"
          ? { email: tempEmail, code, client: "mobile" }
          : { email: tempEmail, code };

      const { data } = await API.post(url, payload);

      let userData = {
        _id: data.user._id,
        email: data.user.email,
        role: data.user.role,
        token: data.token,
      };

      if (data.user.role === "student") {
        try {
          const studentRes = await API.get(
            `/api/students/${data.user.studentId}`,
          );

          const student = studentRes.data;

          userData = {
            ...userData,

            firstName: student.firstName,
            middleName: student.middleName,
            lastName: student.lastName,

            name: `${student.firstName} ${student.lastName}`,

            studentId: student.studentId,
            grade: student.grade,
            phone: student.phone,
            profilePhoto: student.profilePhoto || "",
          };
        } catch (err) {
          console.log(err.message);
        }
      }

      cachedToken = data.token;

      set({
        user: userData,
        isAuthenticated: true,
        otpRequired: false,
        tempEmail: null,
        otpType: null,
      });

      await AsyncStorage.setItem("user", JSON.stringify(userData));

      setTimeout(() => {
        connectSocketSafely(userData._id);
      }, 150);

      Alert.alert("Success", "Login verified!");

      return {
        verified: true,
        role: userData.role,
      };
    } catch (err) {
      const msg = err.response?.data?.message || err.message;
      set({ error: msg });

      return { verified: false, error: msg };
    } finally {
      set({ isLoading: false });
    }
  },

  /* ================= RESEND OTP ================= */
  resendOTP: async () => {
    set({ isLoading: true, error: null });

    try {
      const { tempEmail, otpType } = get();

      if (!tempEmail) throw new Error("No email found.");

      const url =
        otpType === "signup"
          ? "/api/auth/resend-email-otp"
          : "/api/auth/resend-login-otp";

      await API.post(url, { email: tempEmail });

      return { success: true };
    } catch (err) {
      const msg = err.response?.data?.message || err.message;
      set({ error: msg });

      return { success: false, error: msg };
    } finally {
      set({ isLoading: false });
    }
  },

  /* ================= LOGOUT ================= */
  logout: async () => {
    cachedToken = null;
    socketConnected = false;

    await AsyncStorage.removeItem("user");

    set({
      user: null,
      isAuthenticated: false,
      tempEmail: null,
      otpRequired: false,
    });

    return { success: true };
  },

  /* ================= STUDENT DATA ================= */
  fetchStudentData: async () => {
  try {
    const { user } = get();

    if (!user?.studentId) return;

    const { data } = await API.get(`/api/students/${user.studentId}`);

    set({
      studentData: data,

      user: {
        ...user,

        firstName: data.firstName,
        middleName: data.middleName,
        lastName: data.lastName,

        name: `${data.firstName} ${data.lastName}`,

        studentId: data.studentId,
        grade: data.grade,
        phone: data.phone,
        profilePhoto: data.profilePhoto,
      },
    });
  } catch (err) {
    console.log(err.message);
  }
},

  /* ================= SIGNUP ================= */
  signup: async (formData) => {
    set({ isLoading: true });

    try {
      const email = formData.email;

      await API.post("/api/auth/signup", formData);

      set({
        otpRequired: true,
        otpType: "signup",
        tempEmail: email,
      });

      return { success: true };
    } catch (err) {
      return {
        success: false,
        error: err.response?.data?.message || err.message,
      };
    } finally {
      set({ isLoading: false });
    }
  },

  forgotPassword: async (email) => {
    set({ isLoading: true, error: null });

    try {
      const { data } = await API.post("/api/auth/forgot-password", { email });

      set({ tempEmail: email });

      return { success: true, data };
    } catch (err) {
      const msg = err.response?.data?.message || err.message || "Server error";

      console.log("Forgot Password Error:", err.response?.data || err);

      set({ error: msg });

      return { success: false, error: msg };
    } finally {
      set({ isLoading: false });
    }
  },

  verifyForgotPasswordOTP: async (code) => {
    set({ isLoading: true });
    try {
      const { tempEmail } = get();

      await API.post("/api/auth/verify-forgot-password-otp", {
        email: tempEmail,
        code,
      });

      set({ otpCode: code });
      Alert.alert("Success");
    } finally {
      set({ isLoading: false });
    }
  },

  changePassword: async (oldPassword, newPassword) => {
    set({ isLoading: true, error: null });

    try {
      const { data } = await API.post("/api/auth/change-password", {
        oldPassword,
        newPassword,
      });

      return { success: true, message: data.message };
    } catch (err) {
      const msg = err.response?.data?.message || err.message;

      set({ error: msg });
      Alert.alert("Error", msg);

      return { success: false, error: msg };
    } finally {
      set({ isLoading: false });
    }
  },

  resetPassword: async (newPassword) => {
    const { tempEmail, otpCode } = get();

    try {
      const { data } = await API.post("/api/auth/reset-password", {
        email: tempEmail,
        newPassword,
        code: otpCode,
      });

      return { success: true, data };
    } catch (err) {
      return {
        success: false,
        error: err.response?.data?.message || err.message,
      };
    }
  },
}));

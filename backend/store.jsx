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

  // Update Axios authorization
  if (token) {
    API.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    delete API.defaults.headers.common.Authorization;
  }

  try {
    const storedUser = await AsyncStorage.getItem("user");

    const user = storedUser ? JSON.parse(storedUser) : {};

    const updatedUser = {
      ...user,
      token: token || null,
    };

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
  teacherData: null,
  otpCode: null,

  /* ================= CHECK AUTH ================= */
  checkAuth: async () => {
    try {
      set({ isCheckingAuth: true });

      const storedUser = await AsyncStorage.getItem("user");

      if (!storedUser) {
        cachedToken = null;

        set({
          user: null,
          studentData: null,
          teacherData: null,
          isAuthenticated: false,
        });

        return;
      }

      const parsedUser = JSON.parse(storedUser);

      // Restore saved token
      cachedToken = parsedUser?.token || null;

      if (!cachedToken) {
        console.log("No saved token found.");

        await AsyncStorage.removeItem("user");

        set({
          user: null,
          studentData: null,
          teacherData: null,
          isAuthenticated: false,
        });

        return;
      }

      // =========================================================
      // CHECK AUTHENTICATION
      // =========================================================

      const { data } = await API.get("/api/auth/check-auth");

      if (!data.authenticated || !data.user) {
        console.log("Saved token is no longer valid.");

        cachedToken = null;

        await AsyncStorage.removeItem("user");

        set({
          user: null,
          studentData: null,
          teacherData: null,
          isAuthenticated: false,
        });

        return;
      }

      // =========================================================
      // BASIC USER DATA
      // =========================================================

      let userData = {
        _id: data.user._id,
        email: data.user.email,
        role: data.user.role,
        token: parsedUser.token,
        studentId: data.user.studentId,
        employeeId: data.user.employeeId,
      };

      let studentData = null;
      let teacherData = null;

      // =========================================================
      // STUDENT PROFILE
      // =========================================================

      if (data.user.role === "student") {
        try {
          if (data.user.studentId) {
            const { data: student } = await API.get(
              `/api/students/${data.user.studentId}`,
            );

            studentData = student;

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
          }
        } catch (err) {
          console.log(
            "Student profile fetch failed:",
            err.response?.data || err.message,
          );
        }
      }

      // =========================================================
      // TEACHER PROFILE
      // =========================================================
      else if (data.user.role === "teacher") {
        try {
          if (data.user.employeeId) {
            const { data: teacher } = await API.get(
              `/api/teacher-reports/${data.user.employeeId}`,
            );

            teacherData = teacher;

            userData = {
              ...userData,

              firstName: teacher.firstName,
              middleName: teacher.middleName,
              lastName: teacher.lastName,

              name: `${teacher.firstName} ${teacher.lastName}`,

              employeeId: teacher.employeeId,
              department: teacher.department,
              phone: teacher.phone,
              profilePhoto: teacher.profilePhoto || "",
            };
          }
        } catch (err) {
          // IMPORTANT:
          // Do NOT logout if teacher profile fetching fails.
          console.log(
            "Teacher profile fetch failed:",
            err.response?.data || err.message,
          );
        }
      }

      // =========================================================
      // RESTORE USER
      // =========================================================

      set({
        user: userData,
        studentData,
        teacherData,
        isAuthenticated: true,
      });

      // Keep the user and token saved
      await AsyncStorage.setItem("user", JSON.stringify(userData));

      connectSocketSafely(userData._id);
    } catch (err) {
      console.log(
        "CHECK AUTH ERROR:",
        err.response?.status,
        err.response?.data || err.message,
      );

      // Only logout when the server says the token is invalid
      if (err.response?.status === 401) {
        cachedToken = null;

        await AsyncStorage.removeItem("user");

        set({
          user: null,
          studentData: null,
          teacherData: null,
          isAuthenticated: false,
        });
      } else {
        // Keep the user logged in if the problem is
        // network/server/profile fetching.
        set({
          isAuthenticated: true,
        });
      }
    } finally {
      set({
        isCheckingAuth: false,
      });
    }
  },

  cancelOTP: () =>
    set({
      tempEmail: null,
      otpCode: null,
      otpRequired: false,
      otpType: null,
      error: null,
    }),

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

      // =========================================================
      // SAVE TOKEN IMMEDIATELY
      // =========================================================

      cachedToken = data.token;

      await setToken(data.token);

      let userData = {
        _id: data.user._id,
        email: data.user.email,
        role: data.user.role,
        token: data.token,
        studentId: data.user.studentId,
        employeeId: data.user.employeeId,
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
      } else if (data.user.role === "teacher") {
        try {
          const teacherRes = await API.get(
            `/api/teacher-reports/${data.user.employeeId}`,
          );

          const teacherData = teacherRes.data;

          userData = {
            ...userData,

            firstName: teacherData.firstName,
            middleName: teacherData.middleName,
            lastName: teacherData.lastName,

            name: `${teacherData.firstName} ${teacherData.lastName}`,

            employeeId: teacherData.employeeId,
            department: teacherData.department,
            phone: teacherData.phone,
            profilePhoto: teacherData.profilePhoto || "",
          };
        } catch (err) {
          console.log(err.message);
        }
      }

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

      // Save the token FIRST
      cachedToken = data.token;
      await setToken(data.token);

      let userData = {
        _id: data.user._id,
        email: data.user.email,
        role: data.user.role,
        token: data.token,
      };

      let studentData = null;
      let teacherData = null;

      if (data.user.role === "student") {
        try {
          const studentRes = await API.get(
            `/api/students/${data.user.studentId}`,
          );

          studentData = studentRes.data;

          userData = {
            ...userData,

            firstName: studentData.firstName,
            middleName: studentData.middleName,
            lastName: studentData.lastName,

            name: `${studentData.firstName} ${studentData.lastName}`,

            studentId: studentData.studentId,
            grade: studentData.grade,
            phone: studentData.phone,
            profilePhoto: studentData.profilePhoto || "",
          };
        } catch (err) {
          console.log(err.message);
        }
      } else if (data.user.role === "teacher") {
        try {
          const teacherRes = await API.get(
            `/api/teacher-reports/${data.user.employeeId}`,
          );

          teacherData = teacherRes.data;

          userData = {
            ...userData,

            firstName: teacherData.firstName,
            middleName: teacherData.middleName,
            lastName: teacherData.lastName,

            name: `${teacherData.firstName} ${teacherData.lastName}`,

            employeeId: teacherData.employeeId,
            department: teacherData.department,
            phone: teacherData.phone,
            profilePhoto: teacherData.profilePhoto || "",
          };
        } catch (err) {
          console.log(err.message);
        }
      }

      set({
        user: userData,
        studentData,
        teacherData,
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
    try {
      // Clear cached token
      cachedToken = null;

      // Reset socket status
      socketConnected = false;

      // Remove Axios authorization
      delete API.defaults.headers.common.Authorization;

      // Remove saved login
      await AsyncStorage.removeItem("user");

      // Also clear web storage
      if (Platform.OS === "web") {
        localStorage.removeItem("user");
      }

      set({
        user: null,
        studentData: null,
        teacherData: null,
        isAuthenticated: false,
        tempEmail: null,
        otpRequired: false,
        otpType: null,
        otpCode: null,
        error: null,
      });

      return { success: true };
    } catch (err) {
      console.log("Logout error:", err.message);

      return {
        success: false,
        error: err.message,
      };
    }
  },

  /* ================= STUDENT DATA ================= */
  fetchStudentData: async () => {
    try {
      const { user } = get();

      if (!user?.studentId) return;

      const { data } = await API.get(`/api/students/${user.studentId}`);

      const updatedUser = {
        ...user,

        firstName: data.firstName,
        middleName: data.middleName,
        lastName: data.lastName,

        name: `${data.firstName} ${data.lastName}`,

        studentId: data.studentId,
        grade: data.grade,
        phone: data.phone,
        profilePhoto: data.profilePhoto || "",
      };

      set({
        studentData: data,
        user: updatedUser,
      });

      await AsyncStorage.setItem("user", JSON.stringify(updatedUser));
    } catch (err) {
      console.log(
        "Fetch student data error:",
        err.response?.data || err.message,
      );
    }
  },

  /* ================= TEACHER DATA ================= */
  fetchTeacherData: async () => {
    try {
      const { user } = get();

      if (!user?.employeeId) return;

      const { data } = await API.get(`/api/teacher-reports/${user.employeeId}`);

      const updatedUser = {
        ...user,

        firstName: data.firstName,
        middleName: data.middleName,
        lastName: data.lastName,

        name: `${data.firstName} ${data.lastName}`,

        employeeId: data.employeeId,
        department: data.department,
        phone: data.phone,
        profilePhoto: data.profilePhoto || "",
      };

      set({
        teacherData: data,
        user: updatedUser,
      });

      await AsyncStorage.setItem("user", JSON.stringify(updatedUser));
    } catch (err) {
      console.log(
        "Fetch teacher data error:",
        err.response?.data || err.message,
      );
    }
  } /* ================= UPDATE STUDENT PROFILE ================= */,
  updateStudentProfile: async (profileData) => {
    try {
      const response = await API.put("/api/students/profile", profileData);

      if (response.data?.success) {
        const updatedStudent = response.data.student;

        const currentUser = get().user;

        const updatedUser = {
          ...currentUser,
          ...updatedStudent,
          name: `${updatedStudent.firstName} ${updatedStudent.lastName}`,
        };

        set({
          studentData: updatedStudent,
          user: updatedUser,
        });

        await AsyncStorage.setItem("user", JSON.stringify(updatedUser));

        return {
          success: true,
          student: updatedStudent,
        };
      }

      return {
        success: false,
        error: response.data?.message || "Failed to update profile.",
      };
    } catch (error) {
      console.error(
        "UPDATE STUDENT PROFILE ERROR:",
        error?.response?.data || error,
      );

      return {
        success: false,
        error: error?.response?.data?.message || "Failed to update profile.",
      };
    }
  },

  /* ================= UPDATE TEACHER PROFILE ================= */
  updateTeacherProfile: async (profileData) => {
    try {
      const response = await API.put("/api/teacher-reports/profile", profileData);

      if (response.data?.success) {
        const updatedTeacher = response.data.teacher;

        const currentUser = get().user;

        const updatedUser = {
          ...currentUser,
          ...updatedTeacher,
          name: `${updatedTeacher.firstName} ${updatedTeacher.lastName}`,
        };

        set({
          teacherData: updatedTeacher,
          user: updatedUser,
        });

        await AsyncStorage.setItem("user", JSON.stringify(updatedUser));

        return {
          success: true,
          teacher: updatedTeacher,
        };
      }

      return {
        success: false,
        error: response.data?.message || "Failed to update teacher profile.",
      };
    } catch (error) {
      console.error(
        "UPDATE TEACHER PROFILE ERROR:",
        error?.response?.data || error,
      );

      return {
        success: false,
        error:
          error?.response?.data?.message || "Failed to update teacher profile.",
      };
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

      // Clear password-reset state after successful reset
      set({
        tempEmail: null,
        otpCode: null,
        otpRequired: false,
        otpType: null,
        error: null,
      });

      return {
        success: true,
        data,
      };
    } catch (err) {
      return {
        success: false,
        error: err.response?.data?.message || err.message,
      };
    }
  },
}));

import { create } from "zustand";
import { useSocketStore } from "./socketStore";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Alert, Platform } from "react-native";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import Constants from "expo-constants";

/* =========================================================
   API
========================================================= */

export const API = axios.create({
  baseURL: "https://edu-guard-backend.onrender.com",
});

/* =========================================================
   TOKEN CACHE
========================================================= */

let cachedToken = null;

/* =========================================================
   PUSH NOTIFICATIONS
========================================================= */

/*
  Controls how notifications behave while the app
  is currently open.
*/
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

/* =========================================================
   REGISTER PUSH NOTIFICATIONS
========================================================= */

const registerForPushNotificationsAsync = async () => {
  try {
    if (Platform.OS === "web") {
      console.log("Push notifications are not supported on web.");
      return null;
    }

    /* ================= ANDROID CHANNEL ================= */

    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("default", {
        name: "EduGuard Notifications",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        sound: "default",
      });
    }

    /* ================= CHECK PERMISSION ================= */

    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();

    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();

      finalStatus = status;
    }

    if (finalStatus !== "granted") {
      console.log("❌ Push notification permission denied.");
      return null;
    }

    /* ================= GET PROJECT ID ================= */

    const projectId =
      Constants?.expoConfig?.extra?.eas?.projectId ??
      Constants?.easConfig?.projectId;

    if (!projectId) {
      console.log("❌ Expo projectId not found.");
      return null;
    }

    /* ================= GET EXPO TOKEN ================= */

    const token = (
      await Notifications.getExpoPushTokenAsync({
        projectId,
      })
    ).data;

    console.log("====================================");
    console.log("📱 EXPO PUSH TOKEN:");
    console.log(token);
    console.log("====================================");

    return token;
  } catch (error) {
    console.error("❌ PUSH NOTIFICATION REGISTRATION ERROR:", error);

    return null;
  }
};

/* =========================================================
   SAVE PUSH TOKEN TO BACKEND
========================================================= */

const savePushTokenToBackend = async () => {
  try {
    const token = await registerForPushNotificationsAsync();

    if (!token) {
      console.log("⚠️ No Expo push token available.");
      return false;
    }

    await API.post("/api/auth/save-push-token", {
      expoPushToken: token,
    });

    console.log("✅ Expo push token saved to backend.");

    return true;
  } catch (error) {
    console.error(
      "❌ SAVE PUSH TOKEN ERROR:",
      error.response?.data || error.message,
    );

    return false;
  }
};

/* =========================================================
   SOCKET
========================================================= */

let socketConnected = false;

/* =========================================================
   SET TOKEN
========================================================= */

const setToken = async (token) => {
  cachedToken = token || null;

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
  } catch (error) {
    console.log("SET TOKEN ERROR:", error.message);
  }
};

/* =====================================================
   REMOVE EXPO PUSH TOKEN
===================================================== */

const removePushTokenFromBackend = async () => {
  try {
    await API.delete("/api/auth/remove-push-token");

    console.log("✅ Expo push token removed from backend.");

    return true;
  } catch (error) {
    console.error(
      "❌ REMOVE EXPO PUSH TOKEN ERROR:",
      error.response?.data || error.message,
    );

    return false;
  }
};

/* =========================================================
   AXIOS TOKEN INTERCEPTOR
========================================================= */

API.interceptors.request.use(async (config) => {
  try {
    if (!config.headers) {
      config.headers = {};
    }

    let token = cachedToken;

    if (!token) {
      const storedUser = await AsyncStorage.getItem("user");

      if (storedUser) {
        const user = JSON.parse(storedUser);

        token = user?.token || null;
      }
    }

    if (token) {
      cachedToken = token;

      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  } catch (error) {
    console.log("INTERCEPTOR ERROR:", error.message);

    return config;
  }
});

/* =========================================================
   SOCKET CONNECTION
========================================================= */

const connectSocketSafely = (userId) => {
  try {
    const socketStore = useSocketStore?.getState?.();

    if (!socketStore?.connectSocket) {
      return;
    }

    if (!socketConnected && userId) {
      socketConnected = true;

      socketStore.connectSocket(userId);
    }
  } catch (error) {
    console.log("SOCKET ERROR:", error.message);
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

  error: null,

  isLoading: false,

  isAuthenticated: false,

  isCheckingAuth: true,

  studentData: null,

  teacherData: null,

  otpCode: null,

  /* =====================================================
       CHECK AUTH
    ===================================================== */

  /* =====================================================
   SAVE EXPO PUSH TOKEN
===================================================== */

  saveExpoPushToken: async (expoPushToken) => {
    try {
      if (!expoPushToken) {
        console.log("⚠️ No Expo push token provided.");

        return {
          success: false,
          error: "No Expo push token.",
        };
      }

      await API.post("/api/auth/save-push-token", {
        expoPushToken,
      });

      console.log("✅ Expo push token saved.");

      return {
        success: true,
      };
    } catch (error) {
      console.error(
        "SAVE EXPO PUSH TOKEN ERROR:",
        error.response?.data || error.message,
      );

      return {
        success: false,
        error:
          error.response?.data?.message ||
          error.message ||
          "Failed to save push token.",
      };
    }
  },

  removeExpoPushToken: async () => {
  try {
    await API.delete("/api/auth/remove-push-token");

    console.log("✅ Expo push token removed from backend.");

    return {
      success: true,
    };
  } catch (error) {
    console.error(
      "REMOVE EXPO PUSH TOKEN ERROR:",
      error.response?.data || error.message,
    );

    return {
      success: false,
      error:
        error.response?.data?.message ||
        error.message ||
        "Failed to remove push token.",
    };
  }
},

  checkAuth: async () => {
    try {
      set({
        isCheckingAuth: true,
      });

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

      cachedToken = parsedUser?.token || null;

      if (!cachedToken) {
        console.log("NO SAVED TOKEN FOUND.");

        await AsyncStorage.removeItem("user");

        set({
          user: null,
          studentData: null,
          teacherData: null,
          isAuthenticated: false,
        });

        return;
      }

      /* =================================================
           CHECK TOKEN
        ================================================= */

      const { data } = await API.get("/api/auth/check-auth");

      if (!data.authenticated || !data.user) {
        console.log("SAVED TOKEN IS NO LONGER VALID.");

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

      /* =================================================
           BASIC USER DATA
        ================================================= */

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

      /* =================================================
           STUDENT
        ================================================= */

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
        } catch (error) {
          console.log(
            "STUDENT PROFILE FETCH FAILED:",
            error.response?.data || error.message,
          );
        }
      } else if (data.user.role === "teacher") {
        /* =================================================
           TEACHER
        ================================================= */
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
        } catch (error) {
          console.log(
            "TEACHER PROFILE FETCH FAILED:",
            error.response?.data || error.message,
          );
        }
      }

      /* =================================================
           RESTORE
        ================================================= */

      set({
        user: userData,

        studentData,

        teacherData,

        isAuthenticated: true,
      });

      await AsyncStorage.setItem("user", JSON.stringify(userData));

      connectSocketSafely(userData._id);

      setTimeout(() => {
        savePushTokenToBackend();
      }, 500);
    } catch (error) {
      console.log(
        "CHECK AUTH ERROR:",
        error.response?.status,
        error.response?.data || error.message,
      );

      if (error.response?.status === 401) {
        cachedToken = null;

        await AsyncStorage.removeItem("user");

        set({
          user: null,
          studentData: null,
          teacherData: null,
          isAuthenticated: false,
        });
      } else {
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

  /* =====================================================
       CANCEL OTP
    ===================================================== */

  cancelOTP: () =>
    set({
      tempEmail: null,
      otpCode: null,
      otpRequired: false,
      otpType: null,
      error: null,
    }),

  /* =====================================================
       LOGIN
    ===================================================== */

  mobileLogin: async (email, password, accountType) => {
    set({
      isLoading: true,
      error: null,
    });

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

        return {
          success: true,
          requiresOTP: true,
        };
      }

      /* =================================================
           SAVE TOKEN
        ================================================= */

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

      /* =================================================
           STUDENT
        ================================================= */

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
        } catch (error) {
          console.log("STUDENT PROFILE ERROR:", error.message);
        }
      } else if (data.user.role === "teacher") {
        /* =================================================
           TEACHER
        ================================================= */
        try {
          const teacherRes = await API.get(
            `/api/teacher-reports/${data.user.employeeId}`,
          );

          const teacher = teacherRes.data;

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
        } catch (error) {
          console.log("TEACHER PROFILE ERROR:", error.message);
        }
      }

      /* =================================================
           SAVE USER
        ================================================= */

      set({
        user: userData,

        isAuthenticated: true,

        otpRequired: false,

        tempEmail: null,
      });

      await AsyncStorage.setItem("user", JSON.stringify(userData));

      connectSocketSafely(userData._id);

      setTimeout(() => {
        savePushTokenToBackend();
      }, 500);

      return {
        success: true,
      };
    } catch (error) {
      return {
        success: false,

        error: error.response?.data?.message || error.message,
      };
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
        throw new Error("No email found.");
      }

      const url =
        otpType === "signup"
          ? "/api/auth/verify-email"
          : "/api/auth/verify-mobile-login-otp";

      const payload =
        otpType === "signup"
          ? {
              email: tempEmail,
              code,
              client: "mobile",
            }
          : {
              email: tempEmail,
              code,
            };

      const { data } = await API.post(url, payload);

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

      /* =================================================
           STUDENT
        ================================================= */

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
        } catch (error) {
          console.log("STUDENT OTP PROFILE ERROR:", error.message);
        }
      } else if (data.user.role === "teacher") {
        /* =================================================
           TEACHER
        ================================================= */
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
        } catch (error) {
          console.log("TEACHER OTP PROFILE ERROR:", error.message);
        }
      }

      /* =================================================
           SAVE
        ================================================= */

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

      setTimeout(() => {
        savePushTokenToBackend();
      }, 700);

      Alert.alert("Success", "Login verified!");

      return {
        verified: true,
        role: userData.role,
      };
    } catch (error) {
      const message = error.response?.data?.message || error.message;

      set({
        error: message,
      });

      return {
        verified: false,
        error: message,
      };
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
        throw new Error("No email found.");
      }

      const url =
        otpType === "signup"
          ? "/api/auth/resend-email-otp"
          : "/api/auth/resend-login-otp";

      await API.post(url, {
        email: tempEmail,
      });

      return {
        success: true,
      };
    } catch (error) {
      const message = error.response?.data?.message || error.message;

      set({
        error: message,
      });

      return {
        success: false,
        error: message,
      };
    } finally {
      set({
        isLoading: false,
      });
    }
  },

  /* =====================================================
       LOGOUT
    ===================================================== */

  logout: async () => {
  try {
    /* =================================================
       REMOVE PUSH TOKEN FIRST
    ================================================= */

    try {
      await API.delete("/api/auth/remove-push-token");

      console.log("✅ Push token removed before logout.");
    } catch (pushError) {
      console.error(
        "⚠️ FAILED TO REMOVE PUSH TOKEN:",
        pushError.response?.data || pushError.message,
      );
    }

    /* =================================================
       DISCONNECT SOCKET
    ================================================= */

    try {
      const socketStore = useSocketStore?.getState?.();

      if (socketStore?.disconnectSocket) {
        socketStore.disconnectSocket();
      }
    } catch (socketError) {
      console.log(
        "SOCKET DISCONNECT ERROR:",
        socketError.message,
      );
    }

    socketConnected = false;

    /* =================================================
       CLEAR AUTH
    ================================================= */

    cachedToken = null;

    delete API.defaults.headers.common.Authorization;

    await AsyncStorage.removeItem("user");

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

    return {
      success: true,
    };
  } catch (error) {
    console.log("LOGOUT ERROR:", error.message);

    return {
      success: false,
      error: error.message,
    };
  }
},

  /* =====================================================
       FETCH STUDENT DATA
    ===================================================== */

  fetchStudentData: async () => {
    try {
      const { user } = get();

      if (!user?.studentId) {
        return;
      }

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
    } catch (error) {
      console.log(
        "FETCH STUDENT DATA ERROR:",
        error.response?.data || error.message,
      );
    }
  },

  /* =====================================================
       FETCH TEACHER DATA
    ===================================================== */

  fetchTeacherData: async () => {
    try {
      const { user } = get();

      if (!user?.employeeId) {
        return;
      }

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
    } catch (error) {
      console.log(
        "FETCH TEACHER DATA ERROR:",
        error.response?.data || error.message,
      );
    }
  },

  /* =====================================================
       UPDATE STUDENT PROFILE
    ===================================================== */

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
        error.response?.data || error,
      );

      return {
        success: false,

        error:
          error.response?.data?.message ||
          error.message ||
          "Failed to update profile.",
      };
    }
  },

  /* =====================================================
       UPDATE STUDENT PROFILE PHOTO
       
       ANDROID + IOS
    ===================================================== */

  updateStudentProfilePhoto: async (asset) => {
    try {
      if (!asset?.uri) {
        return {
          success: false,
          error: "No image selected.",
        };
      }

      const formData = new FormData();

      const uri = asset.uri;

      const fileName = asset.fileName || `profile-photo-${Date.now()}.jpg`;

      const mimeType = asset.mimeType || "image/jpeg";

      formData.append("profilePhoto", {
        uri: uri,
        name: fileName,
        type: mimeType,
      });

      const response = await API.put("/api/students/profile/photo", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if (response.data?.success) {
        const profilePhoto = response.data.profilePhoto;

        const currentUser = get().user;

        const currentStudent = get().studentData;

        const updatedUser = {
          ...currentUser,

          profilePhoto,
        };

        const updatedStudent = {
          ...currentStudent,

          profilePhoto,
        };

        set({
          user: updatedUser,

          studentData: updatedStudent,
        });

        await AsyncStorage.setItem("user", JSON.stringify(updatedUser));

        return {
          success: true,
          profilePhoto,
        };
      }

      return {
        success: false,

        error: response.data?.message || "Failed to update profile photo.",
      };
    } catch (error) {
      console.error(
        "UPDATE STUDENT PROFILE PHOTO ERROR:",
        error.response?.data || error,
      );

      return {
        success: false,

        error:
          error.response?.data?.message ||
          error.message ||
          "Failed to update profile photo.",
      };
    }
  },

  /* =====================================================
       UPDATE TEACHER PROFILE
    ===================================================== */

  updateTeacherProfile: async (profileData) => {
    try {
      const response = await API.put(
        "/api/teacher-reports/profile",
        profileData,
      );

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
        error.response?.data || error,
      );

      return {
        success: false,

        error:
          error.response?.data?.message || "Failed to update teacher profile.",
      };
    }
  },

  /* =====================================================
       UPDATE TEACHER PROFILE PHOTO
    ===================================================== */

  updateTeacherProfilePhoto: async (asset) => {
    try {
      if (!asset?.uri) {
        return {
          success: false,
          error: "No image selected.",
        };
      }

      const formData = new FormData();

      formData.append("profilePhoto", {
        uri: asset.uri,

        name: asset.fileName || `profile-photo-${Date.now()}.jpg`,

        type: asset.mimeType || "image/jpeg",
      });

      const response = await API.put(
        "/api/teacher-reports/profile/photo",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        },
      );

      if (response.data?.success) {
        const profilePhoto = response.data.profilePhoto;

        const currentUser = get().user;

        const updatedUser = {
          ...currentUser,

          profilePhoto,
        };

        set({
          user: updatedUser,

          teacherData: {
            ...get().teacherData,

            profilePhoto,
          },
        });

        await AsyncStorage.setItem("user", JSON.stringify(updatedUser));

        return {
          success: true,

          profilePhoto,
        };
      }

      return {
        success: false,

        error: response.data?.message || "Failed to update profile photo.",
      };
    } catch (error) {
      console.error(
        "UPDATE TEACHER PROFILE PHOTO ERROR:",
        error.response?.data || error,
      );

      return {
        success: false,

        error:
          error.response?.data?.message ||
          error.message ||
          "Failed to update profile photo.",
      };
    }
  },

  /* =====================================================
       SIGNUP
    ===================================================== */

  signup: async (formData) => {
    set({
      isLoading: true,
    });

    try {
      const email = formData.email;

      await API.post("/api/auth/signup", formData);

      set({
        otpRequired: true,

        otpType: "signup",

        tempEmail: email,
      });

      return {
        success: true,
      };
    } catch (error) {
      return {
        success: false,

        error: error.response?.data?.message || error.message,
      };
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
      const { data } = await API.post("/api/auth/forgot-password", {
        email,
      });

      set({
        tempEmail: email,
      });

      return {
        success: true,
        data,
      };
    } catch (error) {
      const message =
        error.response?.data?.message || error.message || "Server error";

      set({
        error: message,
      });

      return {
        success: false,
        error: message,
      };
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
    });

    try {
      const { tempEmail } = get();

      await API.post("/api/auth/verify-forgot-password-otp", {
        email: tempEmail,
        code,
      });

      set({
        otpCode: code,
      });

      Alert.alert("Success");
    } catch (error) {
      console.error(
        "VERIFY FORGOT PASSWORD OTP ERROR:",
        error.response?.data || error.message,
      );
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

      return {
        success: true,

        message: data.message,
      };
    } catch (error) {
      const message = error.response?.data?.message || error.message;

      set({
        error: message,
      });

      Alert.alert("Error", message);

      return {
        success: false,
        error: message,
      };
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

    try {
      const { data } = await API.post("/api/auth/reset-password", {
        email: tempEmail,

        newPassword,

        code: otpCode,
      });

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
    } catch (error) {
      return {
        success: false,

        error: error.response?.data?.message || error.message,
      };
    }
  },
}));

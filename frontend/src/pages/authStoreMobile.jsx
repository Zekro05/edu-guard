import { create } from "zustand";
import { useSocketStore } from "./socketStore";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Alert, Platform } from "react-native";

import {
  messaging,
  requestPermission,
  getToken,
  onMessage,
  onTokenRefresh,
  AuthorizationStatus,
} from "../config/firebase";

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
   CURRENT DEVICE FCM TOKEN CACHE
========================================================= */

let cachedPushToken = null;

const PUSH_TOKEN_STORAGE_KEY = "eduGuardPushToken";

/* =========================================================
   FCM LISTENER CLEANUP
========================================================= */

let unsubscribeFCMTokenRefresh = null;
let unsubscribeFCMMessage = null;

/* =========================================================
   REGISTER FCM TOKEN
========================================================= */

const registerForPushNotificationsAsync = async () => {
  try {
    console.log("====================================");
    console.log("🔥 REGISTERING FCM");
    console.log("====================================");

    /* =====================================================
       WEB CHECK
    ===================================================== */

    if (Platform.OS === "web") {
      console.log(
        "⚠️ FCM push notifications are not supported in this mobile setup on web."
      );

      return null;
    }

    /* =====================================================
       REQUEST NOTIFICATION PERMISSION
    ===================================================== */

    const authStatus = await requestPermission(
      messaging
    );

    const enabled =
      authStatus === AuthorizationStatus.AUTHORIZED ||
      authStatus === AuthorizationStatus.PROVISIONAL;

    console.log(
      "🔔 FCM authorization status:",
      authStatus
    );

    if (!enabled) {
      console.log(
        "❌ FCM notification permission denied."
      );

      return null;
    }

    console.log(
      "✅ FCM notification permission granted."
    );

    /* =====================================================
       GET FCM REGISTRATION TOKEN
    ===================================================== */

    console.log(
      "📱 Requesting FCM registration token..."
    );

    const token = await getToken(messaging);

    if (!token) {
      console.log(
        "❌ FCM token was not generated."
      );

      return null;
    }

    console.log("====================================");
    console.log("🔥 FCM TOKEN:");
    console.log(token);
    console.log("====================================");

    return token;
  } catch (error) {
    console.error("====================================");
    console.error("❌ FCM REGISTRATION ERROR");
    console.error(
      error?.response?.data ||
        error?.message ||
        error
    );
    console.error("====================================");

    return null;
  }
};

/* =========================================================
   GET PLATFORM
========================================================= */

const getPushPlatform = () => {
  if (Platform.OS === "android") {
    return "android";
  }

  if (Platform.OS === "ios") {
    return "ios";
  }

  return "web";
};

/* =========================================================
   GET / CACHE CURRENT FCM TOKEN
========================================================= */

const getCurrentPushToken = async () => {
  try {
    /* =====================================================
       MEMORY CACHE
    ===================================================== */

    if (cachedPushToken) {
      return cachedPushToken;
    }

    /* =====================================================
       LOCAL STORAGE
    ===================================================== */

    const storedToken =
      await AsyncStorage.getItem(
        PUSH_TOKEN_STORAGE_KEY
      );

    if (storedToken) {
      cachedPushToken = storedToken;

      return storedToken;
    }

    return null;
  } catch (error) {
    console.log(
      "GET CURRENT FCM TOKEN ERROR:",
      error?.message
    );

    return null;
  }
};

/* =========================================================
   SAVE CURRENT FCM TOKEN LOCALLY
========================================================= */

const cachePushToken = async (token) => {
  try {
    if (!token) {
      return;
    }

    cachedPushToken = token;

    await AsyncStorage.setItem(
      PUSH_TOKEN_STORAGE_KEY,
      token
    );
  } catch (error) {
    console.log(
      "CACHE FCM TOKEN ERROR:",
      error?.message
    );
  }
};

/* =========================================================
   CLEAR CURRENT FCM TOKEN LOCALLY
========================================================= */

const clearCachedPushToken = async () => {
  try {
    cachedPushToken = null;

    await AsyncStorage.removeItem(
      PUSH_TOKEN_STORAGE_KEY
    );
  } catch (error) {
    console.log(
      "CLEAR FCM TOKEN ERROR:",
      error?.message
    );
  }
};

/* =========================================================
   SAVE FCM TOKEN TO BACKEND
========================================================= */

const savePushTokenToBackend = async () => {
  try {
    /* =====================================================
       DON'T REGISTER WITHOUT AUTH
    ===================================================== */

    if (!cachedToken) {
      console.log(
        "⚠️ Cannot save FCM token: user is not authenticated."
      );

      return false;
    }

    console.log("====================================");
    console.log(
      "🔥 REGISTERING CURRENT DEVICE FCM TOKEN"
    );
    console.log("====================================");

    /* =====================================================
       GET FCM TOKEN
    ===================================================== */

    const token =
      await registerForPushNotificationsAsync();

    if (!token) {
      console.log(
        "⚠️ No FCM token available."
      );

      return false;
    }

    /* =====================================================
       CACHE CURRENT DEVICE TOKEN
    ===================================================== */

    await cachePushToken(token);

    /* =====================================================
       PLATFORM
    ===================================================== */

    const platform =
      getPushPlatform();

    console.log(
      "📡 Saving FCM token to backend..."
    );

    console.log(
      "Platform:",
      platform
    );

    console.log(
      "Provider: fcm"
    );

    /* =====================================================
       SAVE TOKEN
    ===================================================== */

    const response =
      await API.post(
        "/api/auth/save-push-token",
        {
          token,
          platform,
          provider: "fcm",
        }
      );

    console.log("====================================");
    console.log("✅ FCM TOKEN SAVED");
    console.log(response.data);
    console.log("====================================");

    return true;
  } catch (error) {
    console.error("====================================");
    console.error("❌ SAVE FCM TOKEN ERROR");
    console.error(
      error?.response?.data ||
        error?.message ||
        error
    );
    console.error("====================================");

    return false;
  }
};

/* =========================================================
   REMOVE CURRENT DEVICE FCM TOKEN FROM BACKEND
========================================================= */

const removePushTokenFromBackend = async () => {
  try {
    /* =====================================================
       DON'T TRY WITHOUT AUTH
    ===================================================== */

    if (!cachedToken) {
      console.log(
        "⚠️ No authentication token. FCM token removal skipped."
      );

      return true;
    }

    /* =====================================================
       GET CURRENT DEVICE TOKEN
    ===================================================== */

    const token =
      await getCurrentPushToken();

    if (!token) {
      console.log(
        "⚠️ No current FCM token found."
      );

      return true;
    }

    console.log("====================================");
    console.log(
      "🗑️ REMOVING CURRENT DEVICE FCM TOKEN"
    );
    console.log("====================================");

    console.log(
      "TOKEN:",
      token
    );

    /* =====================================================
       REMOVE ONLY THIS DEVICE TOKEN
    ===================================================== */

    const response =
      await API.delete(
        "/api/auth/remove-push-token",
        {
          data: {
            token,
          },
        }
      );

    console.log("====================================");
    console.log(
      "✅ CURRENT DEVICE FCM TOKEN REMOVED"
    );
    console.log(response.data);
    console.log("====================================");

    /* =====================================================
       CLEAR LOCAL TOKEN ONLY AFTER BACKEND SUCCESS
    ===================================================== */

    await clearCachedPushToken();

    return true;
  } catch (error) {
    console.error("====================================");
    console.error(
      "❌ REMOVE FCM TOKEN ERROR"
    );
    console.error(
      error?.response?.data ||
        error?.message ||
        error
    );
    console.error("====================================");

    return false;
  }
};

/* =========================================================
   SETUP FCM TOKEN REFRESH LISTENER
========================================================= */

const setupFCMTokenRefresh = () => {
  try {
    /* =====================================================
       CLEAN UP EXISTING LISTENER
    ===================================================== */

    if (unsubscribeFCMTokenRefresh) {
      unsubscribeFCMTokenRefresh();
      unsubscribeFCMTokenRefresh = null;
    }

    /* =====================================================
       LISTEN FOR FCM TOKEN CHANGES
    ===================================================== */

    unsubscribeFCMTokenRefresh =
      onTokenRefresh(
        messaging,
        async (newToken) => {
          console.log("====================================");
          console.log(
            "🔥 FCM TOKEN REFRESHED"
          );
          console.log("====================================");

          console.log(
            "NEW FCM TOKEN:",
            newToken
          );

          try {
            if (!cachedToken) {
              console.log(
                "⚠️ No authenticated user. Refreshed FCM token will not be saved yet."
              );

              return;
            }

            const platform =
              getPushPlatform();

            /* =============================================
               SAVE NEW TOKEN TO BACKEND
            ============================================= */

            await API.post(
              "/api/auth/save-push-token",
              {
                token: newToken,
                platform,
                provider: "fcm",
              }
            );

            /* =============================================
               UPDATE LOCAL CACHE
            ============================================= */

            await cachePushToken(
              newToken
            );

            console.log(
              "✅ Refreshed FCM token saved."
            );
          } catch (error) {
            console.error(
              "❌ FAILED TO SAVE REFRESHED FCM TOKEN:",
              error?.response?.data ||
                error?.message ||
                error
            );
          }
        }
      );

    console.log(
      "✅ FCM token refresh listener ready."
    );
  } catch (error) {
    console.error(
      "❌ FCM TOKEN REFRESH SETUP ERROR:",
      error?.message || error
    );
  }
};

/* =========================================================
   SETUP FCM FOREGROUND MESSAGE LISTENER
========================================================= */

const setupFCMMessageListener = () => {
  try {
    /* =====================================================
       CLEAN UP EXISTING LISTENER
    ===================================================== */

    if (unsubscribeFCMMessage) {
      unsubscribeFCMMessage();
      unsubscribeFCMMessage = null;
    }

    /* =====================================================
       LISTEN FOR FOREGROUND FCM MESSAGES
    ===================================================== */

    unsubscribeFCMMessage =
      onMessage(
        messaging,
        async (remoteMessage) => {
          console.log("====================================");
          console.log(
            "🔥 FCM FOREGROUND MESSAGE"
          );
          console.log("====================================");

          console.log(
            JSON.stringify(
              remoteMessage,
              null,
              2
            )
          );

          console.log("====================================");
        }
      );

    console.log(
      "✅ FCM foreground message listener ready."
    );
  } catch (error) {
    console.error(
      "❌ FCM MESSAGE LISTENER ERROR:",
      error?.message || error
    );
  }
};

/* =========================================================
   CLEANUP FCM LISTENERS
========================================================= */

const cleanupFCMListeners = () => {
  try {
    if (unsubscribeFCMTokenRefresh) {
      unsubscribeFCMTokenRefresh();
      unsubscribeFCMTokenRefresh = null;
    }

    if (unsubscribeFCMMessage) {
      unsubscribeFCMMessage();
      unsubscribeFCMMessage = null;
    }

    console.log(
      "✅ FCM listeners cleaned up."
    );
  } catch (error) {
    console.log(
      "FCM LISTENER CLEANUP ERROR:",
      error?.message
    );
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
    API.defaults.headers.common.Authorization =
      `Bearer ${token}`;
  } else {
    delete API.defaults.headers.common.Authorization;
  }

  try {
    const storedUser =
      await AsyncStorage.getItem("user");

    const user = storedUser
      ? JSON.parse(storedUser)
      : {};

    const updatedUser = {
      ...user,
      token: token || null,
    };

    await AsyncStorage.setItem(
      "user",
      JSON.stringify(updatedUser)
    );
  } catch (error) {
    console.log(
      "SET TOKEN ERROR:",
      error.message
    );
  }
};

/* =========================================================
   API AUTH INTERCEPTOR
========================================================= */

API.interceptors.request.use(
  async (config) => {
    try {
      if (!config.headers) {
        config.headers = {};
      }

      let token = cachedToken;

      if (!token) {
        const storedUser =
          await AsyncStorage.getItem("user");

        if (storedUser) {
          const user =
            JSON.parse(storedUser);

          token =
            user?.token || null;
        }
      }

      if (token) {
        cachedToken = token;

        config.headers.Authorization =
          `Bearer ${token}`;
      }

      return config;
    } catch (error) {
      console.log(
        "INTERCEPTOR ERROR:",
        error.message
      );

      return config;
    }
  }
);

/* =========================================================
   SOCKET CONNECTION
========================================================= */

const connectSocketSafely = (userId) => {
  try {
    const socketStore =
      useSocketStore?.getState?.();

    if (!socketStore?.connectSocket) {
      return;
    }

    if (!socketConnected && userId) {
      socketConnected = true;

      socketStore.connectSocket(userId);
    }
  } catch (error) {
    console.log(
      "SOCKET ERROR:",
      error.message
    );
  }
};

/* =========================================================
   SETUP FCM AFTER AUTHENTICATION
========================================================= */

const setupFCMAfterAuthentication = async () => {
  try {
    await savePushTokenToBackend();

    setupFCMTokenRefresh();

    setupFCMMessageListener();
  } catch (error) {
    console.log(
      "SETUP FCM AFTER AUTH ERROR:",
      error?.message
    );
  }
};

/* =========================================================
   AUTH STORE
========================================================= */

export const useAuthStore = create(
  (set, get) => ({
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
       SAVE PUSH TOKEN
    ===================================================== */

    savePushToken: async (token) => {
      try {
        if (!token) {
          return {
            success: false,
            error: "No FCM token.",
          };
        }

        if (!cachedToken) {
          return {
            success: false,
            error:
              "User is not authenticated.",
          };
        }

        const platform =
          getPushPlatform();

        await API.post(
          "/api/auth/save-push-token",
          {
            token,
            platform,
            provider: "fcm",
          }
        );

        await cachePushToken(
          token
        );

        console.log(
          "✅ FCM token saved."
        );

        return {
          success: true,
        };
      } catch (error) {
        console.error(
          "SAVE FCM TOKEN ERROR:",
          error?.response?.data ||
            error?.message ||
            error
        );

        return {
          success: false,
          error:
            error?.response?.data?.message ||
            error?.message ||
            "Failed to save FCM token.",
        };
      }
    },

    /* =====================================================
       REGISTER CURRENT DEVICE
    ===================================================== */

    registerPushNotifications:
      async () => {
        try {
          if (!get().isAuthenticated) {
            console.log(
              "⚠️ Cannot register FCM: user is not authenticated."
            );

            return {
              success: false,
              error:
                "User is not authenticated.",
            };
          }

          const success =
            await savePushTokenToBackend();

          if (success) {
            setupFCMTokenRefresh();
            setupFCMMessageListener();
          }

          return {
            success,
          };
        } catch (error) {
          console.error(
            "REGISTER FCM ERROR:",
            error
          );

          return {
            success: false,
            error:
              error?.message ||
              "Failed to register FCM notifications.",
          };
        }
      },

    /* =====================================================
       REMOVE CURRENT DEVICE FCM TOKEN
    ===================================================== */

    removePushToken: async () => {
      const success =
        await removePushTokenFromBackend();

      return {
        success,
        ...(success
          ? {}
          : {
              error:
                "Failed to remove FCM token.",
            }),
      };
    },

    /* =====================================================
       CHECK AUTH
    ===================================================== */

    checkAuth: async () => {
      try {
        set({
          isCheckingAuth: true,
        });

        const storedUser =
          await AsyncStorage.getItem("user");

        if (!storedUser) {
          cachedToken = null;

          cleanupFCMListeners();

          delete API.defaults.headers
            .common.Authorization;

          set({
            user: null,
            studentData: null,
            teacherData: null,
            isAuthenticated: false,
          });

          return;
        }

        const parsedUser =
          JSON.parse(storedUser);

        cachedToken =
          parsedUser?.token || null;

        if (!cachedToken) {
          console.log(
            "NO SAVED TOKEN FOUND."
          );

          cleanupFCMListeners();

          await AsyncStorage.removeItem(
            "user"
          );

          delete API.defaults.headers
            .common.Authorization;

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

        const {
          data,
        } = await API.get(
          "/api/auth/check-auth"
        );

        if (
          !data.authenticated ||
          !data.user
        ) {
          console.log(
            "SAVED TOKEN IS NO LONGER VALID."
          );

          cachedToken = null;

          cleanupFCMListeners();

          delete API.defaults.headers
            .common.Authorization;

          await AsyncStorage.removeItem(
            "user"
          );

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
          studentId:
            data.user.studentId,
          employeeId:
            data.user.employeeId,
        };

        let studentData = null;
        let teacherData = null;

        /* =================================================
           STUDENT
        ================================================= */

        if (
          data.user.role === "student"
        ) {
          try {
            if (data.user.studentId) {
              const {
                data: student,
              } = await API.get(
                `/api/students/${data.user.studentId}`
              );

              studentData = student;

              userData = {
                ...userData,

                firstName:
                  student.firstName,

                middleName:
                  student.middleName,

                lastName:
                  student.lastName,

                name: `${student.firstName} ${student.lastName}`,

                studentId:
                  student.studentId,

                grade:
                  student.grade,

                phone:
                  student.phone,

                profilePhoto:
                  student.profilePhoto ||
                  "",
              };
            }
          } catch (error) {
            console.log(
              "STUDENT PROFILE FETCH FAILED:",
              error?.response?.data ||
                error?.message
            );
          }
        }

        /* =================================================
           TEACHER
        ================================================= */

        else if (
          data.user.role === "teacher"
        ) {
          try {
            if (data.user.employeeId) {
              const {
                data: teacher,
              } = await API.get(
                `/api/teacher-reports/${data.user.employeeId}`
              );

              teacherData = teacher;

              userData = {
                ...userData,

                firstName:
                  teacher.firstName,

                middleName:
                  teacher.middleName,

                lastName:
                  teacher.lastName,

                name: `${teacher.firstName} ${teacher.lastName}`,

                employeeId:
                  teacher.employeeId,

                department:
                  teacher.department,

                phone:
                  teacher.phone,

                profilePhoto:
                  teacher.profilePhoto ||
                  "",
              };
            }
          } catch (error) {
            console.log(
              "TEACHER PROFILE FETCH FAILED:",
              error?.response?.data ||
                error?.message
            );
          }
        }

        /* =================================================
           RESTORE SESSION
        ================================================= */

        set({
          user: userData,

          studentData,

          teacherData,

          isAuthenticated: true,
        });

        await AsyncStorage.setItem(
          "user",
          JSON.stringify(userData)
        );

        connectSocketSafely(
          userData._id
        );

        /* =================================================
           RE-REGISTER FCM
        ================================================= */

        setTimeout(() => {
          setupFCMAfterAuthentication();
        }, 500);
      } catch (error) {
        console.log(
          "CHECK AUTH ERROR:",
          error?.response?.status,
          error?.response?.data ||
            error?.message
        );

        if (
          error?.response?.status === 401
        ) {
          cachedToken = null;

          cleanupFCMListeners();

          delete API.defaults.headers
            .common.Authorization;

          await AsyncStorage.removeItem(
            "user"
          );

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

    mobileLogin: async (
      email,
      password,
      accountType
    ) => {
      set({
        isLoading: true,
        error: null,
      });

      try {
        const {
          data,
        } = await API.post(
          "/api/auth/mobile-login",
          {
            email,
            password,
            accountType,
          }
        );

        if (
          data.requiresOTP &&
          data.success !== false
        ) {
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

        await setToken(
          data.token
        );

        let userData = {
          _id: data.user._id,
          email: data.user.email,
          role: data.user.role,
          token: data.token,
          studentId:
            data.user.studentId,
          employeeId:
            data.user.employeeId,
        };

        /* =================================================
           STUDENT
        ================================================= */

        if (
          data.user.role === "student"
        ) {
          try {
            const studentRes =
              await API.get(
                `/api/students/${data.user.studentId}`
              );

            const student =
              studentRes.data;

            userData = {
              ...userData,

              firstName:
                student.firstName,

              middleName:
                student.middleName,

              lastName:
                student.lastName,

              name: `${student.firstName} ${student.lastName}`,

              studentId:
                student.studentId,

              grade:
                student.grade,

              phone:
                student.phone,

              profilePhoto:
                student.profilePhoto ||
                "",
            };
          } catch (error) {
            console.log(
              "STUDENT PROFILE ERROR:",
              error?.message
            );
          }
        }

        /* =================================================
           TEACHER
        ================================================= */

        else if (
          data.user.role === "teacher"
        ) {
          try {
            const teacherRes =
              await API.get(
                `/api/teacher-reports/${data.user.employeeId}`
              );

            const teacher =
              teacherRes.data;

            userData = {
              ...userData,

              firstName:
                teacher.firstName,

              middleName:
                teacher.middleName,

              lastName:
                teacher.lastName,

              name: `${teacher.firstName} ${teacher.lastName}`,

              employeeId:
                teacher.employeeId,

              department:
                teacher.department,

              phone:
                teacher.phone,

              profilePhoto:
                teacher.profilePhoto ||
                "",
            };
          } catch (error) {
            console.log(
              "TEACHER PROFILE ERROR:",
              error?.message
            );
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

          otpType: null,
        });

        await AsyncStorage.setItem(
          "user",
          JSON.stringify(userData)
        );

        connectSocketSafely(
          userData._id
        );

        /* =================================================
           REGISTER FCM
        ================================================= */

        setTimeout(() => {
          setupFCMAfterAuthentication();
        }, 500);

        return {
          success: true,
        };
      } catch (error) {
        return {
          success: false,

          error:
            error?.response?.data?.message ||
            error?.message,
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
        const {
          tempEmail,
          otpType,
        } = get();

        if (!tempEmail) {
          throw new Error(
            "No email found."
          );
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

        const {
          data,
        } = await API.post(
          url,
          payload
        );

        cachedToken = data.token;

        await setToken(
          data.token
        );

        let userData = {
          _id: data.user._id,
          email: data.user.email,
          role: data.user.role,
          token: data.token,
          studentId:
            data.user.studentId,
          employeeId:
            data.user.employeeId,
        };

        let studentData = null;
        let teacherData = null;

        /* =================================================
           STUDENT
        ================================================= */

        if (
          data.user.role === "student"
        ) {
          try {
            const studentRes =
              await API.get(
                `/api/students/${data.user.studentId}`
              );

            studentData =
              studentRes.data;

            userData = {
              ...userData,

              firstName:
                studentData.firstName,

              middleName:
                studentData.middleName,

              lastName:
                studentData.lastName,

              name: `${studentData.firstName} ${studentData.lastName}`,

              studentId:
                studentData.studentId,

              grade:
                studentData.grade,

              phone:
                studentData.phone,

              profilePhoto:
                studentData.profilePhoto ||
                "",
            };
          } catch (error) {
            console.log(
              "STUDENT OTP PROFILE ERROR:",
              error?.message
            );
          }
        }

        /* =================================================
           TEACHER
        ================================================= */

        else if (
          data.user.role === "teacher"
        ) {
          try {
            const teacherRes =
              await API.get(
                `/api/teacher-reports/${data.user.employeeId}`
              );

            teacherData =
              teacherRes.data;

            userData = {
              ...userData,

              firstName:
                teacherData.firstName,

              middleName:
                teacherData.middleName,

              lastName:
                teacherData.lastName,

              name: `${teacherData.firstName} ${teacherData.lastName}`,

              employeeId:
                teacherData.employeeId,

              department:
                teacherData.department,

              phone:
                teacherData.phone,

              profilePhoto:
                teacherData.profilePhoto ||
                "",
            };
          } catch (error) {
            console.log(
              "TEACHER OTP PROFILE ERROR:",
              error?.message
            );
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

        await AsyncStorage.setItem(
          "user",
          JSON.stringify(userData)
        );

        setTimeout(() => {
          connectSocketSafely(
            userData._id
          );
        }, 150);

        /* =================================================
           REGISTER FCM AFTER OTP
        ================================================= */

        setTimeout(() => {
          setupFCMAfterAuthentication();
        }, 700);

        Alert.alert(
          "Success",
          "Login verified!"
        );

        return {
          verified: true,
          role: userData.role,
        };
      } catch (error) {
        const message =
          error?.response?.data?.message ||
          error?.message;

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
        const {
          tempEmail,
          otpType,
        } = get();

        if (!tempEmail) {
          throw new Error(
            "No email found."
          );
        }

        const url =
          otpType === "signup"
            ? "/api/auth/resend-email-otp"
            : "/api/auth/resend-login-otp";

        await API.post(
          url,
          {
            email: tempEmail,
          }
        );

        return {
          success: true,
        };
      } catch (error) {
        const message =
          error?.response?.data?.message ||
          error?.message;

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
           REMOVE CURRENT DEVICE FCM TOKEN
           
           JWT IS STILL AVAILABLE HERE.
        ================================================= */

        const pushRemoved =
          await removePushTokenFromBackend();

        if (pushRemoved) {
          console.log(
            "✅ Current device FCM token removed before logout."
          );
        } else {
          console.warn(
            "⚠️ Current device FCM token could not be removed."
          );
        }

        /* =================================================
           CLEANUP FCM LISTENERS
        ================================================= */

        cleanupFCMListeners();

        /* =================================================
           DISCONNECT SOCKET
        ================================================= */

        try {
          const socketStore =
            useSocketStore?.getState?.();

          if (
            socketStore?.disconnectSocket
          ) {
            socketStore.disconnectSocket();
          }
        } catch (socketError) {
          console.log(
            "SOCKET DISCONNECT ERROR:",
            socketError?.message
          );
        }

        socketConnected = false;

        /* =================================================
           CLEAR AUTH
        ================================================= */

        cachedToken = null;

        delete API.defaults.headers
          .common.Authorization;

        await AsyncStorage.removeItem(
          "user"
        );

        /* =================================================
           CLEAR LOCAL FCM TOKEN
        ================================================= */

        await clearCachedPushToken();

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

        console.log(
          "✅ USER LOGGED OUT"
        );

        return {
          success: true,
          pushTokenRemoved:
            pushRemoved,
        };
      } catch (error) {
        console.log(
          "LOGOUT ERROR:",
          error?.message
        );

        /* =================================================
           EVEN IF SOMETHING FAILS,
           CLEAN UP LOCAL AUTH
        ================================================= */

        cleanupFCMListeners();

        cachedToken = null;

        delete API.defaults.headers
          .common.Authorization;

        try {
          await AsyncStorage.removeItem(
            "user"
          );
        } catch {}

        await clearCachedPushToken();

        socketConnected = false;

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
          success: false,
          error:
            error?.message ||
            "Logout failed.",
        };
      }
    },

    /* =====================================================
       FETCH STUDENT DATA
    ===================================================== */

    fetchStudentData: async () => {
      try {
        const {
          user,
        } = get();

        if (!user?.studentId) {
          return;
        }

        const {
          data,
        } = await API.get(
          `/api/students/${user.studentId}`
        );

        const updatedUser = {
          ...user,

          firstName:
            data.firstName,

          middleName:
            data.middleName,

          lastName:
            data.lastName,

          name: `${data.firstName} ${data.lastName}`,

          studentId:
            data.studentId,

          grade:
            data.grade,

          phone:
            data.phone,

          profilePhoto:
            data.profilePhoto || "",
        };

        set({
          studentData: data,
          user: updatedUser,
        });

        await AsyncStorage.setItem(
          "user",
          JSON.stringify(updatedUser)
        );
      } catch (error) {
        console.log(
          "FETCH STUDENT DATA ERROR:",
          error?.response?.data ||
            error?.message
        );
      }
    },

    /* =====================================================
       FETCH TEACHER DATA
    ===================================================== */

    fetchTeacherData: async () => {
      try {
        const {
          user,
        } = get();

        if (!user?.employeeId) {
          return;
        }

        const {
          data,
        } = await API.get(
          `/api/teacher-reports/${user.employeeId}`
        );

        const updatedUser = {
          ...user,

          firstName:
            data.firstName,

          middleName:
            data.middleName,

          lastName:
            data.lastName,

          name: `${data.firstName} ${data.lastName}`,

          employeeId:
            data.employeeId,

          department:
            data.department,

          phone:
            data.phone,

          profilePhoto:
            data.profilePhoto || "",
        };

        set({
          teacherData: data,
          user: updatedUser,
        });

        await AsyncStorage.setItem(
          "user",
          JSON.stringify(updatedUser)
        );
      } catch (error) {
        console.log(
          "FETCH TEACHER DATA ERROR:",
          error?.response?.data ||
            error?.message
        );
      }
    },

    /* =====================================================
       UPDATE STUDENT PROFILE
    ===================================================== */

    updateStudentProfile: async (
      profileData
    ) => {
      try {
        const response =
          await API.put(
            "/api/students/profile",
            profileData
          );

        if (
          response.data?.success
        ) {
          const updatedStudent =
            response.data.student;

          const currentUser =
            get().user;

          const updatedUser = {
            ...currentUser,

            ...updatedStudent,

            name: `${updatedStudent.firstName} ${updatedStudent.lastName}`,
          };

          set({
            studentData:
              updatedStudent,

            user: updatedUser,
          });

          await AsyncStorage.setItem(
            "user",
            JSON.stringify(updatedUser)
          );

          return {
            success: true,
            student: updatedStudent,
          };
        }

        return {
          success: false,

          error:
            response.data?.message ||
            "Failed to update profile.",
        };
      } catch (error) {
        console.error(
          "UPDATE STUDENT PROFILE ERROR:",
          error?.response?.data ||
            error
        );

        return {
          success: false,

          error:
            error?.response?.data?.message ||
            error?.message ||
            "Failed to update profile.",
        };
      }
    },

    /* =====================================================
       UPDATE STUDENT PROFILE PHOTO
    ===================================================== */

    updateStudentProfilePhoto:
      async (asset) => {
        try {
          if (!asset?.uri) {
            return {
              success: false,
              error: "No image selected.",
            };
          }

          const formData =
            new FormData();

          formData.append(
            "profilePhoto",
            {
              uri: asset.uri,

              name:
                asset.fileName ||
                `profile-photo-${Date.now()}.jpg`,

              type:
                asset.mimeType ||
                "image/jpeg",
            }
          );

          const response =
            await API.put(
              "/api/students/profile/photo",
              formData,
              {
                headers: {
                  "Content-Type":
                    "multipart/form-data",
                },
              }
            );

          if (
            response.data?.success
          ) {
            const profilePhoto =
              response.data.profilePhoto;

            const currentUser =
              get().user;

            const currentStudent =
              get().studentData;

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

              studentData:
                updatedStudent,
            });

            await AsyncStorage.setItem(
              "user",
              JSON.stringify(updatedUser)
            );

            return {
              success: true,
              profilePhoto,
            };
          }

          return {
            success: false,

            error:
              response.data?.message ||
              "Failed to update profile photo.",
          };
        } catch (error) {
          console.error(
            "UPDATE STUDENT PROFILE PHOTO ERROR:",
            error?.response?.data ||
              error
          );

          return {
            success: false,

            error:
              error?.response?.data?.message ||
              error?.message ||
              "Failed to update profile photo.",
          };
        }
      },

    /* =====================================================
       UPDATE TEACHER PROFILE
    ===================================================== */

    updateTeacherProfile:
      async (profileData) => {
        try {
          const response =
            await API.put(
              "/api/teacher-reports/profile",
              profileData
            );

          if (
            response.data?.success
          ) {
            const updatedTeacher =
              response.data.teacher;

            const currentUser =
              get().user;

            const updatedUser = {
              ...currentUser,

              ...updatedTeacher,

              name: `${updatedTeacher.firstName} ${updatedTeacher.lastName}`,
            };

            set({
              teacherData:
                updatedTeacher,

              user: updatedUser,
            });

            await AsyncStorage.setItem(
              "user",
              JSON.stringify(updatedUser)
            );

            return {
              success: true,
              teacher: updatedTeacher,
            };
          }

          return {
            success: false,

            error:
              response.data?.message ||
              "Failed to update teacher profile.",
          };
        } catch (error) {
          console.error(
            "UPDATE TEACHER PROFILE ERROR:",
            error?.response?.data ||
              error
          );

          return {
            success: false,

            error:
              error?.response?.data?.message ||
              error?.message ||
              "Failed to update teacher profile.",
          };
        }
      },

    /* =====================================================
       UPDATE TEACHER PROFILE PHOTO
    ===================================================== */

    updateTeacherProfilePhoto:
      async (asset) => {
        try {
          if (!asset?.uri) {
            return {
              success: false,
              error: "No image selected.",
            };
          }

          const formData =
            new FormData();

          formData.append(
            "profilePhoto",
            {
              uri: asset.uri,

              name:
                asset.fileName ||
                `profile-photo-${Date.now()}.jpg`,

              type:
                asset.mimeType ||
                "image/jpeg",
            }
          );

          const response =
            await API.put(
              "/api/teacher-reports/profile/photo",
              formData,
              {
                headers: {
                  "Content-Type":
                    "multipart/form-data",
                },
              }
            );

          if (
            response.data?.success
          ) {
            const profilePhoto =
              response.data.profilePhoto;

            const currentUser =
              get().user;

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

            await AsyncStorage.setItem(
              "user",
              JSON.stringify(updatedUser)
            );

            return {
              success: true,
              profilePhoto,
            };
          }

          return {
            success: false,

            error:
              response.data?.message ||
              "Failed to update teacher profile photo.",
          };
        } catch (error) {
          console.error(
            "UPDATE TEACHER PROFILE PHOTO ERROR:",
            error?.response?.data ||
              error
          );

          return {
            success: false,

            error:
              error?.response?.data?.message ||
              error?.message ||
              "Failed to update teacher profile photo.",
          };
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
        const email =
          formData.email;

        await API.post(
          "/api/auth/signup",
          formData
        );

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

          error:
            error?.response?.data?.message ||
            error?.message,
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

    forgotPassword: async (
      email
    ) => {
      set({
        isLoading: true,
        error: null,
      });

      try {
        const {
          data,
        } = await API.post(
          "/api/auth/forgot-password",
          {
            email,
          }
        );

        set({
          tempEmail: email,
        });

        return {
          success: true,
          data,
        };
      } catch (error) {
        const message =
          error?.response?.data?.message ||
          error?.message ||
          "Server error";

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

    verifyForgotPasswordOTP:
      async (code) => {
        set({
          isLoading: true,
          error: null,
        });

        try {
          const {
            tempEmail,
          } = get();

          await API.post(
            "/api/auth/verify-forgot-password-otp",
            {
              email: tempEmail,
              code,
            }
          );

          set({
            otpCode: code,
          });

          Alert.alert(
            "Success"
          );

          return {
            success: true,
          };
        } catch (error) {
          const message =
            error?.response?.data?.message ||
            error?.message;

          set({
            error: message,
          });

          console.error(
            "VERIFY FORGOT PASSWORD OTP ERROR:",
            error?.response?.data ||
              error?.message
          );

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
       CHANGE PASSWORD
    ===================================================== */

    changePassword:
      async (
        oldPassword,
        newPassword
      ) => {
        set({
          isLoading: true,
          error: null,
        });

        try {
          const {
            data,
          } = await API.post(
            "/api/auth/change-password",
            {
              oldPassword,
              newPassword,
            }
          );

          return {
            success: true,

            message:
              data.message,
          };
        } catch (error) {
          const message =
            error?.response?.data?.message ||
            error?.message;

          set({
            error: message,
          });

          Alert.alert(
            "Error",
            message
          );

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

    resetPassword:
      async (newPassword) => {
        const {
          tempEmail,
          otpCode,
        } = get();

        try {
          const {
            data,
          } = await API.post(
            "/api/auth/reset-password",
            {
              email: tempEmail,

              newPassword,

              code: otpCode,
            }
          );

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

            error:
              error?.response?.data?.message ||
              error?.message,
          };
        }
      },
  })
);
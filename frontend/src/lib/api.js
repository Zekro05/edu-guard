import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL;

if (!API_URL) {
  console.error("❌ VITE_API_URL is not configured.");
}

export const API = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  timeout: 15000,
});

/* =========================================================
   ATTACH JWT AUTOMATICALLY
========================================================= */

API.interceptors.request.use(
  (config) => {
    try {
      const storedUser = localStorage.getItem("user");

      if (storedUser) {
        const user = JSON.parse(storedUser);

        if (user?.token) {
          config.headers.Authorization = `Bearer ${user.token}`;
        }
      }
    } catch (error) {
      console.warn("⚠️ Invalid stored user data. Clearing session.");

      localStorage.removeItem("user");
    }

    return config;
  },
  (error) => Promise.reject(error)
);

/* =========================================================
   HANDLE AUTH ERRORS
========================================================= */

API.interceptors.response.use(
  (response) => response,

  (error) => {
    if (error.response?.status === 401) {
      console.warn("🔐 Unauthorized API request.");
    }

    return Promise.reject(error);
  }
);

if (import.meta.env.DEV) {
  console.log("🔧 API URL:", API_URL);
}
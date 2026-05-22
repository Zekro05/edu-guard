const isDev = import.meta.env.DEV;

export const BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000";

export const getFileUrl = (path) => {
  if (!path) return "";

  // already absolute
  if (path.startsWith("http")) return path;

  return `${BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;
};
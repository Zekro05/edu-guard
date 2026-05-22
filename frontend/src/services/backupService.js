import axios from "axios";

const API = import.meta.env.VITE_API_URL + "/api";

// ✅ Download backup
export const createBackup = async () => {
  const res = await axios.get(`${API}/backup`, {
    responseType: "blob",
  });

  const url = window.URL.createObjectURL(new Blob([res.data]));
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", `backup-${Date.now()}.json`);
  document.body.appendChild(link);
  link.click();
};

// ✅ Restore backup
export const restoreBackup = async (file) => {
  const formData = new FormData();
  formData.append("file", file);

  return await axios.post(`${API}/restore`, formData);
};
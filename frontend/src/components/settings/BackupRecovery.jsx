import { useEffect, useState } from "react";
import axios from "axios";
import { Database, Download, Upload, RefreshCcw } from "lucide-react";

const API = "http://localhost:5000/api"; // Backend API URL

const BackupRecovery = () => {
  const [backups, setBackups] = useState([]);
  const [loadingBackup, setLoadingBackup] = useState(false);
  const [loadingRestore, setLoadingRestore] = useState(false);
  const [file, setFile] = useState(null);

  // Fetch backup history from HistoryLog
  const fetchBackups = async () => {
    try {
      const res = await axios.get(`${API}/backups`, { withCredentials: true });
      setBackups(res.data);
    } catch (err) {
      console.error("Failed to fetch backups:", err.response || err.message);
    }
  };

  useEffect(() => {
    fetchBackups();
  }, []);

  // Manual backup
  const handleBackup = async () => {
    setLoadingBackup(true);
    try {
      const res = await axios.get(`${API}/backup`, { withCredentials: true });
      alert(res.data.message);
      fetchBackups();
    } catch (err) {
      console.error("Backup failed:", err.response || err.message);
      alert("Backup failed! Check console.");
    } finally {
      setLoadingBackup(false);
    }
  };

  // Restore backup
  const handleRestore = async (backupFile) => {
    setLoadingRestore(true);
    try {
      const formData = new FormData();
      formData.append("backupFile", backupFile);

      const res = await axios.post(`${API}/restore-file`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
        withCredentials: true,
      });

      alert(res.data.message);
      fetchBackups();
    } catch (err) {
      console.error("Restore failed:", err.response || err.message);
      alert("Restore failed! Check console.");
    } finally {
      setLoadingRestore(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border p-6">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <Database className="text-green-700" size={22} />
        <h2 className="text-lg font-semibold text-gray-800">
          Data Backup & Recovery
        </h2>
      </div>

      <p className="text-sm text-gray-500 mb-6">
        Secure your system data through manual or automated backups and restore information in case of system failure or data loss.
      </p>

      {/* Backup Actions */}
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        {/* Manual Backup */}
        <div className="border rounded-lg p-5">
          <h3 className="font-semibold text-gray-800 mb-2">Manual Backup</h3>
          <p className="text-sm text-gray-500 mb-4">
            Create an instant backup of the system database and files.
          </p>
          <button
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm text-white ${
              loadingBackup ? "bg-gray-500 cursor-not-allowed" : "bg-green-700 hover:bg-green-800"
            } transition`}
            onClick={handleBackup}
            disabled={loadingBackup}
          >
            <Download size={16} />
            {loadingBackup ? "Backing up..." : "Create Backup"}
          </button>
        </div>

        {/* Restore */}
        <div className="border rounded-lg p-5">
          <h3 className="font-semibold text-gray-800 mb-2">Restore Backup</h3>
          <p className="text-sm text-gray-500 mb-4">
            Restore system data from a previous backup file.
          </p>
          <input
            type="file"
            accept=".json"
            onChange={(e) => setFile(e.target.files[0])}
            className="mb-2"
          />
          <button
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm text-white ${
              !file || loadingRestore ? "bg-gray-500 cursor-not-allowed" : "bg-gray-700 hover:bg-gray-800"
            } transition`}
            onClick={() => handleRestore(file)}
            disabled={!file || loadingRestore}
          >
            <Upload size={16} />
            {loadingRestore ? "Restoring..." : "Restore Data"}
          </button>
        </div>
      </div>

      {/* Backup History */}
      <div>
        <h3 className="font-semibold text-gray-800 mb-3">Backup History</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border rounded-lg overflow-hidden">
            <thead className="bg-gray-100 text-gray-700">
              <tr>
                <th className="text-left px-4 py-3">Date</th>
                <th className="text-left px-4 py-3">Type</th>
                <th className="text-left px-4 py-3">Status</th>
                <th className="text-left px-4 py-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {backups.length === 0 ? (
                <tr>
                  <td colSpan="4" className="text-center px-4 py-3">
                    No backups found.
                  </td>
                </tr>
              ) : (
                backups.map((b) => (
                  <tr key={b._id} className="border-t hover:bg-gray-50">
                    <td className="px-4 py-3">{new Date(b.createdAt).toLocaleString()}</td>
                    <td className="px-4 py-3">{b.action === "Created Backup" ? "Manual" : b.action}</td>
                    <td className="px-4 py-3 text-green-700 font-medium">Successful</td>
                    <td className="px-4 py-3">
                      <button
                        className="flex items-center gap-1 text-green-700 hover:underline"
                        onClick={() => alert("Restore from this backup using the file upload.")}
                      >
                        <RefreshCcw size={14} />
                        Restore
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default BackupRecovery;
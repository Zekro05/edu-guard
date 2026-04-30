import { useEffect, useState } from "react";
import axios from "axios";
import { Database, Download, Upload, RefreshCcw } from "lucide-react";

const API = "http://localhost:5000/api";

const BackupRecovery = () => {
  const [backups, setBackups] = useState([]);
  const [loadingBackup, setLoadingBackup] = useState(false);
  const [loadingRestore, setLoadingRestore] = useState(false);
  const [file, setFile] = useState(null);

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
    <div className="w-full min-h-screen bg-gradient-to-br from-gray-950 via-green-950 to-emerald-950 text-white p-6">

      {/* HEADER */}
      <div className="mb-6 flex items-center gap-3">
        <div className="p-2 bg-green-500/20 rounded-lg">
          <Database className="text-green-400" size={20} />
        </div>

        <div>
          <h1 className="text-2xl font-bold">Backup & Recovery</h1>
          <p className="text-sm text-gray-400">
            Secure system data and restore when needed
          </p>
        </div>
      </div>

      {/* ACTIONS */}
      <div className="grid md:grid-cols-2 gap-6 mb-8">

        {/* BACKUP */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-6 backdrop-blur-xl">
          <h2 className="text-green-400 font-semibold mb-2">Manual Backup</h2>
          <p className="text-sm text-gray-400 mb-4">
            Create a system snapshot instantly.
          </p>

          <button
            onClick={handleBackup}
            disabled={loadingBackup}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition ${
              loadingBackup
                ? "bg-gray-600 cursor-not-allowed"
                : "bg-green-500 text-black hover:bg-green-600"
            }`}
          >
            <Download size={16} />
            {loadingBackup ? "Backing up..." : "Create Backup"}
          </button>
        </div>

        {/* RESTORE */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-6 backdrop-blur-xl">
          <h2 className="text-green-400 font-semibold mb-2">Restore Backup</h2>
          <p className="text-sm text-gray-400 mb-4">
            Restore from a saved backup file.
          </p>

          <input
            type="file"
            accept=".json"
            onChange={(e) => setFile(e.target.files[0])}
            className="mb-3 text-sm"
          />

          <button
            onClick={() => handleRestore(file)}
            disabled={!file || loadingRestore}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition ${
              !file || loadingRestore
                ? "bg-gray-600 cursor-not-allowed"
                : "bg-gray-700 hover:bg-gray-800"
            }`}
          >
            <Upload size={16} />
            {loadingRestore ? "Restoring..." : "Restore Data"}
          </button>
        </div>
      </div>

      {/* HISTORY (KEPT - ONLY STYLED) */}
      <div className="bg-white/5 border border-white/10 rounded-xl p-6 backdrop-blur-xl">

        <h2 className="text-green-400 font-semibold mb-4">
          Backup History
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">

            <thead className="text-gray-300 border-b border-white/10">
              <tr>
                <th className="text-left p-3">Date</th>
                <th className="text-left p-3">Type</th>
                <th className="text-left p-3">Status</th>
                <th className="text-left p-3">Action</th>
              </tr>
            </thead>

            <tbody>
              {backups.length === 0 ? (
                <tr>
                  <td colSpan="4" className="text-center py-6 text-gray-400">
                    No backups found.
                  </td>
                </tr>
              ) : (
                backups.map((b) => (
                  <tr
                    key={b._id}
                    className="border-t border-white/10 hover:bg-white/5"
                  >
                    <td className="p-3">
                      {new Date(b.createdAt).toLocaleString()}
                    </td>

                    <td className="p-3">
                      {b.action === "Created Backup" ? "Manual" : b.action}
                    </td>

                    <td className="p-3 text-green-400 font-medium">
                      Successful
                    </td>

                    <td className="p-3">
                      <button
                        onClick={() =>
                          alert("Restore from this backup using upload.")
                        }
                        className="flex items-center gap-1 text-green-400 hover:text-green-300"
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
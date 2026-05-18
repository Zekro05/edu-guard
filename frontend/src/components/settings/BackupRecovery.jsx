import { useEffect, useState } from "react";
import { Database, Download, Upload, RefreshCcw } from "lucide-react";

/* ================= LOCAL STORAGE KEY ================= */
const LOCAL_KEY = "system_backup_data";

/* ================= MAIN ================= */
const BackupRecovery = () => {
  const [backups, setBackups] = useState([]);
  const [loadingBackup, setLoadingBackup] = useState(false);
  const [loadingRestore, setLoadingRestore] = useState(false);
  const [file, setFile] = useState(null);

  /* ================= LOAD BACKUP HISTORY ================= */
  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem(LOCAL_KEY)) || [];
    setBackups(stored);
  }, []);

  /* ================= CREATE BACKUP ================= */
  const handleBackup = async () => {
    setLoadingBackup(true);

    try {
      // collect system data
      const snapshot = {
        date: new Date().toISOString(),
        reports: JSON.parse(localStorage.getItem("reports") || "[]"),
        incidents: JSON.parse(localStorage.getItem("incidents") || "[]"),
        users: JSON.parse(localStorage.getItem("users") || "[]"),
      };

      const newBackup = {
        id: Date.now(),
        action: "Manual Backup",
        createdAt: snapshot.date,
        data: snapshot,
      };

      const updated = [newBackup, ...backups];

      localStorage.setItem(LOCAL_KEY, JSON.stringify(updated));
      setBackups(updated);

      // auto download file
      const blob = new Blob([JSON.stringify(newBackup, null, 2)], {
        type: "application/json",
      });

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `backup-${Date.now()}.json`;
      a.click();

      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      alert("Backup failed");
    } finally {
      setLoadingBackup(false);
    }
  };

  /* ================= RESTORE FROM FILE ================= */
  const handleRestore = async (backupFile) => {
    if (!backupFile) return;

    setLoadingRestore(true);

    try {
      const text = await backupFile.text();
      const data = JSON.parse(text);

      // restore into localStorage (merge strategy)
      if (data.reports) localStorage.setItem("reports", JSON.stringify(data.reports));
      if (data.incidents) localStorage.setItem("incidents", JSON.stringify(data.incidents));
      if (data.users) localStorage.setItem("users", JSON.stringify(data.users));

      alert("Restore successful!");
    } catch (err) {
      console.error(err);
      alert("Invalid backup file");
    } finally {
      setLoadingRestore(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-gray-50 text-gray-900 p-6">

      {/* HEADER */}
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-green-100 rounded-xl">
          <Database className="text-green-600" size={20} />
        </div>

        <div>
          <h1 className="text-2xl font-bold">Backup & Recovery</h1>
          <p className="text-sm text-gray-500">
            Create and restore local system snapshots
          </p>
        </div>
      </div>

      {/* ACTION CARDS */}
      <div className="grid md:grid-cols-2 gap-6 mb-8">

        {/* BACKUP */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
          <h2 className="text-green-600 font-semibold mb-2">
            Create Backup
          </h2>
          <p className="text-sm text-gray-500 mb-4">
            Export system data as JSON file
          </p>

          <button
            onClick={handleBackup}
            disabled={loadingBackup}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-green-500 text-white hover:bg-green-600 transition disabled:opacity-50"
          >
            <Download size={16} />
            {loadingBackup ? "Creating..." : "Generate Backup"}
          </button>
        </div>

        {/* RESTORE */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
          <h2 className="text-green-600 font-semibold mb-2">
            Restore Data
          </h2>
          <p className="text-sm text-gray-500 mb-4">
            Import backup JSON file
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
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-900 text-white hover:bg-gray-800 transition disabled:opacity-50"
          >
            <Upload size={16} />
            {loadingRestore ? "Restoring..." : "Restore"}
          </button>
        </div>
      </div>

      {/* HISTORY */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">

        <h2 className="text-green-600 font-semibold mb-4">
          Backup History
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">

            <thead className="text-gray-500 border-b">
              <tr>
                <th className="text-left py-3">Date</th>
                <th className="text-left py-3">Type</th>
                <th className="text-left py-3">Status</th>
                <th className="text-left py-3">Action</th>
              </tr>
            </thead>

            <tbody>
              {backups.length === 0 ? (
                <tr>
                  <td colSpan="4" className="text-center py-6 text-gray-400">
                    No backups yet
                  </td>
                </tr>
              ) : (
                backups.map((b) => (
                  <tr key={b.id} className="border-t hover:bg-gray-50">

                    <td className="py-3">
                      {new Date(b.createdAt).toLocaleString()}
                    </td>

                    <td className="py-3 text-gray-700">
                      {b.action}
                    </td>

                    <td className="py-3 text-green-600 font-medium">
                      Active
                    </td>

                    <td className="py-3">
                      <button
                        onClick={() => {
                          const blob = new Blob(
                            [JSON.stringify(b.data, null, 2)],
                            { type: "application/json" }
                          );
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement("a");
                          a.href = url;
                          a.download = `restore-${b.id}.json`;
                          a.click();
                        }}
                        className="flex items-center gap-1 text-green-600 hover:text-green-700"
                      >
                        <RefreshCcw size={14} />
                        Export
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
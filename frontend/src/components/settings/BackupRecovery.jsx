import { Database, Download, Upload, RefreshCcw } from "lucide-react";

const BackupRecovery = () => {
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
        Secure your system data through manual or automated backups and
        restore information in case of system failure or data loss.
      </p>

      {/* Backup Actions */}
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        {/* Manual Backup */}
        <div className="border rounded-lg p-5">
          <h3 className="font-semibold text-gray-800 mb-2">
            Manual Backup
          </h3>
          <p className="text-sm text-gray-500 mb-4">
            Create an instant backup of the system database and files.
          </p>
          <button className="flex items-center gap-2 bg-green-700 text-white px-4 py-2 rounded-md text-sm hover:bg-green-800 transition">
            <Download size={16} />
            Create Backup
          </button>
        </div>

        {/* Restore */}
        <div className="border rounded-lg p-5">
          <h3 className="font-semibold text-gray-800 mb-2">
            Restore Backup
          </h3>
          <p className="text-sm text-gray-500 mb-4">
            Restore system data from a previous backup file.
          </p>
          <button className="flex items-center gap-2 bg-gray-700 text-white px-4 py-2 rounded-md text-sm hover:bg-gray-800 transition">
            <Upload size={16} />
            Restore Data
          </button>
        </div>
      </div>

      {/* Backup History */}
      <div>
        <h3 className="font-semibold text-gray-800 mb-3">
          Backup History
        </h3>

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
              <tr className="border-t hover:bg-gray-50">
                <td className="px-4 py-3">2026-02-06</td>
                <td className="px-4 py-3">Manual</td>
                <td className="px-4 py-3 text-green-700 font-medium">
                  Successful
                </td>
                <td className="px-4 py-3">
                  <button className="flex items-center gap-1 text-green-700 hover:underline">
                    <RefreshCcw size={14} />
                    Restore
                  </button>
                </td>
              </tr>

              <tr className="border-t hover:bg-gray-50">
                <td className="px-4 py-3">2026-02-05</td>
                <td className="px-4 py-3">Automated</td>
                <td className="px-4 py-3 text-green-700 font-medium">
                  Successful
                </td>
                <td className="px-4 py-3">
                  <button className="flex items-center gap-1 text-green-700 hover:underline">
                    <RefreshCcw size={14} />
                    Restore
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default BackupRecovery;
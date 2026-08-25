import { useEffect, useState } from "react";
import {
  Database,
  Download,
  Upload,
  RefreshCcw,
  ShieldCheck,
  FileArchive,
  Clock3,
  CheckCircle2,
  FileJson,
} from "lucide-react";

/* =========================================================
   LOCAL STORAGE KEY
========================================================= */

const LOCAL_KEY = "system_backup_data";

/* =========================================================
   MAIN
========================================================= */

const BackupRecovery = () => {
  const [backups, setBackups] = useState([]);
  const [loadingBackup, setLoadingBackup] = useState(false);
  const [loadingRestore, setLoadingRestore] = useState(false);
  const [file, setFile] = useState(null);

  /* =======================================================
     LOAD BACKUP HISTORY
  ======================================================= */

  useEffect(() => {
    const stored =
      JSON.parse(localStorage.getItem(LOCAL_KEY)) || [];

    setBackups(stored);
  }, []);

  /* =======================================================
     CREATE BACKUP
  ======================================================= */

  const handleBackup = async () => {
    setLoadingBackup(true);

    try {
      const snapshot = {
        date: new Date().toISOString(),
        reports: JSON.parse(
          localStorage.getItem("reports") || "[]"
        ),
        incidents: JSON.parse(
          localStorage.getItem("incidents") || "[]"
        ),
        users: JSON.parse(
          localStorage.getItem("users") || "[]"
        ),
      };

      const newBackup = {
        id: Date.now(),
        action: "Manual Backup",
        createdAt: snapshot.date,
        data: snapshot,
      };

      const updated = [newBackup, ...backups];

      localStorage.setItem(
        LOCAL_KEY,
        JSON.stringify(updated)
      );

      setBackups(updated);

      /* DOWNLOAD BACKUP */

      const blob = new Blob(
        [JSON.stringify(newBackup, null, 2)],
        {
          type: "application/json",
        }
      );

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

  /* =======================================================
     RESTORE FROM FILE
  ======================================================= */

  const handleRestore = async (backupFile) => {
    if (!backupFile) return;

    setLoadingRestore(true);

    try {
      const text = await backupFile.text();
      const data = JSON.parse(text);

      if (data.reports) {
        localStorage.setItem(
          "reports",
          JSON.stringify(data.reports)
        );
      }

      if (data.incidents) {
        localStorage.setItem(
          "incidents",
          JSON.stringify(data.incidents)
        );
      }

      if (data.users) {
        localStorage.setItem(
          "users",
          JSON.stringify(data.users)
        );
      }

      alert("Restore successful!");
    } catch (err) {
      console.error(err);
      alert("Invalid backup file");
    } finally {
      setLoadingRestore(false);
    }
  };

  /* =======================================================
     EXPORT EXISTING BACKUP
  ======================================================= */

  const exportBackup = (backup) => {
    const blob = new Blob(
      [JSON.stringify(backup.data, null, 2)],
      {
        type: "application/json",
      }
    );

    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `restore-${backup.id}.json`;
    a.click();

    URL.revokeObjectURL(url);
  };

  /* =======================================================
     LAST BACKUP
  ======================================================= */

  const latestBackup = backups.length > 0
    ? backups[0]
    : null;

  return (
    <div className="w-full text-gray-900">

      {/* =====================================================
          HEADER
      ===================================================== */}

      <div className="flex items-start justify-between gap-6 mb-7">

        <div className="flex items-start gap-4">

          <div
            className="
              w-12
              h-12
              rounded-2xl
              bg-green-50
              text-green-600
              flex
              items-center
              justify-center
              border
              border-green-100
              flex-shrink-0
            "
          >
            <Database
              size={21}
              strokeWidth={2.2}
            />
          </div>

          <div>

            <h1
              className="
                text-xl
                font-extrabold
                tracking-tight
                text-gray-900
              "
            >
              Backup & Recovery
            </h1>

            <p className="text-sm text-gray-400 mt-1">
              Create, export, and restore system data snapshots.
            </p>

          </div>

        </div>

        {/* STATUS */}

        <div
          className="
            hidden
            sm:flex
            items-center
            gap-2
            px-3
            py-2
            rounded-xl
            bg-green-50
            border
            border-green-100
            text-xs
            font-semibold
            text-green-700
          "
        >
          <span className="w-2 h-2 rounded-full bg-green-500" />
          Backup System Ready
        </div>

      </div>

      {/* =====================================================
          SUMMARY CARDS
      ===================================================== */}

      <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4 mb-7">

        <BackupSummary
          icon={<FileArchive size={18} />}
          label="Total Backups"
          value={backups.length}
          description="Saved backup snapshots available."
        />

        <BackupSummary
          icon={<Clock3 size={18} />}
          label="Latest Backup"
          value={
            latestBackup
              ? new Date(
                  latestBackup.createdAt
                ).toLocaleDateString()
              : "None"
          }
          description={
            latestBackup
              ? new Date(
                  latestBackup.createdAt
                ).toLocaleTimeString()
              : "No backup has been created yet."
          }
        />

        <BackupSummary
          icon={<ShieldCheck size={18} />}
          label="System Status"
          value="Ready"
          description="Backup and recovery tools are available."
        />

      </div>

      {/* =====================================================
          BACKUP / RESTORE ACTIONS
      ===================================================== */}

      <div className="grid lg:grid-cols-2 gap-5 mb-7">

        {/* ===================================================
            CREATE BACKUP
        =================================================== */}

        <section
          className="
            bg-white
            border
            border-gray-100
            rounded-3xl
            p-6
            shadow-[0_4px_24px_rgba(0,0,0,0.025)]
          "
        >

          <div className="flex items-start justify-between">

            <div className="flex items-start gap-3">

              <div
                className="
                  w-10
                  h-10
                  rounded-xl
                  bg-green-50
                  text-green-600
                  flex
                  items-center
                  justify-center
                  flex-shrink-0
                "
              >
                <Download size={18} />
              </div>

              <div>

                <h2 className="text-sm font-bold text-gray-900">
                  Create Backup
                </h2>

                <p className="text-xs text-gray-400 mt-1">
                  Export a snapshot of the current system data.
                </p>

              </div>

            </div>

            <span
              className="
                px-2
                py-1
                rounded-lg
                bg-green-50
                border
                border-green-100
                text-[9px]
                font-bold
                uppercase
                tracking-wide
                text-green-600
              "
            >
              Manual
            </span>

          </div>

          {/* INFO */}

          <div
            className="
              mt-6
              p-4
              rounded-2xl
              bg-gray-50
              border
              border-gray-100
            "
          >

            <div className="flex items-center gap-3">

              <FileJson
                size={18}
                className="text-gray-400"
              />

              <div>

                <p className="text-xs font-semibold text-gray-700">
                  JSON Backup File
                </p>

                <p className="text-[11px] text-gray-400 mt-0.5">
                  Reports, incidents, and users
                </p>

              </div>

            </div>

          </div>

          {/* ACTION */}

          <button
            onClick={handleBackup}
            disabled={loadingBackup}
            className="
              mt-5
              w-full
              flex
              items-center
              justify-center
              gap-2
              px-4
              py-2.5
              rounded-xl
              bg-green-600
              hover:bg-green-700
              disabled:bg-green-400
              disabled:cursor-not-allowed
              text-white
              text-sm
              font-semibold
              shadow-sm
              hover:shadow-md
              transition-all
              duration-200
            "
          >

            <Download size={16} />

            {loadingBackup
              ? "Creating Backup..."
              : "Generate Backup"}

          </button>

        </section>

        {/* ===================================================
            RESTORE DATA
        =================================================== */}

        <section
          className="
            bg-white
            border
            border-gray-100
            rounded-3xl
            p-6
            shadow-[0_4px_24px_rgba(0,0,0,0.025)]
          "
        >

          <div className="flex items-start justify-between">

            <div className="flex items-start gap-3">

              <div
                className="
                  w-10
                  h-10
                  rounded-xl
                  bg-gray-100
                  text-gray-600
                  flex
                  items-center
                  justify-center
                  flex-shrink-0
                "
              >
                <Upload size={18} />
              </div>

              <div>

                <h2 className="text-sm font-bold text-gray-900">
                  Restore Data
                </h2>

                <p className="text-xs text-gray-400 mt-1">
                  Import a previously exported backup file.
                </p>

              </div>

            </div>

            <span
              className="
                px-2
                py-1
                rounded-lg
                bg-gray-50
                border
                border-gray-100
                text-[9px]
                font-bold
                uppercase
                tracking-wide
                text-gray-500
              "
            >
              JSON
            </span>

          </div>

          {/* FILE SELECTOR */}

          <label
            className="
              mt-6
              flex
              flex-col
              items-center
              justify-center
              min-h-[108px]
              px-4
              rounded-2xl
              border
              border-dashed
              border-gray-200
              bg-gray-50/70
              hover:bg-gray-50
              hover:border-green-200
              cursor-pointer
              transition-all
            "
          >

            <FileJson
              size={22}
              className="text-gray-300 mb-2"
            />

            <p className="text-xs font-semibold text-gray-600">
              {file
                ? file.name
                : "Choose a backup file"}
            </p>

            <p className="text-[10px] text-gray-400 mt-1">
              JSON files only
            </p>

            <input
              type="file"
              accept=".json"
              onChange={(e) =>
                setFile(e.target.files[0])
              }
              className="hidden"
            />

          </label>

          {/* RESTORE */}

          <button
            onClick={() => handleRestore(file)}
            disabled={!file || loadingRestore}
            className="
              mt-5
              w-full
              flex
              items-center
              justify-center
              gap-2
              px-4
              py-2.5
              rounded-xl
              bg-gray-900
              hover:bg-gray-800
              disabled:bg-gray-300
              disabled:text-gray-500
              disabled:cursor-not-allowed
              text-white
              text-sm
              font-semibold
              shadow-sm
              transition-all
              duration-200
            "
          >

            <Upload size={16} />

            {loadingRestore
              ? "Restoring..."
              : "Restore Backup"}

          </button>

        </section>

      </div>

      {/* =====================================================
          BACKUP HISTORY
      ===================================================== */}

      <section
        className="
          bg-white
          border
          border-gray-100
          rounded-3xl
          shadow-[0_4px_24px_rgba(0,0,0,0.025)]
          overflow-hidden
        "
      >

        {/* HEADER */}

        <div className="p-6 border-b border-gray-100">

          <div className="flex items-center justify-between">

            <div>

              <h2 className="text-sm font-bold text-gray-900">
                Backup History
              </h2>

              <p className="text-xs text-gray-400 mt-1">
                Review previously created system snapshots.
              </p>

            </div>

            <div
              className="
                w-9
                h-9
                rounded-xl
                bg-green-50
                text-green-600
                flex
                items-center
                justify-center
              "
            >
              <Clock3 size={16} />
            </div>

          </div>

        </div>

        {/* TABLE */}

        <div className="overflow-x-auto">

          <table className="w-full text-sm">

            <thead>

              <tr className="bg-gray-50/70 border-b border-gray-100">

                <th
                  className="
                    px-6
                    py-3.5
                    text-left
                    text-[10px]
                    font-bold
                    uppercase
                    tracking-wider
                    text-gray-400
                    whitespace-nowrap
                  "
                >
                  Date & Time
                </th>

                <th
                  className="
                    px-6
                    py-3.5
                    text-left
                    text-[10px]
                    font-bold
                    uppercase
                    tracking-wider
                    text-gray-400
                  "
                >
                  Type
                </th>

                <th
                  className="
                    px-6
                    py-3.5
                    text-left
                    text-[10px]
                    font-bold
                    uppercase
                    tracking-wider
                    text-gray-400
                  "
                >
                  Status
                </th>

                <th
                  className="
                    px-6
                    py-3.5
                    text-left
                    text-[10px]
                    font-bold
                    uppercase
                    tracking-wider
                    text-gray-400
                  "
                >
                  Action
                </th>

              </tr>

            </thead>

            <tbody className="divide-y divide-gray-100">

              {backups.length === 0 ? (

                <tr>

                  <td colSpan="4">

                    <div
                      className="
                        py-14
                        flex
                        flex-col
                        items-center
                        justify-center
                        text-center
                      "
                    >

                      <div
                        className="
                          w-12
                          h-12
                          rounded-2xl
                          bg-gray-50
                          flex
                          items-center
                          justify-center
                          mb-3
                        "
                      >

                        <Database
                          size={21}
                          className="text-gray-300"
                        />

                      </div>

                      <p className="text-sm font-semibold text-gray-700">
                        No backups yet
                      </p>

                      <p className="text-xs text-gray-400 mt-1 max-w-[280px]">
                        Create your first backup to see it listed here.
                      </p>

                    </div>

                  </td>

                </tr>

              ) : (

                backups.map((backup) => (

                  <BackupRow
                    key={backup.id}
                    backup={backup}
                    onExport={() =>
                      exportBackup(backup)
                    }
                  />

                ))

              )}

            </tbody>

          </table>

        </div>

      </section>

    </div>
  );
};

export default BackupRecovery;

/* =========================================================
   SUMMARY CARD
========================================================= */

const BackupSummary = ({
  icon,
  label,
  value,
  description,
}) => (
  <div
    className="
      bg-white
      border
      border-gray-100
      rounded-3xl
      p-5
      shadow-[0_4px_24px_rgba(0,0,0,0.025)]
    "
  >

    <div className="flex items-start justify-between">

      <div>

        <p className="text-xs font-semibold text-gray-400">
          {label}
        </p>

        <p className="text-xl font-extrabold tracking-tight text-gray-900 mt-2">
          {value}
        </p>

      </div>

      <div
        className="
          w-10
          h-10
          rounded-xl
          bg-green-50
          text-green-600
          flex
          items-center
          justify-center
        "
      >
        {icon}
      </div>

    </div>

    <p className="text-[11px] text-gray-400 mt-4">
      {description}
    </p>

    <div className="mt-4 h-1 w-10 rounded-full bg-green-500" />

  </div>
);

/* =========================================================
   BACKUP ROW
========================================================= */

const BackupRow = ({
  backup,
  onExport,
}) => (
  <tr className="group hover:bg-gray-50/70 transition-colors">

    {/* DATE */}

    <td className="px-6 py-4 whitespace-nowrap">

      <div className="flex items-center gap-3">

        <div
          className="
            w-9
            h-9
            rounded-xl
            bg-gray-50
            border
            border-gray-100
            flex
            items-center
            justify-center
            flex-shrink-0
          "
        >
          <Clock3
            size={15}
            className="text-gray-400"
          />
        </div>

        <div>

          <p className="text-xs font-semibold text-gray-700">
            {new Date(
              backup.createdAt
            ).toLocaleDateString()}
          </p>

          <p className="text-[10px] text-gray-400 mt-0.5">
            {new Date(
              backup.createdAt
            ).toLocaleTimeString()}
          </p>

        </div>

      </div>

    </td>

    {/* TYPE */}

    <td className="px-6 py-4">

      <span
        className="
          inline-flex
          items-center
          gap-1.5
          px-2.5
          py-1
          rounded-lg
          bg-green-50
          border
          border-green-100
          text-[10px]
          font-bold
          text-green-700
        "
      >

        <FileArchive size={12} />

        {backup.action}

      </span>

    </td>

    {/* STATUS */}

    <td className="px-6 py-4">

      <span
        className="
          inline-flex
          items-center
          gap-1.5
          px-2.5
          py-1
          rounded-lg
          bg-green-50
          border
          border-green-100
          text-[10px]
          font-bold
          text-green-600
        "
      >

        <CheckCircle2 size={12} />

        Active

      </span>

    </td>

    {/* ACTION */}

    <td className="px-6 py-4">

      <button
        onClick={onExport}
        className="
          inline-flex
          items-center
          gap-2
          px-3
          py-2
          rounded-xl
          text-xs
          font-semibold
          text-green-600
          bg-green-50
          hover:bg-green-100
          border
          border-green-100
          transition-all
        "
      >

        <RefreshCcw size={14} />

        Export

      </button>

    </td>

  </tr>
);
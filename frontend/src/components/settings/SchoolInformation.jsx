import { School, Lock } from "lucide-react";

const SchoolInformation = ({ darkMode = false }) => {
  return (
    <div
      className={`w-full transition-colors duration-200 ${
        darkMode ? "text-gray-100" : "text-gray-900"
      }`}
    >
      {/* =====================================================
          SECTION HEADER
      ===================================================== */}
      <div className="flex items-center justify-between gap-6 mb-8">
        <div className="flex items-center gap-4">
          {/* ICON */}
          <div
            className={`w-11 h-11 rounded-xl border flex items-center justify-center flex-shrink-0 transition-colors duration-200 ${
              darkMode
                ? "bg-green-950/50 text-green-400 border-green-900/60"
                : "bg-green-50 text-green-600 border-green-100"
            }`}
          >
            <School size={20} strokeWidth={2.1} />
          </div>

          {/* TITLE */}
          <div>
            <h1
              className={`text-xl font-black tracking-tight transition-colors duration-200 ${
                darkMode ? "text-white" : "text-gray-900"
              }`}
            >
              School Information
            </h1>

            <p
              className={`text-sm mt-1 transition-colors duration-200 ${
                darkMode ? "text-gray-400" : "text-gray-400"
              }`}
            >
              Official school details used across the system.
            </p>
          </div>
        </div>

        {/* STATUS */}
        <div
          className={`hidden sm:flex items-center gap-2 px-3 py-2 rounded-xl border transition-colors duration-200 ${
            darkMode
              ? "bg-gray-900/70 border-gray-800"
              : "bg-gray-50 border-gray-100"
          }`}
        >
          <Lock
            size={13}
            className={darkMode ? "text-gray-500" : "text-gray-400"}
          />

          <span
            className={`text-xs font-medium ${
              darkMode ? "text-gray-400" : "text-gray-500"
            }`}
          >
            Read Only
          </span>
        </div>
      </div>

      {/* =====================================================
          READ-ONLY NOTICE
      ===================================================== */}
      <div
        className={`mb-8 flex items-start gap-3 px-4 py-3.5 rounded-xl border transition-colors duration-200 ${
          darkMode
            ? "bg-amber-950/30 border-amber-900/50"
            : "bg-amber-50 border-amber-100"
        }`}
      >
        <Lock
          size={17}
          strokeWidth={2}
          className={`mt-0.5 flex-shrink-0 ${
            darkMode ? "text-amber-400" : "text-amber-600"
          }`}
        />

        <div>
          <p
            className={`text-sm font-semibold ${
              darkMode ? "text-amber-300" : "text-amber-800"
            }`}
          >
            School information is read-only
          </p>

          <p
            className={`text-xs mt-0.5 ${
              darkMode ? "text-amber-400/80" : "text-amber-700"
            }`}
          >
            These details are official school records and cannot be edited
            from the system.
          </p>
        </div>
      </div>

      {/* =====================================================
          FORM
      ===================================================== */}
      <div className="space-y-8">
        {/* ===================================================
            BASIC DETAILS
        =================================================== */}
        <section
          className={`border rounded-2xl overflow-hidden transition-colors duration-200 ${
            darkMode
              ? "bg-[#0D1712] border-gray-800"
              : "bg-white border-gray-100"
          }`}
        >
          {/* SECTION HEADER */}
          <div
            className={`px-5 py-4 border-b transition-colors duration-200 ${
              darkMode
                ? "bg-[#111D17] border-gray-800"
                : "bg-gray-50/70 border-gray-100"
            }`}
          >
            <h2
              className={`text-sm font-bold ${
                darkMode ? "text-white" : "text-gray-900"
              }`}
            >
              Basic Details
            </h2>

            <p
              className={`text-xs mt-0.5 ${
                darkMode ? "text-gray-500" : "text-gray-400"
              }`}
            >
              Primary contact information for the school.
            </p>
          </div>

          {/* FIELDS */}
          <div className="p-5">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Field
                label="School Name"
                value="Our Lady of the Holy Rosary School"
                darkMode={darkMode}
              />

              <Field
                label="Contact Number"
                value="09XXXXXXXXX"
                darkMode={darkMode}
              />

              <Field
                label="Email Address"
                value="school@email.com"
                type="email"
                darkMode={darkMode}
              />
            </div>
          </div>
        </section>

        {/* ===================================================
            ADDITIONAL INFORMATION
        =================================================== */}
        <section
          className={`border rounded-2xl overflow-hidden transition-colors duration-200 ${
            darkMode
              ? "bg-[#0D1712] border-gray-800"
              : "bg-white border-gray-100"
          }`}
        >
          {/* SECTION HEADER */}
          <div
            className={`px-5 py-4 border-b transition-colors duration-200 ${
              darkMode
                ? "bg-[#111D17] border-gray-800"
                : "bg-gray-50/70 border-gray-100"
            }`}
          >
            <h2
              className={`text-sm font-bold ${
                darkMode ? "text-white" : "text-gray-900"
              }`}
            >
              Additional Information
            </h2>

            <p
              className={`text-xs mt-0.5 ${
                darkMode ? "text-gray-500" : "text-gray-400"
              }`}
            >
              Additional details displayed throughout the system.
            </p>
          </div>

          {/* FIELDS */}
          <div className="p-5 space-y-6">
            <Field
              label="School Address"
              value="General Trias, Cavite"
              darkMode={darkMode}
            />

            <div>
              <label
                className={`block text-sm font-semibold mb-2 ${
                  darkMode ? "text-gray-300" : "text-gray-700"
                }`}
              >
                School Details
              </label>

              <div className="relative">
                <textarea
                  rows={6}
                  value="Our Lady of the Holy Rosary School - General Trias Campus"
                  readOnly
                  className={`w-full border rounded-xl px-4 py-3 pr-11 text-sm resize-none cursor-not-allowed focus:outline-none transition-colors duration-200 ${
                    darkMode
                      ? "bg-[#101B15] border-gray-800 text-gray-300 placeholder-gray-600"
                      : "bg-gray-50 border-gray-200 text-gray-600"
                  }`}
                />

                <Lock
                  size={15}
                  className={`absolute right-4 top-4 ${
                    darkMode ? "text-gray-500" : "text-gray-400"
                  }`}
                />
              </div>

              <p
                className={`text-[11px] mt-2 ${
                  darkMode ? "text-gray-500" : "text-gray-400"
                }`}
              >
                This information is maintained as an official school record.
              </p>
            </div>
          </div>
        </section>
      </div>

      {/* =====================================================
          READ-ONLY FOOTER
      ===================================================== */}
      <div
        className={`mt-8 pt-5 border-t flex items-center justify-between gap-4 transition-colors duration-200 ${
          darkMode ? "border-gray-800" : "border-gray-100"
        }`}
      >
        <div className="flex items-center gap-2">
          <Lock
            size={14}
            className={darkMode ? "text-gray-500" : "text-gray-400"}
          />

          <p
            className={`text-xs ${
              darkMode ? "text-gray-500" : "text-gray-400"
            }`}
          >
            School information is managed by the system administrator.
          </p>
        </div>

        <span
          className={`hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[11px] font-semibold transition-colors duration-200 ${
            darkMode
              ? "bg-gray-900/70 border-gray-800 text-gray-400"
              : "bg-gray-50 border-gray-100 text-gray-500"
          }`}
        >
          <Lock size={11} />
          Read Only
        </span>
      </div>
    </div>
  );
};

export default SchoolInformation;

/* =========================================================
   READ-ONLY FIELD COMPONENT
========================================================= */

const Field = ({
  label,
  value,
  type = "text",
  darkMode = false,
}) => {
  return (
    <div>
      <label
        className={`block text-sm font-semibold mb-2 ${
          darkMode ? "text-gray-300" : "text-gray-700"
        }`}
      >
        {label}
      </label>

      <div className="relative">
        <input
          type={type}
          value={value}
          readOnly
          className={`w-full border rounded-xl px-4 py-3 pr-11 text-sm cursor-not-allowed focus:outline-none transition-colors duration-200 ${
            darkMode
              ? "bg-[#101B15] border-gray-800 text-gray-300"
              : "bg-gray-50 border-gray-200 text-gray-600"
          }`}
        />

        <Lock
          size={14}
          className={`absolute right-4 top-1/2 -translate-y-1/2 ${
            darkMode ? "text-gray-500" : "text-gray-400"
          }`}
        />
      </div>
    </div>
  );
};
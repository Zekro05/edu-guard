import React, { useState } from "react";
import { Smartphone } from "lucide-react";

const StatusBadge = ({ status }) => {
  const colors = {
    pending: "bg-yellow-100 text-yellow-700",
    accepted: "bg-green-100 text-green-700",
    rejected: "bg-red-100 text-red-700",
  };
  return (
    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${colors[status]}`}>
      {status.toUpperCase()}
    </span>
  );
};

const MobileReport = ({ report, onAccept, onReject }) => {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* ✅ CARD VIEW */}
      <div
        onClick={() => setOpen(true)}
        className="bg-white rounded-xl border p-4 shadow-sm hover:shadow-md cursor-pointer transition"
      >
        <div className="flex justify-between items-center">
          <h3 className="flex items-center gap-2 font-semibold text-md">
            <Smartphone className="text-green-700" size={18} />
            {report.studentName}
          </h3>
          <StatusBadge status={report.status} />
        </div>

        <p className="text-sm text-gray-600 mt-2">{report.offense}</p>

        <div className="flex justify-between text-xs text-gray-500 mt-3">
          <span>{report.date}</span>
          <span>{report.time}</span>
        </div>
      </div>

      {/* ✅ MODAL VIEW */}
      {open && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl shadow-lg relative">
            
            {/* CLOSE BUTTON */}
            <button
              onClick={() => setOpen(false)}
              className="absolute top-3 right-3 text-gray-500 hover:text-black"
            >
              ✕
            </button>

            {/* HEADER */}
            <div className="flex justify-between mb-4">
              <h3 className="flex items-center gap-2 font-semibold text-lg">
                <Smartphone className="text-green-700" size={22} />
                Mobile Report
              </h3>
              <StatusBadge status={report.status} />
            </div>

            {/* FORM DETAILS */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormRow label="Student Name" value={report.studentName} />
              <FormRow label="Offense" value={report.offense} />
              <FormRow label="Location" value={report.location} />
              <FormRow label="Date" value={report.date} />
              <FormRow label="Time" value={report.time} />
            </div>

            <FormTextArea label="Description" value={report.description} />

            {/* ACTION BUTTONS */}
            {report.status === "pending" && (
              <div className="mt-6 flex gap-3">
                <button
                  onClick={() => {
                    onAccept(report._id);
                    setOpen(false);
                  }}
                  className="bg-green-700 text-white px-4 py-2 rounded hover:bg-green-800"
                >
                  ACCEPT
                </button>
                <button
                  onClick={() => {
                    onReject(report._id);
                    setOpen(false);
                  }}
                  className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
                >
                  REJECT
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default MobileReport;

/* REUSABLE COMPONENTS */
const FormRow = ({ label, value }) => (
  <div className="flex flex-col">
    <label className="text-sm font-medium mb-1">{label}</label>
    <input value={value} readOnly className="w-full p-2 bg-gray-100 rounded border border-gray-200" />
  </div>
);

const FormTextArea = ({ label, value }) => (
  <div className="flex flex-col mt-2">
    <label className="text-sm font-medium mb-1">{label}</label>
    <textarea value={value} readOnly className="w-full p-2 bg-gray-100 rounded border border-gray-200 h-24" />
  </div>
);
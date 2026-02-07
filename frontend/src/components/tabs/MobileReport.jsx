// src/components/tabs/MobileReport.jsx
import React from "react";
import { Smartphone } from 'lucide-react';

const MobileReport = () => {
  return (
    <div className="bg-white rounded-xl border border-black p-6">
      
      <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
        <Smartphone className="text-green-700" size={22} /> Mobile Report
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormRow label="Student Name *" value="Garcia Ana Lisa D." />
        <FormRow label="Offense Type *" value="Improper Uniform" />
        <FormRow label="Location *" value="Room 101" />
        <FormRow label="Date Incident *" value="25/01/26" />
        <FormRow label="Time" value="12:02 PM" />
      </div>

      <FormTextArea
        label="Incident Description *"
        value="Wearing unauthorized accessories and improper uniform modification. Second violation this semester..."
      />

      <div className="mt-4">
        <button className="px-4 py-2 bg-blue-500 text-white font-semibold rounded hover:bg-blue-600 transition">
          ACCEPT
        </button>
      </div>
    </div>
  );
};

export default MobileReport;

/* ===== Helper Components ===== */
const FormRow = ({ label, value }) => (
  <div className="flex flex-col">
    <label className="text-sm font-medium mb-1">{label}</label>
    <input
      type="text"
      value={value}
      readOnly
      className="w-full p-2 bg-gray-100 rounded border border-gray-200"
    />
  </div>
);

const FormTextArea = ({ label, value }) => (
  <div className="flex flex-col mt-2">
    <label className="text-sm font-medium mb-1">{label}</label>
    <textarea
      value={value}
      readOnly
      className="w-full p-2 bg-gray-100 rounded border border-gray-200 h-24"
    ></textarea>
  </div>
);

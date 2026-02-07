import React, { useState } from "react";

const IncidentReport = () => {
  const [form, setForm] = useState({
    student: "",
    offense: "",
    location: "",
    description: "",
    date: "",
    time: "",
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = () => {
    console.log(form);
    // Handle submission
  };

  return (
    <div className="bg-white rounded-xl border border-black shadow-md p-6">

      <h3 className="font-semibold text-lg mb-4">Incident Report</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <FormRow label="Student Name *" name="student" value={form.student} onChange={handleChange} placeholder="Student" />
        <FormRow label="Offense Type *" name="offense" value={form.offense} onChange={handleChange} placeholder="Offense" />
        <FormRow label="Location *" name="location" value={form.location} onChange={handleChange} placeholder="e.g., Room 711" />
        <FormRow label="Date Incident *" name="date" value={form.date} onChange={handleChange} placeholder="DD/MM/YY" />
        <FormRow label="Time" name="time" value={form.time} onChange={handleChange} placeholder="HH:MM AM/PM" />
      </div>

      <FormTextArea label="Incident Description *" name="description" value={form.description} onChange={handleChange} placeholder="Detailed description..." />

      <div className="mt-4">
        <button
          onClick={handleSubmit}
          className="px-4 py-2 bg-blue-500 text-white font-semibold rounded hover:bg-blue-600 transition"
        >
          Submit Report
        </button>
      </div>
    </div>
  );
};

export default IncidentReport;

/* ===== Helper Components ===== */
const FormRow = ({ label, name, value, onChange, placeholder }) => (
  <div className="flex flex-col">
    <label className="text-sm font-medium mb-1">{label}</label>
    <input
      type="text"
      name={name}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className="w-full p-2 bg-gray-50 rounded border border-gray-300 focus:ring-1 focus:ring-green-600 focus:outline-none"
    />
  </div>
);

const FormTextArea = ({ label, name, value, onChange, placeholder }) => (
  <div className="flex flex-col mt-2">
    <label className="text-sm font-medium mb-1">{label}</label>
    <textarea
      name={name}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className="w-full p-2 bg-gray-50 rounded border border-gray-300 focus:ring-1 focus:ring-green-600 focus:outline-none h-24"
    ></textarea>
  </div>
);
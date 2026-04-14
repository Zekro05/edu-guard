import React, { useState, useEffect, useRef } from "react";
import axios from "axios";

const IncidentReport = () => {
  const [form, setForm] = useState({
    student: "",
    studentId: "",
    offense: "",
    location: "",
    description: "",
    date: "",
    time: "",
  });

  const [search, setSearch] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const abortRef = useRef(null);

  // ===== DEBOUNCED SEARCH =====
  useEffect(() => {
    if (!search.trim()) {
      setResults([]);
      return;
    }

    const delay = setTimeout(() => {
      fetchStudents(search);
    }, 300);

    return () => clearTimeout(delay);
  }, [search]);

  const fetchStudents = async (value) => {
    try {
      setLoading(true);

      if (abortRef.current) {
        abortRef.current.abort();
      }

      const controller = new AbortController();
      abortRef.current = controller;

      const res = await axios.get(
        `/api/students/search?query=${value}`,
        { signal: controller.signal }
      );

      setResults(res.data);
    } catch (err) {
      if (err.name !== "CanceledError") {
        console.log(err);
      }
    } finally {
      setLoading(false);
    }
  };

  // ===== SELECT STUDENT =====
  const handleSelectStudent = (student) => {
    setSearch(student.fullname);

    setForm((prev) => ({
      ...prev,
      student: student.fullname,
      studentId: student._id,
    }));

    setResults([]);
  };

  // ===== FORM INPUT HANDLER =====
  const handleChange = (e) => {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  // ===== SEARCH INPUT HANDLER =====
  const handleSearchChange = (value) => {
    setSearch(value);

    setForm((prev) => ({
      ...prev,
      student: value,
      studentId: "",
    }));
  };

  const handleSubmit = () => {
    console.log(form);
  };

  return (
    <div className="bg-white rounded-xl border border-black shadow-md p-6">

      <h3 className="font-semibold text-lg mb-4">
        Incident Report
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">

        {/* ===== STUDENT SEARCH ===== */}
        <div className="flex flex-col relative z-50">
          <label className="text-sm font-medium mb-1">
            Student Name *
          </label>

          <input
            type="text"
            value={search}
            placeholder="Search student..."
            onChange={(e) => handleSearchChange(e.target.value)}
            autoComplete="off"
            className="w-full p-2 bg-gray-50 rounded border border-gray-300 focus:ring-1 focus:ring-green-600 focus:outline-none"
          />

          {(search && (results.length > 0 || loading)) && (
            <div className="absolute top-full left-0 right-0 bg-white border border-gray-300 rounded shadow-lg z-[9999] max-h-48 overflow-y-auto">

              {loading && (
                <div className="p-2 text-sm text-gray-500">
                  Searching...
                </div>
              )}

              {!loading &&
                results.map((student) => (
                  <div
                    key={student._id}
                    onClick={() => handleSelectStudent(student)}
                    className="p-2 hover:bg-gray-100 cursor-pointer"
                  >
                    {student.fullname}
                  </div>
                ))}

              {!loading && results.length === 0 && (
                <div className="p-2 text-sm text-gray-500">
                  No students found
                </div>
              )}
            </div>
          )}
        </div>

        {/* ===== OFFENSE ===== */}
        <FormRow
          label="Offense Type *"
          name="offense"
          value={form.offense}
          onChange={handleChange}
          placeholder="Offense"
        />

        {/* ===== LOCATION ===== */}
        <FormRow
          label="Location *"
          name="location"
          value={form.location}
          onChange={handleChange}
          placeholder="e.g., Room 711"
        />

        {/* ===== DATE ===== */}
        <FormRow
          label="Date Incident *"
          name="date"
          value={form.date}
          onChange={handleChange}
          placeholder="DD/MM/YY"
        />

        {/* ===== TIME ===== */}
        <FormRow
          label="Time"
          name="time"
          value={form.time}
          onChange={handleChange}
          placeholder="HH:MM AM/PM"
        />
      </div>

      {/* ===== DESCRIPTION ===== */}
      <FormTextArea
        label="Incident Description *"
        name="description"
        value={form.description}
        onChange={handleChange}
        placeholder="Detailed description..."
      />

      {/* ===== SUBMIT ===== */}
      <div className="mt-6">
        <button
          onClick={handleSubmit}
          className="bg-green-700 text-white px-5 py-2 rounded-md text-sm hover:bg-green-800 transition"
        >
          SUBMIT REPORT
        </button>
      </div>
    </div>
  );
};

export default IncidentReport;

/* ===== FORM COMPONENTS ===== */

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
    />
  </div>
);
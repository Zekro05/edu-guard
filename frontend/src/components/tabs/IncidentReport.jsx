import React, { useState, useEffect, useRef, useCallback, memo } from "react";
import axios from "axios";
import { Search } from "lucide-react";

/* ================= MAIN ================= */
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
  const debounceRef = useRef(null);

  /* ================= DEBOUNCED SEARCH ================= */
  useEffect(() => {
    if (!search.trim()) {
      setResults([]);
      return;
    }

    clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(() => {
      fetchStudents(search);
    }, 300);

    return () => clearTimeout(debounceRef.current);
  }, [search]);

  /* ================= FETCH STUDENTS (SAFE) ================= */
  const fetchStudents = useCallback(async (value) => {
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

      setResults(res.data || []);
    } catch (err) {
      if (err.name !== "CanceledError") {
        console.log(err);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  /* ================= SELECT STUDENT ================= */
  const handleSelectStudent = (student) => {
    setSearch(student.fullname);

    setForm((prev) => ({
      ...prev,
      student: student.fullname,
      studentId: student._id,
    }));

    setResults([]);
  };

  /* ================= FORM ================= */
  const handleChange = (e) => {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = () => {
    console.log(form);
  };

  return (
    <div className="bg-white/5 border border-white/10 backdrop-blur-xl rounded-2xl p-6 text-white">

      {/* TITLE */}
      <h3 className="text-lg font-semibold text-green-400 mb-6">
        Incident Report
      </h3>

      {/* GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        {/* ===== STUDENT SEARCH ===== */}
        <div className="relative z-50">

          <label className="text-sm text-gray-300 mb-1 block">
            Student Name *
          </label>

          <div className="flex items-center bg-white/10 px-3 py-2 rounded-xl border border-white/10">
            <Search size={16} className="text-gray-400" />
            <input
              value={search}
              placeholder="Search student..."
              onChange={(e) => setSearch(e.target.value)}
              className="bg-transparent ml-2 w-full outline-none text-white"
              autoComplete="off"
            />
          </div>

          {/* DROPDOWN */}
          {search && (results.length > 0 || loading) && (
            <div className="absolute mt-2 w-full bg-gray-900 border border-white/10 rounded-xl shadow-xl max-h-56 overflow-y-auto z-50">

              {loading && (
                <div className="p-3 text-sm text-gray-400">
                  Searching...
                </div>
              )}

              {!loading &&
                results.map((student) => (
                  <div
                    key={student._id}
                    onClick={() => handleSelectStudent(student)}
                    className="p-3 hover:bg-white/10 cursor-pointer text-sm"
                  >
                    {student.fullname}
                  </div>
                ))}

              {!loading && results.length === 0 && (
                <div className="p-3 text-sm text-gray-500">
                  No students found
                </div>
              )}
            </div>
          )}
        </div>

        {/* OFFENSE */}
        <Input
          label="Offense Type *"
          name="offense"
          value={form.offense}
          onChange={handleChange}
        />

        {/* LOCATION */}
        <Input
          label="Location *"
          name="location"
          value={form.location}
          onChange={handleChange}
        />

        {/* DATE */}
        <Input
          label="Date Incident *"
          name="date"
          value={form.date}
          onChange={handleChange}
        />

        {/* TIME */}
        <Input
          label="Time"
          name="time"
          value={form.time}
          onChange={handleChange}
        />

      </div>

      {/* DESCRIPTION */}
      <div className="mt-4">
        <label className="text-sm text-gray-300 mb-1 block">
          Incident Description *
        </label>

        <textarea
          name="description"
          value={form.description}
          onChange={handleChange}
          placeholder="Detailed description..."
          className="w-full bg-white/10 border border-white/10 rounded-xl p-3 h-28 outline-none text-white"
        />
      </div>

      {/* SUBMIT */}
      <div className="mt-6 flex justify-end">
        <button
          onClick={handleSubmit}
          className="px-5 py-2 bg-green-500 hover:bg-green-600 rounded-xl text-white font-medium transition"
        >
          Submit Report
        </button>
      </div>

    </div>
  );
};

export default memo(IncidentReport);

/* ================= INPUT COMPONENT ================= */
const Input = memo(({ label, name, value, onChange }) => (
  <div>
    <label className="text-sm text-gray-300 mb-1 block">{label}</label>

    <input
      name={name}
      value={value}
      onChange={onChange}
      className="w-full bg-white/10 border border-white/10 rounded-xl px-3 py-2 outline-none text-white"
    />
  </div>
));
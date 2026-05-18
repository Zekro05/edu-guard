import React, { useState, useEffect, useRef, useCallback, memo } from "react";
import { Search, Paperclip, UploadCloud } from "lucide-react";
import toast from "react-hot-toast";
import { API } from "../../store/authStore";

/* ================= THEME ================= */
const C = {
  primary: "#1B5E20",
  bg: "#F8FAFC",
  surface: "#ffffff",
  border: "#E5E7EB",
  text: "#111827",
  muted: "#6B7280",
};

/* ================= MAIN ================= */
const IncidentReport = () => {
  const [form, setForm] = useState({
    student: "",
    studentId: "",
    studentName: "",
    offense: "",
    location: "",
    description: "",
  });

  const [search, setSearch] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const [files, setFiles] = useState([]);
  const fileRef = useRef(null);

  const abortRef = useRef(null);
  const debounceRef = useRef(null);

  /* ================= DATE/TIME ================= */
  const getDateTime = () => {
    const now = new Date();
    return {
      date: now.toISOString().split("T")[0],
      time: now.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };
  };

  /* ================= SEARCH ================= */
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

  const fetchStudents = useCallback(async (value) => {
    try {
      setLoading(true);

      if (abortRef.current) abortRef.current.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      const res = await API.get(
        `/api/students/search?query=${value}`,
        { signal: controller.signal }
      );

      setResults(res.data || []);
    } finally {
      setLoading(false);
    }
  }, []);

  /* ================= SELECT STUDENT ================= */
  const handleSelectStudent = (student) => {
    const fullName = `${student.firstName} ${student.lastName}`;

    setSearch(fullName);

    setForm((prev) => ({
      ...prev,
      student: fullName,
      studentName: fullName,
      studentId: student._id,
    }));

    setResults([]);
  };

  const handleChange = (e) => {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  /* ================= FILES ================= */
  const handleFiles = (e) => {
    setFiles(Array.from(e.target.files));
  };

  const removeFile = (index) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  /* ================= SUBMIT ================= */
  const handleSubmit = async () => {
    try {
      const { date, time } = getDateTime();

      if (!form.studentId || !form.offense || !form.location || !form.description) {
        toast.error("Please fill all required fields");
        return;
      }

      const formData = new FormData();

      formData.append("studentId", form.studentId);
      formData.append("studentName", form.studentName);
      formData.append("offense", form.offense);
      formData.append("location", form.location);
      formData.append("description", form.description);
      formData.append("date", date);
      formData.append("time", time);
      formData.append("reporter", "Teacher");

      files.forEach((file) => formData.append("evidence", file));

      await API.post("/api/reports", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      toast.success("Report submitted!");

      setFiles([]);
      setSearch("");
      setForm({
        student: "",
        studentId: "",
        studentName: "",
        offense: "",
        location: "",
        description: "",
      });

      if (fileRef.current) fileRef.current.value = "";
    } catch (err) {
      toast.error("Failed to submit report");
    }
  };

  /* ================= UI ================= */
  return (
    <div
      className="rounded-2xl border p-6"
      style={{
        background: C.surface,
        borderColor: C.border,
      }}
    >

      {/* HEADER */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900">
          Incident Report Form
        </h3>
        <p className="text-sm text-gray-500">
          Submit student incident details for review
        </p>
      </div>

      {/* STUDENT SEARCH */}
      <div className="relative mb-5">
        <label className="text-xs text-gray-500">Student *</label>

        <div className="relative mt-1">
          <Search size={14} className="absolute left-3 top-3 text-gray-400" />

          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search student..."
            className="w-full pl-9 pr-3 py-2 rounded-xl border outline-none"
            style={{
              borderColor: C.border,
              background: "#F9FAFB",
            }}
          />
        </div>

        {/* DROPDOWN */}
        {search && (results.length > 0 || loading) && (
          <div
            className="absolute w-full mt-2 rounded-xl border max-h-52 overflow-y-auto shadow-md z-50"
            style={{
              background: C.surface,
              borderColor: C.border,
            }}
          >
            {loading && (
              <p className="p-3 text-sm text-gray-500">Searching...</p>
            )}

            {!loading &&
              results.map((s) => (
                <div
                  key={s._id}
                  onClick={() => handleSelectStudent(s)}
                  className="p-3 hover:bg-gray-50 cursor-pointer text-sm"
                >
                  {s.firstName} {s.lastName}
                </div>
              ))}
          </div>
        )}
      </div>

      {/* INPUT GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Offense" name="offense" value={form.offense} onChange={handleChange} />
        <Field label="Location" name="location" value={form.location} onChange={handleChange} />
      </div>

      {/* DESCRIPTION */}
      <div className="mt-4">
        <label className="text-xs text-gray-500">Description</label>
        <textarea
          name="description"
          value={form.description}
          onChange={handleChange}
          rows={4}
          className="w-full mt-1 p-3 rounded-xl border outline-none"
          style={{
            background: "#F9FAFB",
            borderColor: C.border,
          }}
        />
      </div>

      {/* FILE UPLOAD */}
      <div className="mt-5">
        <label className="text-xs text-gray-500 flex items-center gap-2">
          <Paperclip size={14} /> Evidence
        </label>

        <div className="mt-2 flex items-center gap-3">
          <input
            ref={fileRef}
            type="file"
            multiple
            onChange={handleFiles}
            className="text-sm"
          />
        </div>

        {/* PREVIEW */}
        {files.length > 0 && (
          <div className="flex gap-3 mt-3 flex-wrap">
            {files.map((file, i) => (
              <div key={i} className="relative">
                <img
                  src={URL.createObjectURL(file)}
                  className="w-16 h-16 rounded-lg object-cover border"
                />
                <button
                  onClick={() => removeFile(i)}
                  className="absolute -top-2 -right-2 bg-red-500 text-white text-xs px-1 rounded"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* SUBMIT */}
      <button
        onClick={handleSubmit}
        className="mt-6 w-full py-2 rounded-xl font-medium transition"
        style={{
          background: C.primary,
          color: "white",
        }}
      >
        <UploadCloud size={16} className="inline mr-2" />
        Submit Report
      </button>
    </div>
  );
};

export default memo(IncidentReport);

/* ================= FIELD ================= */
const Field = memo(({ label, name, value, onChange }) => (
  <div>
    <label className="text-xs text-gray-500">{label}</label>
    <input
      name={name}
      value={value}
      onChange={onChange}
      className="w-full mt-1 px-3 py-2 rounded-xl border outline-none"
      style={{
        background: "#F9FAFB",
        borderColor: "#E5E7EB",
      }}
    />
  </div>
));
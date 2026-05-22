import React, { useState, useEffect, useRef, useCallback, memo } from "react";
import { Search } from "lucide-react";
import toast from "react-hot-toast";
import { API } from "../../lib/api";

/* ================= THEME ================= */
const C = {
  primary: "#1B5E20",
  surface: "#ffffff",
  bg: "#F8FAFC",
  border: "#E5E7EB",
  text: "#111827",
  muted: "#6B7280",
};

/* ================= MAIN ================= */
const ComplaintReport = () => {
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

  /* ================= SUBMIT ================= */
  const handleSubmit = async () => {
    try {
      if (!form.studentId || !form.offense || !form.location || !form.description) {
        toast.error("Please fill all required fields");
        return;
      }

      const { date, time } = getDateTime();

      await API.post("/api/reports", {
  studentId: selectedStudent._id,
  studentName: `${selectedStudent.firstName} ${selectedStudent.lastName}`,
  offense: finalIncidentType,
  location: finalLocation,
  description,
  date: formatDate(date),
  time: formatTime(date),
  reporter: isAnonymous ? "Anonymous" : "Guest",
  evidence: uploadedUrls, // 👈 CLOUDINARY URLs ONLY
});

      toast.success("Complaint submitted successfully!");

      setForm({
        student: "",
        studentId: "",
        studentName: "",
        offense: "",
        location: "",
        description: "",
      });

      setSearch("");
    } catch (err) {
      toast.error("Failed to submit complaint");
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
          Complaint Report Form
        </h3>
        <p className="text-sm text-gray-500">
          File a formal complaint against a student
        </p>
      </div>

      {/* GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        {/* STUDENT SEARCH */}
        <div className="relative">
          <label className="text-xs text-gray-500">Student *</label>

          <div className="relative mt-1">
            <Search size={14} className="absolute left-3 top-3 text-gray-400" />

            <input
              value={search}
              placeholder="Search student..."
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl border outline-none"
              style={{
                background: "#F9FAFB",
                borderColor: C.border,
              }}
            />
          </div>

          {/* DROPDOWN */}
          {search && (results.length > 0 || loading) && (
            <div
              className="absolute mt-2 w-full rounded-xl border max-h-52 overflow-y-auto shadow-md z-50"
              style={{
                background: C.surface,
                borderColor: C.border,
              }}
            >
              {loading && (
                <p className="p-3 text-sm text-gray-500">
                  Searching...
                </p>
              )}

              {!loading &&
                results.map((student) => (
                  <div
                    key={student._id}
                    onClick={() => handleSelectStudent(student)}
                    className="p-3 text-sm hover:bg-gray-50 cursor-pointer"
                  >
                    {student.firstName} {student.lastName}
                  </div>
                ))}

              {!loading && results.length === 0 && (
                <p className="p-3 text-sm text-gray-400">
                  No students found
                </p>
              )}
            </div>
          )}
        </div>

        {/* INPUTS */}
        <Field
          label="Offense Type *"
          name="offense"
          value={form.offense}
          onChange={handleChange}
        />

        <Field
          label="Location *"
          name="location"
          value={form.location}
          onChange={handleChange}
        />
      </div>

      {/* DESCRIPTION */}
      <div className="mt-4">
        <label className="text-xs text-gray-500">
          Complaint Description *
        </label>

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

      {/* ACTION */}
      <div className="mt-6 flex justify-end">
        <button
          onClick={handleSubmit}
          className="px-5 py-2 rounded-xl font-medium transition"
          style={{
            background: C.primary,
            color: "white",
          }}
        >
          Submit Complaint
        </button>
      </div>
    </div>
  );
};

export default memo(ComplaintReport);

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
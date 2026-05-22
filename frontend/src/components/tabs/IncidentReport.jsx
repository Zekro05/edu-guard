import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  memo,
} from "react";
import { Search, Paperclip, UploadCloud } from "lucide-react";
import toast from "react-hot-toast";
import { API } from "../lib/api";;

/* ================= OPTIONS ================= */

const incidentOptions = [
  {
    label: "MINOR OFFENSES",
    items: [
      "Dress Code Violation",
      "Improper Uniform",
      "Improper Haircut",
      "Unauthorized Hair Color",
      "Wearing Earrings",
      "Use of Cosmetics/Nail Polish",
      "Unnecessary Talking",
      "Shouting",
      "Howling",
      "Eating Inside Classroom",
      "Extreme Quarrels",
      "Minor Classroom Disruption",
      "Use of Impolite Words",
      "Cursing",
      "Teasing",
      "Name Calling",
      "Habitual Absences",
      "Unnecessary Use of Chat Box",
      "Unresponsive During Online Classes",
      "Leaving Online Conference Without Permission",
      "Turning Off Camera Without Valid Reason",
      "Improper Camera Visibility",
      "Habitual Tardiness",
      "Inappropriate Profile Picture/Background",
      "Unsigned School Correspondence",
      "Late Submission of Reply Slips",
      "Non-submission of Reply Slips",
      "Failure to Submit Excuse Letter",
      "Loss of Violation Report",
      "Littering",
      "Violation of Library Rules",
      "Failure to Return Borrowed Materials",
      "Not Wearing School ID",
      "Playing Cards",
      "Rough Play",
      "Horseplaying",
      "Refusal to Replace Damaged Property",
      "Using Cellphone During Examination",
      "Failure to Present School ID",
      "Tampering School ID",
      "Tampering Library Card",
      "Loitering",
      "Lending School ID",
      "Using Someone Else's ID",
      "Locker Policy Violation",
      "Eating in Restricted Areas",
      "Unauthorized Gadgets",
      "Unauthorized Cellphone Use",
    ],
  },
  {
    label: "MAJOR OFFENSES",
    items: [
      "Sharing Account Credentials",
      "Piracy",
      "Unauthorized Downloading",
      "Posting Screenshots Without Consent",
      "Defamation",
      "Slander",
      "Recording Without Consent",
      "Cyberbullying",
      "Cyber Baiting",
      "Unauthorized Transactions",
      "Viewing Pornographic Materials",
      "Selling Without Approval",
      "Spreading Fake News",
      "Harassment",
      "Threatening Messages",
      "Profanity",
      "Using Portal for Political Activities",
      "Using Portal for Gambling",
      "Anonymous Harassing Emails",
      "Threatening Other Students",
      "Desecration of Religious Items",
      "Disrespect During Ceremonies",
      "Improper Use of Internet",
      "Withholding Information",
      "Petty Theft",
      "Stealing",
      "Possession of Pornographic Materials",
      "Threatening School Personnel",
      "Unauthorized Solicitation",
      "Disrespect to School Authorities",
      "Disobedience",
      "Defiance",
      "Assault",
      "Abusive Behavior",
      "Bringing School Into Disrepute",
      "Forgery",
      "Cheating",
      "Plagiarism",
      "Academic Dishonesty",
      "Vandalism",
      "Defacing School Property",
      "Destroying School Property",
      "Tampering School Records",
      "Possession of Immoral Materials",
      "Gambling",
      "Mischief",
      "Unauthorized Use of School Equipment",
      "Spreading False Information",
      "Instigating a Fight",
      "Unauthorized Leaving of Campus",
      "Possession of Liquor",
      "Possession of Cigarettes",
      "Possession of Vape",
      "Possession of Deadly Weapon",
      "Fighting",
      "Physical Injury",
      "Physical Assault",
      "Entering Bars While in Uniform",
      "Tampering Fire Safety Equipment",
      "Habitual Violation of School Rules",
      "Smoking Inside Campus",
      "Smoking During School Activities",
      "Drug Possession",
      "Drug Selling",
      "Public Display of Affection",
      "Indecent Conduct",
      "Immoral Conduct",
      "Pregnancy-related Misconduct",
      "Sex Video/Scandal Involvement",
      "Joining Unauthorized Fraternities",
      "Hazing",
      "Voyeurism",
    ],
  },
  {
    label: "CUSTOM",
    items: ["Other"],
  },
];

const locationOptions = [
  {
    label: "PRE SCHOOL BUILDING",
    items: ["PS 101", "PS 102"],
  },
  {
    label: "GLORIOUS BUILDING",
    items: ["GB 101", "GB 102", "GB 103"],
  },
  {
    label: "JOYFUL BUILDING",
    items: [
      "JB 101",
      "JB 102",
      "JB 103",
      "JB 104",
      "JB 105",
      "JB 201",
      "JB 202",
      "JB 203",
      "JB 205",
      "JB 206",
      "JB 207",
    ],
  },
  {
    label: "LUMINOUS BUILDING",
    items: ["LB 101", "LB 102", "LB 103", "LB 104", "LB 201", "LB 202", "LB 203", "LB 204"],
  },
  {
    label: "GATES",
    items: [
      "Main Gate - Pedestrian",
      "Main Gate - Vehicle",
      "Campus Gate - Pedestrian",
      "Campus Gate - Vehicle",
    ],
  },
  {
    label: "OTHER AREAS",
    items: [
      "Hallway",
      "Library",
      "Computer Laboratory",
      "Science Laboratory",
      "Canteen",
      "Gymnasium",
      "Playground",
      "School Grounds",
      "Parking Area",
      "Clinic",
      "Guidance Office",
      "Principal's Office",
      "Faculty Room",
      "Chapel",
      "Comfort Room",
      "Stairway",
      "Other",
    ],
  },
];

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

  const getDateTime = () => {
    const now = new Date();
    return {
      date: now.toISOString().split("T")[0],
      time: now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
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

      const res = await API.get(`/api/students/search?query=${value}`, {
        signal: controller.signal,
      });

      setResults(res.data || []);
    } finally {
      setLoading(false);
    }
  }, []);

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

  const handleFiles = (e) => setFiles(Array.from(e.target.files));
  const removeFile = (index) =>
    setFiles((prev) => prev.filter((_, i) => i !== index));

  /* ================= SUBMIT ================= */

  const handleSubmit = async () => {
    try {
      const { date, time } = getDateTime();

      if (
        !form.studentId ||
        !form.offense ||
        !form.location ||
        !form.description
      ) {
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

      await API.post("/api/reports", formData);

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
    } catch {
      toast.error("Failed to submit report");
    }
  };

  /* ================= UI ================= */

  return (
    <div className="rounded-2xl border p-6" style={{ background: C.surface }}>
      <div className="mb-6">
        <h3 className="text-lg font-semibold">Incident Report Form</h3>
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
          />
        </div>

        {search && (results.length > 0 || loading) && (
          <div className="absolute w-full mt-2 rounded-xl border max-h-52 overflow-y-auto shadow-md z-50 bg-white">
            {loading && <p className="p-3 text-sm">Searching...</p>}

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

      {/* DROPDOWNS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <DropdownField
          label="Offense"
          name="offense"
          value={form.offense}
          onChange={handleChange}
          options={incidentOptions}
        />

        <DropdownField
          label="Location"
          name="location"
          value={form.location}
          onChange={handleChange}
          options={locationOptions}
        />
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
        />
      </div>

      {/* FILES */}
      <div className="mt-5">
        <label className="text-xs text-gray-500 flex items-center gap-2">
          <Paperclip size={14} /> Evidence
        </label>

        <input ref={fileRef} type="file" multiple onChange={handleFiles} />

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
        className="mt-6 w-full py-2 rounded-xl text-white"
        style={{ background: C.primary }}
      >
        <UploadCloud size={16} className="inline mr-2" />
        Submit Report
      </button>
    </div>
  );
};

export default memo(IncidentReport);

/* ================= DROPDOWN ================= */

const DropdownField = memo(({ label, name, value, onChange, options }) => (
  <div>
    <label className="text-xs text-gray-500">{label}</label>

    <select
      name={name}
      value={value}
      onChange={onChange}
      className="w-full mt-1 px-3 py-2 rounded-xl border outline-none bg-gray-50"
    >
      <option value="">Select {label}</option>

      {options.map((group) => (
        <optgroup key={group.label} label={group.label}>
          {group.items.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </optgroup>
      ))}
    </select>
  </div>
));
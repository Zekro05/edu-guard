import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  memo,
} from "react";

import {
  Search,
  Paperclip,
  UploadCloud,
  UserRound,
  MapPin,
  FileWarning,
  X,
  CheckCircle2,
  Loader2,
  ClipboardPenLine,
} from "lucide-react";

import toast from "react-hot-toast";
import { API } from "../../lib/api";

/* =========================================================
   OPTIONS
========================================================= */

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
    items: [
      "LB 101",
      "LB 102",
      "LB 103",
      "LB 104",
      "LB 201",
      "LB 202",
      "LB 203",
      "LB 204",
    ],
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

/* =========================================================
   MAIN
========================================================= */

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
  const [submitting, setSubmitting] = useState(false);

  const [files, setFiles] = useState([]);

  const fileRef = useRef(null);
  const abortRef = useRef(null);
  const debounceRef = useRef(null);

  /* =========================================================
     DATE
  ========================================================= */

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

  /* =========================================================
     STUDENT SEARCH
  ========================================================= */

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

      if (abortRef.current) {
        abortRef.current.abort();
      }

      const controller = new AbortController();

      abortRef.current = controller;

      const res = await API.get(
        `/api/students/search?query=${encodeURIComponent(value)}`,
        {
          signal: controller.signal,
        },
      );

      setResults(res.data || []);
    } catch (error) {
      if (error?.name !== "CanceledError" && error?.name !== "AbortError") {
        console.error("Student search error:", error);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSelectStudent = (student) => {
    const fullName = [student.firstName, student.middleName, student.lastName]
      .filter(Boolean)
      .join(" ");

    setSearch(fullName);

    setForm((prev) => ({
      ...prev,
      student: fullName,
      studentName: fullName,
      studentId: student._id,
    }));

    setResults([]);
  };

  /* =========================================================
     FORM
  ========================================================= */

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  /* =========================================================
     FILES
  ========================================================= */

  const handleFiles = (e) => {
    const selectedFiles = Array.from(e.target.files || []);

    setFiles((prev) => [...prev, ...selectedFiles]);
  };

  const removeFile = (index) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  /* =========================================================
     SUBMIT
  ========================================================= */

  const handleSubmit = async () => {
    try {
      const { date, time } = getDateTime();

      if (
        !form.studentId ||
        !form.offense ||
        !form.location ||
        !form.description.trim()
      ) {
        toast.error("Please complete all required fields.");
        return;
      }

      setSubmitting(true);

      const formData = new FormData();

      formData.append("studentId", form.studentId);
      formData.append("studentName", form.studentName);
      formData.append("offense", form.offense);
      formData.append("location", form.location);
      formData.append("description", form.description);
      formData.append("date", date);
      formData.append("time", time);
      formData.append("reporter", "Teacher");

      files.forEach((file) => {
        formData.append("evidence", file);
      });

      await API.post("/api/reports", formData);

      toast.success("Incident report submitted successfully.");

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

      if (fileRef.current) {
        fileRef.current.value = "";
      }
    } catch (error) {
      console.error("Report submission error:", error);

      toast.error(
        error?.response?.data?.message ||
          "Failed to submit incident report.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  /* =========================================================
     RENDER
  ========================================================= */

  return (
    <div className="space-y-6">
      {/* =====================================================
          FORM HEADER
      ===================================================== */}

      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-9 h-9 rounded-xl bg-green-50 text-green-700 flex items-center justify-center">
              <ClipboardPenLine size={17} />
            </div>

            <span className="text-[10px] uppercase tracking-widest font-bold text-green-700">
              Incident Management
            </span>
          </div>

          <h3 className="text-xl font-extrabold tracking-tight text-gray-900">
            Incident Report
          </h3>

          <p className="text-sm text-gray-500 mt-1">
            Record a student incident and submit it for guidance review.
          </p>
        </div>

        <div className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-xl bg-gray-50 border border-gray-100">
          <span className="w-2 h-2 rounded-full bg-green-500" />

          <span className="text-[11px] font-semibold text-gray-500">
            New Report
          </span>
        </div>
      </div>

      {/* =====================================================
          STUDENT INFORMATION
      ===================================================== */}

      <section className="bg-white border border-gray-100 rounded-3xl p-5 md:p-6 shadow-[0_4px_24px_rgba(0,0,0,0.025)]">
        <SectionHeader
          icon={<UserRound size={17} />}
          title="Student Information"
          description="Search and select the student involved in the incident."
        />

        <div className="mt-5">
          <FieldLabel label="Student" required />

          <div className="relative mt-2">
            <Search
              size={17}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
            />

            <input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);

                if (form.studentId) {
                  setForm((prev) => ({
                    ...prev,
                    student: "",
                    studentId: "",
                    studentName: "",
                  }));
                }
              }}
              placeholder="Search student by name..."
              className="
                w-full
                h-12
                pl-11
                pr-10
                rounded-xl
                bg-gray-50
                border
                border-gray-200
                text-sm
                text-gray-900
                outline-none
                placeholder:text-gray-400
                focus:bg-white
                focus:border-green-300
                focus:ring-4
                focus:ring-green-50
                transition
              "
            />

            {loading && (
              <Loader2
                size={17}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-green-600 animate-spin"
              />
            )}

            {!loading && form.studentId && (
              <CheckCircle2
                size={17}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-green-600"
              />
            )}

            {/* SEARCH RESULTS */}

            {search && !form.studentId && (
              <div
                className="
                  absolute
                  left-0
                  right-0
                  top-[calc(100%+8px)]
                  z-50
                  bg-white
                  border
                  border-gray-100
                  rounded-2xl
                  shadow-[0_16px_40px_rgba(0,0,0,0.10)]
                  overflow-hidden
                "
              >
                {loading ? (
                  <div className="p-5 flex items-center gap-3">
                    <Loader2
                      size={17}
                      className="text-green-600 animate-spin"
                    />

                    <p className="text-sm text-gray-500">
                      Searching students...
                    </p>
                  </div>
                ) : results.length > 0 ? (
                  <div className="max-h-64 overflow-y-auto p-2">
                    {results.map((student) => (
                      <button
                        type="button"
                        key={student._id}
                        onClick={() => handleSelectStudent(student)}
                        className="
                          w-full
                          flex
                          items-center
                          gap-3
                          p-3
                          rounded-xl
                          text-left
                          hover:bg-green-50
                          transition
                        "
                      >
                        <div className="w-10 h-10 rounded-xl bg-green-100 text-green-700 flex items-center justify-center flex-shrink-0">
                          <span className="text-xs font-bold">
                            {student.firstName?.charAt(0)}
                            {student.lastName?.charAt(0)}
                          </span>
                        </div>

                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-gray-900 truncate">
                            {[
                              student.firstName,
                              student.middleName,
                              student.lastName,
                            ]
                              .filter(Boolean)
                              .join(" ")}
                          </p>

                          <p className="text-[11px] text-gray-400 mt-0.5">
                            {student.studentId || "Student"}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="p-6 text-center">
                    <UserRound
                      size={22}
                      className="mx-auto text-gray-300 mb-2"
                    />

                    <p className="text-sm font-semibold text-gray-600">
                      No students found
                    </p>

                    <p className="text-xs text-gray-400 mt-1">
                      Try searching using another name.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* SELECTED STUDENT */}

          {form.studentId && (
            <div className="mt-3 flex items-center gap-3 p-3 rounded-2xl bg-green-50 border border-green-100">
              <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center text-green-700 border border-green-100">
                <CheckCircle2 size={17} />
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-[10px] uppercase tracking-wider font-bold text-green-600">
                  Selected Student
                </p>

                <p className="text-sm font-bold text-gray-900 truncate">
                  {form.studentName}
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setSearch("");

                  setForm((prev) => ({
                    ...prev,
                    student: "",
                    studentId: "",
                    studentName: "",
                  }));
                }}
                className="w-8 h-8 rounded-lg hover:bg-white flex items-center justify-center text-gray-400 hover:text-gray-700 transition"
              >
                <X size={15} />
              </button>
            </div>
          )}
        </div>
      </section>

      {/* =====================================================
          INCIDENT DETAILS
      ===================================================== */}

      <section className="bg-white border border-gray-100 rounded-3xl p-5 md:p-6 shadow-[0_4px_24px_rgba(0,0,0,0.025)]">
        <SectionHeader
          icon={<FileWarning size={17} />}
          title="Incident Details"
          description="Provide the offense and location where the incident occurred."
        />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mt-5">
          <DropdownField
            icon={<FileWarning size={16} />}
            label="Offense"
            name="offense"
            value={form.offense}
            onChange={handleChange}
            options={incidentOptions}
            required
          />

          <DropdownField
            icon={<MapPin size={16} />}
            label="Location"
            name="location"
            value={form.location}
            onChange={handleChange}
            options={locationOptions}
            required
          />
        </div>

        {/* DESCRIPTION */}

        <div className="mt-5">
          <FieldLabel label="Incident Description" required />

          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            rows={6}
            placeholder="Describe what happened, including relevant details, circumstances, and observations..."
            className="
              w-full
              mt-2
              px-4
              py-3.5
              rounded-xl
              bg-gray-50
              border
              border-gray-200
              text-sm
              text-gray-900
              outline-none
              resize-none
              placeholder:text-gray-400
              focus:bg-white
              focus:border-green-300
              focus:ring-4
              focus:ring-green-50
              transition
            "
          />

          <div className="flex justify-end mt-1.5">
            <span className="text-[10px] text-gray-400">
              {form.description.length} characters
            </span>
          </div>
        </div>
      </section>

      {/* =====================================================
          EVIDENCE
      ===================================================== */}

      <section className="bg-white border border-gray-100 rounded-3xl p-5 md:p-6 shadow-[0_4px_24px_rgba(0,0,0,0.025)]">
        <SectionHeader
          icon={<Paperclip size={17} />}
          title="Evidence"
          description="Attach photos or supporting files related to the incident."
          optional
        />

        <div className="mt-5">
          <input
            ref={fileRef}
            type="file"
            multiple
            accept="image/*"
            onChange={handleFiles}
            className="hidden"
          />

          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="
              w-full
              border-2
              border-dashed
              border-gray-200
              rounded-2xl
              p-7
              bg-gray-50/70
              hover:bg-green-50/40
              hover:border-green-200
              transition
              group
            "
          >
            <div className="w-11 h-11 mx-auto rounded-xl bg-white border border-gray-100 flex items-center justify-center text-gray-400 group-hover:text-green-600 group-hover:border-green-100 transition">
              <UploadCloud size={20} />
            </div>

            <p className="text-sm font-semibold text-gray-700 mt-3">
              Click to upload evidence
            </p>

            <p className="text-xs text-gray-400 mt-1">
              You can select multiple image files
            </p>
          </button>

          {/* FILE PREVIEWS */}

          {files.length > 0 && (
            <div className="mt-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-bold text-gray-700">
                  Attached Evidence
                </p>

                <span className="text-[10px] text-gray-400">
                  {files.length}{" "}
                  {files.length === 1 ? "file" : "files"}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {files.map((file, index) => (
                  <EvidencePreview
                    key={`${file.name}-${index}`}
                    file={file}
                    index={index}
                    onRemove={removeFile}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* =====================================================
          SUBMIT
      ===================================================== */}

      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-1 pb-2">
        <div className="flex items-start gap-2 text-xs text-gray-400">
          <span className="text-red-400">*</span>

          <p>
            Required fields must be completed before submitting the report.
          </p>
        </div>

        <button
          type="button"
          onClick={handleSubmit}
          disabled={submitting}
          className="
            w-full
            sm:w-auto
            min-w-[190px]
            flex
            items-center
            justify-center
            gap-2
            px-6
            py-3
            rounded-xl
            bg-green-700
            hover:bg-green-800
            disabled:bg-green-400
            text-white
            text-sm
            font-semibold
            shadow-sm
            hover:shadow-md
            transition
            active:scale-[0.98]
          "
        >
          {submitting ? (
            <>
              <Loader2 size={17} className="animate-spin" />
              Submitting...
            </>
          ) : (
            <>
              <UploadCloud size={17} />
              Submit Incident Report
            </>
          )}
        </button>
      </div>
    </div>
  );
};

/* =========================================================
   SECTION HEADER
========================================================= */

const SectionHeader = ({
  icon,
  title,
  description,
  optional = false,
}) => (
  <div className="flex items-start gap-3">
    <div className="w-9 h-9 rounded-xl bg-green-50 text-green-700 flex items-center justify-center flex-shrink-0">
      {icon}
    </div>

    <div>
      <div className="flex items-center gap-2">
        <h4 className="text-sm font-bold text-gray-900">{title}</h4>

        {optional && (
          <span className="text-[9px] font-semibold uppercase tracking-wider text-gray-400">
            Optional
          </span>
        )}
      </div>

      <p className="text-[11px] text-gray-400 mt-1">{description}</p>
    </div>
  </div>
);

/* =========================================================
   FIELD LABEL
========================================================= */

const FieldLabel = ({ label, required = false }) => (
  <label className="text-xs font-semibold text-gray-700">
    {label}

    {required && (
      <span className="text-red-500 ml-1">*</span>
    )}
  </label>
);

/* =========================================================
   DROPDOWN
========================================================= */

const DropdownField = memo(
  ({
    icon,
    label,
    name,
    value,
    onChange,
    options,
    required,
  }) => (
    <div>
      <FieldLabel label={label} required={required} />

      <div className="relative mt-2">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
          {icon}
        </span>

        <select
          name={name}
          value={value}
          onChange={onChange}
          className="
            w-full
            h-12
            pl-11
            pr-10
            rounded-xl
            bg-gray-50
            border
            border-gray-200
            text-sm
            text-gray-700
            outline-none
            appearance-none
            focus:bg-white
            focus:border-green-300
            focus:ring-4
            focus:ring-green-50
            transition
          "
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

        <span className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
        </span>
      </div>
    </div>
  ),
);

/* =========================================================
   EVIDENCE PREVIEW
========================================================= */

const EvidencePreview = memo(({ file, index, onRemove }) => {
  const [preview, setPreview] = useState(null);

  useEffect(() => {
    const url = URL.createObjectURL(file);

    setPreview(url);

    return () => {
      URL.revokeObjectURL(url);
    };
  }, [file]);

  return (
    <div className="group relative rounded-2xl overflow-hidden border border-gray-100 bg-gray-50">
      <div className="aspect-square">
        {preview ? (
          <img
            src={preview}
            alt={file.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Loader2
              size={18}
              className="text-gray-400 animate-spin"
            />
          </div>
        )}
      </div>

      <div className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-black/60 to-transparent pt-8">
        <p className="text-[10px] text-white truncate pr-5">
          {file.name}
        </p>
      </div>

      <button
        type="button"
        onClick={() => onRemove(index)}
        className="
          absolute
          top-2
          right-2
          w-7
          h-7
          rounded-lg
          bg-black/60
          text-white
          flex
          items-center
          justify-center
          opacity-0
          group-hover:opacity-100
          hover:bg-red-500
          transition
        "
      >
        <X size={13} />
      </button>
    </div>
  );
});

export default memo(IncidentReport);
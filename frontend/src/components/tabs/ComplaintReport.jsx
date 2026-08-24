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
  FileText,
  X,
  CheckCircle2,
  ChevronDown,
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

  const [files, setFiles] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  const fileRef = useRef(null);
  const abortRef = useRef(null);
  const debounceRef = useRef(null);

  /* =========================================================
     DATE / TIME
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
     SEARCH STUDENTS
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
    const fullName = `${student.firstName || ""} ${
      student.lastName || ""
    }`.trim();

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
     RESET
  ========================================================= */

  const resetForm = () => {
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
  };

  /* =========================================================
     SUBMIT
  ========================================================= */

  const handleSubmit = async () => {
    if (submitting) return;

    try {
      const { date, time } = getDateTime();

      if (!form.studentId) {
        toast.error("Please select a student");
        return;
      }

      if (!form.offense) {
        toast.error("Please select an offense");
        return;
      }

      if (!form.location) {
        toast.error("Please select the incident location");
        return;
      }

      if (!form.description.trim()) {
        toast.error("Please provide a description");
        return;
      }

      setSubmitting(true);

      const formData = new FormData();

      formData.append("studentId", form.studentId);
      formData.append("studentName", form.studentName);
      formData.append("offense", form.offense);
      formData.append("location", form.location);
      formData.append("description", form.description.trim());
      formData.append("date", date);
      formData.append("time", time);
      formData.append("reporter", "Teacher");

      files.forEach((file) => {
        formData.append("evidence", file);
      });

      await API.post("/api/reports", formData);

      toast.success("Complaint submitted successfully!");

      resetForm();
    } catch (error) {
      console.error("Complaint submission error:", error);

      toast.error(
        error?.response?.data?.message ||
          "Failed to submit complaint. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  /* =========================================================
     RENDER
  ========================================================= */

  return (
    <div className="bg-[#F7F9F8] rounded-3xl border border-gray-100 shadow-[0_4px_24px_rgba(0,0,0,0.025)] overflow-visible">
      {/* =====================================================
          HEADER
      ===================================================== */}

      <div className="px-6 md:px-8 py-6 border-b border-gray-100 bg-white rounded-t-3xl">
        <div className="flex items-start gap-4">
          <div className="w-11 h-11 rounded-2xl bg-green-50 text-green-700 flex items-center justify-center flex-shrink-0">
            <FileText size={20} />
          </div>

          <div>
            <h3 className="text-lg font-extrabold tracking-tight text-gray-900">
              Complaint Report Form
            </h3>

            <p className="text-sm text-gray-500 mt-1">
              Submit a student complaint for guidance review and appropriate
              action.
            </p>
          </div>
        </div>
      </div>

      {/* =====================================================
          FORM
      ===================================================== */}

      <div className="p-6 md:p-8 bg-white rounded-b-3xl">
        {/* ===================================================
            STUDENT
        =================================================== */}

        <section>
          <SectionHeader
            icon={<UserRound size={16} />}
            title="Student Information"
            description="Search and select the student involved in the complaint."
          />

          <div className="relative mt-4">
            <FieldLabel label="Student" required />

            <div
              className={`relative mt-2 ${
                form.studentId ? "ring-2 ring-green-100" : ""
              } rounded-2xl`}
            >
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
                  pl-11
                  pr-11
                  py-3.5
                  rounded-2xl
                  border
                  border-gray-200
                  bg-gray-50/70
                  text-sm
                  text-gray-900
                  placeholder:text-gray-400
                  outline-none
                  transition
                  focus:bg-white
                  focus:border-green-300
                  focus:ring-4
                  focus:ring-green-50
                "
              />

              {form.studentId && (
                <CheckCircle2
                  size={18}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-green-600"
                />
              )}
            </div>

            {/* SEARCH RESULTS */}

            {search && (results.length > 0 || loading) && (
              <div
                className="
                  absolute
                  left-0
                  right-0
                  mt-2
                  bg-white
                  border
                  border-gray-100
                  rounded-2xl
                  shadow-[0_16px_40px_rgba(0,0,0,0.10)]
                  overflow-hidden
                  z-50
                "
              >
                {loading ? (
                  <div className="px-4 py-5 flex items-center gap-3">
                    <div className="w-5 h-5 border-2 border-green-200 border-t-green-600 rounded-full animate-spin" />

                    <p className="text-sm text-gray-500">
                      Searching students...
                    </p>
                  </div>
                ) : results.length > 0 ? (
                  <div className="max-h-64 overflow-y-auto p-2">
                    {results.map((student) => {
                      const fullName = `${student.firstName || ""} ${
                        student.lastName || ""
                      }`.trim();

                      return (
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
                          <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-600 flex-shrink-0">
                            {student.firstName?.charAt(0)?.toUpperCase()}
                            {student.lastName?.charAt(0)?.toUpperCase()}
                          </div>

                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold text-gray-900 truncate">
                              {fullName}
                            </p>

                            <p className="text-[11px] text-gray-400 mt-0.5">
                              {student.studentId || "Student"}
                            </p>
                          </div>

                          <ChevronDown
                            size={15}
                            className="-rotate-90 text-gray-300"
                          />
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="px-4 py-6 text-center">
                    <UserRound
                      size={20}
                      className="mx-auto text-gray-300 mb-2"
                    />

                    <p className="text-sm font-semibold text-gray-600">
                      No students found
                    </p>

                    <p className="text-xs text-gray-400 mt-1">
                      Try searching with a different name.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* SELECTED STUDENT */}

          {form.studentId && (
            <div className="mt-3 p-3 rounded-2xl bg-green-50 border border-green-100 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center text-green-700 shadow-sm">
                <CheckCircle2 size={17} />
              </div>

              <div className="min-w-0">
                <p className="text-[10px] uppercase tracking-wider font-bold text-green-600">
                  Selected Student
                </p>

                <p className="text-sm font-bold text-gray-900 truncate">
                  {form.studentName}
                </p>
              </div>
            </div>
          )}
        </section>

        {/* ===================================================
            INCIDENT DETAILS
        =================================================== */}

        <section className="mt-8">
          <SectionHeader
            icon={<FileText size={16} />}
            title="Complaint Details"
            description="Provide the details and location of the reported incident."
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-5">
            <DropdownField
              label="Offense"
              name="offense"
              value={form.offense}
              onChange={handleChange}
              options={incidentOptions}
              required
            />

            <DropdownField
              label="Location"
              name="location"
              value={form.location}
              onChange={handleChange}
              options={locationOptions}
              required
              icon={<MapPin size={15} />}
            />
          </div>

          {/* DESCRIPTION */}

          <div className="mt-5">
            <FieldLabel
              label="Complaint Description"
              required
              hint="Describe what happened clearly and objectively."
            />

            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              rows={6}
              placeholder="Describe the incident, circumstances, people involved, and any relevant details..."
              className="
                w-full
                mt-2
                px-4
                py-3.5
                rounded-2xl
                border
                border-gray-200
                bg-gray-50/70
                text-sm
                text-gray-900
                placeholder:text-gray-400
                outline-none
                resize-none
                transition
                focus:bg-white
                focus:border-green-300
                focus:ring-4
                focus:ring-green-50
              "
            />

            <div className="flex justify-end mt-1.5">
              <span className="text-[10px] text-gray-400">
                {form.description.length} characters
              </span>
            </div>
          </div>
        </section>

        {/* ===================================================
            EVIDENCE
        =================================================== */}

        <section className="mt-8">
          <SectionHeader
            icon={<Paperclip size={16} />}
            title="Evidence"
            description="Attach photos or supporting files related to the complaint."
          />

          <div className="mt-5">
            <input
              ref={fileRef}
              type="file"
              multiple
              onChange={handleFiles}
              className="hidden"
              id="complaint-evidence-upload"
            />

            <label
              htmlFor="complaint-evidence-upload"
              className="
                group
                cursor-pointer
                block
                border-2
                border-dashed
                border-gray-200
                rounded-2xl
                p-6
                bg-gray-50/60
                hover:bg-green-50/40
                hover:border-green-200
                transition
              "
            >
              <div className="flex flex-col items-center justify-center text-center">
                <div className="w-12 h-12 rounded-2xl bg-white border border-gray-100 shadow-sm flex items-center justify-center text-gray-400 group-hover:text-green-600 group-hover:bg-green-50 transition">
                  <UploadCloud size={21} />
                </div>

                <p className="text-sm font-bold text-gray-700 mt-3">
                  Add supporting evidence
                </p>

                <p className="text-xs text-gray-400 mt-1">
                  Click to browse files from your device
                </p>

                <p className="text-[10px] text-gray-300 mt-2">
                  Images and supported evidence files
                </p>
              </div>
            </label>

            {/* FILE PREVIEW */}

            {files.length > 0 && (
              <div className="mt-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-bold text-gray-700">
                    Selected Evidence
                  </p>

                  <p className="text-[10px] text-gray-400">
                    {files.length} file{files.length !== 1 ? "s" : ""}
                  </p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {files.map((file, index) => {
                    const isImage = file.type.startsWith("image/");

                    return (
                      <div
                        key={`${file.name}-${index}`}
                        className="
                          group
                          relative
                          rounded-2xl
                          overflow-hidden
                          border
                          border-gray-100
                          bg-gray-50
                        "
                      >
                        {isImage ? (
                          <img
                            src={URL.createObjectURL(file)}
                            alt={file.name}
                            className="w-full h-24 object-cover"
                          />
                        ) : (
                          <div className="h-24 flex flex-col items-center justify-center px-3">
                            <FileText
                              size={24}
                              className="text-gray-400"
                            />

                            <p className="text-[10px] text-gray-500 truncate w-full text-center mt-2">
                              {file.name}
                            </p>
                          </div>
                        )}

                        <button
                          type="button"
                          onClick={() => removeFile(index)}
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
                            transition
                            hover:bg-red-500
                          "
                        >
                          <X size={14} />
                        </button>

                        {isImage && (
                          <div className="absolute bottom-0 left-0 right-0 px-2 py-1.5 bg-gradient-to-t from-black/60 to-transparent">
                            <p className="text-[9px] text-white truncate">
                              {file.name}
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </section>

        {/* ===================================================
            SUBMIT
        =================================================== */}

        <div className="mt-8 pt-6 border-t border-gray-100">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold text-gray-700">
                Ready to submit?
              </p>

              <p className="text-[11px] text-gray-400 mt-1">
                Make sure all required complaint details are complete.
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
                px-5
                py-3.5
                rounded-2xl
                bg-green-700
                text-white
                text-sm
                font-bold
                shadow-[0_8px_24px_rgba(21,128,61,0.18)]
                hover:bg-green-800
                hover:shadow-[0_10px_28px_rgba(21,128,61,0.24)]
                active:scale-[0.98]
                disabled:opacity-60
                disabled:cursor-not-allowed
                transition
              "
            >
              {submitting ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <UploadCloud size={17} />
                  Submit Complaint
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

/* =========================================================
   SECTION HEADER
========================================================= */

const SectionHeader = ({ icon, title, description }) => (
  <div className="flex items-start gap-3">
    <div className="w-8 h-8 rounded-xl bg-gray-50 text-gray-500 flex items-center justify-center flex-shrink-0">
      {icon}
    </div>

    <div>
      <h4 className="text-sm font-bold text-gray-900">{title}</h4>

      <p className="text-xs text-gray-400 mt-0.5">{description}</p>
    </div>
  </div>
);

/* =========================================================
   FIELD LABEL
========================================================= */

const FieldLabel = ({ label, required, hint }) => (
  <div className="flex items-center justify-between gap-3">
    <label className="text-xs font-bold text-gray-700">
      {label}

      {required && <span className="text-red-500 ml-1">*</span>}
    </label>

    {hint && (
      <span className="hidden sm:block text-[10px] text-gray-400">
        {hint}
      </span>
    )}
  </div>
);

/* =========================================================
   DROPDOWN
========================================================= */

const DropdownField = memo(
  ({ label, name, value, onChange, options, required, icon }) => (
    <div>
      <FieldLabel label={label} required={required} />

      <div className="relative mt-2">
        {icon && (
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
            {icon}
          </span>
        )}

        <select
          name={name}
          value={value}
          onChange={onChange}
          className={`
            appearance-none
            w-full
            ${icon ? "pl-11" : "pl-4"}
            pr-10
            py-3.5
            rounded-2xl
            border
            border-gray-200
            bg-gray-50/70
            text-sm
            text-gray-700
            outline-none
            transition
            focus:bg-white
            focus:border-green-300
            focus:ring-4
            focus:ring-green-50
            ${
              !value
                ? "text-gray-400"
                : "text-gray-900 font-medium"
            }
          `}
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

        <ChevronDown
          size={16}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
        />
      </div>
    </div>
  ),
);

export default memo(ComplaintReport);
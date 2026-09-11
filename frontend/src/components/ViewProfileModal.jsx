import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  User,
  ShieldAlert,
  Brain,
  Sparkles,
  Activity,
  CalendarDays,
  GraduationCap,
  Hash,
  Mail,
  Phone,
  FileText,
  ChevronRight,
  Clock,
  Tag,
  ClipboardList,
  MapPin,
  Users,
  VenusAndMars,
  BookOpen,
  UserRound,
  BadgeCheck,
  ExternalLink,
} from "lucide-react";

import RiskBadge from "./RiskBadge";
import { API } from "../lib/api";

const ViewProfileModal = ({ student, close }) => {
  const [tab, setTab] = useState("history");

  const [timeline, setTimeline] = useState([]);
  const [incidents, setIncidents] = useState([]);
  const [reports, setReports] = useState([]);

  const [selectedIncident, setSelectedIncident] = useState(null);

  const [ai, setAi] = useState(null);
  const [loading, setLoading] = useState(false);

  const [activityLoading, setActivityLoading] = useState(true);

  const analysisRequestRef = useRef(false);
  const analyzedStudentRef = useRef(null);

  /* =========================================================
     ESC CLOSE
  ========================================================= */

  useEffect(() => {
    const esc = (e) => {
      if (e.key !== "Escape") return;

      if (selectedIncident) {
        setSelectedIncident(null);
      } else {
        close();
      }
    };

    window.addEventListener("keydown", esc);

    return () => {
      window.removeEventListener("keydown", esc);
    };
  }, [close, selectedIncident]);

  /* =========================================================
     LOCK BODY SCROLL
  ========================================================= */

  useEffect(() => {
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  /* =========================================================
     FETCH STUDENT ACTIVITY
  ========================================================= */

  useEffect(() => {
    if (!student?._id) return;

    const fetchStudentActivity = async () => {
      try {
        setActivityLoading(true);

        const [incidentRes, reportRes] = await Promise.all([
          API.get(`/api/incidents/student/${student._id}`),
          API.get("/api/reports"),
        ]);

        const incidentData = Array.isArray(incidentRes.data)
          ? incidentRes.data
          : incidentRes.data?.incidents || [];

        const reportData = Array.isArray(reportRes.data)
          ? reportRes.data
          : reportRes.data?.reports || [];

        setIncidents(incidentData);
        setReports(reportData);

        /* =====================================================
           FIND REPORT CONNECTED TO INCIDENT
        ===================================================== */

        const findReportForIncident = (incident) => {
          const possibleReportIds = [
            incident?.report?._id,
            incident?.reportId,
            incident?.reportID,
            typeof incident?.report === "string"
              ? incident.report
              : null,
          ]
            .filter(Boolean)
            .map((id) => id.toString());

          if (!possibleReportIds.length) {
            return null;
          }

          return (
            reportData.find((report) =>
              possibleReportIds.includes(
                report?._id?.toString(),
              ),
            ) || null
          );
        };

        /* =====================================================
           FORMAT TIMELINE
        ===================================================== */

        const formatted = incidentData
          .filter(Boolean)
          .map((incident, index) => {
            const report = findReportForIncident(incident);

            return {
              id:
                incident?._id?.toString() ||
                report?._id?.toString() ||
                `incident-${index}-${Date.now()}`,

              type: "incident",

              date:
                incident?.createdAt ||
                incident?.date ||
                report?.createdAt ||
                report?.date ||
                null,

              data: {
                incidentId:
                  incident?._id?.toString() ||
                  `incident-${index}`,

                title:
                  incident?.title ||
                  report?.title ||
                  report?.offense ||
                  "Incident Report",

                description:
                  report?.description ||
                  incident?.description ||
                  "No description provided.",

                category:
                  report?.category ||
                  report?.categoryName ||
                  incident?.category ||
                  incident?.offense ||
                  report?.offense ||
                  "Uncategorized",

                action:
                  incident?.action ||
                  incident?.disciplinaryAction ||
                  incident?.guidanceAction ||
                  "No action recorded",

                details:
                  incident?.details ||
                  report?.details ||
                  "",

                level:
                  incident?.level ||
                  incident?.riskLevel ||
                  report?.level ||
                  report?.riskLevel ||
                  null,

                status:
                  incident?.status ||
                  report?.status ||
                  null,

                reportId:
                  report?._id ||
                  incident?.reportId ||
                  incident?.reportID ||
                  null,

                report,
                incident,
              },
            };
          });

        setTimeline(formatted);
      } catch (err) {
        console.error(
          "Failed to fetch student activity:",
          err,
        );

        setIncidents([]);
        setReports([]);
        setTimeline([]);
      } finally {
        setActivityLoading(false);
      }
    };

    fetchStudentActivity();
  }, [student?._id]);

  /* =========================================================
     GET STUDENT REPORTS
  ========================================================= */

  const getStudentReports = () => {
    if (!student?._id) return [];

    return reports.filter((r) => {
      const studentId =
        r?.student?._id ||
        r?.studentId ||
        r?.student;

      return (
        studentId &&
        studentId.toString() === student._id.toString()
      );
    });
  };

  /* =========================================================
     AI ANALYSIS
  ========================================================= */

  const runAIAnalysis = async () => {
    if (!student?._id) return;

    if (analysisRequestRef.current) {
      return;
    }

    analysisRequestRef.current = true;

    try {
      setLoading(true);
      setAi(null);

      const studentReports = getStudentReports();

      /* =====================================================
         NO DATA
      ===================================================== */

      if (
        !incidents.length &&
        !timeline.length &&
        !studentReports.length
      ) {
        setAi({
          summary:
            "No behavioral records are currently available for this student.",

          pattern:
            "No observable behavioral pattern can be established from the available school records.",

          risk:
            "Low recorded activity risk, but this should not be interpreted as proof that no concerns exist.",

          prediction:
            "No reliable behavioral projection can be made because there is insufficient recorded activity.",

          interventions: [
            {
              recommendation:
                "Continue routine student monitoring.",
              basis:
                "There is insufficient recorded activity to justify a targeted intervention.",
              referenceIds: [],
              references: [],
            },
            {
              recommendation:
                "Encourage positive classroom and school engagement.",
              basis:
                "General supportive engagement may be maintained when no specific concern is recorded.",
              referenceIds: [],
              references: [],
            },
            {
              recommendation:
                "Review future behavioral records before escalating support.",
              basis:
                "Additional school records are needed before selecting a targeted intervention.",
              referenceIds: [],
              references: [],
            },
          ],

          notes:
            "The analysis is limited because no recorded incidents or reports are currently available.",

          researchReferences: [],
        });

        analyzedStudentRef.current = student._id;

        return;
      }

      /* =====================================================
         SEND STRUCTURED DATA TO RESEARCH-BACKED ENDPOINT
      ===================================================== */

      console.log(
        "🤖 Generating research-backed student AI analysis...",
      );

      const res = await API.post(
        "/api/gemini/student-analysis",
        {
          grade: student.grade || "",
          riskLevel: student.riskLevel || "",

          timeline: timeline.map((item) => ({
            date: item.date,
            type: item.type,
            category:
              item.data?.category ||
              "Uncategorized",

            title:
              item.data?.title ||
              "Incident",

            description:
              item.data?.description ||
              "",

            level:
              item.data?.level ||
              "",

            status:
              item.data?.status ||
              "",

            action:
              item.data?.action ||
              "",
          })),

          incidents: incidents.map((incident) => ({
            _id: incident?._id,
            title:
              incident?.title ||
              "Incident",

            category:
              incident?.category ||
              "Uncategorized",

            level:
              incident?.level ||
              "",

            status:
              incident?.status ||
              "",

            action:
              incident?.action ||
              "",

            studentStatement:
              incident?.studentStatement ||
              "",

            createdAt:
              incident?.createdAt ||
              null,
          })),

          reports: studentReports.map((report) => ({
            _id: report?._id,

            offense:
              report?.offense ||
              report?.category ||
              "Report",

            category:
              report?.category ||
              report?.offense ||
              "Uncategorized",

            location:
              report?.location ||
              "",

            date:
              report?.date ||
              report?.createdAt ||
              null,

            description:
              report?.description ||
              "",

            status:
              report?.status ||
              "",
          })),
        },
        {
          timeout: 60000,
        },
      );

      const parsed = res?.data;

      if (!parsed?.success) {
        throw new Error(
          parsed?.error ||
            "The research-backed AI analysis failed.",
        );
      }

      /* =====================================================
         NORMALIZE INTERVENTIONS
      ===================================================== */

      const normalizedInterventions =
        Array.isArray(parsed?.interventions)
          ? parsed.interventions.map(
              (item, index) => {
                /*
                 * New backend format:
                 *
                 * {
                 *   recommendation,
                 *   basis,
                 *   referenceIds,
                 *   references
                 * }
                 *
                 * We also support strings so older
                 * backend responses don't break the UI.
                 */

                if (typeof item === "string") {
                  return {
                    recommendation: item,
                    basis:
                      "No evidence basis was returned by the research service.",
                    referenceIds: [],
                    references: [],
                  };
                }

                return {
                  recommendation:
                    item?.recommendation ||
                    `Recommended intervention ${index + 1}`,

                  basis:
                    item?.basis ||
                    "No evidence basis was returned.",

                  referenceIds:
                    Array.isArray(
                      item?.referenceIds,
                    )
                      ? item.referenceIds
                      : [],

                  references:
                    Array.isArray(
                      item?.references,
                    )
                      ? item.references
                      : [],
                };
              },
            )
          : [];

      /* =====================================================
         NORMALIZE RESEARCH REFERENCES
      ===================================================== */

      const researchReferences =
        Array.isArray(
          parsed?.researchReferences,
        )
          ? parsed.researchReferences
          : [];

      setAi({
        summary:
          parsed?.summary ||
          "No summary was generated.",

        pattern:
          parsed?.pattern ||
          "No clear behavioral pattern was identified.",

        risk:
          parsed?.risk ||
          "Risk could not be determined.",

        prediction:
          parsed?.prediction ||
          "No prediction is available.",

        interventions:
          normalizedInterventions.length
            ? normalizedInterventions
            : [
                {
                  recommendation:
                    "Continue routine monitoring.",
                  basis:
                    "The AI service did not return a specific intervention.",
                  referenceIds: [],
                  references: [],
                },
              ],

        notes:
          parsed?.notes ||
          "No additional notes were generated.",

        researchReferences,
      });

      analyzedStudentRef.current =
        student._id;

      console.log(
        "✅ Research-backed student AI analysis completed.",
        {
          references:
            researchReferences.length,
          interventions:
            normalizedInterventions.length,
        },
      );
    } catch (err) {
      console.error(
        "AI analysis error:",
        err,
      );

      const status =
        err?.response?.status;

      const backendCode =
        err?.response?.data?.code;

      /* =====================================================
         CONTENT SAFETY
      ===================================================== */

      if (
        backendCode ===
        "GEMINI_CONTENT_BLOCKED"
      ) {
        setAi({
          summary:
            "The AI service could not analyze this profile because the submitted content was blocked by Gemini's safety system.",

          pattern:
            "The behavioral pattern could not be analyzed.",

          risk: "Unavailable",

          prediction: "Unavailable",

          interventions: [
            {
              recommendation:
                "Review the recorded information manually.",
              basis:
                "The AI service could not process the submitted records.",
              referenceIds: [],
              references: [],
            },
            {
              recommendation:
                "Continue normal guidance procedures.",
              basis:
                "Manual school guidance remains available while AI analysis is unavailable.",
              referenceIds: [],
              references: [],
            },
            {
              recommendation:
                "Try the AI analysis again later.",
              basis:
                "The current request was blocked by the AI safety system.",
              referenceIds: [],
              references: [],
            },
          ],

          notes:
            "Gemini blocked the request through its content-safety system.",

          researchReferences: [],
        });

        return;
      }

      /* =====================================================
         RATE LIMIT
      ===================================================== */

      if (status === 429) {
        setAi({
          summary:
            "The AI service has reached its request limit.",

          pattern:
            "Analysis is temporarily unavailable.",

          risk: "Unavailable",

          prediction: "Unavailable",

          interventions: [
            {
              recommendation:
                "Try the analysis again later.",
              basis:
                "The AI service is currently rate limited.",
              referenceIds: [],
              references: [],
            },
            {
              recommendation:
                "Continue manual student monitoring.",
              basis:
                "Manual monitoring can continue without AI analysis.",
              referenceIds: [],
              references: [],
            },
            {
              recommendation:
                "Review the student's records directly.",
              basis:
                "Existing school records remain available for manual review.",
              referenceIds: [],
              references: [],
            },
          ],

          notes:
            "Gemini's request limit has been reached.",

          researchReferences: [],
        });

        return;
      }

      /* =====================================================
         GEMINI UNAVAILABLE
      ===================================================== */

      if (status === 503) {
        setAi({
          summary:
            "The AI service is temporarily unavailable.",

          pattern:
            "Analysis could not be completed.",

          risk: "Unavailable",

          prediction: "Unavailable",

          interventions: [
            {
              recommendation:
                "Try the analysis again later.",
              basis:
                "The AI service is temporarily unavailable.",
              referenceIds: [],
              references: [],
            },
            {
              recommendation:
                "Continue manual student monitoring.",
              basis:
                "Manual monitoring remains available.",
              referenceIds: [],
              references: [],
            },
            {
              recommendation:
                "Review the student's records directly.",
              basis:
                "Existing school records can still be reviewed.",
              referenceIds: [],
              references: [],
            },
          ],

          notes:
            "Gemini is temporarily experiencing high demand.",

          researchReferences: [],
        });

        return;
      }

      /* =====================================================
         TIMEOUT
      ===================================================== */

      if (
        err?.code === "ECONNABORTED" ||
        err?.code === "ETIMEDOUT"
      ) {
        setAi({
          summary:
            "The AI analysis took too long to complete.",

          pattern:
            "Analysis timed out before a result was received.",

          risk: "Unavailable",

          prediction: "Unavailable",

          interventions: [
            {
              recommendation:
                "Try the analysis again.",
              basis:
                "The previous AI request exceeded the allowed response time.",
              referenceIds: [],
              references: [],
            },
            {
              recommendation:
                "Review the student's records manually.",
              basis:
                "The existing school records remain available.",
              referenceIds: [],
              references: [],
            },
            {
              recommendation:
                "Continue normal guidance procedures.",
              basis:
                "Normal school guidance procedures should continue while AI is unavailable.",
              referenceIds: [],
              references: [],
            },
          ],

          notes:
            "The AI request exceeded the 60-second timeout.",

          researchReferences: [],
        });

        return;
      }

      /* =====================================================
         GENERAL ERROR
      ===================================================== */

      setAi({
        summary:
          "AI analysis failed.",

        pattern: "Unavailable",

        risk: "Unknown",

        prediction: "Unavailable",

        interventions: [
          {
            recommendation:
              "Check the AI service and try again.",
            basis:
              "The research-backed AI analysis could not be completed.",
            referenceIds: [],
            references: [],
          },
        ],

        notes:
          err?.response?.data?.error ||
          err?.message ||
          "System error while generating analysis.",

        researchReferences: [],
      });
    } finally {
      setLoading(false);
      analysisRequestRef.current = false;
    }
  };

  /* =========================================================
     AUTOMATIC AI ANALYSIS
  ========================================================= */

  useEffect(() => {
    if (tab !== "analysis") return;
    if (!student?._id) return;
    if (activityLoading) return;

    if (
      analyzedStudentRef.current ===
      student._id
    ) {
      return;
    }

    runAIAnalysis();
  }, [
    tab,
    student?._id,
    activityLoading,
  ]);

  /* =========================================================
     REFRESH AI
  ========================================================= */

  const refreshAIAnalysis = () => {
    if (loading) return;

    analyzedStudentRef.current = null;

    runAIAnalysis();
  };

  /* =========================================================
     NO STUDENT
  ========================================================= */

  if (!student) return null;

  /* =========================================================
     PROFILE FIELD HELPERS
  ========================================================= */

  const getFullName = () => {
    return [
      student.firstName,
      student.middleName,
      student.lastName,
      student.suffix,
    ]
      .filter(Boolean)
      .join(" ");
  };

  /* =========================================================
     MAIN RENDER
  ========================================================= */

  return (
    <>
      <AnimatePresence mode="wait">
        <motion.div
          key="student-profile-modal"
          onClick={close}
          className="
            fixed inset-0 z-50 bg-black/40
            backdrop-blur-md flex items-center
            justify-center p-4 sm:p-6
          "
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            key="student-profile-content"
            onClick={(e) =>
              e.stopPropagation()
            }
            initial={{
              scale: 0.94,
              opacity: 0,
              y: 30,
            }}
            animate={{
              scale: 1,
              opacity: 1,
              y: 0,
            }}
            exit={{
              scale: 0.95,
              opacity: 0,
            }}
            transition={{
              duration: 0.25,
            }}
            className="
              w-full max-w-6xl max-h-[92vh]
              bg-white/75 backdrop-blur-2xl
              border border-white/40
              rounded-[2rem] shadow-2xl
              overflow-hidden flex flex-col
            "
          >
            {/* HEADER */}

            <div
              className="
                relative flex-shrink-0 overflow-hidden
                border-b border-white/30
              "
            >
              <div
                className="
                  absolute -top-32 -left-20
                  w-80 h-80 bg-green-200/30
                  rounded-full blur-3xl
                "
              />

              <div
                className="
                  absolute -top-20 right-0
                  w-72 h-72 bg-emerald-100/30
                  rounded-full blur-3xl
                "
              />

              <div
                className="
                  relative px-6 sm:px-8 py-6
                  flex items-start justify-between
                  gap-5
                "
              >
                <div
                  className="
                    flex items-center gap-4 sm:gap-5
                    min-w-0
                  "
                >
                  <div
                    className="
                      w-16 h-16 sm:w-20 sm:h-20
                      rounded-3xl bg-white/70
                      backdrop-blur-xl
                      border border-white/50
                      shadow-lg overflow-hidden
                      flex items-center justify-center
                      flex-shrink-0
                    "
                  >
                    {student.profilePhoto ? (
                      <img
                        src={
                          student.profilePhoto
                        }
                        alt={`${student.firstName} ${student.lastName}`}
                        className="
                          w-full h-full
                          object-cover
                        "
                      />
                    ) : (
                      <User
                        size={30}
                        className="text-gray-400"
                      />
                    )}
                  </div>

                  <div className="min-w-0">
                    <div
                      className="
                        flex items-center gap-3
                        flex-wrap
                      "
                    >
                      <h2
                        className="
                          text-2xl sm:text-3xl
                          font-black tracking-tight
                          text-gray-900 truncate
                        "
                      >
                        {student.firstName}{" "}
                        {student.middleName
                          ? `${student.middleName} `
                          : ""}
                        {student.lastName}
                      </h2>

                      <RiskBadge
                        level={
                          student.riskLevel
                        }
                      />
                    </div>

                    <p
                      className="
                        text-sm text-gray-500 mt-1
                      "
                    >
                      Student behavioral profile
                    </p>

                    <div
                      className="
                        flex gap-2 mt-3 flex-wrap
                      "
                    >
                      <InfoPill
                        icon={
                          <GraduationCap
                            size={13}
                          />
                        }
                        label={`Grade ${
                          student.grade ||
                          "N/A"
                        }`}
                      />

                      <InfoPill
                        icon={
                          <Hash size={13} />
                        }
                        label={
                          student.studentId ||
                          "No ID"
                        }
                      />

                      <InfoPill
                        icon={
                          <Activity
                            size={13}
                          />
                        }
                        label={`${timeline.length} ${
                          timeline.length === 1
                            ? "Activity"
                            : "Activities"
                        }`}
                      />
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={close}
                  className="
                    w-10 h-10 sm:w-11 sm:h-11
                    rounded-2xl bg-white/60
                    hover:bg-white
                    border border-white/40
                    backdrop-blur flex
                    items-center justify-center
                    transition flex-shrink-0
                  "
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* TABS */}

            <div
              className="
                flex gap-2 px-6 sm:px-8 py-4
                border-b border-white/30
                bg-white/25 backdrop-blur
                flex-shrink-0 overflow-x-auto
              "
            >
              <TabButton
                active={tab === "history"}
                icon={<Activity size={16} />}
                label="Activity Timeline"
                onClick={() =>
                  setTab("history")
                }
              />

              <TabButton
                active={tab === "analysis"}
                icon={<Brain size={16} />}
                label="AI Analysis"
                onClick={() =>
                  setTab("analysis")
                }
              />

              <TabButton
                active={tab === "profile"}
                icon={<User size={16} />}
                label="Profile"
                onClick={() =>
                  setTab("profile")
                }
              />
            </div>

            {/* CONTENT */}

            <div
              className="
                flex-1 min-h-0 overflow-y-auto
                p-6 sm:p-8
                bg-gradient-to-br
                from-white/20 to-white/5
              "
            >
              {/* =================================================
                  HISTORY
              ================================================= */}

              {tab === "history" && (
                <div className="space-y-5">
                  <div
                    className="
                      grid grid-cols-1 md:grid-cols-3
                      gap-4
                    "
                  >
                    <ProfileInfo
                      icon={<Mail size={17} />}
                      label="Email"
                      value={
                        student.email ||
                        "Not provided"
                      }
                    />

                    <ProfileInfo
                      icon={<Phone size={17} />}
                      label="Phone"
                      value={
                        student.phone ||
                        "Not provided"
                      }
                    />

                    <ProfileInfo
                      icon={<User size={17} />}
                      label="Gender"
                      value={
                        student.gender ||
                        "Not provided"
                      }
                    />
                  </div>

                  <div
                    className="
                      flex items-center
                      justify-between pt-3
                    "
                  >
                    <div>
                      <h3
                        className="
                          text-lg font-bold
                          text-gray-900
                        "
                      >
                        Incident History
                      </h3>

                      <p
                        className="
                          text-xs text-gray-500 mt-1
                        "
                      >
                        Click an incident to view its
                        complete report
                      </p>
                    </div>

                    <div
                      className="
                        px-3 py-1.5 rounded-xl
                        bg-white/60
                        border border-white/40
                        text-xs font-semibold
                        text-gray-600
                      "
                    >
                      {timeline.length} records
                    </div>
                  </div>

                  {timeline.length === 0 && (
                    <div
                      className="
                        bg-white/50
                        backdrop-blur-xl
                        border border-white/30
                        rounded-3xl p-12
                        text-center
                      "
                    >
                      <div
                        className="
                          w-14 h-14 mx-auto
                          rounded-2xl
                          bg-green-100 text-green-700
                          flex items-center
                          justify-center
                        "
                      >
                        <ClipboardList
                          size={24}
                        />
                      </div>

                      <p
                        className="
                          font-semibold
                          text-gray-800 mt-4
                        "
                      >
                        No incident history
                      </p>

                      <p
                        className="
                          text-sm text-gray-500 mt-1
                        "
                      >
                        This student currently has
                        no recorded incidents.
                      </p>
                    </div>
                  )}

                  {timeline.map(
                    (item, idx) => (
                      <motion.button
                        key={
                          item.id ||
                          `timeline-item-${idx}`
                        }
                        type="button"
                        onClick={() =>
                          setSelectedIncident(
                            item,
                          )
                        }
                        initial={{
                          opacity: 0,
                          y: 12,
                        }}
                        animate={{
                          opacity: 1,
                          y: 0,
                        }}
                        transition={{
                          delay:
                            idx * 0.025,
                        }}
                        className="
                          w-full text-left
                          bg-white/50
                          backdrop-blur-2xl
                          border border-white/40
                          rounded-3xl
                          p-5 sm:p-6
                          shadow-sm
                          hover:bg-white/75
                          hover:shadow-lg
                          hover:-translate-y-0.5
                          transition-all group
                        "
                      >
                        <div
                          className="
                            flex justify-between
                            gap-5
                          "
                        >
                          <div
                            className="
                              flex gap-4 min-w-0
                            "
                          >
                            <div
                              className="
                                w-11 h-11
                                rounded-2xl
                                bg-green-100
                                text-green-700
                                flex items-center
                                justify-center
                                flex-shrink-0
                              "
                            >
                              <ShieldAlert
                                size={19}
                              />
                            </div>

                            <div className="min-w-0">
                              <div
                                className="
                                  flex items-center
                                  gap-2 flex-wrap
                                "
                              >
                                <span
                                  className="
                                    text-[10px]
                                    uppercase
                                    tracking-wider
                                    font-bold
                                    px-2.5 py-1
                                    rounded-lg
                                    bg-green-100
                                    text-green-700
                                  "
                                >
                                  Incident
                                </span>

                                {item.data
                                  ?.category && (
                                  <span
                                    className="
                                      text-[10px]
                                      uppercase
                                      tracking-wider
                                      font-semibold
                                      px-2.5 py-1
                                      rounded-lg
                                      bg-gray-100
                                      text-gray-600
                                    "
                                  >
                                    {
                                      item.data
                                        .category
                                    }
                                  </span>
                                )}
                              </div>

                              <h3
                                className="
                                  font-bold
                                  text-gray-900 mt-2
                                "
                              >
                                {
                                  item.data
                                    ?.title
                                }
                              </h3>

                              <p
                                className="
                                  text-sm
                                  text-gray-500 mt-1
                                  line-clamp-2
                                  leading-relaxed
                                "
                              >
                                {
                                  item.data
                                    ?.description
                                }
                              </p>

                              <div
                                className="
                                  flex items-center
                                  gap-1 text-xs
                                  text-green-600
                                  font-semibold mt-3
                                  group-hover:gap-2
                                  transition-all
                                "
                              >
                                View incident details
                                <ChevronRight
                                  size={14}
                                />
                              </div>
                            </div>
                          </div>

                          <div
                            className="
                              text-right flex-shrink-0
                              hidden sm:block
                            "
                          >
                            <p
                              className="
                                text-xs text-gray-400
                                whitespace-nowrap
                              "
                            >
                              {formatDate(
                                item.date,
                              )}
                            </p>

                            {item.data?.level && (
                              <div className="mt-2">
                                <RiskBadge
                                  level={
                                    item.data.level
                                  }
                                />
                              </div>
                            )}
                          </div>
                        </div>

                        <div
                          className="
                            flex items-center
                            gap-2 mt-4 sm:hidden
                          "
                        >
                          <Clock
                            size={13}
                            className="text-gray-400"
                          />

                          <span
                            className="
                              text-xs text-gray-400
                            "
                          >
                            {formatDate(
                              item.date,
                            )}
                          </span>

                          {item.data?.level && (
                            <RiskBadge
                              level={
                                item.data.level
                              }
                            />
                          )}
                        </div>
                      </motion.button>
                    ),
                  )}
                </div>
              )}

              {/* =================================================
                  AI ANALYSIS
              ================================================= */}

              {tab === "analysis" && (
                <div className="space-y-5">
                  <div
                    className="
                      relative overflow-hidden
                      bg-gradient-to-r
                      from-green-600
                      to-emerald-500
                      text-white rounded-3xl
                      p-6 shadow-lg
                      shadow-green-200
                    "
                  >
                    <div
                      className="
                        absolute -right-10 -top-10
                        w-40 h-40 bg-white/10
                        rounded-full blur-2xl
                      "
                    />

                    <div
                      className="
                        relative flex items-center
                        gap-4
                      "
                    >
                      <div
                        className="
                          w-11 h-11 rounded-2xl
                          bg-white/15 backdrop-blur
                          flex items-center
                          justify-center
                        "
                      >
                        <Sparkles size={21} />
                      </div>

                      <div>
                        <h3
                          className="
                            font-bold text-lg
                          "
                        >
                          AI Behavioral Analysis
                        </h3>

                        <p
                          className="
                            text-sm text-green-50 mt-1
                          "
                        >
                          AI-generated insights based
                          on recorded student activity
                          and the research database.
                        </p>
                      </div>
                    </div>
                  </div>

                  {loading && (
                    <div
                      className="
                        bg-white/50
                        backdrop-blur-xl
                        border border-white/30
                        rounded-3xl p-10
                        text-center
                      "
                    >
                      <div
                        className="
                          w-12 h-12 border-4
                          border-green-500
                          border-t-transparent
                          rounded-full animate-spin
                          mx-auto mb-4
                        "
                      />

                      <p
                        className="
                          text-green-700
                          font-semibold
                        "
                      >
                        Generating research-backed
                        AI analysis...
                      </p>

                      <p
                        className="
                          text-xs text-gray-500 mt-2
                        "
                      >
                        Reviewing behavioral patterns,
                        incident history, and relevant
                        research evidence
                      </p>
                    </div>
                  )}

                  {ai && !loading && (
                    <>
                      <GlassCard
                        title="Behavior Summary"
                        text={ai.summary}
                      />

                      <GlassCard
                        title="Pattern Analysis"
                        text={ai.pattern}
                      />

                      <GlassCard
                        title="Risk Assessment"
                        text={ai.risk}
                        highlight="yellow"
                      />

                      <GlassCard
                        title="Prediction"
                        text={ai.prediction}
                        highlight="red"
                      />

                      {/* =================================================
                          INTERVENTION PLAN
                      ================================================= */}

                      <div
                        className="
                          bg-white/50
                          backdrop-blur-2xl
                          border border-white/30
                          rounded-3xl p-6
                        "
                      >
                        <div
                          className="
                            flex items-center gap-3 mb-5
                          "
                        >
                          <div
                            className="
                              w-9 h-9 rounded-xl
                              bg-green-100
                              text-green-700
                              flex items-center
                              justify-center
                            "
                          >
                            <Activity size={17} />
                          </div>

                          <div>
                            <h3
                              className="
                                font-bold
                                text-gray-900
                              "
                            >
                              Intervention Plan
                            </h3>

                            <p
                              className="
                                text-xs
                                text-gray-500
                              "
                            >
                              Recommended next steps
                              supported by the research
                              database
                            </p>
                          </div>
                        </div>

                        <div className="space-y-4">
                          {ai.interventions?.map(
                            (item, idx) => {
                              const intervention =
                                typeof item ===
                                "string"
                                  ? {
                                      recommendation:
                                        item,
                                      basis:
                                        "No evidence basis was returned.",
                                      referenceIds: [],
                                      references: [],
                                    }
                                  : item;

                              const references =
                                Array.isArray(
                                  intervention?.references,
                                )
                                  ? intervention.references
                                  : [];

                              return (
                                <div
                                  key={`intervention-${idx}`}
                                  className="
                                    bg-white/60
                                    border
                                    border-white/30
                                    rounded-2xl
                                    p-4
                                  "
                                >
                                  <div
                                    className="
                                      flex items-start
                                      gap-4
                                    "
                                  >
                                    <div
                                      className="
                                        w-8 h-8
                                        rounded-xl
                                        bg-green-100
                                        text-green-700
                                        flex items-center
                                        justify-center
                                        font-bold text-sm
                                        flex-shrink-0
                                      "
                                    >
                                      {idx + 1}
                                    </div>

                                    <div className="min-w-0 flex-1">
                                      <p
                                        className="
                                          text-sm
                                          font-semibold
                                          text-gray-800
                                        "
                                      >
                                        {intervention?.recommendation ||
                                          "No recommendation provided."}
                                      </p>

                                      <div
                                        className="
                                          mt-3 p-3
                                          rounded-xl
                                          bg-green-50/70
                                          border
                                          border-green-100
                                        "
                                      >
                                        <p
                                          className="
                                            text-[10px]
                                            uppercase
                                            tracking-wider
                                            font-bold
                                            text-green-700
                                          "
                                        >
                                          Evidence basis
                                        </p>

                                        <p
                                          className="
                                            text-xs
                                            text-gray-600
                                            mt-1
                                            leading-relaxed
                                          "
                                        >
                                          {intervention?.basis ||
                                            "No evidence basis was returned."}
                                        </p>
                                      </div>

                                      {references.length >
                                        0 && (
                                        <div className="mt-3 space-y-2">
                                          <p
                                            className="
                                              text-[10px]
                                              uppercase
                                              tracking-wider
                                              font-bold
                                              text-gray-500
                                            "
                                          >
                                            Supporting research
                                          </p>

                                          {references.map(
                                            (
                                              reference,
                                              referenceIndex,
                                            ) => (
                                              <ResearchReference
                                                key={
                                                  reference?.referenceId ||
                                                  `reference-${idx}-${referenceIndex}`
                                                }
                                                reference={
                                                  reference
                                                }
                                              />
                                            ),
                                          )}
                                        </div>
                                      )}

                                      {!references.length && (
                                        <div
                                          className="
                                            mt-3
                                            text-[11px]
                                            text-gray-400
                                            italic
                                          "
                                        >
                                          No matching research
                                          reference was returned
                                          for this recommendation.
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              );
                            },
                          )}
                        </div>
                      </div>

                      {/* =================================================
                          RESEARCH DATABASE USED
                      ================================================= */}

                      {Array.isArray(
                        ai.researchReferences,
                      ) &&
                        ai.researchReferences.length >
                          0 && (
                          <div
                            className="
                              bg-white/50
                              backdrop-blur-2xl
                              border border-white/30
                              rounded-3xl p-6
                            "
                          >
                            <div
                              className="
                                flex items-center
                                gap-3 mb-5
                              "
                            >
                              <div
                                className="
                                  w-9 h-9
                                  rounded-xl
                                  bg-green-100
                                  text-green-700
                                  flex items-center
                                  justify-center
                                "
                              >
                                <BookOpen
                                  size={17}
                                />
                              </div>

                              <div>
                                <h3
                                  className="
                                    font-bold
                                    text-gray-900
                                  "
                                >
                                  Research Evidence Used
                                </h3>

                                <p
                                  className="
                                    text-xs
                                    text-gray-500
                                  "
                                >
                                  Research references
                                  retrieved from the
                                  EduGuard database
                                </p>
                              </div>
                            </div>

                            <div className="space-y-3">
                              {ai.researchReferences.map(
                                (
                                  reference,
                                  index,
                                ) => (
                                  <ResearchReference
                                    key={
                                      reference?.referenceId ||
                                      `research-${index}`
                                    }
                                    reference={
                                      reference
                                    }
                                    expanded
                                  />
                                ),
                              )}
                            </div>
                          </div>
                        )}

                      <GlassCard
                        title="Counselor Notes"
                        text={ai.notes}
                      />

                      <div className="flex justify-end">
                        <button
                          type="button"
                          onClick={
                            refreshAIAnalysis
                          }
                          disabled={loading}
                          className="
                            px-4 py-2 rounded-xl
                            bg-green-600
                            hover:bg-green-700
                            text-white text-xs
                            font-semibold transition
                            disabled:opacity-50
                          "
                        >
                          Regenerate Analysis
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* =================================================
                  PROFILE
              ================================================= */}

              {tab === "profile" && (
                <div className="space-y-5">
                  <div
                    className="
                      bg-white/50
                      backdrop-blur-2xl
                      border border-white/30
                      rounded-3xl p-6
                    "
                  >
                    <div
                      className="
                        flex items-center gap-4 mb-6
                      "
                    >
                      <div
                        className="
                          w-11 h-11 rounded-2xl
                          bg-green-100
                          text-green-700
                          flex items-center
                          justify-center
                        "
                      >
                        <User size={21} />
                      </div>

                      <div>
                        <h3
                          className="
                            font-bold text-gray-900
                          "
                        >
                          Student Information
                        </h3>

                        <p
                          className="
                            text-xs text-gray-500 mt-1
                          "
                        >
                          Complete profile information
                        </p>
                      </div>
                    </div>

                    <div
                      className="
                        flex flex-col items-center
                        justify-center mb-7
                      "
                    >
                      <div
                        className="
                          w-24 h-24 rounded-3xl
                          bg-white/70
                          border border-white/50
                          shadow-lg overflow-hidden
                          flex items-center
                          justify-center
                        "
                      >
                        {student.profilePhoto ? (
                          <img
                            src={
                              student.profilePhoto
                            }
                            alt={getFullName()}
                            className="
                              w-full h-full
                              object-cover
                            "
                          />
                        ) : (
                          <User
                            size={38}
                            className="text-gray-400"
                          />
                        )}
                      </div>

                      <h3
                        className="
                          text-xl font-black
                          text-gray-900 mt-4
                        "
                      >
                        {getFullName() ||
                          "Unnamed Student"}
                      </h3>

                      <div className="mt-2">
                        <RiskBadge
                          level={
                            student.riskLevel
                          }
                        />
                      </div>
                    </div>

                    <div
                      className="
                        grid grid-cols-1
                        md:grid-cols-2 gap-4
                      "
                    >
                      <ProfileInfo
                        icon={<Hash size={17} />}
                        label="Student ID"
                        value={
                          student.studentId ||
                          "Not provided"
                        }
                      />

                      <ProfileInfo
                        icon={
                          <GraduationCap
                            size={17}
                          />
                        }
                        label="Grade"
                        value={
                          student.grade ||
                          "Not provided"
                        }
                      />

                      <ProfileInfo
                        icon={
                          <BookOpen size={17} />
                        }
                        label="Section"
                        value={
                          student.section ||
                          student.classSection ||
                          "Not provided"
                        }
                      />

                      <ProfileInfo
                        icon={
                          <BadgeCheck
                            size={17}
                          />
                        }
                        label="Status"
                        value={
                          student.status ||
                          "Active"
                        }
                      />

                      <ProfileInfo
                        icon={<Mail size={17} />}
                        label="Email"
                        value={
                          student.email ||
                          "Not provided"
                        }
                      />

                      <ProfileInfo
                        icon={<Phone size={17} />}
                        label="Phone"
                        value={
                          student.phone ||
                          student.contactNumber ||
                          "Not provided"
                        }
                      />

                      <ProfileInfo
                        icon={
                          <VenusAndMars
                            size={17}
                          />
                        }
                        label="Gender"
                        value={
                          student.gender ||
                          "Not provided"
                        }
                      />

                      <ProfileInfo
                        icon={
                          <CalendarDays
                            size={17}
                          />
                        }
                        label="Date of Birth"
                        value={
                          student.dateOfBirth ||
                          student.birthDate ||
                          student.birthday
                            ? formatDate(
                                student.dateOfBirth ||
                                  student.birthDate ||
                                  student.birthday,
                              )
                            : "Not provided"
                        }
                      />
                    </div>
                  </div>

                  {/* ADDRESS + GUARDIAN */}

                  <div
                    className="
                      grid grid-cols-1
                      md:grid-cols-2 gap-5
                    "
                  >
                    <div
                      className="
                        bg-white/50
                        backdrop-blur-2xl
                        border border-white/30
                        rounded-3xl p-6
                      "
                    >
                      <div
                        className="
                          flex items-center
                          gap-3 mb-5
                        "
                      >
                        <div
                          className="
                            w-9 h-9 rounded-xl
                            bg-green-100
                            text-green-700
                            flex items-center
                            justify-center
                          "
                        >
                          <MapPin size={17} />
                        </div>

                        <div>
                          <h3
                            className="
                              font-bold text-gray-900
                            "
                          >
                            Address
                          </h3>

                          <p
                            className="
                              text-xs text-gray-500
                            "
                          >
                            Registered address
                          </p>
                        </div>
                      </div>

                      <p
                        className="
                          text-sm text-gray-700
                          leading-relaxed
                        "
                      >
                        {student.address ||
                          student.homeAddress ||
                          student.currentAddress ||
                          "No address provided."}
                      </p>
                    </div>

                    <div
                      className="
                        bg-white/50
                        backdrop-blur-2xl
                        border border-white/30
                        rounded-3xl p-6
                      "
                    >
                      <div
                        className="
                          flex items-center
                          gap-3 mb-5
                        "
                      >
                        <div
                          className="
                            w-9 h-9 rounded-xl
                            bg-green-100
                            text-green-700
                            flex items-center
                            justify-center
                          "
                        >
                          <Users size={17} />
                        </div>

                        <div>
                          <h3
                            className="
                              font-bold text-gray-900
                            "
                          >
                            Parent / Guardian
                          </h3>

                          <p
                            className="
                              text-xs text-gray-500
                            "
                          >
                            Emergency / guardian
                            information
                          </p>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <ProfileInfo
                          icon={
                            <UserRound
                              size={16}
                            />
                          }
                          label="Name"
                          value={
                            student.guardianName ||
                            student.parentName ||
                            student.parentGuardian ||
                            "Not provided"
                          }
                        />

                        <ProfileInfo
                          icon={
                            <Phone size={16} />
                          }
                          label="Contact"
                          value={
                            student.guardianPhone ||
                            student.parentPhone ||
                            student.parentContact ||
                            "Not provided"
                          }
                        />
                      </div>
                    </div>
                  </div>

                  {/* ACADEMIC */}

                  <div
                    className="
                      bg-white/50
                      backdrop-blur-2xl
                      border border-white/30
                      rounded-3xl p-6
                    "
                  >
                    <div
                      className="
                        flex items-center
                        gap-3 mb-5
                      "
                    >
                      <div
                        className="
                          w-9 h-9 rounded-xl
                          bg-green-100
                          text-green-700
                          flex items-center
                          justify-center
                        "
                      >
                        <GraduationCap
                          size={17}
                        />
                      </div>

                      <div>
                        <h3
                          className="
                            font-bold text-gray-900
                          "
                        >
                          Academic Information
                        </h3>

                        <p
                          className="
                            text-xs text-gray-500
                          "
                        >
                          Student academic details
                        </p>
                      </div>
                    </div>

                    <div
                      className="
                        grid grid-cols-1
                        sm:grid-cols-2
                        lg:grid-cols-3 gap-4
                      "
                    >
                      <ProfileInfo
                        icon={
                          <GraduationCap
                            size={17}
                          />
                        }
                        label="Grade"
                        value={
                          student.grade ||
                          "Not provided"
                        }
                      />

                      <ProfileInfo
                        icon={
                          <BookOpen size={17} />
                        }
                        label="Section"
                        value={
                          student.section ||
                          student.classSection ||
                          "Not provided"
                        }
                      />

                      <ProfileInfo
                        icon={<Hash size={17} />}
                        label="Student ID"
                        value={
                          student.studentId ||
                          "Not provided"
                        }
                      />

                      <ProfileInfo
                        icon={
                          <ShieldAlert
                            size={17}
                          />
                        }
                        label="Risk Level"
                        value={
                          student.riskLevel ||
                          "Not assessed"
                        }
                      />

                      <ProfileInfo
                        icon={
                          <Activity
                            size={17}
                          />
                        }
                        label="Recorded Incidents"
                        value={String(
                          incidents.length,
                        )}
                      />

                      <ProfileInfo
                        icon={
                          <FileText
                            size={17}
                          />
                        }
                        label="Recorded Reports"
                        value={String(
                          getStudentReports()
                            .length,
                        )}
                      />
                    </div>
                  </div>

                  {/* ACCOUNT */}

                  <div
                    className="
                      bg-white/50
                      backdrop-blur-2xl
                      border border-white/30
                      rounded-3xl p-6
                    "
                  >
                    <div
                      className="
                        flex items-center
                        gap-3 mb-5
                      "
                    >
                      <div
                        className="
                          w-9 h-9 rounded-xl
                          bg-green-100
                          text-green-700
                          flex items-center
                          justify-center
                        "
                      >
                        <User size={17} />
                      </div>

                      <div>
                        <h3
                          className="
                            font-bold text-gray-900
                          "
                        >
                          Account Information
                        </h3>

                        <p
                          className="
                            text-xs text-gray-500
                          "
                        >
                          EduGuard account details
                        </p>
                      </div>
                    </div>

                    <div
                      className="
                        grid grid-cols-1
                        md:grid-cols-2 gap-4
                      "
                    >
                      <ProfileInfo
                        icon={<Mail size={17} />}
                        label="Account Email"
                        value={
                          student.email ||
                          "Not provided"
                        }
                      />

                      <ProfileInfo
                        icon={
                          <BadgeCheck
                            size={17}
                          />
                        }
                        label="Role"
                        value={
                          student.role ||
                          "Student"
                        }
                      />

                      <ProfileInfo
                        icon={
                          <CalendarDays
                            size={17}
                          />
                        }
                        label="Date Added"
                        value={
                          student.createdAt
                            ? formatDate(
                                student.createdAt,
                              )
                            : "Not available"
                        }
                      />

                      <ProfileInfo
                        icon={
                          <CalendarDays
                            size={17}
                          />
                        }
                        label="Last Updated"
                        value={
                          student.updatedAt
                            ? formatDate(
                                student.updatedAt,
                              )
                            : "Not available"
                        }
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      </AnimatePresence>

      {/* =======================================================
          INCIDENT DETAIL MODAL
      ======================================================= */}

      <AnimatePresence mode="wait">
        {selectedIncident && (
          <motion.div
            key="incident-detail-modal"
            className="
              fixed inset-0 z-[70]
              bg-black/45 backdrop-blur-md
              flex items-center justify-center
              p-4 sm:p-6
            "
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() =>
              setSelectedIncident(null)
            }
          >
            <motion.div
              key="incident-detail-content"
              onClick={(e) =>
                e.stopPropagation()
              }
              initial={{
                opacity: 0,
                scale: 0.95,
                y: 20,
              }}
              animate={{
                opacity: 1,
                scale: 1,
                y: 0,
              }}
              exit={{
                opacity: 0,
                scale: 0.95,
              }}
              className="
                w-full max-w-2xl
                max-h-[90vh]
                bg-white/80
                backdrop-blur-2xl
                border border-white/50
                rounded-[2rem]
                shadow-2xl
                overflow-hidden
                flex flex-col
              "
            >
              <div
                className="
                  relative overflow-hidden
                  px-6 sm:px-7 py-6
                  border-b border-white/30
                  flex-shrink-0
                "
              >
                <div
                  className="
                    absolute -top-20 -right-20
                    w-48 h-48
                    bg-green-200/30
                    rounded-full blur-3xl
                  "
                />

                <div
                  className="
                    relative flex justify-between
                    items-start gap-4
                  "
                >
                  <div
                    className="
                      flex items-center gap-4
                    "
                  >
                    <div
                      className="
                        w-12 h-12 rounded-2xl
                        bg-green-100
                        text-green-700
                        flex items-center
                        justify-center
                        flex-shrink-0
                      "
                    >
                      <ShieldAlert size={21} />
                    </div>

                    <div>
                      <p
                        className="
                          text-[10px]
                          uppercase tracking-wider
                          font-bold text-green-600
                        "
                      >
                        Incident Record
                      </p>

                      <h3
                        className="
                          text-xl font-bold
                          text-gray-900 mt-1
                        "
                      >
                        {
                          selectedIncident
                            .data?.title
                        }
                      </h3>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      setSelectedIncident(
                        null,
                      )
                    }
                    className="
                      w-10 h-10 rounded-xl
                      bg-white/60 hover:bg-white
                      border border-white/40
                      flex items-center
                      justify-center
                      transition
                      flex-shrink-0
                    "
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              <div
                className="
                  flex-1 overflow-y-auto
                  p-6 sm:p-7 space-y-5
                "
              >
                <div
                  className="
                    grid grid-cols-1
                    sm:grid-cols-3 gap-3
                  "
                >
                  <DetailBox
                    icon={
                      <CalendarDays
                        size={14}
                      />
                    }
                    label="Date"
                    value={formatDate(
                      selectedIncident.date,
                    )}
                  />

                  <DetailBox
                    icon={<Tag size={14} />}
                    label="Category"
                    value={
                      selectedIncident
                        .data?.category ||
                      "Uncategorized"
                    }
                  />

                  <DetailBox
                    icon={
                      <ShieldAlert
                        size={14}
                      />
                    }
                    label="Risk Level"
                    value={
                      selectedIncident
                        .data?.level ||
                      "Not assessed"
                    }
                  />
                </div>

                <DetailSection
                  icon={<FileText size={17} />}
                  title="Report Description"
                >
                  <p
                    className="
                      text-sm text-gray-700
                      leading-relaxed
                    "
                  >
                    {selectedIncident.data
                      ?.description ||
                      "No description provided."}
                  </p>
                </DetailSection>

                <DetailSection
                  icon={
                    <ClipboardList
                      size={17}
                    />
                  }
                  title="Disciplinary / Guidance Action"
                >
                  <p
                    className="
                      text-sm text-gray-700
                      leading-relaxed
                    "
                  >
                    {selectedIncident.data
                      ?.action ||
                      "No action recorded."}
                  </p>
                </DetailSection>

                {selectedIncident.data
                  ?.status && (
                  <DetailSection
                    icon={
                      <Activity size={17} />
                    }
                    title="Current Status"
                  >
                    <span
                      className="
                        inline-flex px-3 py-1.5
                        rounded-xl
                        bg-green-100
                        text-green-700
                        text-xs font-bold
                      "
                    >
                      {
                        selectedIncident
                          .data.status
                      }
                    </span>
                  </DetailSection>
                )}

                {selectedIncident.data
                  ?.details && (
                  <DetailSection
                    icon={
                      <FileText size={17} />
                    }
                    title="Additional Details"
                  >
                    <p
                      className="
                        text-sm text-gray-700
                        leading-relaxed
                      "
                    >
                      {
                        selectedIncident.data
                          .details
                      }
                    </p>
                  </DetailSection>
                )}

                {selectedIncident.data
                  ?.reportId && (
                  <div
                    className="
                      pt-2 text-[10px]
                      text-gray-400
                    "
                  >
                    Report Reference:{" "}
                    {
                      selectedIncident.data
                        .reportId
                    }
                  </div>
                )}
              </div>

              <div
                className="
                  px-6 sm:px-7 py-5
                  border-t border-white/30
                  bg-white/20
                  flex justify-end
                  flex-shrink-0
                "
              >
                <button
                  type="button"
                  onClick={() =>
                    setSelectedIncident(
                      null,
                    )
                  }
                  className="
                    px-5 py-2.5 rounded-xl
                    bg-green-600
                    hover:bg-green-700
                    text-white text-sm
                    font-semibold shadow-md
                    shadow-green-200
                    transition
                  "
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

/* =========================================================
   RESEARCH REFERENCE
========================================================= */

const ResearchReference = ({
  reference,
  expanded = false,
}) => {
  if (!reference) return null;

  const authors = Array.isArray(
    reference.authors,
  )
    ? reference.authors.join(", ")
    : reference.authors || "";

  const citation =
    reference.citation ||
    reference.title ||
    "Research reference";

  const doi = reference.doi || "";

  const sourceUrl =
    reference.sourceUrl ||
    (doi
      ? `https://doi.org/${doi.replace(
          /^https?:\/\/doi\.org\//i,
          "",
        )}`
      : "");

  return (
    <div
      className="
        bg-white/60
        border border-white/30
        rounded-2xl
        p-4
      "
    >
      <div
        className="
          flex items-start gap-3
        "
      >
        <div
          className="
            w-8 h-8 rounded-xl
            bg-green-100
            text-green-700
            flex items-center
            justify-center
            flex-shrink-0
          "
        >
          <BookOpen size={15} />
        </div>

        <div className="min-w-0 flex-1">
          <p
            className="
              text-xs font-bold
              text-gray-800
              leading-relaxed
            "
          >
            {citation}
          </p>

          {authors && (
            <p
              className="
                text-[11px]
                text-gray-500
                mt-1
                leading-relaxed
              "
            >
              {authors}
              {reference.year
                ? ` (${reference.year})`
                : ""}
            </p>
          )}

          {(reference.journal ||
            reference.volume ||
            reference.issue ||
            reference.pages) && (
            <p
              className="
                text-[11px]
                text-gray-500
                mt-1
                leading-relaxed
              "
            >
              {reference.journal || ""}
              {reference.volume
                ? `, ${reference.volume}`
                : ""}
              {reference.issue
                ? `(${reference.issue})`
                : ""}
              {reference.pages
                ? `, ${reference.pages}`
                : ""}
            </p>
          )}

          {expanded &&
            reference.findings && (
              <div
                className="
                  mt-3
                  p-3
                  rounded-xl
                  bg-gray-50/80
                  border border-gray-100
                "
              >
                <p
                  className="
                    text-[10px]
                    uppercase
                    tracking-wider
                    font-bold
                    text-gray-500
                  "
                >
                  Research finding
                </p>

                <p
                  className="
                    text-xs
                    text-gray-600
                    mt-1
                    leading-relaxed
                  "
                >
                  {reference.findings}
                </p>
              </div>
            )}

          <div
            className="
              flex flex-wrap
              items-center
              gap-2 mt-3
            "
          >
            {reference.referenceId && (
              <span
                className="
                  px-2 py-1
                  rounded-lg
                  bg-green-50
                  text-green-700
                  text-[9px]
                  font-bold
                  border
                  border-green-100
                "
              >
                {reference.referenceId}
              </span>
            )}

            {reference.evidenceLevel && (
              <span
                className="
                  px-2 py-1
                  rounded-lg
                  bg-gray-100
                  text-gray-600
                  text-[9px]
                  font-semibold
                "
              >
                {reference.evidenceLevel}
              </span>
            )}

            {doi && (
              <span
                className="
                  text-[9px]
                  text-gray-400
                "
              >
                DOI: {doi}
              </span>
            )}

            {sourceUrl && (
              <a
                href={sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) =>
                  e.stopPropagation()
                }
                className="
                  inline-flex
                  items-center
                  gap-1
                  text-[10px]
                  font-semibold
                  text-green-600
                  hover:text-green-700
                "
              >
                View source
                <ExternalLink
                  size={11}
                />
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

/* =========================================================
   TAB BUTTON
========================================================= */

const TabButton = ({
  active,
  icon,
  label,
  onClick,
}) => (
  <button
    type="button"
    onClick={onClick}
    className={`
      flex items-center gap-2
      px-5 py-3 rounded-2xl
      text-sm font-semibold
      transition whitespace-nowrap
      ${
        active
          ? "bg-green-600 text-white shadow-lg shadow-green-200"
          : "bg-white/40 text-gray-600 hover:bg-white/70 border border-white/30"
      }
    `}
  >
    {icon}
    {label}
  </button>
);

/* =========================================================
   INFO PILL
========================================================= */

const InfoPill = ({
  icon,
  label,
}) => (
  <div
    className="
      flex items-center gap-1.5
      px-3 py-1.5 rounded-xl
      bg-white/50 backdrop-blur
      border border-white/40
      text-xs font-medium
      text-gray-600
    "
  >
    {icon}
    <span>{label}</span>
  </div>
);

/* =========================================================
   PROFILE INFO
========================================================= */

const ProfileInfo = ({
  icon,
  label,
  value,
}) => (
  <div
    className="
      bg-white/45
      backdrop-blur-xl
      border border-white/30
      rounded-2xl p-4
    "
  >
    <div
      className="
        flex items-center gap-2
        text-gray-400
      "
    >
      {icon}

      <span
        className="
          text-[10px]
          uppercase
          tracking-wider
          font-semibold
        "
      >
        {label}
      </span>
    </div>

    <p
      className="
        text-sm font-semibold
        text-gray-800 mt-2
        break-words
      "
    >
      {value}
    </p>
  </div>
);

/* =========================================================
   DETAIL BOX
========================================================= */

const DetailBox = ({
  icon,
  label,
  value,
}) => (
  <div
    className="
      bg-white/50
      border border-white/40
      rounded-2xl p-4
    "
  >
    <div
      className="
        flex items-center gap-1.5
        text-gray-400
      "
    >
      {icon}

      <p
        className="
          text-[9px]
          uppercase
          tracking-wider
          font-semibold
        "
      >
        {label}
      </p>
    </div>

    <p
      className="
        text-sm font-semibold
        text-gray-800 mt-2
        truncate
      "
    >
      {value}
    </p>
  </div>
);

/* =========================================================
   DETAIL SECTION
========================================================= */

const DetailSection = ({
  icon,
  title,
  children,
}) => (
  <div
    className="
      bg-white/55
      backdrop-blur-xl
      border border-white/40
      rounded-2xl p-5
    "
  >
    <div
      className="
        flex items-center
        gap-2 mb-3
      "
    >
      <div
        className="
          w-8 h-8 rounded-xl
          bg-green-100
          text-green-700
          flex items-center
          justify-center
        "
      >
        {icon}
      </div>

      <p
        className="
          text-sm font-bold
          text-gray-900
        "
      >
        {title}
      </p>
    </div>

    {children}
  </div>
);

/* =========================================================
   GLASS CARD
========================================================= */

const GlassCard = ({
  title,
  text,
  highlight,
}) => (
  <div
    className={`
      bg-white/45
      backdrop-blur-2xl
      border rounded-3xl
      p-6 shadow-sm
      ${
        highlight === "yellow"
          ? "border-yellow-200/60"
          : highlight === "red"
            ? "border-red-200/60"
            : "border-white/30"
      }
    `}
  >
    <p
      className="
        text-sm font-bold
        text-gray-900
      "
    >
      {title}
    </p>

    <p
      className="
        text-sm text-gray-600
        mt-3 leading-relaxed
      "
    >
      {text}
    </p>
  </div>
);

/* =========================================================
   DATE FORMATTER
========================================================= */

const formatDate = (date) => {
  if (!date) {
    return "Unknown date";
  }

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) {
    return "Unknown date";
  }

  return parsed.toLocaleDateString(
    "en-US",
    {
      month: "short",
      day: "numeric",
      year: "numeric",
    },
  );
};

export default ViewProfileModal;
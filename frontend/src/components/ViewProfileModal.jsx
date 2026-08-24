import { useState, useEffect } from "react";
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

          if (possibleReportIds.length === 0) {
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
              /*
               * Always generate a guaranteed non-empty ID.
               */
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
                  "Incident Report",

                description:
                  report?.description ||
                  incident?.description ||
                  "No description provided.",

                category:
                  report?.category ||
                  incident?.category ||
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
      }
    };

    fetchStudentActivity();
  }, [student?._id]);

  /* =========================================================
     AI ANALYSIS
  ========================================================= */

  useEffect(() => {
    if (tab !== "analysis") return;
    if (!student) return;

    setAi(null);

    const run = async () => {
      try {
        setLoading(true);

        /* =====================================================
           NO DATA
        ===================================================== */

        if (!incidents.length && !timeline.length) {
          setAi({
            summary:
              "No behavioral records available.",

            pattern:
              "Stable profile (no data).",

            risk:
              "Low risk due to no recorded activity.",

            prediction:
              "Stable behavior expected.",

            interventions: [
              "Maintain monitoring",
              "Encourage engagement",
              "No intervention required",
            ],

            notes:
              "Insufficient data for deep analysis.",
          });

          setLoading(false);
          return;
        }

        /* =====================================================
           AI PROMPT
        ===================================================== */

        const prompt = `
Return ONLY valid JSON:

{
  "summary": "...",
  "pattern": "...",
  "risk": "...",
  "prediction": "...",
  "interventions": ["..."],
  "notes": "..."
}

Student:
Name: ${student.firstName} ${student.lastName}
Grade: ${student.grade}
Risk: ${student.riskLevel}

FULL ACTIVITY TIMELINE:
${timeline
  .map(
    (t) =>
      `- ${t.type}: ${
        t.data?.title ||
        t.data?.action ||
        "Record"
      } | Category: ${
        t.data?.category ||
        "N/A"
      } | Risk: ${
        t.data?.level ||
        "N/A"
      } | Description: ${
        t.data?.description ||
        "N/A"
      }`,
  )
  .join("\n")}

INCIDENTS:
${incidents
  .map(
    (i) =>
      `- ${
        i?.title ||
        "Incident"
      } | ${
        i?.level ||
        "N/A"
      } | ${
        i?.category ||
        "N/A"
      }`,
  )
  .join("\n")}

REPORTS:
${reports
  .filter((r) => {
    const studentId =
      r?.student?._id ||
      r?.studentId ||
      r?.student;

    return (
      studentId &&
      studentId.toString() ===
        student._id.toString()
    );
  })
  .map(
    (r) =>
      `- ${
        r?.title ||
        "Report"
      } | ${
        r?.category ||
        "N/A"
      } | ${
        r?.description ||
        "No description"
      }`,
  )
  .join("\n")}
`;

        const res = await API.post(
          "/api/gemini/generate",
          {
            prompt,
          },
        );

        let raw = (
          res.data?.text || ""
        )
          .replace(/```json|```/g, "")
          .trim();

        const parsed = JSON.parse(raw);

        setAi(parsed);
      } catch (err) {
        console.error(
          "AI analysis error:",
          err,
        );

        setAi({
          summary:
            "AI analysis failed.",

          pattern:
            "Unavailable",

          risk:
            "Unknown",

          prediction:
            "Unavailable",

          interventions: [
            "Check AI service",
          ],

          notes:
            "System error while generating analysis.",
        });
      } finally {
        setLoading(false);
      }
    };

    run();
  }, [
    tab,
    student,
    incidents,
    timeline,
    reports,
  ]);

  /* =========================================================
     NO STUDENT
  ========================================================= */

  if (!student) return null;

  return (
    <>
      {/* =====================================================
          MAIN PROFILE MODAL
      ===================================================== */}

      <AnimatePresence mode="wait">
        <motion.div
          key="student-profile-modal"
          onClick={close}
          className="
            fixed
            inset-0
            z-50
            bg-black/40
            backdrop-blur-md
            flex
            items-center
            justify-center
            p-4 sm:p-6
          "
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* =================================================
              MAIN MODAL
          ================================================= */}

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
              w-full
              max-w-6xl
              max-h-[92vh]
              bg-white/75
              backdrop-blur-2xl
              border border-white/40
              rounded-[2rem]
              shadow-2xl
              overflow-hidden
              flex
              flex-col
            "
          >
            {/* =================================================
                HEADER
            ================================================= */}

            <div
              className="
                relative
                flex-shrink-0
                overflow-hidden
                border-b border-white/30
              "
            >
              <div
                className="
                  absolute
                  -top-32
                  -left-20
                  w-80
                  h-80
                  bg-green-200/30
                  rounded-full
                  blur-3xl
                "
              />

              <div
                className="
                  absolute
                  -top-20
                  right-0
                  w-72
                  h-72
                  bg-emerald-100/30
                  rounded-full
                  blur-3xl
                "
              />

              <div
                className="
                  relative
                  px-6 sm:px-8
                  py-6
                  flex
                  items-start
                  justify-between
                  gap-5
                "
              >
                {/* PROFILE */}

                <div
                  className="
                    flex
                    items-center
                    gap-4 sm:gap-5
                    min-w-0
                  "
                >
                  <div
                    className="
                      w-16
                      h-16
                      sm:w-20
                      sm:h-20
                      rounded-3xl
                      bg-white/70
                      backdrop-blur-xl
                      border border-white/50
                      shadow-lg
                      overflow-hidden
                      flex
                      items-center
                      justify-center
                      flex-shrink-0
                    "
                  >
                    {student.profilePhoto ? (
                      <img
                        src={student.profilePhoto}
                        alt={`${student.firstName} ${student.lastName}`}
                        className="
                          w-full
                          h-full
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
                        flex
                        items-center
                        gap-3
                        flex-wrap
                      "
                    >
                      <h2
                        className="
                          text-2xl
                          sm:text-3xl
                          font-black
                          tracking-tight
                          text-gray-900
                          truncate
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
                        text-sm
                        text-gray-500
                        mt-1
                      "
                    >
                      Student behavioral profile
                    </p>

                    <div
                      className="
                        flex
                        gap-2
                        mt-3
                        flex-wrap
                      "
                    >
                      <InfoPill
                        icon={
                          <GraduationCap
                            size={13}
                          />
                        }
                        label={`Grade ${student.grade}`}
                      />

                      <InfoPill
                        icon={
                          <Hash size={13} />
                        }
                        label={
                          student.studentId
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

                {/* CLOSE */}

                <button
                  type="button"
                  onClick={close}
                  className="
                    w-10
                    h-10
                    sm:w-11
                    sm:h-11
                    rounded-2xl
                    bg-white/60
                    hover:bg-white
                    border border-white/40
                    backdrop-blur
                    flex
                    items-center
                    justify-center
                    transition
                    flex-shrink-0
                  "
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* =================================================
                TABS
            ================================================= */}

            <div
              className="
                flex
                gap-2
                px-6 sm:px-8
                py-4
                border-b border-white/30
                bg-white/25
                backdrop-blur
                flex-shrink-0
                overflow-x-auto
              "
            >
              <TabButton
                active={
                  tab === "history"
                }
                icon={
                  <Activity size={16} />
                }
                label="Activity Timeline"
                onClick={() =>
                  setTab("history")
                }
              />

              <TabButton
                active={
                  tab === "analysis"
                }
                icon={
                  <Brain size={16} />
                }
                label="AI Analysis"
                onClick={() =>
                  setTab("analysis")
                }
              />
            </div>

            {/* =================================================
                CONTENT
            ================================================= */}

            <div
              className="
                flex-1
                min-h-0
                overflow-y-auto
                p-6 sm:p-8
                bg-gradient-to-br
                from-white/20
                to-white/5
              "
            >
              {/* =================================================
                  HISTORY
              ================================================= */}

              {tab === "history" && (
                <div className="space-y-5">
                  {/* CONTACT INFO */}

                  <div
                    className="
                      grid
                      grid-cols-1
                      md:grid-cols-3
                      gap-4
                    "
                  >
                    <ProfileInfo
                      icon={
                        <Mail size={17} />
                      }
                      label="Email"
                      value={
                        student.email ||
                        "Not provided"
                      }
                    />

                    <ProfileInfo
                      icon={
                        <Phone size={17} />
                      }
                      label="Phone"
                      value={
                        student.phone ||
                        "Not provided"
                      }
                    />

                    <ProfileInfo
                      icon={
                        <User size={17} />
                      }
                      label="Gender"
                      value={
                        student.gender ||
                        "Not provided"
                      }
                    />
                  </div>

                  {/* SECTION HEADER */}

                  <div
                    className="
                      flex
                      items-center
                      justify-between
                      pt-3
                    "
                  >
                    <div>
                      <h3
                        className="
                          text-lg
                          font-bold
                          text-gray-900
                        "
                      >
                        Incident History
                      </h3>

                      <p
                        className="
                          text-xs
                          text-gray-500
                          mt-1
                        "
                      >
                        Click an incident to view its complete report
                      </p>
                    </div>

                    <div
                      className="
                        px-3
                        py-1.5
                        rounded-xl
                        bg-white/60
                        border border-white/40
                        text-xs
                        font-semibold
                        text-gray-600
                      "
                    >
                      {timeline.length} records
                    </div>
                  </div>

                  {/* EMPTY */}

                  {timeline.length === 0 && (
                    <div
                      className="
                        bg-white/50
                        backdrop-blur-xl
                        border border-white/30
                        rounded-3xl
                        p-12
                        text-center
                      "
                    >
                      <div
                        className="
                          w-14
                          h-14
                          mx-auto
                          rounded-2xl
                          bg-green-100
                          text-green-700
                          flex
                          items-center
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
                          text-gray-800
                          mt-4
                        "
                      >
                        No incident history
                      </p>

                      <p
                        className="
                          text-sm
                          text-gray-500
                          mt-1
                        "
                      >
                        This student currently has no recorded incidents.
                      </p>
                    </div>
                  )}

                  {/* =================================================
                      INCIDENT LIST
                  ================================================= */}

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
                          w-full
                          text-left
                          bg-white/50
                          backdrop-blur-2xl
                          border border-white/40
                          rounded-3xl
                          p-5 sm:p-6
                          shadow-sm
                          hover:bg-white/75
                          hover:shadow-lg
                          hover:-translate-y-0.5
                          transition-all
                          group
                        "
                      >
                        <div
                          className="
                            flex
                            justify-between
                            gap-5
                          "
                        >
                          {/* LEFT */}

                          <div
                            className="
                              flex
                              gap-4
                              min-w-0
                            "
                          >
                            <div
                              className="
                                w-11
                                h-11
                                rounded-2xl
                                bg-green-100
                                text-green-700
                                flex
                                items-center
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
                                  flex
                                  items-center
                                  gap-2
                                  flex-wrap
                                "
                              >
                                <span
                                  className="
                                    text-[10px]
                                    uppercase
                                    tracking-wider
                                    font-bold
                                    px-2.5
                                    py-1
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
                                      px-2.5
                                      py-1
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
                                  text-gray-900
                                  mt-2
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
                                  text-gray-500
                                  mt-1
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
                                  flex
                                  items-center
                                  gap-1
                                  text-xs
                                  text-green-600
                                  font-semibold
                                  mt-3
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

                          {/* RIGHT */}

                          <div
                            className="
                              text-right
                              flex-shrink-0
                              hidden sm:block
                            "
                          >
                            <p
                              className="
                                text-xs
                                text-gray-400
                                whitespace-nowrap
                              "
                            >
                              {formatDate(
                                item.date,
                              )}
                            </p>

                            {item.data
                              ?.level && (
                              <div className="mt-2">
                                <RiskBadge
                                  level={
                                    item.data
                                      .level
                                  }
                                />
                              </div>
                            )}
                          </div>
                        </div>

                        {/* MOBILE DATE */}

                        <div
                          className="
                            flex
                            items-center
                            gap-2
                            mt-4
                            sm:hidden
                          "
                        >
                          <Clock
                            size={13}
                            className="text-gray-400"
                          />

                          <span
                            className="
                              text-xs
                              text-gray-400
                            "
                          >
                            {formatDate(
                              item.date,
                            )}
                          </span>

                          {item.data
                            ?.level && (
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
                  {/* AI HEADER */}

                  <div
                    className="
                      relative
                      overflow-hidden
                      bg-gradient-to-r
                      from-green-600
                      to-emerald-500
                      text-white
                      rounded-3xl
                      p-6
                      shadow-lg
                      shadow-green-200
                    "
                  >
                    <div
                      className="
                        absolute
                        -right-10
                        -top-10
                        w-40
                        h-40
                        bg-white/10
                        rounded-full
                        blur-2xl
                      "
                    />

                    <div
                      className="
                        relative
                        flex
                        items-center
                        gap-4
                      "
                    >
                      <div
                        className="
                          w-11
                          h-11
                          rounded-2xl
                          bg-white/15
                          backdrop-blur
                          flex
                          items-center
                          justify-center
                        "
                      >
                        <Sparkles
                          size={21}
                        />
                      </div>

                      <div>
                        <h3
                          className="
                            font-bold
                            text-lg
                          "
                        >
                          AI Behavioral Analysis
                        </h3>

                        <p
                          className="
                            text-sm
                            text-green-50
                            mt-1
                          "
                        >
                          AI-generated insights based on recorded student activity.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* LOADING */}

                  {loading && (
                    <div
                      className="
                        bg-white/50
                        backdrop-blur-xl
                        border border-white/30
                        rounded-3xl
                        p-10
                        text-center
                      "
                    >
                      <div
                        className="
                          w-12
                          h-12
                          border-4
                          border-green-500
                          border-t-transparent
                          rounded-full
                          animate-spin
                          mx-auto
                          mb-4
                        "
                      />

                      <p
                        className="
                          text-green-700
                          font-semibold
                        "
                      >
                        Generating AI behavioral analysis...
                      </p>

                      <p
                        className="
                          text-xs
                          text-gray-500
                          mt-2
                        "
                      >
                        Reviewing behavioral patterns and incident history
                      </p>
                    </div>
                  )}

                  {/* AI RESULTS */}

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

                      {/* INTERVENTION PLAN */}

                      <div
                        className="
                          bg-white/50
                          backdrop-blur-2xl
                          border border-white/30
                          rounded-3xl
                          p-6
                        "
                      >
                        <div
                          className="
                            flex
                            items-center
                            gap-3
                            mb-5
                          "
                        >
                          <div
                            className="
                              w-9
                              h-9
                              rounded-xl
                              bg-green-100
                              text-green-700
                              flex
                              items-center
                              justify-center
                            "
                          >
                            <Activity
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
                              Intervention Plan
                            </h3>

                            <p
                              className="
                                text-xs
                                text-gray-500
                              "
                            >
                              Recommended next steps
                            </p>
                          </div>
                        </div>

                        <div className="space-y-3">
                          {ai.interventions?.map(
                            (item, idx) => (
                              <div
                                key={`intervention-${idx}-${String(
                                  item,
                                )}`}
                                className="
                                  flex
                                  items-center
                                  gap-4
                                  bg-white/60
                                  border border-white/30
                                  rounded-2xl
                                  p-4
                                "
                              >
                                <div
                                  className="
                                    w-8
                                    h-8
                                    rounded-xl
                                    bg-green-100
                                    text-green-700
                                    flex
                                    items-center
                                    justify-center
                                    font-bold
                                    text-sm
                                    flex-shrink-0
                                  "
                                >
                                  {idx + 1}
                                </div>

                                <p
                                  className="
                                    text-sm
                                    text-gray-700
                                  "
                                >
                                  {item}
                                </p>
                              </div>
                            ),
                          )}
                        </div>
                      </div>

                      <GlassCard
                        title="Counselor Notes"
                        text={ai.notes}
                      />
                    </>
                  )}
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
              fixed
              inset-0
              z-[70]
              bg-black/45
              backdrop-blur-md
              flex
              items-center
              justify-center
              p-4 sm:p-6
            "
            initial={{
              opacity: 0,
            }}
            animate={{
              opacity: 1,
            }}
            exit={{
              opacity: 0,
            }}
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
                w-full
                max-w-2xl
                max-h-[90vh]
                bg-white/80
                backdrop-blur-2xl
                border border-white/50
                rounded-[2rem]
                shadow-2xl
                overflow-hidden
                flex
                flex-col
              "
            >
              {/* =================================================
                  DETAIL HEADER
              ================================================= */}

              <div
                className="
                  relative
                  overflow-hidden
                  px-6 sm:px-7
                  py-6
                  border-b border-white/30
                  flex-shrink-0
                "
              >
                <div
                  className="
                    absolute
                    -top-20
                    -right-20
                    w-48
                    h-48
                    bg-green-200/30
                    rounded-full
                    blur-3xl
                  "
                />

                <div
                  className="
                    relative
                    flex
                    justify-between
                    items-start
                    gap-4
                  "
                >
                  <div
                    className="
                      flex
                      items-center
                      gap-4
                    "
                  >
                    <div
                      className="
                        w-12
                        h-12
                        rounded-2xl
                        bg-green-100
                        text-green-700
                        flex
                        items-center
                        justify-center
                        flex-shrink-0
                      "
                    >
                      <ShieldAlert
                        size={21}
                      />
                    </div>

                    <div>
                      <p
                        className="
                          text-[10px]
                          uppercase
                          tracking-wider
                          font-bold
                          text-green-600
                        "
                      >
                        Incident Record
                      </p>

                      <h3
                        className="
                          text-xl
                          font-bold
                          text-gray-900
                          mt-1
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
                      w-10
                      h-10
                      rounded-xl
                      bg-white/60
                      hover:bg-white
                      border border-white/40
                      flex
                      items-center
                      justify-center
                      transition
                      flex-shrink-0
                    "
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              {/* =================================================
                  DETAIL BODY
              ================================================= */}

              <div
                className="
                  flex-1
                  overflow-y-auto
                  p-6 sm:p-7
                  space-y-5
                "
              >
                {/* SUMMARY */}

                <div
                  className="
                    grid
                    grid-cols-1
                    sm:grid-cols-3
                    gap-3
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
                    icon={
                      <Tag size={14} />
                    }
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

                {/* DESCRIPTION */}

                <DetailSection
                  icon={
                    <FileText size={17} />
                  }
                  title="Report Description"
                >
                  <p
                    className="
                      text-sm
                      text-gray-700
                      leading-relaxed
                    "
                  >
                    {selectedIncident.data
                      ?.description ||
                      "No description provided."}
                  </p>
                </DetailSection>

                {/* ACTION */}

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
                      text-sm
                      text-gray-700
                      leading-relaxed
                    "
                  >
                    {selectedIncident.data
                      ?.action ||
                      "No action recorded."}
                  </p>
                </DetailSection>

                {/* STATUS */}

                {selectedIncident.data
                  ?.status && (
                  <DetailSection
                    icon={
                      <Activity
                        size={17}
                      />
                    }
                    title="Current Status"
                  >
                    <span
                      className="
                        inline-flex
                        px-3
                        py-1.5
                        rounded-xl
                        bg-green-100
                        text-green-700
                        text-xs
                        font-bold
                      "
                    >
                      {
                        selectedIncident
                          .data.status
                      }
                    </span>
                  </DetailSection>
                )}

                {/* DETAILS */}

                {selectedIncident.data
                  ?.details && (
                  <DetailSection
                    icon={
                      <FileText
                        size={17}
                      />
                    }
                    title="Additional Details"
                  >
                    <p
                      className="
                        text-sm
                        text-gray-700
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

                {/* REPORT ID */}

                {selectedIncident.data
                  ?.reportId && (
                  <div
                    className="
                      pt-2
                      text-[10px]
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

              {/* =================================================
                  DETAIL FOOTER
              ================================================= */}

              <div
                className="
                  px-6 sm:px-7
                  py-5
                  border-t border-white/30
                  bg-white/20
                  flex
                  justify-end
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
                    px-5
                    py-2.5
                    rounded-xl
                    bg-green-600
                    hover:bg-green-700
                    text-white
                    text-sm
                    font-semibold
                    shadow-md
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
      flex
      items-center
      gap-2
      px-5
      py-3
      rounded-2xl
      text-sm
      font-semibold
      transition
      whitespace-nowrap
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
      flex
      items-center
      gap-1.5
      px-3
      py-1.5
      rounded-xl
      bg-white/50
      backdrop-blur
      border border-white/40
      text-xs
      font-medium
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
      rounded-2xl
      p-4
    "
  >
    <div
      className="
        flex
        items-center
        gap-2
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
        text-sm
        font-semibold
        text-gray-800
        mt-2
        truncate
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
      rounded-2xl
      p-4
    "
  >
    <div
      className="
        flex
        items-center
        gap-1.5
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
        text-sm
        font-semibold
        text-gray-800
        mt-2
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
      rounded-2xl
      p-5
    "
  >
    <div
      className="
        flex
        items-center
        gap-2
        mb-3
      "
    >
      <div
        className="
          w-8
          h-8
          rounded-xl
          bg-green-100
          text-green-700
          flex
          items-center
          justify-center
        "
      >
        {icon}
      </div>

      <p
        className="
          text-sm
          font-bold
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
      border
      rounded-3xl
      p-6
      shadow-sm
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
        text-sm
        font-bold
        text-gray-900
      "
    >
      {title}
    </p>

    <p
      className="
        text-sm
        text-gray-600
        mt-3
        leading-relaxed
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
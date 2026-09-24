import React, { memo, useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { API } from "../../lib/api";

import {
  Smartphone,
  MapPin,
  Calendar,
  User2,
  FileText,
  Check,
  X,
  Clock3,
  Activity,
  BrainCircuit,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Eye,
  RefreshCw,
  Loader2,
  Image as ImageIcon,
  ChevronDown,
  ChevronUp,
  Info as InfoIcon,
  Sparkles,
  Copy,
  CheckCircle2,
  ExternalLink,
  Paperclip,
  Shield,
  Timer,
  MessageSquareText,
  Hash,
} from "lucide-react";

/* =========================================================
   THEME
========================================================= */

const COLORS = {
  primary: "#1B5E20",
  primaryLight: "#E8F5E9",
  darkPrimaryLight: "#163B20",
  border: "#E5E7EB",
  darkBorder: "#1A2C20",
};

/* =========================================================
   THEME HOOK
========================================================= */

const getStoredTheme = () => {
  try {
    return localStorage.getItem("guided-theme") === "dark";
  } catch {
    return false;
  }
};

const useGuidedTheme = () => {
  const [darkMode, setDarkMode] = useState(getStoredTheme);

  useEffect(() => {
    const handleThemeChange = (event) => {
      if (event?.detail === "dark" || event?.detail === "light") {
        setDarkMode(event.detail === "dark");
      } else {
        setDarkMode(getStoredTheme());
      }
    };

    const handleStorage = (event) => {
      if (event.key === "guided-theme") {
        setDarkMode(event.newValue === "dark");
      }
    };

    window.addEventListener("guided-theme-change", handleThemeChange);
    window.addEventListener("storage", handleStorage);

    return () => {
      window.removeEventListener("guided-theme-change", handleThemeChange);
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  return darkMode;
};

/* =========================================================
   STATUS CONFIG
========================================================= */

const getStatusConfig = (status, darkMode) => {
  const normalized = status?.toLowerCase() || "pending";

  const config = {
    pending: {
      label: "Pending review",
      dot: "bg-amber-500",
      icon: <Timer size={13} />,
      classes: darkMode
        ? "bg-amber-950/50 border-amber-800/60 text-amber-300"
        : "bg-amber-50 border-amber-200 text-amber-700",
    },
    accepted: {
      label: "Accepted",
      dot: "bg-emerald-500",
      icon: <CheckCircle2 size={13} />,
      classes: darkMode
        ? "bg-emerald-950/50 border-emerald-800/60 text-emerald-300"
        : "bg-emerald-50 border-emerald-200 text-emerald-700",
    },
    rejected: {
      label: "Rejected",
      dot: "bg-red-500",
      icon: <X size={13} />,
      classes: darkMode
        ? "bg-red-950/50 border-red-800/60 text-red-300"
        : "bg-red-50 border-red-200 text-red-700",
    },
    under_review: {
      label: "Under review",
      dot: "bg-blue-500",
      icon: <Eye size={13} />,
      classes: darkMode
        ? "bg-blue-950/50 border-blue-800/60 text-blue-300"
        : "bg-blue-50 border-blue-200 text-blue-700",
    },
  };

  return config[normalized] || config.pending;
};

/* =========================================================
   STATUS BADGE
========================================================= */

const StatusBadge = memo(({ status, darkMode = false }) => {
  const config = getStatusConfig(status, darkMode);

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[13px] font-bold whitespace-nowrap ${config.classes}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      {config.icon}
      {config.label}
    </span>
  );
});

/* =========================================================
   INFO TILE
========================================================= */

const InfoTile = memo(({ icon, label, value, darkMode = false }) => (
  <div
    className={`group rounded-2xl border p-3.5 transition-all duration-200 ${
      darkMode
        ? "bg-[#101F15] border-[#1A2C20] hover:bg-[#13251A]"
        : "bg-gray-50/80 border-gray-100 hover:bg-white hover:shadow-sm"
    }`}
  >
    <div className="flex items-center gap-2.5 min-w-0">
      <div
        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
          darkMode ? "bg-[#163B20] text-green-300" : "bg-green-100 text-green-700"
        }`}
      >
        {icon}
      </div>

      <div className="min-w-0">
        <p
          className={`text-[13px] uppercase tracking-[0.12em] font-bold ${
            darkMode ? "text-gray-500" : "text-gray-400"
          }`}
        >
          {label}
        </p>

        <p
          className={`mt-0.5 text-[15px] font-semibold leading-5 break-words ${
            darkMode ? "text-gray-100" : "text-gray-800"
          }`}
        >
          {value || "N/A"}
        </p>
      </div>
    </div>
  </div>
));

/* =========================================================
   AI LEVEL BADGE
========================================================= */

const AILevelBadge = memo(({ label, value, darkMode = false }) => {
  const normalized = value?.toLowerCase();

  let classes = darkMode
    ? "bg-gray-900/60 border-gray-700 text-gray-300"
    : "bg-gray-50 border-gray-200 text-gray-600";

  let icon = <InfoIcon size={12} />;

  if (normalized === "high") {
    classes = darkMode
      ? "bg-red-950/50 border-red-800/70 text-red-300"
      : "bg-red-50 border-red-200 text-red-700";
    icon = <AlertTriangle size={12} />;
  } else if (normalized === "medium") {
    classes = darkMode
      ? "bg-amber-950/50 border-amber-800/70 text-amber-300"
      : "bg-amber-50 border-amber-200 text-amber-700";
    icon = <ShieldAlert size={12} />;
  } else if (normalized === "low") {
    classes = darkMode
      ? "bg-emerald-950/50 border-emerald-800/70 text-emerald-300"
      : "bg-emerald-50 border-emerald-200 text-emerald-700";
    icon = <ShieldCheck size={12} />;
  }

  return (
    <div>
      <p
        className={`text-[13px] uppercase tracking-[0.12em] font-bold mb-1.5 ${
          darkMode ? "text-gray-500" : "text-gray-400"
        }`}
      >
        {label}
      </p>

      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-[13px] font-bold ${classes}`}
      >
        {icon}
        {value || "Not analyzed"}
      </span>
    </div>
  );
});

/* =========================================================
   EVIDENCE BADGE
========================================================= */

const EvidenceBadge = memo(({ value, darkMode = false }) => {
  const normalized = value?.toLowerCase();

  let classes = darkMode
    ? "bg-gray-900/60 border-gray-700 text-gray-300"
    : "bg-gray-50 border-gray-200 text-gray-600";

  let icon = <InfoIcon size={12} />;

  if (normalized === "consistent" || normalized === "relevant") {
    classes = darkMode
      ? "bg-emerald-950/50 border-emerald-800/70 text-emerald-300"
      : "bg-emerald-50 border-emerald-200 text-emerald-700";
    icon = <ShieldCheck size={12} />;
  } else if (normalized === "partially consistent") {
    classes = darkMode
      ? "bg-amber-950/50 border-amber-800/70 text-amber-300"
      : "bg-amber-50 border-amber-200 text-amber-700";
    icon = <AlertTriangle size={12} />;
  } else if (normalized === "inconsistent" || normalized === "unable to verify") {
    classes = darkMode
      ? "bg-red-950/50 border-red-800/70 text-red-300"
      : "bg-red-50 border-red-200 text-red-700";
    icon = <ShieldAlert size={12} />;
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-[13px] font-bold ${classes}`}
    >
      {icon}
      {value || "Not analyzed"}
    </span>
  );
});

/* =========================================================
   SECTION HEADER
========================================================= */

const SectionHeader = memo(({ icon, title, subtitle, darkMode = false }) => (
  <div className="flex items-start gap-3 mb-3.5">
    <div
      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
        darkMode ? "bg-[#163B20] text-green-300" : "bg-green-100 text-green-700"
      }`}
    >
      {icon}
    </div>

    <div className="min-w-0">
      <p
        className={`text-[15px] font-extrabold ${
          darkMode ? "text-gray-100" : "text-gray-800"
        }`}
      >
        {title}
      </p>

      {subtitle && (
        <p
          className={`text-[13px] mt-0.5 leading-4 ${
            darkMode ? "text-gray-500" : "text-gray-400"
          }`}
        >
          {subtitle}
        </p>
      )}
    </div>
  </div>
));

/* =========================================================
   EVIDENCE SECTION
========================================================= */

const EvidenceSection = memo(({ evidence = [], darkMode = false }) => {
  const [expanded, setExpanded] = useState(false);
  const [preview, setPreview] = useState(null);

  const imageEvidence = evidence.filter((item) => item?.type === "image");
  const otherEvidence = evidence.filter((item) => item?.type !== "image");

  if (!evidence.length) {
    return (
      <div
        className={`rounded-2xl border border-dashed p-5 text-center ${
          darkMode
            ? "bg-[#101F15] border-[#24392A]"
            : "bg-gray-50/70 border-gray-200"
        }`}
      >
        <div
          className={`mx-auto w-11 h-11 rounded-2xl flex items-center justify-center ${
            darkMode ? "bg-[#163B20] text-gray-500" : "bg-gray-100 text-gray-400"
          }`}
        >
          <Paperclip size={19} />
        </div>

        <p
          className={`mt-3 text-[15px] font-bold ${
            darkMode ? "text-gray-300" : "text-gray-600"
          }`}
        >
          No evidence attached
        </p>

        <p
          className={`mt-1 text-[13px] ${
            darkMode ? "text-gray-600" : "text-gray-400"
          }`}
        >
          This report was submitted without attachments.
        </p>
      </div>
    );
  }

  return (
    <>
      <div
        className={`rounded-2xl border overflow-hidden ${
          darkMode
            ? "bg-[#0D1A12] border-[#1A2C20]"
            : "bg-white border-gray-100"
        }`}
      >
        <button
          type="button"
          onClick={() => setExpanded((value) => !value)}
          className="w-full p-4 flex items-center justify-between gap-3 text-left"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                darkMode ? "bg-[#163B20] text-green-300" : "bg-green-100 text-green-700"
              }`}
            >
              <ImageIcon size={17} />
            </div>

            <div className="min-w-0">
              <p
                className={`text-[15px] font-extrabold ${
                  darkMode ? "text-gray-100" : "text-gray-800"
                }`}
              >
                Evidence & attachments
              </p>
              <p
                className={`text-[13px] mt-0.5 ${
                  darkMode ? "text-gray-500" : "text-gray-400"
                }`}
              >
                {evidence.length} attachment{evidence.length === 1 ? "" : "s"} •{" "}
                {imageEvidence.length} image{imageEvidence.length === 1 ? "" : "s"}
              </p>
            </div>
          </div>

          <span
            className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
              darkMode ? "bg-[#101F15] text-gray-400" : "bg-gray-50 text-gray-500"
            }`}
          >
            {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </span>
        </button>

        <AnimatePresence initial={false}>
          {expanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className={`border-t ${
                darkMode ? "border-[#1A2C20]" : "border-gray-100"
              }`}
            >
              <div className="p-4">
                {imageEvidence.length > 0 && (
                  <div className="grid grid-cols-2 gap-2.5">
                    {imageEvidence.map((item, index) => (
                      <button
                        type="button"
                        key={`${item.url}-${index}`}
                        onClick={() => setPreview(item.url)}
                        className={`group relative overflow-hidden rounded-2xl aspect-square border ${
                          darkMode ? "bg-[#101F15] border-[#24392A]" : "bg-gray-100 border-gray-100"
                        }`}
                      >
                        <img
                          src={item.url}
                          alt={`Evidence ${index + 1}`}
                          loading="lazy"
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                          onError={(event) => {
                            event.currentTarget.style.display = "none";
                          }}
                        />

                        <span className="absolute inset-x-2 bottom-2 px-2 py-1.5 rounded-lg bg-black/65 text-white text-[13px] font-bold text-left backdrop-blur-sm">
                          Evidence {index + 1}
                        </span>

                        <span className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/50 text-white flex items-center justify-center">
                          <Eye size={14} />
                        </span>
                      </button>
                    ))}
                  </div>
                )}

                {otherEvidence.length > 0 && (
                  <div className={imageEvidence.length ? "mt-3 space-y-2" : "space-y-2"}>
                    {otherEvidence.map((item, index) => (
                      <a
                        key={`${item.url}-${index}`}
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`flex items-center gap-3 p-3 rounded-xl border ${
                          darkMode
                            ? "bg-[#101F15] border-[#24392A] hover:bg-[#14261B]"
                            : "bg-gray-50 border-gray-100 hover:bg-gray-100"
                        }`}
                      >
                        <FileText
                          size={16}
                          className={darkMode ? "text-gray-500" : "text-gray-500"}
                        />

                        <span
                          className={`text-[13px] font-semibold truncate flex-1 ${
                            darkMode ? "text-gray-300" : "text-gray-700"
                          }`}
                        >
                          Attachment {index + 1}
                        </span>

                        <ExternalLink size={13} className="text-gray-400 shrink-0" />
                      </a>
                    ))}
                  </div>
                )}

                <div
                  className={`mt-3 flex items-start gap-2 text-[13px] leading-4 ${
                    darkMode ? "text-gray-600" : "text-gray-400"
                  }`}
                >
                  <InfoIcon size={13} className="shrink-0 mt-0.5" />
                  <span>
                    GuidEd AI Review can assess supported image evidence for relevance and
                    consistency, but it cannot independently verify authenticity,
                    location, timing, or whether an incident actually occurred.
                  </span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {preview && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setPreview(null)}
            className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm p-4 flex items-center justify-center"
          >
            <button
              type="button"
              onClick={() => setPreview(null)}
              className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 text-white flex items-center justify-center"
            >
              <X size={19} />
            </button>

            <motion.img
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              src={preview}
              alt="Evidence preview"
              onClick={(event) => event.stopPropagation()}
              className="max-w-full max-h-[85vh] rounded-2xl object-contain shadow-2xl"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
});

/* =========================================================
   AI REVIEW PANEL
========================================================= */

const AIReviewPanel = memo(
  ({ aiReview, analyzing, onAnalyze, aiError, darkMode = false }) => {
    const [expanded, setExpanded] = useState(false);
    const analyzed = Boolean(aiReview?.analyzed);

    return (
      <div
        className={`rounded-2xl border overflow-hidden ${
          darkMode ? "bg-[#0D1A12] border-[#1A2C20]" : "bg-white border-gray-100"
        }`}
      >
        <div
          className={`p-4 ${
            analyzed
              ? darkMode
                ? "bg-gradient-to-br from-[#102719] to-[#0D1A12]"
                : "bg-gradient-to-br from-green-50 via-white to-white"
              : darkMode
                ? "bg-[#101F15]"
                : "bg-gray-50/70"
          }`}
        >
          <div className="flex items-start gap-3">
            <div
              className={`relative w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 shadow-sm ${
                darkMode ? "bg-[#163B20] text-green-300" : "bg-green-100 text-green-700"
              }`}
            >
              <BrainCircuit size={20} />
              {analyzed && (
                <span className="absolute -right-1 -bottom-1 w-4 h-4 rounded-full bg-green-500 border-2 border-white dark:border-[#0D1A12] flex items-center justify-center">
                  <Check size={9} className="text-white" />
                </span>
              )}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h4
                  className={`text-[16px] font-extrabold tracking-tight ${
                    darkMode ? "text-gray-100" : "text-gray-900"
                  }`}
                >
                  GuidEd AI Review
                </h4>

                <span
                  className={`inline-flex items-center gap-1 px-2 py-1 rounded-full border text-[13px] font-bold ${
                    darkMode
                      ? "bg-[#163B20] border-[#285C32] text-green-300"
                      : "bg-white border-green-200 text-green-700"
                  }`}
                >
                  <Sparkles size={9} />
                  AI-assisted review
                </span>
              </div>

              <p
                className={`text-[13px] leading-4 mt-1 ${
                  darkMode ? "text-gray-500" : "text-gray-500"
                }`}
              >
                A focused AI-assisted snapshot of severity, risk, priority, and evidence signals.
                Use it to support — not replace — professional judgment.
              </p>
            </div>
          </div>

          {analyzed && (
            <div
              className={`mt-4 grid grid-cols-3 gap-2 rounded-2xl p-2 border ${
                darkMode
                  ? "bg-[#0A140E] border-[#1A2C20]"
                  : "bg-white/80 border-green-100"
              }`}
            >
              <div className="rounded-xl px-2.5 py-2 text-center">
                <p className={`text-[13px] uppercase tracking-wider font-bold ${darkMode ? "text-gray-600" : "text-gray-400"}`}>Risk</p>
                <p className={`text-[13px] font-extrabold mt-0.5 ${darkMode ? "text-gray-200" : "text-gray-800"}`}>{aiReview?.riskLevel || "—"}</p>
              </div>
              <div className={`rounded-xl px-2.5 py-2 text-center border-x ${darkMode ? "border-[#1A2C20]" : "border-green-100"}`}>
                <p className={`text-[13px] uppercase tracking-wider font-bold ${darkMode ? "text-gray-600" : "text-gray-400"}`}>Severity</p>
                <p className={`text-[13px] font-extrabold mt-0.5 ${darkMode ? "text-gray-200" : "text-gray-800"}`}>{aiReview?.severity || "—"}</p>
              </div>
              <div className="rounded-xl px-2.5 py-2 text-center">
                <p className={`text-[13px] uppercase tracking-wider font-bold ${darkMode ? "text-gray-600" : "text-gray-400"}`}>Priority</p>
                <p className={`text-[13px] font-extrabold mt-0.5 ${darkMode ? "text-gray-200" : "text-gray-800"}`}>{aiReview?.reviewPriority || "—"}</p>
              </div>
            </div>
          )}

          <div className="mt-4 grid grid-cols-2 gap-2">
            {analyzed && (
              <button
                type="button"
                onClick={() => setExpanded((value) => !value)}
                className={`min-h-10 rounded-xl border text-[13px] font-bold flex items-center justify-center gap-1.5 ${
                  darkMode
                    ? "bg-[#0D1A12] border-[#24392A] text-gray-300"
                    : "bg-white border-gray-200 text-gray-600"
                }`}
              >
                {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                {expanded ? "Hide result" : "View result"}
              </button>
            )}

            <button
              type="button"
              onClick={onAnalyze}
              disabled={analyzing}
              className={`min-h-10 rounded-xl bg-green-700 hover:bg-green-800 disabled:bg-green-400 text-white text-[13px] font-bold flex items-center justify-center gap-1.5 ${
                analyzed ? "" : "col-span-2"
              }`}
            >
              {analyzing ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Analyzing…
                </>
              ) : analyzed ? (
                <>
                  <RefreshCw size={14} />
                  Refresh AI Review
                </>
              ) : (
                <>
                  <BrainCircuit size={14} />
                  Run GuidEd AI Review
                </>
              )}
            </button>
          </div>

          {aiError && (
            <div
              className={`mt-3 rounded-xl border p-3 flex items-start gap-2 text-[13px] leading-4 ${
                darkMode
                  ? "bg-red-950/40 border-red-800/60 text-red-300"
                  : "bg-red-50 border-red-200 text-red-700"
              }`}
            >
              <AlertTriangle size={14} className="shrink-0 mt-0.5" />
              <span>{aiError}</span>
            </div>
          )}
        </div>

        <AnimatePresence initial={false}>
          {analyzed && expanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className={`border-t ${darkMode ? "border-[#1A2C20]" : "border-gray-100"}`}
            >
              <div className="p-4 space-y-3">
                <div className="grid grid-cols-2 gap-2.5">
                  <div
                    className={`rounded-xl border p-3 ${
                      darkMode ? "bg-[#101F15] border-[#1A2C20]" : "bg-gray-50 border-gray-100"
                    }`}
                  >
                    <AILevelBadge label="Risk" value={aiReview?.riskLevel} darkMode={darkMode} />
                  </div>

                  <div
                    className={`rounded-xl border p-3 ${
                      darkMode ? "bg-[#101F15] border-[#1A2C20]" : "bg-gray-50 border-gray-100"
                    }`}
                  >
                    <AILevelBadge label="Severity" value={aiReview?.severity} darkMode={darkMode} />
                  </div>

                  <div
                    className={`rounded-xl border p-3 ${
                      darkMode ? "bg-[#101F15] border-[#1A2C20]" : "bg-gray-50 border-gray-100"
                    }`}
                  >
                    <AILevelBadge
                      label="Priority"
                      value={aiReview?.reviewPriority}
                      darkMode={darkMode}
                    />
                  </div>

                  <div
                    className={`rounded-xl border p-3 ${
                      darkMode ? "bg-[#101F15] border-[#1A2C20]" : "bg-gray-50 border-gray-100"
                    }`}
                  >
                    <p
                      className={`text-[13px] uppercase tracking-[0.12em] font-bold mb-1.5 ${
                        darkMode ? "text-gray-500" : "text-gray-400"
                      }`}
                    >
                      Evidence
                    </p>

                    <EvidenceBadge
                      value={aiReview?.evidenceAssessment}
                      darkMode={darkMode}
                    />
                  </div>
                </div>

                {aiReview?.severityReason && (
                  <div
                    className={`rounded-xl border p-3.5 ${
                      darkMode ? "bg-[#101F15] border-[#1A2C20]" : "bg-gray-50 border-gray-100"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1.5">
                      <ShieldAlert size={14} className="text-green-600" />
                      <p
                        className={`text-[13px] font-bold ${
                          darkMode ? "text-gray-200" : "text-gray-700"
                        }`}
                      >
                        Why this severity?
                      </p>
                    </div>

                    <p
                      className={`text-[13px] leading-5 ${
                        darkMode ? "text-gray-400" : "text-gray-600"
                      }`}
                    >
                      {aiReview.severityReason}
                    </p>
                  </div>
                )}

                {Array.isArray(aiReview?.evidenceFindings) &&
                  aiReview.evidenceFindings.length > 0 && (
                    <div
                      className={`rounded-xl border p-3.5 ${
                        darkMode ? "bg-[#101F15] border-[#1A2C20]" : "bg-gray-50 border-gray-100"
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <Eye size={14} className="text-green-600" />
                        <p
                          className={`text-[13px] font-bold ${
                            darkMode ? "text-gray-200" : "text-gray-700"
                          }`}
                        >
                          Evidence findings
                        </p>
                      </div>

                      <ul className="space-y-2">
                        {aiReview.evidenceFindings.map((finding, index) => (
                          <li
                            key={`${index}-${finding}`}
                            className={`flex items-start gap-2 text-[13px] leading-5 ${
                              darkMode ? "text-gray-400" : "text-gray-600"
                            }`}
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-green-600 mt-2 shrink-0" />
                            <span>{finding}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                {aiReview?.summary && (
                  <div
                    className={`rounded-xl border p-3.5 ${
                      darkMode
                        ? "bg-[#102719] border-[#245C2A]"
                        : "bg-green-50 border-green-100"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1.5">
                      <Sparkles
                        size={14}
                        className={darkMode ? "text-green-300" : "text-green-700"}
                      />
                      <p
                        className={`text-[13px] font-bold ${
                          darkMode ? "text-green-300" : "text-green-900"
                        }`}
                      >
                        AI summary
                      </p>
                    </div>

                    <p
                      className={`text-[13px] leading-5 ${
                        darkMode ? "text-gray-300" : "text-gray-700"
                      }`}
                    >
                      {aiReview.summary}
                    </p>
                  </div>
                )}

                {Array.isArray(aiReview?.limitations) && aiReview.limitations.length > 0 && (
                  <div
                    className={`rounded-xl border p-3.5 ${
                      darkMode
                        ? "bg-amber-950/30 border-amber-800/60"
                        : "bg-amber-50 border-amber-200"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1.5">
                      <InfoIcon
                        size={14}
                        className={darkMode ? "text-amber-300" : "text-amber-700"}
                      />
                      <p
                        className={`text-[13px] font-bold ${
                          darkMode ? "text-amber-300" : "text-amber-800"
                        }`}
                      >
                        AI limitations
                      </p>
                    </div>

                    <ul className="space-y-1.5">
                      {aiReview.limitations.map((limitation, index) => (
                        <li
                          key={`${index}-${limitation}`}
                          className={`text-[13px] leading-4 ${
                            darkMode ? "text-amber-300" : "text-amber-800"
                          }`}
                        >
                          • {limitation}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div
                  className={`rounded-xl border p-3 flex items-start gap-2 ${
                    darkMode
                      ? "bg-blue-950/30 border-blue-800/60 text-blue-300"
                      : "bg-blue-50 border-blue-200 text-blue-800"
                  }`}
                >
                  <InfoIcon size={14} className="shrink-0 mt-0.5" />
                  <p className="text-[13px] leading-4">
                    <span className="font-bold">Human review required.</span>{" "}
                    GuidEd AI Review provides decision support only and does not automatically
                    accept or reject the report.
                  </p>
                </div>

                <div
                  className={`flex flex-wrap items-center justify-between gap-2 text-[13px] ${
                    darkMode ? "text-gray-600" : "text-gray-400"
                  }`}
                >
                  <span>{aiReview?.model ? `Model: ${aiReview.model}` : "GuidEd AI Review"}</span>
                  {aiReview?.analyzedAt && (
                    <span>
                      {new Date(aiReview.analyzedAt).toLocaleString("en-US")}
                    </span>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }
);

/* =========================================================
   MAIN MOBILE REPORT
========================================================= */

const MobileReport = ({ report, onAccept, onReject, onAIAnalyzed }) => {
  const darkMode = useGuidedTheme();

  const [aiReview, setAiReview] = useState(report?.aiReview || null);
  const [analyzing, setAnalyzing] = useState(false);
  const [aiError, setAiError] = useState("");
  const [showDescription, setShowDescription] = useState(true);
  const [copiedId, setCopiedId] = useState(false);

  useEffect(() => {
    setAiReview(report?.aiReview || null);
  }, [report?._id, report?.aiReview]);

  const status = report?.status?.toLowerCase() || "pending";
  const statusConfig = getStatusConfig(status, darkMode);

  const reporterName =
  report?.reporter === "Anonymous"
    ? "Anonymous"
    : report?.reporter ||
      (report?.reporterId
        ? report.reporterId.name ||
          `${report.reporterId.firstName || ""} ${report.reporterId.lastName || ""}`.trim()
        : "Anonymous");

  const createdDate = report?.createdAt
    ? new Date(report.createdAt).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : "N/A";

  const createdTime = report?.createdAt
    ? new Date(report.createdAt).toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
      })
    : "";

  const incidentDate = report?.date
    ? `${new Date(report.date).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })} • ${report.time || "N/A"}`
    : "N/A";

  const currentAIReview = aiReview || report?.aiReview || null;

  const evidenceCount = Array.isArray(report?.evidence) ? report.evidence.length : 0;

  const reportReference = report?._id
    ? String(report._id).slice(-8).toUpperCase()
    : "N/A";

  const riskLevel = currentAIReview?.riskLevel?.toLowerCase();

  const riskAccent =
    riskLevel === "high"
      ? "from-red-600 to-rose-500"
      : riskLevel === "medium"
        ? "from-amber-500 to-orange-400"
        : riskLevel === "low"
          ? "from-emerald-600 to-green-500"
          : "from-green-700 to-emerald-500";

  const reviewProgress = useMemo(() => {
    let completed = 0;
    const total = 4;

    if (report?.studentName) completed += 1;
    if (report?.description) completed += 1;
    if (evidenceCount > 0) completed += 1;
    if (currentAIReview?.analyzed) completed += 1;

    return Math.round((completed / total) * 100);
  }, [report?.studentName, report?.description, evidenceCount, currentAIReview?.analyzed]);

  const copyReference = async () => {
    if (!report?._id) return;

    try {
      await navigator.clipboard.writeText(String(report._id));
      setCopiedId(true);

      setTimeout(() => {
        setCopiedId(false);
      }, 1600);
    } catch {
      setCopiedId(false);
    }
  };

  const analyzeWithGemini = async () => {
    if (!report?._id) {
      setAiError("Unable to analyze this report because the report ID is missing.");
      return;
    }

    setAnalyzing(true);
    setAiError("");

    try {
      const response = await API.post(
        `/api/gemini/analyze-pending-report/${report._id}`,
        {},
        {
          timeout: 15 * 60 * 1000,
        },
      );

      const data = response?.data || {};

      const result =
        data?.aiReview ||
        data?.analysis ||
        data?.result ||
        data;

      if (!result || typeof result !== "object") {
        throw new Error("Gemini returned an invalid analysis result.");
      }

      const normalizedResult = {
        ...result,
        analyzed: true,
      };

      setAiReview(normalizedResult);
      onAIAnalyzed?.(report._id, normalizedResult);
    } catch (error) {
      console.error("Gemini pending report analysis error:", error);

      setAiError(
        error?.response?.data?.message ||
          error?.response?.data?.error ||
          error?.message ||
          "Unable to analyze this report with Gemini.",
      );
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <article
      style={{
        fontFamily:
          '"Inter", "Plus Jakarta Sans", "Segoe UI", "Helvetica Neue", Arial, sans-serif',
      }}
      className={`relative w-full overflow-hidden rounded-[30px] border ${
        darkMode
          ? "bg-[#08110C] border-[#1B3022] text-white"
          : "bg-[#F8FAF9] border-[#E6ECE8] text-gray-900"
      }`}
    >
      {/* CASE COCKPIT HEADER */}
      <div
        className={`relative overflow-hidden ${
          darkMode
            ? "bg-[radial-gradient(circle_at_85%_15%,rgba(52,211,153,.18),transparent_28%),linear-gradient(135deg,#102D1C,#09150E 68%,#07110B)]"
            : "bg-[radial-gradient(circle_at_85%_15%,rgba(16,185,129,.18),transparent_28%),linear-gradient(135deg,#ECFDF5,#F8FAFC 68%,#F0FDF4)]"
        }`}
      >
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-emerald-600 via-green-400 to-lime-400" />
        <div className="absolute -right-16 -top-20 h-44 w-44 rounded-full border border-white/10" />
        <div className="absolute -right-7 -top-11 h-28 w-28 rounded-full border border-white/10" />

        <div className="relative p-5 sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex min-w-0 items-start gap-3.5">
              <div className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-[18px] bg-emerald-600 text-white shadow-lg shadow-emerald-900/20">
                <Smartphone size={23} />
                <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full border-2 border-[#102D1C] bg-white text-emerald-600">
                  <Activity size={10} />
                </span>
              </div>

              <div className="min-w-0">
                <div className="mb-1 flex flex-wrap items-center gap-2">
                  <span className="text-[13px] font-black uppercase tracking-[0.18em] text-emerald-500">
                    GuidEd Mobile Desk
                  </span>
                  <span className={`rounded-full px-2 py-0.5 text-[13px] font-black uppercase tracking-wider ${darkMode ? "bg-white/10 text-emerald-300" : "bg-emerald-100 text-emerald-700"}`}>
                    Live case
                  </span>
                </div>
                <h3 className={`truncate text-[22px] leading-tight font-black tracking-[-0.02em] ${darkMode ? "text-white" : "text-gray-950"}`}>
                  Incident Report
                </h3>
                <p className={`mt-1 max-w-md text-[13px] leading-4 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                  Review the case, inspect supporting evidence, then make a guidance decision.
                </p>
              </div>
            </div>

            <StatusBadge status={status} darkMode={darkMode} />
          </div>

          {/* CASE ID / DATE */}
          <div className="mt-5 grid grid-cols-2 gap-2.5 sm:grid-cols-3">
            <button
              type="button"
              onClick={copyReference}
              className={`group rounded-2xl border p-3 text-left transition-colors ${darkMode ? "border-white/10 bg-white/[0.05] hover:bg-white/[0.08]" : "border-gray-200 bg-white/75 hover:bg-white"}`}
            >
              <div className={`mb-1 flex items-center gap-1.5 text-[13px] font-black uppercase tracking-wider ${darkMode ? "text-gray-500" : "text-gray-400"}`}>
                <Hash size={10} /> Case ID
              </div>
              <div className={`flex items-center gap-1.5 text-[13px] font-black ${darkMode ? "text-gray-200" : "text-gray-700"}`}>
                #{reportReference}
                {copiedId ? <Check size={11} className="text-emerald-500" /> : <Copy size={11} className="opacity-50 group-hover:opacity-100" />}
              </div>
            </button>

            <div className={`rounded-2xl border p-3 ${darkMode ? "border-white/10 bg-white/[0.05]" : "border-gray-200 bg-white/75"}`}>
              <div className={`mb-1 flex items-center gap-1.5 text-[13px] font-black uppercase tracking-wider ${darkMode ? "text-gray-500" : "text-gray-400"}`}>
                <Calendar size={10} /> Submitted
              </div>
              <div className={`text-[13px] font-black ${darkMode ? "text-gray-200" : "text-gray-700"}`}>{createdDate}</div>
            </div>

            <div className={`col-span-2 rounded-2xl border p-3 sm:col-span-1 ${darkMode ? "border-white/10 bg-white/[0.05]" : "border-gray-200 bg-white/75"}`}>
              <div className={`mb-1 flex items-center gap-1.5 text-[13px] font-black uppercase tracking-wider ${darkMode ? "text-gray-500" : "text-gray-400"}`}>
                <Clock3 size={10} /> Time received
              </div>
              <div className={`text-[13px] font-black ${darkMode ? "text-gray-200" : "text-gray-700"}`}>{createdTime || "N/A"}</div>
            </div>
          </div>
        </div>
      </div>

      {/* REVIEW PROGRESS RAIL */}
      <div className={`border-b px-5 py-3.5 sm:px-6 ${darkMode ? "border-[#1B3022] bg-[#0B1710]" : "border-gray-100 bg-white"}`}>
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2.5">
            <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${darkMode ? "bg-emerald-500/10 text-emerald-400" : "bg-emerald-50 text-emerald-600"}`}>
              <Shield size={14} />
            </div>
            <div className="min-w-0">
              <p className={`text-[13px] font-black ${darkMode ? "text-gray-200" : "text-gray-700"}`}>Review progress</p>
              <p className={`truncate text-[13px] ${darkMode ? "text-gray-600" : "text-gray-400"}`}>Case completeness before final action</p>
            </div>
          </div>
          <span className={`text-[15px] font-black ${darkMode ? "text-emerald-400" : "text-emerald-600"}`}>{reviewProgress}%</span>
        </div>
        <div className={`mt-2 h-2 overflow-hidden rounded-full ${darkMode ? "bg-[#17251B]" : "bg-gray-100"}`}>
          <div className={`h-full rounded-full bg-gradient-to-r ${riskAccent}`} style={{ width: `${reviewProgress}%` }} />
        </div>
        <div className="mt-2 flex items-center justify-between text-[13px] font-bold">
          <span className={report?.studentName ? "text-emerald-600" : darkMode ? "text-gray-600" : "text-gray-400"}>Student</span>
          <span className={report?.description ? "text-emerald-600" : darkMode ? "text-gray-600" : "text-gray-400"}>Narrative</span>
          <span className={evidenceCount > 0 ? "text-emerald-600" : darkMode ? "text-gray-600" : "text-gray-400"}>Evidence</span>
          <span className={currentAIReview?.analyzed ? "text-emerald-600" : darkMode ? "text-gray-600" : "text-gray-400"}>AI review</span>
        </div>
      </div>

      {/* CASE SNAPSHOT */}
      <div className={`p-5 sm:p-6 ${darkMode ? "bg-[#08110C]" : "bg-[#F8FAF9]"}`}>
        <div className="mb-3 flex items-end justify-between gap-3">
          <div>
            <p className={`text-[13px] font-black uppercase tracking-[0.18em] ${darkMode ? "text-emerald-500" : "text-emerald-600"}`}>Case snapshot</p>
            <h4 className={`mt-0.5 text-[15px] font-black ${darkMode ? "text-white" : "text-gray-900"}`}>What we know so far</h4>
          </div>
          <span className={`text-[13px] font-bold ${darkMode ? "text-gray-600" : "text-gray-400"}`}>{evidenceCount} attachment{evidenceCount === 1 ? "" : "s"}</span>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          <InfoTile icon={<User2 size={15} />} label="Student" value={report?.studentName} darkMode={darkMode} />
          <InfoTile icon={<FileText size={15} />} label="Report type" value={report?.offense} darkMode={darkMode} />
          <InfoTile icon={<MapPin size={15} />} label="Location" value={report?.location} darkMode={darkMode} />
          <InfoTile icon={<Clock3 size={15} />} label="Incident" value={incidentDate} darkMode={darkMode} />
        </div>

        {/* PEOPLE + CASE PULSE */}
        <div className="mt-2.5 grid gap-2.5 sm:grid-cols-[1fr_auto]">
          <div className={`flex items-center gap-3 rounded-2xl border p-3.5 ${darkMode ? "border-[#1B3022] bg-[#0D1A12]" : "border-gray-100 bg-white"}`}>
            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${darkMode ? "bg-emerald-500/10 text-emerald-400" : "bg-emerald-50 text-emerald-600"}`}>
              <MessageSquareText size={16} />
            </div>
            <div className="min-w-0 flex-1">
              <p className={`text-[13px] font-black uppercase tracking-wider ${darkMode ? "text-gray-600" : "text-gray-400"}`}>Submitted by</p>
              <p className={`truncate text-[13px] font-black ${darkMode ? "text-gray-200" : "text-gray-700"}`}>{reporterName}</p>
            </div>
            <span className={`hidden rounded-full px-2 py-1 text-[13px] font-black sm:block ${darkMode ? "bg-white/5 text-gray-500" : "bg-gray-50 text-gray-400"}`}>Student app</span>
          </div>

          <div className={`rounded-2xl border px-4 py-3.5 sm:min-w-[150px] ${darkMode ? "border-[#1B3022] bg-[#0D1A12]" : "border-gray-100 bg-white"}`}>
            <div className="flex items-center justify-between gap-3">
              <span className={`text-[13px] font-black uppercase tracking-wider ${darkMode ? "text-gray-600" : "text-gray-400"}`}>Case pulse</span>
              <span className={`h-2 w-2 rounded-full ${status === "pending" ? "bg-amber-400" : status === "accepted" ? "bg-emerald-500" : "bg-rose-500"}`} />
            </div>
            <p className={`mt-1 text-[13px] font-black capitalize ${darkMode ? "text-gray-200" : "text-gray-700"}`}>{status}</p>
          </div>
        </div>

        {/* REVIEWER CHECKLIST */}
        <div className={`mt-4 rounded-[22px] border p-4 ${darkMode ? "border-[#1B3022] bg-[#0D1A12]" : "border-gray-100 bg-white"}`}>
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className={`text-[13px] font-black uppercase tracking-[0.16em] ${darkMode ? "text-emerald-500" : "text-emerald-600"}`}>Reviewer checklist</p>
              <p className={`mt-0.5 text-[13px] font-black ${darkMode ? "text-gray-200" : "text-gray-700"}`}>Before you decide</p>
            </div>
            <ShieldCheck size={17} className={reviewProgress === 100 ? "text-emerald-500" : darkMode ? "text-gray-600" : "text-gray-300"} />
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            {[
              [!!report?.studentName, "Student identified"],
              [!!report?.description, "Description reviewed"],
              [evidenceCount > 0, "Evidence attached"],
              [!!currentAIReview?.analyzed, "AI review available"],
            ].map(([done, label]) => (
              <div key={label} className={`flex items-center gap-2 rounded-xl px-2.5 py-2 ${done ? (darkMode ? "bg-emerald-500/10" : "bg-emerald-50") : darkMode ? "bg-white/[0.03]" : "bg-gray-50"}`}>
                <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${done ? "bg-emerald-500 text-white" : darkMode ? "bg-white/10 text-gray-600" : "bg-gray-200 text-gray-400"}`}>
                  {done ? <Check size={10} /> : <span className="h-1.5 w-1.5 rounded-full bg-current" />}
                </span>
                <span className={`text-[13px] font-bold ${done ? (darkMode ? "text-emerald-300" : "text-emerald-700") : darkMode ? "text-gray-600" : "text-gray-400"}`}>{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* INCIDENT STORY */}
        <div className={`mt-4 overflow-hidden rounded-[22px] border ${darkMode ? "border-[#1B3022] bg-[#0D1A12]" : "border-gray-100 bg-white"}`}>
          <button type="button" onClick={() => setShowDescription((value) => !value)} className="flex w-full items-center justify-between gap-3 p-4 text-left">
            <div className="flex min-w-0 items-center gap-3">
              <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${darkMode ? "bg-emerald-500/10 text-emerald-400" : "bg-emerald-50 text-emerald-600"}`}><FileText size={15} /></div>
              <div className="min-w-0">
                <p className={`text-[13px] font-black ${darkMode ? "text-gray-200" : "text-gray-700"}`}>Incident story</p>
                <p className={`text-[13px] ${darkMode ? "text-gray-600" : "text-gray-400"}`}>Reporter-provided narrative</p>
              </div>
            </div>
            <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${darkMode ? "bg-white/5 text-gray-500" : "bg-gray-50 text-gray-500"}`}>{showDescription ? <ChevronUp size={15} /> : <ChevronDown size={15} />}</span>
          </button>
          {showDescription && (
            <div className={`mx-4 mb-4 rounded-2xl border p-4 text-[14px] leading-6 whitespace-pre-wrap break-words ${darkMode ? "border-[#24392A] bg-[#101F15] text-gray-300" : "border-gray-100 bg-[#F8FAF9] text-gray-600"}`}>
              {report?.description || "No description provided."}
            </div>
          )}
        </div>

        {/* EVIDENCE */}
        <div className="mt-4">
          <EvidenceSection evidence={report?.evidence || []} darkMode={darkMode} />
        </div>

        {/* AI REVIEW */}
        <div className="mt-4">
          <AIReviewPanel aiReview={currentAIReview} analyzing={analyzing} onAnalyze={analyzeWithGemini} aiError={aiError} darkMode={darkMode} />
        </div>

        {/* DECISION DECK */}
        {status === "pending" && (
          <div className={`mt-4 overflow-hidden rounded-[24px] border ${darkMode ? "border-emerald-500/20 bg-[#0D1A12]" : "border-emerald-100 bg-white"}`}>
            <div className={`px-4 py-3.5 ${darkMode ? "bg-emerald-500/[0.06]" : "bg-emerald-50/60"}`}>
              <div className="flex items-center gap-2.5">
                <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${darkMode ? "bg-emerald-500/10 text-emerald-400" : "bg-emerald-100 text-emerald-700"}`}><ShieldCheck size={16} /></div>
                <div>
                  <p className={`text-[13px] font-black ${darkMode ? "text-gray-200" : "text-gray-800"}`}>Decision deck</p>
                  <p className={`text-[13px] ${darkMode ? "text-gray-600" : "text-gray-400"}`}>Choose the action that matches your review.</p>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2.5 p-3.5">
              <button type="button" onClick={() => onAccept?.(report._id)} className="min-h-12 rounded-2xl bg-emerald-700 px-3 text-[13px] font-black text-white shadow-sm transition hover:bg-emerald-800 active:scale-[0.99] flex items-center justify-center gap-2 touch-manipulation"><Check size={16} /> Accept</button>
              <button type="button" onClick={() => onReject?.(report._id)} className="min-h-12 rounded-2xl border border-rose-200 bg-rose-50 px-3 text-[13px] font-black text-rose-700 transition hover:bg-rose-100 active:scale-[0.99] flex items-center justify-center gap-2 touch-manipulation dark:border-rose-900/50 dark:bg-rose-500/10 dark:text-rose-300"><X size={16} /> Reject</button>
            </div>
          </div>
        )}

        {/* FOOTER NOTE */}
        <div className={`flex items-start gap-2 px-1 pt-1 text-[13px] leading-4 ${darkMode ? "text-gray-600" : "text-gray-400"}`}>
          <InfoIcon size={12} className="mt-0.5 shrink-0" />
          <p>Mobile reports are intended for authorized guidance review. AI output is advisory and should be considered together with the submitted information and applicable school procedures.</p>
        </div>
      </div>
    </article>
  );
};

export default memo(MobileReport);

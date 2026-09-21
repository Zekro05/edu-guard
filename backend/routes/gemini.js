import express from "express";

import { ai } from "../config/geminiAi.js";

import {
  findRelevantResearchReferences,
  formatReferencesForGemini,
} from "../services/researchReferenceService.js";

import Report from "../models/reportModel.js";
import Incident from "../models/incidentModel.js";
import Student from "../models/studentModel.js";

const router = express.Router();

const GEMINI_MODEL = "models/gemini-3-flash-preview";
const MAX_RETRIES = 4;
const MAX_EVIDENCE_IMAGES = 5;
const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10 MB

const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
];

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const CONCLUSION_OPTIONS = [
  "Warning",
  "Call a Parent",
  "Community Service",
  "Suspension",
];

const getErrorStatus = (error) => {
  return (
    error?.status ||
    error?.response?.status ||
    error?.error?.code ||
    error?.statusCode ||
    null
  );
};

const generateWithRetry = async (contents, options = {}) => {
  const { maxRetries = MAX_RETRIES, config } = options;

  let lastError;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      console.log(`🤖 Gemini request attempt ${attempt + 1}/${maxRetries + 1}`);

      const response = await ai.models.generateContent({
        model: GEMINI_MODEL,
        contents,
        ...(config ? { config } : {}),
      });

      const blockReason = response?.promptFeedback?.blockReason;

      if (blockReason) {
        console.error("🚫 Gemini blocked the request:", blockReason);

        const blockedError = new Error(
          `Gemini blocked the request: ${blockReason}`,
        );

        blockedError.code = "GEMINI_CONTENT_BLOCKED";

        blockedError.blockReason = blockReason;

        throw blockedError;
      }

      const candidates = response?.candidates;

      if (
        !candidates ||
        !Array.isArray(candidates) ||
        candidates.length === 0
      ) {
        const emptyError = new Error(
          "Gemini returned no generated candidates.",
        );

        emptyError.code = "GEMINI_EMPTY_RESPONSE";

        throw emptyError;
      }

      console.log("✅ Gemini request successful.");

      return response;
    } catch (error) {
      lastError = error;

      const status = getErrorStatus(error);

      console.error(`❌ Gemini attempt ${attempt + 1} failed.`, {
        status,
        code: error?.code,
        blockReason: error?.blockReason,
        message: error?.message || "Unknown Gemini error",
      });

      if (error?.code === "GEMINI_CONTENT_BLOCKED") {
        throw error;
      }

      if (error?.code === "GEMINI_EMPTY_RESPONSE") {
        throw error;
      }

      const retryableStatuses = [408, 429, 500, 502, 503, 504];

      if (!retryableStatuses.includes(Number(status))) {
        throw error;
      }

      if (attempt === maxRetries) {
        break;
      }

      const delay = Math.min(1000 * Math.pow(2, attempt), 8000);

      console.log(`⏳ Retrying in ${delay / 1000} seconds...`);

      await sleep(delay);
    }
  }

  throw lastError;
};

const getGeminiText = (response) => {
  return (
    response?.candidates?.[0]?.content?.parts
      ?.map((part) => part?.text || "")
      .join("")
      .trim() ||
    response?.text?.trim() ||
    ""
  );
};

const cleanJsonText = (text) => {
  if (!text) {
    return "";
  }

  let cleaned = String(text).trim();

  cleaned = cleaned
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  const firstBrace = cleaned.indexOf("{");

  const lastBrace = cleaned.lastIndexOf("}");

  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    cleaned = cleaned.slice(firstBrace, lastBrace + 1);
  }

  return cleaned;
};

const normalizeConclusion = (conclusion) => {
  if (!conclusion) {
    return null;
  }

  const normalized = String(conclusion).trim().toLowerCase();

  const match = CONCLUSION_OPTIONS.find(
    (option) => option.toLowerCase() === normalized,
  );

  return match || null;
};

const getFallbackConclusion = (currentIncident = {}) => {
  const level = String(currentIncident?.level || "").toLowerCase();

  if (level === "high") {
    return "Suspension";
  }

  if (level === "medium") {
    return "Call a Parent";
  }

  return "Warning";
};

const normalizeValue = (value, fallback = "Unknown") => {
  if (value === null || value === undefined || String(value).trim() === "") {
    return fallback;
  }

  return String(value).trim();
};

const normalizeArray = (value) => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => String(item || "").trim())
    .filter(Boolean)
    .slice(0, 10);
};

const normalizeEnum = (value, allowedValues, fallback) => {
  if (!value) {
    return fallback;
  }

  const normalized = String(value).trim().toLowerCase();

  const match = allowedValues.find((item) => item.toLowerCase() === normalized);

  return match || fallback;
};

const normalizeConfidence = (value) => {
  if (value === null || value === undefined) {
    return null;
  }

  let number = Number(value);

  if (Number.isNaN(number)) {
    const match = String(value).match(/\d+(\.\d+)?/);

    if (!match) {
      return null;
    }

    number = Number(match[0]);
  }

  /*
    Handle Gemini returning 0.84 instead of 84.
  */
  if (number > 0 && number <= 1) {
    number *= 100;
  }

  number = Math.round(number);

  return Math.min(100, Math.max(0, number));
};

const countBy = (items, getter) => {
  const counts = {};

  for (const item of items) {
    const value = normalizeValue(getter(item));

    counts[value] = (counts[value] || 0) + 1;
  }

  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .map(([name, count]) => ({
      name,
      count,
    }));
};

const getStudentId = (item) => {
  const value =
    item?.studentId?._id || item?.studentId || item?.student?._id || null;

  return value ? String(value) : null;
};

const getDateValue = (item) => {
  return (
    item?.date ||
    item?.incidentDate ||
    item?.createdAt ||
    item?.updatedAt ||
    null
  );
};

const getMonthKey = (dateValue) => {
  if (!dateValue) {
    return "Unknown";
  }

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return "Unknown";
  }

  return date.toISOString().slice(0, 7);
};

const getDateRange = (items) => {
  const dates = items
    .map(getDateValue)
    .filter(Boolean)
    .map((value) => new Date(value))
    .filter((date) => !Number.isNaN(date.getTime()))
    .sort((a, b) => a - b);

  if (!dates.length) {
    return {
      earliest: null,
      latest: null,
    };
  }

  return {
    earliest: dates[0].toISOString(),

    latest: dates[dates.length - 1].toISOString(),
  };
};

const buildSchoolWideStatistics = ({ reports, incidents, students }) => {
  const allStudentIds = new Set();

  reports.forEach((report) => {
    const studentId = getStudentId(report);

    if (studentId) {
      allStudentIds.add(studentId);
    }
  });

  incidents.forEach((incident) => {
    const studentId = getStudentId(incident);

    if (studentId) {
      allStudentIds.add(studentId);
    }
  });

  const severityDistribution = countBy(
    incidents,
    (incident) => incident?.level || incident?.riskLevel || "Unknown",
  );

  const categoryDistribution = countBy(
    incidents,
    (incident) => incident?.category || incident?.title || "Unknown",
  );

  const offenseDistribution = countBy(
    reports,
    (report) => report?.offense || report?.category || "Unknown",
  );

  const locationDistribution = countBy(
    [...reports, ...incidents],
    (item) => item?.location || "Unknown",
  );

  const incidentStatusDistribution = countBy(
    incidents,
    (incident) => incident?.status || "Unknown",
  );

  const reportStatusDistribution = countBy(
    reports,
    (report) => report?.status || "Unknown",
  );

  const reporterDistribution = countBy(
    reports,
    (report) => report?.reporterType || "Unknown",
  );

  const monthlyMap = {};

  reports.forEach((report) => {
    const month = getMonthKey(getDateValue(report));

    if (!monthlyMap[month]) {
      monthlyMap[month] = {
        month,
        reports: 0,
        incidents: 0,
      };
    }

    monthlyMap[month].reports += 1;
  });

  incidents.forEach((incident) => {
    const month = getMonthKey(getDateValue(incident));

    if (!monthlyMap[month]) {
      monthlyMap[month] = {
        month,
        reports: 0,
        incidents: 0,
      };
    }

    monthlyMap[month].incidents += 1;
  });

  const monthlyTrend = Object.values(monthlyMap).sort((a, b) =>
    a.month.localeCompare(b.month),
  );

  /*
    Anonymous student behavior summary.
    Student names are intentionally not sent to Gemini.
  */
  const studentBehaviorMap = {};

  incidents.forEach((incident) => {
    const studentId = getStudentId(incident);

    if (!studentId) {
      return;
    }

    if (!studentBehaviorMap[studentId]) {
      studentBehaviorMap[studentId] = {
        studentId,
        incidentCount: 0,
        highCount: 0,
        mediumCount: 0,
        lowCount: 0,
        categories: {},
      };
    }

    const student = studentBehaviorMap[studentId];

    student.incidentCount += 1;

    const level = String(
      incident?.level || incident?.riskLevel || "",
    ).toLowerCase();

    if (level === "high") {
      student.highCount += 1;
    }

    if (level === "medium") {
      student.mediumCount += 1;
    }

    if (level === "low") {
      student.lowCount += 1;
    }

    const category = normalizeValue(incident?.category || incident?.title);

    student.categories[category] = (student.categories[category] || 0) + 1;
  });

  const recurringStudents = Object.values(studentBehaviorMap)
    .sort((a, b) => b.incidentCount - a.incidentCount)
    .slice(0, 20);

  const highIncidents = incidents.filter((incident) => {
    const level = String(
      incident?.level || incident?.riskLevel || "",
    ).toLowerCase();

    return level === "high";
  }).length;

  const mediumIncidents = incidents.filter((incident) => {
    const level = String(
      incident?.level || incident?.riskLevel || "",
    ).toLowerCase();

    return level === "medium";
  }).length;

  const lowIncidents = incidents.filter((incident) => {
    const level = String(
      incident?.level || incident?.riskLevel || "",
    ).toLowerCase();

    return level === "low";
  }).length;

  return {
    totalStudents: students.length,

    studentsInvolved: allStudentIds.size,

    totalReports: reports.length,

    totalIncidents: incidents.length,

    highIncidents,

    mediumIncidents,

    lowIncidents,

    severityDistribution,

    categoryDistribution: categoryDistribution.slice(0, 15),

    offenseDistribution: offenseDistribution.slice(0, 15),

    locationDistribution: locationDistribution.slice(0, 15),

    incidentStatusDistribution,

    reportStatusDistribution,

    reporterDistribution,

    monthlyTrend,

    recurringStudents,

    reportDateRange: getDateRange(reports),

    incidentDateRange: getDateRange(incidents),
  };
};

/* =========================================================
   PENDING REPORT EVIDENCE HELPERS
========================================================= */

/*
  Determine image MIME type from a URL when Cloudinary does
  not provide a usable content-type header.
*/
const getMimeTypeFromUrl = (url) => {
  try {
    const parsedUrl = new URL(url);

    const pathname = parsedUrl.pathname.toLowerCase();

    if (pathname.endsWith(".jpg") || pathname.endsWith(".jpeg")) {
      return "image/jpeg";
    }

    if (pathname.endsWith(".png")) {
      return "image/png";
    }

    if (pathname.endsWith(".webp")) {
      return "image/webp";
    }

    if (pathname.endsWith(".gif")) {
      return "image/gif";
    }

    return null;
  } catch {
    return null;
  }
};

/*
  Download a public evidence image and convert it into
  Gemini inlineData.
*/
const fetchImageAsInlineData = async (url) => {
  if (!url) {
    throw new Error("Evidence URL is missing.");
  }

  const controller = new AbortController();

  const timeout = setTimeout(() => controller.abort(), 15000);

  try {
    const response = await fetch(url, {
      method: "GET",
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(
        `Evidence image could not be downloaded. HTTP ${response.status}`,
      );
    }

    const contentTypeHeader = response.headers.get("content-type") || "";

    const contentType = contentTypeHeader.split(";")[0].trim().toLowerCase();

    const mimeType = ALLOWED_IMAGE_TYPES.includes(contentType)
      ? contentType
      : getMimeTypeFromUrl(url);

    if (!mimeType || !ALLOWED_IMAGE_TYPES.includes(mimeType)) {
      throw new Error("Evidence file is not a supported image type.");
    }

    const contentLength = response.headers.get("content-length");

    if (contentLength && Number(contentLength) > MAX_IMAGE_SIZE) {
      throw new Error(
        "Evidence image is larger than the 10 MB analysis limit.",
      );
    }

    const arrayBuffer = await response.arrayBuffer();

    if (arrayBuffer.byteLength > MAX_IMAGE_SIZE) {
      throw new Error(
        "Evidence image is larger than the 10 MB analysis limit.",
      );
    }

    const base64 = Buffer.from(arrayBuffer).toString("base64");

    return {
      inlineData: {
        mimeType,
        data: base64,
      },
    };
  } finally {
    clearTimeout(timeout);
  }
};

/* =========================================================
   BUILD PENDING REPORT PROMPT
========================================================= */

const buildPendingReportPrompt = ({ report, imageCount, skippedEvidence }) => {
  const evidenceDescription =
    imageCount > 0
      ? `${imageCount} image evidence file(s) will be provided after this prompt.`
      : "No image evidence is available for visual analysis.";

  const skippedDescription =
    skippedEvidence > 0
      ? `${skippedEvidence} evidence file(s) were not visually analyzed because they are video/document files or unsupported files.`
      : "There are no additional unanalyzed evidence files.";

  return `
You are GuidEd AI, an AI assistant supporting authorized
school personnel who review student incident reports.

Your role is to ASSIST HUMAN REVIEW.

You must NOT make the final disciplinary decision.

You must NOT automatically accept the report.

You must NOT automatically reject the report.

Analyze the submitted report using the written information
and any attached image evidence.

=========================================================
IMPORTANT LIMITATIONS
=========================================================

1. You cannot prove that the report is true.

2. You cannot prove that an image is authentic.

3. You cannot determine when or where an image was actually
   taken.

4. You cannot determine whether an image was edited outside
   the information visibly available to you.

5. Do not identify students based on facial appearance.

6. Do not make psychological or mental-health diagnoses.

7. Do not infer facts that are not supported by the report
   or visible evidence.

8. If evidence is unclear, say so.

9. Human verification is required before accepting or
   rejecting the report.

=========================================================
DISTINGUISH THESE CONCEPTS
=========================================================

SEVERITY:

How serious the reported incident appears to be based on the
information provided.

Possible values:

- Low
- Medium
- High


RISK:

How much attention or urgency the report may require based
on the available information.

Consider:

- potential harm
- escalation indicators
- repeated behavior described in the report
- seriousness of the reported conduct
- circumstances recorded in the report

Possible values:

- Low
- Medium
- High


REVIEW PRIORITY:

How urgently an authorized reviewer should examine the report.

Possible values:

- Low
- Medium
- High


EVIDENCE ASSESSMENT:

Evaluate whether the visible evidence appears relevant to the
reported incident and whether it appears visually consistent
with the written description.

Possible values:

- Relevant
- Consistent
- Partially Consistent
- Inconsistent
- Insufficient
- Unable to Verify

IMPORTANT:

Do NOT use the word "accurate" to mean that the evidence is
proven authentic.

"Consistent" means that the visible information appears
consistent with the written report. It does NOT prove that
the incident happened exactly as described.

=========================================================
REPORT INFORMATION
=========================================================

Offense:
${String(report?.offense || "Not provided").trim()}

Location:
${String(report?.location || "Not provided").trim()}

Incident Date:
${report?.date ? new Date(report.date).toISOString() : "Not provided"}

Incident Time:
${String(report?.time || "Not provided").trim()}

Reporter Type:
${String(report?.reporterType || "Not provided").trim()}

Description:
${String(report?.description || "No description provided.").trim()}

=========================================================
EVIDENCE
=========================================================

${evidenceDescription}

${skippedDescription}

=========================================================
ANALYSIS REQUIREMENTS
=========================================================

Determine:

1. riskLevel
2. severity
3. severityReason
4. reviewPriority
5. evidenceAssessment
6. evidenceConfidence
7. evidenceFindings
8. limitations
9. summary

The analysis must:

- use only the information provided
- avoid inventing facts
- avoid diagnosing the student
- avoid psychological conclusions
- avoid identifying students from faces
- avoid claiming authenticity
- avoid claiming that an image proves the report
- identify contradictions when clearly visible
- identify missing or insufficient evidence
- identify image-quality limitations
- distinguish observations from assumptions
- state limitations clearly

Do not include the student's name.

Do not include private identifiers.

Do not make an accept/reject decision.

=========================================================
OUTPUT
=========================================================

Return ONLY valid JSON.

Do not use markdown.

Do not wrap the JSON in code fences.

Do not add additional properties.

Required structure:

{
  "riskLevel": "Low",
  "severity": "Medium",
  "severityReason": "",
  "reviewPriority": "Medium",
  "evidenceAssessment": "Insufficient",
  "evidenceConfidence": 0,
  "evidenceFindings": [],
  "limitations": [],
  "summary": ""
}

riskLevel MUST be exactly:

Low
Medium
High

severity MUST be exactly:

Low
Medium
High

reviewPriority MUST be exactly:

Low
Medium
High

evidenceAssessment MUST be exactly one of:

Relevant
Consistent
Partially Consistent
Inconsistent
Insufficient
Unable to Verify

evidenceConfidence MUST be a number from 0 to 100.

Return ONLY the JSON object.
`;
};

/* =========================================================
   ANALYZE ONE PENDING REPORT
========================================================= */

const analyzePendingReportData = async (report) => {
  if (!report) {
    throw new Error("Report was not found.");
  }

  if (report.status !== "pending") {
    throw new Error("Only pending reports can be analyzed by this endpoint.");
  }

  const evidence = Array.isArray(report.evidence) ? report.evidence : [];

  /*
      Only image evidence is sent to Gemini in this version.

      Video/document analysis can be added separately later.
    */
  const imageEvidence = evidence
    .filter((item) => {
      const type = String(item?.type || "").toLowerCase();

      return type === "image" && item?.url;
    })
    .slice(0, MAX_EVIDENCE_IMAGES);

  const skippedEvidenceCount = Math.max(
    0,
    evidence.length - imageEvidence.length,
  );

  const imageParts = [];

  const evidenceDownloadLimitations = [];

  /*
      Download each image from Cloudinary and prepare it
      for Gemini.
    */
  for (const evidenceItem of imageEvidence) {
    try {
      const inlineData = await fetchImageAsInlineData(evidenceItem.url);

      imageParts.push(inlineData);
    } catch (error) {
      console.warn("⚠️ Could not load report evidence image:", error?.message);

      evidenceDownloadLimitations.push(
        `One image evidence file could not be loaded for AI analysis: ${
          error?.message || "Unknown image loading error"
        }`,
      );
    }
  }

  const prompt = buildPendingReportPrompt({
    report,
    imageCount: imageParts.length,
    skippedEvidence: skippedEvidenceCount,
  });

  /*
      Gemini multimodal request.

      The first part contains the text prompt.
      Following parts contain the actual images.
    */
  const contents = [
    {
      role: "user",
      parts: [
        {
          text: prompt,
        },
        ...imageParts,
      ],
    },
  ];

  let response;

  try {
    response = await generateWithRetry(contents, {
      config: {
        responseMimeType: "application/json",
      },
    });
  } catch (error) {
    const status = getErrorStatus(error);

    if (Number(status) === 429) {
      throw new Error(
        "Gemini rate limit reached. Please wait before analyzing more reports.",
      );
    }

    if (Number(status) === 503) {
      throw new Error(
        "Gemini is temporarily unavailable. Please try again later.",
      );
    }

    throw error;
  }

  const text = getGeminiText(response);

  if (!text.trim()) {
    throw new Error("Gemini returned an empty response for this report.");
  }

  const cleaned = cleanJsonText(text);

  let parsed;

  try {
    parsed = JSON.parse(cleaned);
  } catch (error) {
    console.error("❌ Pending report Gemini JSON parse error:", error);

    console.error("Gemini returned:", text);

    throw new Error("Gemini returned invalid JSON for this report.");
  }

  /* =======================================================
       NORMALIZE AI RESPONSE
    ======================================================= */

  const riskLevel = normalizeEnum(
    parsed?.riskLevel,
    ["Low", "Medium", "High"],
    "Medium",
  );

  const severity = normalizeEnum(
    parsed?.severity,
    ["Low", "Medium", "High"],
    "Medium",
  );

  const reviewPriority = normalizeEnum(
    parsed?.reviewPriority,
    ["Low", "Medium", "High"],
    "Medium",
  );

  const evidenceAssessment = normalizeEnum(
    parsed?.evidenceAssessment,
    [
      "Relevant",
      "Consistent",
      "Partially Consistent",
      "Inconsistent",
      "Insufficient",
      "Unable to Verify",
    ],
    imageParts.length > 0 ? "Unable to Verify" : "Insufficient",
  );

  const evidenceConfidence = normalizeConfidence(parsed?.evidenceConfidence);

  const evidenceFindings = normalizeArray(parsed?.evidenceFindings);

  const limitations = normalizeArray(parsed?.limitations);

  /*
      Add server-generated limitations.
    */

  if (skippedEvidenceCount > 0) {
    limitations.push(
      `${skippedEvidenceCount} evidence file(s) were not visually analyzed because this endpoint currently analyzes image evidence only.`,
    );
  }

  for (const limitation of evidenceDownloadLimitations) {
    limitations.push(limitation);
  }

  /*
      Remove duplicate limitations.
    */
  const uniqueLimitations = [...new Set(limitations)].slice(0, 10);

  let finalEvidenceAssessment = evidenceAssessment;

  /*
      If images existed but none could actually be loaded,
      AI cannot legitimately provide a visual assessment.
    */
  if (imageEvidence.length > 0 && imageParts.length === 0) {
    finalEvidenceAssessment = "Unable to Verify";
  }

  /*
      No image evidence means evidence assessment is
      insufficient.
    */
  if (imageEvidence.length === 0) {
    finalEvidenceAssessment = "Insufficient";
  }

  const summary =
    String(parsed?.summary || "").trim() || "Manual review is required.";

  const severityReason =
    String(parsed?.severityReason || "").trim() ||
    "Severity was determined from the available report information.";

  return {
    analyzed: true,

    analyzedAt: new Date(),

    model: GEMINI_MODEL,

    riskLevel,

    severity,

    severityReason,

    reviewPriority,

    evidenceAssessment: finalEvidenceAssessment,

    evidenceConfidence,

    evidenceFindings,

    limitations: uniqueLimitations,

    summary,

    analyzedImageCount: imageParts.length,

    unanalyzedEvidenceCount: skippedEvidenceCount,

    error: "",
  };
};

/* =========================================================
   GENERIC GENERATE
========================================================= */

router.post("/generate", async (req, res) => {
  try {
    const { prompt } = req.body;

    if (!prompt) {
      return res.status(400).json({
        success: false,
        error: "Prompt is required",
      });
    }

    const response = await generateWithRetry(prompt);

    const text = getGeminiText(response);

    if (!text) {
      return res.status(500).json({
        success: false,
        error: "Gemini returned an empty response.",
        code: "GEMINI_EMPTY_RESPONSE",
      });
    }

    return res.json({
      success: true,
      text,
    });
  } catch (err) {
    console.error("Gemini API error:", err);

    if (err?.code === "GEMINI_CONTENT_BLOCKED") {
      return res.status(422).json({
        success: false,
        error:
          "Gemini blocked this content and could not generate an AI response.",
        code: "GEMINI_CONTENT_BLOCKED",
        reason: err?.blockReason || "PROHIBITED_CONTENT",
      });
    }

    if (err?.code === "GEMINI_EMPTY_RESPONSE") {
      return res.status(500).json({
        success: false,
        error: "Gemini returned no generated content.",
        code: "GEMINI_EMPTY_RESPONSE",
      });
    }

    const status = getErrorStatus(err);

    if (Number(status) === 503) {
      return res.status(503).json({
        success: false,
        error:
          "Gemini AI is temporarily experiencing high demand. Please try again in a few moments.",
        code: "GEMINI_UNAVAILABLE",
      });
    }

    if (Number(status) === 429) {
      return res.status(429).json({
        success: false,
        error:
          "Gemini AI request limit has been reached. Please try again shortly.",
        code: "GEMINI_RATE_LIMIT",
      });
    }

    return res.status(500).json({
      success: false,
      error: err?.message || "Failed to generate AI content.",
    });
  }
});

/* =========================================================
   STUDENT AI ANALYSIS
   CURRENT INCIDENT FIRST
   WITH RESEARCH REFERENCES
========================================================= */

router.post("/student-analysis", async (req, res) => {
  try {
    const {
      grade,
      riskLevel,
      currentIncident = null,
      previousIncidents = [],
      timeline = [],
      incidents = [],
      reports = [],
      requiredConclusionOptions = CONCLUSION_OPTIONS,
    } = req.body;

    const primaryIncident = currentIncident || null;

    let supportingIncidents = Array.isArray(previousIncidents)
      ? previousIncidents
      : [];

    if (supportingIncidents.length === 0 && Array.isArray(incidents)) {
      supportingIncidents = incidents.filter((incident) => {
        if (!primaryIncident?.incidentId) {
          return true;
        }

        return (
          String(incident?.incidentId) !== String(primaryIncident.incidentId)
        );
      });
    }

    const allowedConclusions = Array.isArray(requiredConclusionOptions)
      ? requiredConclusionOptions.filter((option) =>
          CONCLUSION_OPTIONS.includes(option),
        )
      : CONCLUSION_OPTIONS;

    const finalConclusionOptions = allowedConclusions.length
      ? allowedConclusions
      : CONCLUSION_OPTIONS;

    console.log("📚 Finding relevant research references...");

    const researchReferences = await findRelevantResearchReferences({
      grade,
      riskLevel,
      timeline,
      incidents: supportingIncidents,
      reports,
      currentIncident: primaryIncident,
      previousIncidents: supportingIncidents,
      limit: 5,
    });

    console.log(
      `📚 Selected ${researchReferences.length} research references.`,
    );

    const researchContext = formatReferencesForGemini(researchReferences);

    const currentIncidentText = primaryIncident
      ? `
Incident ID:
${primaryIncident?.incidentId || "N/A"}

Report ID:
${primaryIncident?.reportId || "N/A"}

Title / Offense:
${primaryIncident?.title || "N/A"}

Category:
${primaryIncident?.category || "N/A"}

Severity / Level:
${primaryIncident?.level || "N/A"}

Current Status:
${primaryIncident?.status || "N/A"}

Student Statement:
${primaryIncident?.studentStatement || "No student statement provided."}

Report Description:
${primaryIncident?.reportDescription || "No report description provided."}

Location:
${primaryIncident?.location || "Not specified"}

Date:
${primaryIncident?.date || "Not specified"}

Time:
${primaryIncident?.time || "Not specified"}

Evidence:
${
  Array.isArray(primaryIncident?.evidence)
    ? primaryIncident.evidence.join(", ")
    : primaryIncident?.evidence || "No evidence details provided."
}

Recorded Action:
${primaryIncident?.action || "No action recorded."}

Created At:
${primaryIncident?.createdAt || "N/A"}
`
      : "No current incident was supplied.";

    const previousIncidentText = supportingIncidents.length
      ? supportingIncidents
          .map(
            (incident, index) => `
Previous Incident ${index + 1}

Incident ID:
${incident?.incidentId || "N/A"}

Title:
${incident?.title || "N/A"}

Category:
${incident?.category || "N/A"}

Severity / Level:
${incident?.level || "N/A"}

Status:
${incident?.status || "N/A"}

Student Statement:
${incident?.studentStatement || "No student statement provided."}

Action:
${incident?.action || "No action recorded."}

Created At:
${incident?.createdAt || "N/A"}
`,
          )
          .join("\n")
      : "No previous incidents were supplied.";

    const reportText = reports.length
      ? reports
          .map(
            (report, index) => `
Report ${index + 1}

Report ID:
${report?.reportId || "N/A"}

Offense:
${report?.offense || "N/A"}

Category:
${report?.category || "N/A"}

Description:
${report?.description || "N/A"}

Location:
${report?.location || "N/A"}

Date:
${report?.date || "N/A"}

Time:
${report?.time || "N/A"}

Status:
${report?.status || "N/A"}
`,
          )
          .join("\n")
      : "No recorded reports.";

    const prompt = `
You are GuidEd AI, an educational guidance assistant.

Your task is to analyze a student's CURRENT SCHOOL INCIDENT
and provide cautious, research-supported educational guidance
for authorized school guidance personnel.

This is NOT a medical, psychological, psychiatric, or clinical
diagnosis.

=========================================================
MOST IMPORTANT RULE: CURRENT INCIDENT HAS PRIORITY
=========================================================

The "CURRENT INCIDENT" section below represents the specific
incident/case that the guidance administrator is currently
reviewing.

The intervention recommendation MUST be based PRIMARILY on
the CURRENT INCIDENT.

You MUST evaluate the current incident's:

- title/offense
- category
- severity/level
- current status
- student statement
- report description
- circumstances
- location
- date/time
- evidence
- recorded action, when available

Previous incidents and previous reports are SECONDARY context.

Use previous behavioral history ONLY when it is directly
relevant to understanding the current incident or deciding
what educational intervention may be appropriate.

DO NOT recommend an intervention merely because the student
previously committed another offense.

DO NOT let an old incident override the facts of the current
incident.

DO NOT treat the student's previous history as more important
than the facts of the current incident.

The recommendation must answer:

"What intervention is most appropriate for THIS CURRENT
INCIDENT, based primarily on the current incident overview
and supported by the supplied research references?"

=========================================================
RESEARCH RULES
=========================================================

You MUST use the research references supplied below as the
evidence base for recommendations.

1. Use ONLY the supplied research references.
2. Never invent a study.
3. Never invent an author.
4. Never invent a journal.
5. Never invent a DOI.
6. Never invent research findings.
7. Never cite a reference that was not supplied.
8. Every recommendation must include one or more supplied
   reference IDs when adequate research support exists.
9. If a recommendation cannot be adequately supported by the
   supplied references, say:
   "Insufficient evidence in the current reference database."
10. Research evidence should support educational guidance,
    not diagnosis.
11. Do not claim that a research finding proves what will
    happen to this particular student.
12. Use cautious language such as:
    "may", "can", "consider", and "evidence suggests".

=========================================================
CONCLUSION RULE
=========================================================

Every intervention recommendation MUST end with a conclusion.

The conclusion MUST be exactly ONE of these options:

${finalConclusionOptions.map((option) => `- ${option}`).join("\n")}

Do not create another conclusion option.

The "conclusion" field MUST contain only the selected option.

=========================================================
STUDENT INFORMATION
=========================================================

Grade:
${grade || "Not specified"}

Current recorded risk level:
${riskLevel || "Not specified"}

=========================================================
CURRENT INCIDENT
=========================================================

${currentIncidentText}

=========================================================
PREVIOUS INCIDENTS
=========================================================

${previousIncidentText}

=========================================================
RECORDED REPORTS
=========================================================

${reportText}

=========================================================
RESEARCH REFERENCE DATABASE
=========================================================

${researchContext}

=========================================================
ANALYSIS RULES
=========================================================

- Base behavioral observations ONLY on recorded school
  information.

- Do not invent facts.

- Do not diagnose mental health conditions.

- Do not speculate about medical conditions.

- Do not make assumptions about personality.

- Risk must be based only on recorded school information.

- Prediction must be cautious.

- The CURRENT INCIDENT is the primary basis for intervention.

- Previous incidents are secondary context.

- Previous incidents must never automatically escalate the
  intervention.

- Do not recommend suspension simply because a previous incident
  was severe.

- Consider the actual severity, circumstances, evidence,
  student statement, and current status of the CURRENT INCIDENT.

- Keep recommendations educational and proportionate.

- Do not invent school policies.

- Do not state that a particular intervention is legally required.

- Provide exactly 3 intervention recommendations.

- Each recommendation must have:
  - recommendation
  - conclusion
  - basis
  - referenceIds
  - references

- Do not use markdown.

- Do not wrap JSON in code fences.

- Do not add explanations outside the JSON.

=========================================================
REQUIRED JSON STRUCTURE
=========================================================

{
  "summary": "",
  "pattern": "",
  "risk": "",
  "prediction": "",
  "interventions": [
    {
      "recommendation": "",
      "conclusion": "Warning",
      "basis": "",
      "referenceIds": [],
      "references": [
        {
          "referenceId": "",
          "citation": "",
          "doi": ""
        }
      ]
    }
  ],
  "notes": ""
}

Return ONLY valid JSON.
`;

    console.log(
      "🤖 Generating current-incident-focused research-backed student analysis...",
    );

    const response = await generateWithRetry(prompt, {
      config: {
        responseMimeType: "application/json",
      },
    });

    let text = getGeminiText(response);

    if (!text) {
      return res.status(500).json({
        success: false,
        error: "Gemini returned an empty response.",
        code: "GEMINI_EMPTY_RESPONSE",
      });
    }

    text = cleanJsonText(text);

    let analysis;

    try {
      analysis = JSON.parse(text);
    } catch (parseError) {
      console.error("❌ Research AI JSON Parse Error:", parseError);

      console.error("Gemini returned:", text);

      return res.status(500).json({
        success: false,
        error: "Gemini returned invalid JSON.",
        code: "GEMINI_INVALID_JSON",
      });
    }

    const validRiskLevels = ["Low", "Medium", "High"];

    const validatedRisk = validRiskLevels.includes(analysis?.risk)
      ? analysis.risk
      : analysis?.risk || "Risk could not be determined.";

    const referenceMap = new Map(
      researchReferences.map((reference) => [reference.referenceId, reference]),
    );

    const rawInterventions = Array.isArray(analysis?.interventions)
      ? analysis.interventions
      : [];

    const validatedInterventions = rawInterventions
      .slice(0, 3)
      .map((intervention) => {
        const validIds = Array.isArray(intervention?.referenceIds)
          ? intervention.referenceIds.filter((id) => referenceMap.has(id))
          : [];

        const validReferences = validIds.map((id) => {
          const reference = referenceMap.get(id);

          return {
            referenceId: reference.referenceId,

            citation: `${reference.authors.join(", ")} (${reference.year})`,

            doi: reference.doi || "",
          };
        });

        let conclusion = normalizeConclusion(intervention?.conclusion);

        if (!conclusion) {
          const recommendationText = String(
            intervention?.recommendation || "",
          ).toLowerCase();

          if (recommendationText.includes("suspension")) {
            conclusion = "Suspension";
          } else if (recommendationText.includes("community service")) {
            conclusion = "Community Service";
          } else if (recommendationText.includes("call a parent")) {
            conclusion = "Call a Parent";
          } else if (recommendationText.includes("warning")) {
            conclusion = "Warning";
          }
        }

        if (!conclusion) {
          conclusion = getFallbackConclusion(primaryIncident);
        }

        const recommendation = String(
          intervention?.recommendation || "No recommendation generated.",
        ).trim();

        const escapedConclusion = conclusion.replace(
          /[.*+?^${}()|[\]\\]/g,
          "\\$&",
        );

        const conclusionRegex = new RegExp(
          `Conclusion\\s*:\\s*${escapedConclusion}\\.?$`,
          "i",
        );

        const finalRecommendation = conclusionRegex.test(recommendation)
          ? recommendation
          : `${recommendation}${
              recommendation ? " " : ""
            }Conclusion: ${conclusion}.`;

        return {
          recommendation: finalRecommendation,

          conclusion,

          basis:
            intervention?.basis ||
            "The recommendation is primarily based on the current incident overview and supported by the available research references.",

          referenceIds: validIds,

          references: validReferences,
        };
      });

    while (validatedInterventions.length < 3) {
      const fallbackConclusion = getFallbackConclusion(primaryIncident);

      validatedInterventions.push({
        recommendation: `Insufficient evidence in the current reference database to generate an additional evidence-supported intervention for the current incident. Conclusion: ${fallbackConclusion}.`,

        conclusion: fallbackConclusion,

        basis:
          "The available research references did not provide enough evidence for an additional recommendation.",

        referenceIds: [],

        references: [],
      });
    }

    return res.json({
      success: true,

      analysisBasis: "current-incident",

      currentIncidentId: primaryIncident?.incidentId || null,

      summary: analysis?.summary || "No summary was generated.",

      pattern:
        analysis?.pattern || "No clear behavioral pattern was identified.",

      risk: validatedRisk,

      prediction: analysis?.prediction || "No prediction is available.",

      interventions: validatedInterventions,

      notes: analysis?.notes || "No additional notes were generated.",

      researchReferences: researchReferences.map((reference) => ({
        referenceId: reference.referenceId,

        type: reference.type,

        category: reference.category,

        title: reference.title,

        authors: reference.authors,

        year: reference.year,

        journal: reference.journal,

        doi: reference.doi,

        sourceUrl: reference.sourceUrl,

        findings: reference.findings,

        evidenceLevel: reference.evidenceLevel,
      })),
    });
  } catch (err) {
    console.error("❌ Research-backed AI analysis error:", err);

    if (err?.code === "GEMINI_CONTENT_BLOCKED") {
      return res.status(422).json({
        success: false,
        error:
          "AI analysis could not be generated because Gemini blocked the submitted content.",
        code: "GEMINI_CONTENT_BLOCKED",
        reason: err?.blockReason || "PROHIBITED_CONTENT",
      });
    }

    if (err?.code === "GEMINI_EMPTY_RESPONSE") {
      return res.status(500).json({
        success: false,
        error: "Gemini returned no generated content.",
        code: "GEMINI_EMPTY_RESPONSE",
      });
    }

    const status = getErrorStatus(err);

    if (Number(status) === 429) {
      return res.status(429).json({
        success: false,
        error:
          "Gemini AI request limit has been reached. Please try again shortly.",
        code: "GEMINI_RATE_LIMIT",
      });
    }

    if (Number(status) === 503) {
      return res.status(503).json({
        success: false,
        error:
          "Gemini AI is temporarily experiencing high demand. Please try again in a few moments.",
        code: "GEMINI_UNAVAILABLE",
      });
    }

    return res.status(500).json({
      success: false,
      error: err?.message || "Failed to generate research-backed AI analysis.",
    });
  }
});

/* =========================================================
   SCHOOL-WIDE AI ANALYSIS
========================================================= */

router.post("/school-analysis", async (req, res) => {
  try {
    console.log("🏫 Starting school-wide GuidEd AI analysis...");

    const [reports, incidents, students] = await Promise.all([
      Report.find({}).lean(),

      Incident.find({}).lean(),

      Student.find({}).lean(),
    ]);

    console.log(
      `📊 School data loaded: ${reports.length} reports, ${incidents.length} incidents, ${students.length} students.`,
    );

    const schoolStats = buildSchoolWideStatistics({
      reports,
      incidents,
      students,
    });

    const recentReports = [...reports]
      .sort(
        (a, b) =>
          new Date(getDateValue(b) || 0) - new Date(getDateValue(a) || 0),
      )
      .slice(0, 200);

    const recentIncidents = [...incidents]
      .sort(
        (a, b) =>
          new Date(getDateValue(b) || 0) - new Date(getDateValue(a) || 0),
      )
      .slice(0, 200);

    console.log("📚 Finding research references for school-wide analysis...");

    const researchReferences = await findRelevantResearchReferences({
      grade: "All Grades",

      riskLevel:
        schoolStats.highIncidents > 0
          ? "High"
          : schoolStats.mediumIncidents > 0
            ? "Medium"
            : "Low",

      timeline: schoolStats.monthlyTrend,

      incidents: recentIncidents,

      reports: recentReports,

      currentIncident: null,

      previousIncidents: recentIncidents,

      limit: 5,
    });

    console.log(
      `📚 Selected ${researchReferences.length} school-wide research references.`,
    );

    const researchContext = formatReferencesForGemini(researchReferences);

    const reportText = recentReports.length
      ? recentReports
          .map(
            (report, index) => `
Report Sample ${index + 1}

Report ID:
${report?.reportId || "N/A"}

Offense:
${report?.offense || "N/A"}

Category:
${report?.category || "N/A"}

Location:
${report?.location || "N/A"}

Reporter Type:
${report?.reporterType || "N/A"}

Date:
${report?.date || "N/A"}

Time:
${report?.time || "N/A"}

Status:
${report?.status || "N/A"}

Description:
${report?.description || "N/A"}
`,
          )
          .join("\n")
      : "No reports recorded.";

    const incidentText = recentIncidents.length
      ? recentIncidents
          .map(
            (incident, index) => `
Incident Sample ${index + 1}

Incident ID:
${incident?.incidentId || incident?._id || "N/A"}

Title:
${incident?.title || "N/A"}

Category:
${incident?.category || "N/A"}

Severity / Level:
${incident?.level || incident?.riskLevel || "N/A"}

Status:
${incident?.status || "N/A"}

Location:
${incident?.location || "N/A"}

Date:
${incident?.date || "N/A"}

Action:
${incident?.action || "N/A"}

Created At:
${incident?.createdAt || "N/A"}
`,
          )
          .join("\n")
      : "No incidents recorded.";

    const prompt = `
You are GuidEd AI, an educational guidance and school
behavioral analytics assistant.

Analyze the OVERALL SCHOOL-WIDE BEHAVIORAL DATA recorded
in the GuidEd system.

This is NOT an analysis of one student.

This is NOT an analysis of one incident.

This is NOT a current-incident intervention assessment.

The purpose is to identify meaningful school-wide behavioral
trends that can help authorized guidance personnel understand
the overall discipline environment.

This is NOT a medical, psychological, psychiatric, or
clinical diagnosis.

=========================================================
SCHOOL-WIDE DATA
=========================================================

Total Students:
${schoolStats.totalStudents}

Students Involved:
${schoolStats.studentsInvolved}

Total Reports:
${schoolStats.totalReports}

Total Incidents:
${schoolStats.totalIncidents}

High-Level Incidents:
${schoolStats.highIncidents}

Medium-Level Incidents:
${schoolStats.mediumIncidents}

Low-Level Incidents:
${schoolStats.lowIncidents}

=========================================================
SEVERITY DISTRIBUTION
=========================================================

${JSON.stringify(schoolStats.severityDistribution, null, 2)}

=========================================================
TOP INCIDENT CATEGORIES
=========================================================

${JSON.stringify(schoolStats.categoryDistribution, null, 2)}

=========================================================
TOP REPORTED OFFENSES
=========================================================

${JSON.stringify(schoolStats.offenseDistribution, null, 2)}

=========================================================
LOCATION DISTRIBUTION
=========================================================

${JSON.stringify(schoolStats.locationDistribution, null, 2)}

=========================================================
INCIDENT STATUS DISTRIBUTION
=========================================================

${JSON.stringify(schoolStats.incidentStatusDistribution, null, 2)}

=========================================================
REPORT STATUS DISTRIBUTION
=========================================================

${JSON.stringify(schoolStats.reportStatusDistribution, null, 2)}

=========================================================
REPORTER TYPE DISTRIBUTION
=========================================================

${JSON.stringify(schoolStats.reporterDistribution, null, 2)}

=========================================================
MONTHLY BEHAVIORAL TREND
=========================================================

${JSON.stringify(schoolStats.monthlyTrend, null, 2)}

=========================================================
REPEATED RECORDED INCIDENT PATTERNS
=========================================================

${JSON.stringify(schoolStats.recurringStudents, null, 2)}

=========================================================
DATE RANGE
=========================================================

Reports:
${JSON.stringify(schoolStats.reportDateRange, null, 2)}

Incidents:
${JSON.stringify(schoolStats.incidentDateRange, null, 2)}

=========================================================
RECENT REPORT SAMPLES
=========================================================

${reportText}

=========================================================
RECENT INCIDENT SAMPLES
=========================================================

${incidentText}

=========================================================
RESEARCH REFERENCE DATABASE
=========================================================

${researchContext}

=========================================================
ANALYSIS RULES
=========================================================

1. Analyze the school as a whole.

2. Use the aggregate statistics.

3. Do not focus on a single student.

4. Do not focus on a single incident.

5. Identify recurring behavioral categories.

6. Identify changes or trends over time.

7. Identify severity distribution.

8. Identify locations where incidents appear concentrated.

9. Identify whether repeated incidents appear to be a
   meaningful school-wide pattern.

10. Identify possible areas where guidance programs,
    prevention, monitoring, communication, or student
    support could be improved.

11. Distinguish recorded facts from interpretation.

12. Do not invent facts.

13. Do not diagnose mental health conditions.

14. Do not speculate about medical conditions.

15. Do not claim to know students' psychological states.

16. Do not claim that a pattern proves causation.

17. Use cautious language such as:
    "may", "can", "appears", and "suggests".

18. Do not invent school policies.

19. Recommendations must be SCHOOL-WIDE.

20. Do not recommend individual disciplinary actions.

=========================================================
REQUIRED OUTPUT
=========================================================

Return ONLY valid JSON.

{
  "summary": "",
  "pattern": "",
  "risk": "",
  "prediction": "",
  "interventions": [
    {
      "recommendation": "",
      "basis": "",
      "referenceIds": [],
      "references": [
        {
          "referenceId": "",
          "citation": "",
          "doi": ""
        }
      ]
    }
  ],
  "notes": ""
}

Return exactly 3 school-wide recommendations.
`;

    console.log("🤖 Generating school-wide research-backed AI analysis...");

    const response = await generateWithRetry(prompt, {
      config: {
        responseMimeType: "application/json",
      },
    });

    let text = getGeminiText(response);

    if (!text) {
      return res.status(500).json({
        success: false,
        error: "Gemini returned an empty response.",
        code: "GEMINI_EMPTY_RESPONSE",
      });
    }

    text = cleanJsonText(text);

    let analysis;

    try {
      analysis = JSON.parse(text);
    } catch (parseError) {
      console.error("❌ School-wide AI JSON Parse Error:", parseError);

      console.error("Gemini returned:", text);

      return res.status(500).json({
        success: false,
        error: "Gemini returned invalid JSON.",
        code: "GEMINI_INVALID_JSON",
      });
    }

    const validRiskLevels = ["Low", "Medium", "High"];

    const validatedRisk = validRiskLevels.includes(analysis?.risk)
      ? analysis.risk
      : "Low";

    const referenceMap = new Map(
      researchReferences.map((reference) => [reference.referenceId, reference]),
    );

    const rawInterventions = Array.isArray(analysis?.interventions)
      ? analysis.interventions
      : [];

    const validatedInterventions = rawInterventions
      .slice(0, 3)
      .map((intervention) => {
        const validIds = Array.isArray(intervention?.referenceIds)
          ? intervention.referenceIds.filter((id) => referenceMap.has(id))
          : [];

        const validReferences = validIds.map((id) => {
          const reference = referenceMap.get(id);

          return {
            referenceId: reference.referenceId,

            citation: `${reference.authors.join(", ")} (${reference.year})`,

            doi: reference.doi || "",
          };
        });

        return {
          recommendation: String(
            intervention?.recommendation ||
              "No school-wide recommendation generated.",
          ).trim(),

          basis: String(
            intervention?.basis ||
              "The recommendation is based on the aggregate school-wide behavioral data and available research references.",
          ).trim(),

          referenceIds: validIds,

          references: validReferences,
        };
      });

    while (validatedInterventions.length < 3) {
      validatedInterventions.push({
        recommendation:
          "Insufficient evidence in the current reference database to generate an additional evidence-supported school-wide recommendation.",

        basis:
          "The available research references did not provide enough evidence for an additional recommendation.",

        referenceIds: [],

        references: [],
      });
    }

    return res.json({
      success: true,

      analysisBasis: "school-wide",

      scope: "entire-system",

      summary: analysis?.summary || "No school-wide summary was generated.",

      pattern:
        analysis?.pattern ||
        "No clear school-wide behavioral pattern was identified.",

      risk: validatedRisk,

      prediction:
        analysis?.prediction || "No school-wide prediction is available.",

      interventions: validatedInterventions,

      notes:
        analysis?.notes || "No additional school-wide notes were generated.",

      schoolStats,

      researchReferences: researchReferences.map((reference) => ({
        referenceId: reference.referenceId,

        type: reference.type,

        category: reference.category,

        title: reference.title,

        authors: reference.authors,

        year: reference.year,

        journal: reference.journal,

        doi: reference.doi,

        sourceUrl: reference.sourceUrl,

        findings: reference.findings,

        evidenceLevel: reference.evidenceLevel,
      })),
    });
  } catch (err) {
    console.error("❌ School-wide AI analysis error:", err);

    if (err?.code === "GEMINI_CONTENT_BLOCKED") {
      return res.status(422).json({
        success: false,
        error:
          "AI analysis could not be generated because Gemini blocked the submitted content.",
        code: "GEMINI_CONTENT_BLOCKED",
        reason: err?.blockReason || "PROHIBITED_CONTENT",
      });
    }

    if (err?.code === "GEMINI_EMPTY_RESPONSE") {
      return res.status(500).json({
        success: false,
        error: "Gemini returned no generated content.",
        code: "GEMINI_EMPTY_RESPONSE",
      });
    }

    const status = getErrorStatus(err);

    if (Number(status) === 429) {
      return res.status(429).json({
        success: false,
        error:
          "Gemini AI request limit has been reached. Please try again shortly.",
        code: "GEMINI_RATE_LIMIT",
      });
    }

    if (Number(status) === 503) {
      return res.status(503).json({
        success: false,
        error:
          "Gemini AI is temporarily experiencing high demand. Please try again in a few moments.",
        code: "GEMINI_UNAVAILABLE",
      });
    }

    return res.status(500).json({
      success: false,
      error: err?.message || "Failed to generate school-wide AI analysis.",
    });
  }
});

/* =========================================================
   ANALYZE INCIDENT
========================================================= */

router.post("/analyze-incident", async (req, res) => {
  try {
    const {
      studentName,
      offense,
      location,
      description,
      reporterType,
      status,
    } = req.body;

    const prompt = `
You are EduGuard AI, an educational guidance assistant.

Your task is to classify and summarize a school disciplinary incident for authorized school guidance personnel.

This is NOT a medical or psychological diagnosis.

Analyze only the incident information provided below.

Offense:
${offense || "Not specified"}

Location:
${location || "Not specified"}

Reporter type:
${reporterType || "Not specified"}

Current incident status:
${status || "Pending"}

Incident description:
${description || "No description provided"}

Return ONLY a valid JSON object.

{
  "category": "",
  "confidence": "",
  "riskLevel": "",
  "pattern": "",
  "prediction": "",
  "remarks": "",
  "recommendation": ""
}

Requirements:

- category must be a short incident category.

- confidence must be a percentage.

- riskLevel must be exactly Low, Medium, or High.

- pattern must contain 1-2 concise sentences.

- prediction must contain exactly 1 cautious sentence.

- remarks must contain 2-3 concise professional sentences.

- recommendation must provide practical school guidance.

- Do not diagnose mental health conditions.

- Do not speculate about medical conditions.

- Do not make claims about psychological states.

- Do not invent facts.

- Do not include personal information.

- Do not use markdown.

- Do not wrap the JSON in code fences.
`;

    console.log("🤖 Starting GuidEd incident AI analysis...");

    const response = await generateWithRetry(prompt, {
      config: {
        responseMimeType: "application/json",
      },
    });

    let text = getGeminiText(response);

    if (!text) {
      return res.status(500).json({
        success: false,
        error: "Gemini returned an empty response.",
        code: "GEMINI_EMPTY_RESPONSE",
      });
    }

    text = cleanJsonText(text);

    let analysis;

    try {
      analysis = JSON.parse(text);
    } catch {
      return res.status(500).json({
        success: false,
        error: "Gemini returned invalid JSON.",
        code: "GEMINI_INVALID_JSON",
      });
    }

    const validRiskLevels = ["Low", "Medium", "High"];

    const riskLevel = validRiskLevels.includes(analysis?.riskLevel)
      ? analysis.riskLevel
      : "Low";

    return res.json({
      success: true,

      category: analysis?.category || offense || "General Incident",

      confidence: analysis?.confidence || "90%",

      riskLevel,

      pattern:
        analysis?.pattern || "No recurring behavioral pattern identified.",

      prediction:
        analysis?.prediction ||
        "No prediction available based on the available information.",

      remarks: analysis?.remarks || "No additional remarks were generated.",

      recommendation:
        analysis?.recommendation ||
        "Review the incident details and provide appropriate guidance.",
    });
  } catch (err) {
    console.error("❌ Gemini Incident Analysis Error:", err);

    if (err?.code === "GEMINI_CONTENT_BLOCKED") {
      return res.status(422).json({
        success: false,
        error:
          "AI analysis could not be generated because Gemini blocked the incident content.",
        code: "GEMINI_CONTENT_BLOCKED",
        reason: err?.blockReason || "PROHIBITED_CONTENT",
      });
    }

    if (err?.code === "GEMINI_EMPTY_RESPONSE") {
      return res.status(500).json({
        success: false,
        error: "Gemini returned no generated content.",
        code: "GEMINI_EMPTY_RESPONSE",
      });
    }

    const status = getErrorStatus(err);

    if (Number(status) === 429) {
      return res.status(429).json({
        success: false,
        error:
          "Gemini AI request limit has been reached. Please try again shortly.",
        code: "GEMINI_RATE_LIMIT",
      });
    }

    if (Number(status) === 503) {
      return res.status(503).json({
        success: false,
        error:
          "Gemini AI is temporarily experiencing high demand. Please try again in a few moments.",
        code: "GEMINI_UNAVAILABLE",
      });
    }

    return res.status(500).json({
      success: false,
      error: err?.message || "Failed to analyze incident.",
    });
  }
});

/* =========================================================
   ANALYZE ONE PENDING REPORT
========================================================= */

/*
  POST:
  /api/gemini/analyze-pending-report/:reportId

  What this does:

  1. Finds the report.
  2. Makes sure it is still pending.
  3. Loads image evidence.
  4. Sends report + images to Gemini.
  5. Saves Gemini's result into report.aiReview.
  6. Returns the AI review.

  IMPORTANT:

  This endpoint NEVER changes report.status.

  Gemini cannot accept or reject the report.
*/

router.post("/analyze-pending-report/:reportId", async (req, res) => {
  try {
    const { reportId } = req.params;

    if (!reportId) {
      return res.status(400).json({
        success: false,
        error: "Report ID is required.",
      });
    }

    const report = await Report.findById(reportId);

    if (!report) {
      return res.status(404).json({
        success: false,
        error: "Report not found.",
      });
    }

    if (report.status !== "pending") {
      return res.status(400).json({
        success: false,
        error: "Only pending reports can be analyzed.",
      });
    }

    console.log(`🔎 Starting Gemini pending report analysis: ${reportId}`);

    const aiReview = await analyzePendingReportData(report);

    /*
        Save only the AI review.

        report.status remains "pending".
      */
    report.aiReview = aiReview;

    await report.save();

    console.log(`✅ Pending report AI analysis saved: ${reportId}`);

    return res.json({
      success: true,

      message: "Pending report analyzed successfully.",

      reportId: report._id,

      aiReview: report.aiReview,
    });
  } catch (err) {
    console.error("❌ Analyze pending report error:", err);

    if (err?.code === "GEMINI_CONTENT_BLOCKED") {
      return res.status(422).json({
        success: false,
        error:
          "Gemini blocked the report content and could not complete the AI analysis.",
        code: "GEMINI_CONTENT_BLOCKED",
        reason: err?.blockReason || "PROHIBITED_CONTENT",
      });
    }

    if (err?.code === "GEMINI_EMPTY_RESPONSE") {
      return res.status(500).json({
        success: false,
        error: "Gemini returned no generated content.",
        code: "GEMINI_EMPTY_RESPONSE",
      });
    }

    if (err?.message?.includes("Only pending reports")) {
      return res.status(400).json({
        success: false,
        error: err.message,
      });
    }

    if (err?.message?.includes("rate limit")) {
      return res.status(429).json({
        success: false,
        error: err.message,
        code: "GEMINI_RATE_LIMIT",
      });
    }

    if (err?.message?.includes("temporarily unavailable")) {
      return res.status(503).json({
        success: false,
        error: err.message,
        code: "GEMINI_UNAVAILABLE",
      });
    }

    const status = getErrorStatus(err);

    if (Number(status) === 429) {
      return res.status(429).json({
        success: false,
        error:
          "Gemini AI request limit has been reached. Please try again shortly.",
        code: "GEMINI_RATE_LIMIT",
      });
    }

    if (Number(status) === 503) {
      return res.status(503).json({
        success: false,
        error: "Gemini AI is temporarily unavailable. Please try again later.",
        code: "GEMINI_UNAVAILABLE",
      });
    }

    return res.status(500).json({
      success: false,
      error: err?.message || "Failed to analyze pending report.",
    });
  }
});

/* =========================================================
   ANALYZE ALL PENDING REPORTS
========================================================= */

/*
  POST:
  /api/gemini/analyze-pending-reports

  Optional body:

  {
    "reanalyze": true
  }

  Default:

  {
    "reanalyze": false
  }

  When reanalyze is false:
  - reports with existing aiReview are skipped.

  When reanalyze is true:
  - every pending report is analyzed again.

  IMPORTANT:

  Reports are processed ONE AT A TIME.

  This is intentional to reduce Gemini API rate-limit
  problems.
*/

router.post("/analyze-pending-reports", async (req, res) => {
  try {
    const reanalyze = req.body?.reanalyze === true;

    /*
      Only pending reports are eligible.
    */
    const pendingReports = await Report.find({
      status: "pending",
    })
      .sort({
        createdAt: -1,
      })
      .lean(false);

    if (pendingReports.length === 0) {
      return res.json({
        success: true,

        message: "There are no pending reports to analyze.",

        total: 0,

        analyzed: 0,

        skipped: 0,

        failed: 0,

        highRisk: 0,

        mediumRisk: 0,

        lowRisk: 0,

        highSeverity: 0,

        mediumSeverity: 0,

        lowSeverity: 0,

        results: [],
      });
    }

    console.log(
      `🔎 Starting batch AI analysis for ${pendingReports.length} pending report(s).`,
    );

    const results = [];

    let analyzedCount = 0;
    let skippedCount = 0;
    let failedCount = 0;

    let highRiskCount = 0;
    let mediumRiskCount = 0;
    let lowRiskCount = 0;

    let highSeverityCount = 0;
    let mediumSeverityCount = 0;
    let lowSeverityCount = 0;

    /*
      Process reports sequentially.

      This is intentional.

      Gemini image analysis can consume significantly more
      resources than normal text requests.
    */
    for (const report of pendingReports) {
      try {
        /*
          Skip reports that already have an AI analysis
          unless reanalysis was explicitly requested.
        */
        if (report.aiReview?.analyzed === true && !reanalyze) {
          skippedCount++;

          const existingReview = report.aiReview;

          /*
            Count existing classifications so the frontend
            receives complete batch statistics.
          */
          if (existingReview?.riskLevel === "High") {
            highRiskCount++;
          } else if (existingReview?.riskLevel === "Medium") {
            mediumRiskCount++;
          } else if (existingReview?.riskLevel === "Low") {
            lowRiskCount++;
          }

          if (existingReview?.severity === "High") {
            highSeverityCount++;
          } else if (existingReview?.severity === "Medium") {
            mediumSeverityCount++;
          } else if (existingReview?.severity === "Low") {
            lowSeverityCount++;
          }

          results.push({
            reportId: report._id,

            success: true,

            skipped: true,

            reason: "Report already has an AI analysis.",

            aiReview: existingReview,
          });

          continue;
        }

        console.log(
          `🤖 Analyzing pending report ${report._id}...`,
        );

        const aiReview = await analyzePendingReportData(report);

        /*
          Save ONLY the AI review.

          The report remains pending.

          Gemini does NOT accept or reject the report.
        */
        report.aiReview = aiReview;

        await report.save();

        analyzedCount++;

        /*
          Collect risk statistics.
        */
        if (aiReview?.riskLevel === "High") {
          highRiskCount++;
        } else if (aiReview?.riskLevel === "Medium") {
          mediumRiskCount++;
        } else if (aiReview?.riskLevel === "Low") {
          lowRiskCount++;
        }

        /*
          Collect severity statistics.
        */
        if (aiReview?.severity === "High") {
          highSeverityCount++;
        } else if (aiReview?.severity === "Medium") {
          mediumSeverityCount++;
        } else if (aiReview?.severity === "Low") {
          lowSeverityCount++;
        }

        results.push({
          reportId: report._id,

          success: true,

          skipped: false,

          aiReview: report.aiReview,
        });

        /*
          Small delay between reports.

          This helps avoid sending requests to Gemini
          immediately one after another.
        */
        await sleep(1000);
      } catch (error) {
        failedCount++;

        console.error(
          `❌ Failed to analyze pending report ${report._id}:`,
          error?.message || error,
        );

        results.push({
          reportId: report._id,

          success: false,

          skipped: false,

          error:
            error?.message ||
            "Failed to analyze pending report.",
        });

        /*
          Continue processing the remaining reports.

          One failed report should not stop the entire
          batch operation.
        */
        continue;
      }
    }

    console.log(
      `✅ Batch AI analysis complete.`,
      {
        total: pendingReports.length,
        analyzed: analyzedCount,
        skipped: skippedCount,
        failed: failedCount,
        highRisk: highRiskCount,
        mediumRisk: mediumRiskCount,
        lowRisk: lowRiskCount,
        highSeverity: highSeverityCount,
        mediumSeverity: mediumSeverityCount,
        lowSeverity: lowSeverityCount,
      },
    );

    return res.json({
      success: true,

      message:
        "Pending report AI analysis completed.",

      total: pendingReports.length,

      analyzed: analyzedCount,

      skipped: skippedCount,

      failed: failedCount,

      /*
        Risk summary
      */
      highRisk: highRiskCount,

      mediumRisk: mediumRiskCount,

      lowRisk: lowRiskCount,

      /*
        Severity summary
      */
      highSeverity: highSeverityCount,

      mediumSeverity: mediumSeverityCount,

      lowSeverity: lowSeverityCount,

      /*
        Individual report results
      */
      results,
    });
  } catch (err) {
    console.error(
      "❌ Analyze pending reports error:",
      err,
    );

    if (err?.code === "GEMINI_CONTENT_BLOCKED") {
      return res.status(422).json({
        success: false,

        error:
          "Gemini blocked some submitted content and could not complete the AI analysis.",

        code: "GEMINI_CONTENT_BLOCKED",

        reason:
          err?.blockReason ||
          "PROHIBITED_CONTENT",
      });
    }

    if (err?.code === "GEMINI_EMPTY_RESPONSE") {
      return res.status(500).json({
        success: false,

        error:
          "Gemini returned no generated content.",

        code: "GEMINI_EMPTY_RESPONSE",
      });
    }

    const status = getErrorStatus(err);

    if (Number(status) === 429) {
      return res.status(429).json({
        success: false,

        error:
          "Gemini AI request limit has been reached. Please wait before analyzing more reports.",

        code: "GEMINI_RATE_LIMIT",
      });
    }

    if (Number(status) === 503) {
      return res.status(503).json({
        success: false,

        error:
          "Gemini AI is temporarily unavailable. Please try again later.",

        code: "GEMINI_UNAVAILABLE",
      });
    }

    return res.status(500).json({
      success: false,

      error:
        err?.message ||
        "Failed to analyze pending reports.",
    });
  }
});

/* =========================================================
   STUDENT HISTORY AI ANALYSIS
   NO RESEARCH LOOKUP
   STUDENT-FACING ONLY
========================================================= */

router.post("/student-history-analysis", async (req, res) => {
  try {
    const {
      grade,
      riskLevel,
      currentIncident = null,
      previousIncidents = [],
      incidents = [],
      reports = [],
    } = req.body;

    /*
      This endpoint is intentionally separate from /student-analysis.

      /student-analysis:
      - Admin/guidance use
      - Research-backed
      - Uses findRelevantResearchReferences()

      /student-history-analysis:
      - Student-facing
      - No research lookup
      - Uses only the student's recorded incident history
      - Provides educational/supportive guidance
    */

    const primaryIncident = currentIncident || null;

    let historyIncidents = Array.isArray(previousIncidents)
      ? previousIncidents
      : [];

    /*
      If previousIncidents was not supplied, fall back to incidents.
      Exclude the current incident so it is not duplicated.
    */
    if (historyIncidents.length === 0 && Array.isArray(incidents)) {
      historyIncidents = incidents.filter((incident) => {
        if (!primaryIncident?.incidentId) {
          return true;
        }

        return (
          String(incident?.incidentId) !==
          String(primaryIncident.incidentId)
        );
      });
    }

    /*
      Keep the amount of information sent to Gemini reasonable.
      The current incident is always kept separate and receives
      priority in the prompt.
    */
    historyIncidents = historyIncidents
      .slice(0, 30)
      .sort((a, b) => {
        const dateA = new Date(getDateValue(a) || 0).getTime();
        const dateB = new Date(getDateValue(b) || 0).getTime();

        return dateB - dateA;
      });

    const safeReports = Array.isArray(reports)
      ? reports.slice(0, 30)
      : [];

    const currentIncidentText = primaryIncident
      ? `
Incident ID:
${primaryIncident?.incidentId || "N/A"}

Report ID:
${primaryIncident?.reportId || "N/A"}

Title:
${primaryIncident?.title || "N/A"}

Category:
${primaryIncident?.category || "N/A"}

Risk Level:
${primaryIncident?.level || "N/A"}

Status:
${primaryIncident?.status || "N/A"}

Student Statement:
${primaryIncident?.studentStatement || "No student statement recorded."}

Incident Description:
${primaryIncident?.description || "No incident description recorded."}

Recorded Action:
${primaryIncident?.action || "No action recorded."}

Date:
${primaryIncident?.date || primaryIncident?.createdAt || "N/A"}

Location:
${primaryIncident?.location || "N/A"}
`
      : "No current incident was provided.";

    const previousIncidentText = historyIncidents.length
      ? historyIncidents
          .map(
            (incident, index) => `
Previous Incident ${index + 1}

Incident ID:
${incident?.incidentId || "N/A"}

Report ID:
${incident?.reportId || "N/A"}

Title:
${incident?.title || "N/A"}

Category:
${incident?.category || "N/A"}

Risk Level:
${incident?.level || "N/A"}

Status:
${incident?.status || "N/A"}

Description:
${incident?.description || "N/A"}

Student Statement:
${incident?.studentStatement || "No student statement recorded."}

Action:
${incident?.action || "N/A"}

Date:
${getDateValue(incident) || "N/A"}
`,
          )
          .join("\n")
      : "No previous incidents were recorded.";

    const reportText = safeReports.length
      ? safeReports
          .map(
            (report, index) => `
Report ${index + 1}

Report ID:
${report?.reportId || "N/A"}

Offense:
${report?.offense || "N/A"}

Category:
${report?.category || "N/A"}

Description:
${report?.description || "N/A"}

Location:
${report?.location || "N/A"}

Date:
${report?.date || "N/A"}

Time:
${report?.time || "N/A"}

Status:
${report?.status || "N/A"}
`,
          )
          .join("\n")
      : "No recorded reports.";

    const prompt = `
You are GuidEd AI, an educational student-support assistant.

You are analyzing a student's recorded school incident history
for the STUDENT THEMSELVES.

This analysis is NOT a medical, psychological, psychiatric,
or clinical diagnosis.

It is also NOT a disciplinary decision.

The purpose is to help the student understand their recorded
school history and identify constructive ways they may improve,
seek support, and avoid repeated problems.

=========================================================
IMPORTANT STUDENT SAFETY AND FAIRNESS RULES
=========================================================

- Use ONLY information contained in the supplied records.
- Do not invent facts.
- Do not invent incidents.
- Do not assume motives.
- Do not make assumptions about personality.
- Do not diagnose mental health conditions.
- Do not speculate about medical conditions.
- Do not label the student with a disorder.
- Do not make predictions that the student will commit future
  misconduct.
- Do not say that the student is a "bad student" or similar.
- Do not recommend punishment.
- Do not recommend suspension.
- Do not recommend detention.
- Do not recommend community service as punishment.
- Do not recommend disciplinary escalation.
- Do not claim that a disciplinary action is required.
- Do not invent school policies.

The analysis should be supportive, factual, and appropriate
for a student to read.

=========================================================
CURRENT INCIDENT
=========================================================

The current incident, when available, should receive the
greatest attention.

${currentIncidentText}

=========================================================
PREVIOUS INCIDENT HISTORY
=========================================================

Previous incidents are secondary context.

${previousIncidentText}

=========================================================
RECORDED REPORTS
=========================================================

${reportText}

=========================================================
STUDENT INFORMATION
=========================================================

Grade:
${grade || "Not specified"}

Current recorded risk level:
${riskLevel || "Not specified"}

=========================================================
ANALYSIS REQUIREMENTS
=========================================================

Generate:

1. A student-friendly description of the recorded history.

2. A cautious description of any repeated or notable pattern
   that is directly supported by the records.

3. A risk assessment based ONLY on the supplied school records.

4. A cautious "what this means" statement.

   This must NOT predict future misconduct.

   Instead, explain what the recorded history may indicate
   about areas where the student could benefit from support,
   reflection, communication, or positive changes.

5. Exactly THREE supportive guidance suggestions.

The suggestions should be practical and non-punitive.

Examples include:

- speaking with a guidance counselor
- reflecting on the circumstances surrounding an incident
- asking for clarification or support
- practicing communication or conflict-resolution skills
- creating a plan to avoid similar situations
- seeking help from a trusted adult
- using available school support resources

Do not present these as mandatory disciplinary actions.

=========================================================
LANGUAGE
=========================================================

Use respectful and student-friendly language.

Avoid judgmental language.

Use cautious wording such as:

"the records show"

"the history indicates"

"this may suggest"

"you may benefit from"

"consider"

"it may help to"

Do not overstate conclusions.

=========================================================
REQUIRED JSON FORMAT
=========================================================

Return ONLY valid JSON.

{
  "summary": "",
  "pattern": "",
  "risk": "",
  "prediction": "",
  "interventions": [
    {
      "recommendation": "",
      "basis": ""
    },
    {
      "recommendation": "",
      "basis": ""
    },
    {
      "recommendation": "",
      "basis": ""
    }
  ],
  "notes": ""
}

=========================================================
FIELD REQUIREMENTS
=========================================================

summary:
A concise student-friendly description of the recorded
incident history.

pattern:
Describe only patterns directly supported by the records.
If there is not enough information to identify a pattern,
say so.

risk:
Use one of:

"Low"
"Medium"
"High"

The risk assessment must be based only on the supplied
school records and must not be presented as a diagnosis.

prediction:
DO NOT predict future misconduct.

Instead, describe what area of support or improvement may
be useful based on the recorded history.

interventions:
Provide exactly THREE practical, supportive, non-punitive
suggestions.

notes:
Add a brief reminder that the analysis is based only on
recorded information and that the student can speak with
a guidance counselor or trusted adult for additional support.

Do not use markdown.

Do not wrap JSON in code fences.

Return ONLY valid JSON.
`;

    console.log(
      "🤖 Generating student-facing incident history analysis...",
    );

    /*
      IMPORTANT:
      There is intentionally NO call to:

      findRelevantResearchReferences()

      This keeps the student endpoint faster and independent
      from the research-backed admin analysis.
    */

    const response = await generateWithRetry(prompt, {
      maxRetries: 1,
      config: {
        responseMimeType: "application/json",
      },
    });

    let text = getGeminiText(response);

    if (!text) {
      return res.status(500).json({
        success: false,
        error: "Gemini returned an empty response.",
        code: "GEMINI_EMPTY_RESPONSE",
      });
    }

    text = cleanJsonText(text);

    let analysis;

    try {
      analysis = JSON.parse(text);
    } catch (parseError) {
      console.error(
        "❌ Student History AI JSON Parse Error:",
        parseError,
      );

      console.error("Gemini returned:", text);

      return res.status(500).json({
        success: false,
        error: "Gemini returned invalid JSON.",
        code: "GEMINI_INVALID_JSON",
      });
    }

    const validRiskLevels = ["Low", "Medium", "High"];

    const validatedRisk = validRiskLevels.includes(
      analysis?.risk,
    )
      ? analysis.risk
      : "Low";

    let interventions = Array.isArray(
      analysis?.interventions,
    )
      ? analysis.interventions
      : [];

    /*
      Make sure the student endpoint always returns exactly
      three supportive suggestions.
    */
    const fallbackInterventions = [
      {
        recommendation:
          "Consider speaking with your guidance counselor about the situations recorded in your history and any support you may need.",
        basis:
          "A guidance conversation can help you understand the circumstances surrounding the recorded incidents and identify constructive next steps.",
      },
      {
        recommendation:
          "Reflect on the circumstances surrounding the recorded incidents and identify one or two changes that could help you handle similar situations differently.",
        basis:
          "Reflection can help you recognize situations that may benefit from different communication or decision-making strategies.",
      },
      {
        recommendation:
          "If you are experiencing difficulty with a situation at school, consider asking a trusted adult for help before the situation becomes more difficult.",
        basis:
          "Seeking support early can provide an opportunity to discuss concerns and identify constructive ways forward.",
      },
    ];

    interventions = interventions
      .filter(
        (item) =>
          item &&
          typeof item.recommendation === "string" &&
          item.recommendation.trim(),
      )
      .slice(0, 3)
      .map((item) => ({
        recommendation: item.recommendation.trim(),
        basis:
          typeof item.basis === "string" && item.basis.trim()
            ? item.basis.trim()
            : "This suggestion is based on the recorded student history.",
      }));

    while (interventions.length < 3) {
      interventions.push(
        fallbackInterventions[interventions.length],
      );
    }

    return res.json({
      success: true,
      analysisBasis: "student-incident-history",

      incidentCount:
        (primaryIncident ? 1 : 0) +
        historyIncidents.length,

      summary:
        analysis?.summary ||
        "The available records do not contain enough information to provide a detailed summary.",

      pattern:
        analysis?.pattern ||
        "No clear pattern can be identified from the available records.",

      risk: validatedRisk,

      prediction:
        analysis?.prediction ||
        "The recorded history can be used to identify areas where additional support or reflection may be helpful.",

      interventions,

      notes:
        analysis?.notes ||
        "This analysis is based only on recorded school information. You may speak with your guidance counselor or another trusted adult if you need additional support.",
    });
  } catch (err) {
    console.error(
      "❌ Student History Gemini analysis error:",
      err,
    );

    if (err?.code === "GEMINI_CONTENT_BLOCKED") {
      return res.status(422).json({
        success: false,
        error:
          "Gemini blocked this content and could not generate a student analysis.",
        code: "GEMINI_CONTENT_BLOCKED",
        reason:
          err?.blockReason || "PROHIBITED_CONTENT",
      });
    }

    if (err?.code === "GEMINI_EMPTY_RESPONSE") {
      return res.status(500).json({
        success: false,
        error:
          "Gemini returned no generated content.",
        code: "GEMINI_EMPTY_RESPONSE",
      });
    }

    const status = getErrorStatus(err);

    if (Number(status) === 503) {
      return res.status(503).json({
        success: false,
        error:
          "Gemini AI is temporarily experiencing high demand. Please try again in a few moments.",
        code: "GEMINI_UNAVAILABLE",
      });
    }

    if (Number(status) === 429) {
      return res.status(429).json({
        success: false,
        error:
          "Gemini AI request limit has been reached. Please try again shortly.",
        code: "GEMINI_RATE_LIMIT",
      });
    }

    return res.status(500).json({
      success: false,
      error:
        err?.message ||
        "Failed to generate student history analysis.",
    });
  }
});

/* =========================================================
   EXPORT
========================================================= */

export default router;

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

/* =========================================================
   GEMINI CONFIG
========================================================= */

const GEMINI_MODEL = "models/gemini-3-flash-preview";
const MAX_RETRIES = 4;

const sleep = (ms) =>
  new Promise((resolve) => setTimeout(resolve, ms));

/* =========================================================
   ALLOWED INTERVENTION CONCLUSIONS
========================================================= */

const CONCLUSION_OPTIONS = [
  "Warning",
  "Call a Parent",
  "Community Service",
  "Suspension",
];

/* =========================================================
   GET ERROR STATUS
========================================================= */

const getErrorStatus = (error) => {
  return (
    error?.status ||
    error?.response?.status ||
    error?.error?.code ||
    null
  );
};

/* =========================================================
   RETRY GEMINI
========================================================= */

const generateWithRetry = async (
  contents,
  options = {},
) => {
  const {
    maxRetries = MAX_RETRIES,
    config,
  } = options;

  let lastError;

  for (
    let attempt = 0;
    attempt <= maxRetries;
    attempt++
  ) {
    try {
      console.log(
        `🤖 Gemini request attempt ${
          attempt + 1
        }/${maxRetries + 1}`,
      );

      const response =
        await ai.models.generateContent({
          model: GEMINI_MODEL,
          contents,
          ...(config ? { config } : {}),
        });

      const blockReason =
        response?.promptFeedback?.blockReason;

      if (blockReason) {
        console.error(
          "🚫 Gemini blocked the request:",
          blockReason,
        );

        const blockedError = new Error(
          `Gemini blocked the request: ${blockReason}`,
        );

        blockedError.code =
          "GEMINI_CONTENT_BLOCKED";

        blockedError.blockReason =
          blockReason;

        throw blockedError;
      }

      const candidates =
        response?.candidates;

      if (
        !candidates ||
        !Array.isArray(candidates) ||
        candidates.length === 0
      ) {
        const emptyError = new Error(
          "Gemini returned no generated candidates.",
        );

        emptyError.code =
          "GEMINI_EMPTY_RESPONSE";

        throw emptyError;
      }

      console.log(
        "✅ Gemini request successful.",
      );

      return response;
    } catch (error) {
      lastError = error;

      const status =
        getErrorStatus(error);

      console.error(
        `❌ Gemini attempt ${
          attempt + 1
        } failed.`,
        {
          status,
          code: error?.code,
          blockReason:
            error?.blockReason,
          message:
            error?.message ||
            "Unknown Gemini error",
        },
      );

      if (
        error?.code ===
        "GEMINI_CONTENT_BLOCKED"
      ) {
        throw error;
      }

      if (
        error?.code ===
        "GEMINI_EMPTY_RESPONSE"
      ) {
        throw error;
      }

      const retryableStatuses = [
        408,
        429,
        500,
        502,
        503,
        504,
      ];

      if (
        !retryableStatuses.includes(
          Number(status),
        )
      ) {
        throw error;
      }

      if (attempt === maxRetries) {
        break;
      }

      const delay = Math.min(
        1000 *
          Math.pow(2, attempt),
        8000,
      );

      console.log(
        `⏳ Retrying in ${
          delay / 1000
        } seconds...`,
      );

      await sleep(delay);
    }
  }

  throw lastError;
};

/* =========================================================
   EXTRACT TEXT
========================================================= */

const getGeminiText = (
  response,
) => {
  return (
    response?.candidates?.[0]
      ?.content?.parts
      ?.map(
        (part) =>
          part?.text || "",
      )
      .join("")
      .trim() ||
    response?.text?.trim() ||
    ""
  );
};

/* =========================================================
   CLEAN JSON
========================================================= */

const cleanJsonText = (
  text,
) => {
  return text
    .replace(
      /^```json\s*/i,
      "",
    )
    .replace(
      /^```\s*/i,
      "",
    )
    .replace(
      /\s*```$/i,
      "",
    )
    .trim();
};

/* =========================================================
   NORMALIZE CONCLUSION
========================================================= */

const normalizeConclusion = (
  conclusion,
) => {
  if (!conclusion) {
    return null;
  }

  const normalized =
    String(conclusion)
      .trim()
      .toLowerCase();

  const match =
    CONCLUSION_OPTIONS.find(
      (option) =>
        option.toLowerCase() ===
        normalized,
    );

  return match || null;
};

/* =========================================================
   FALLBACK CONCLUSION
========================================================= */

const getFallbackConclusion = (
  currentIncident = {},
) => {
  const level =
    String(
      currentIncident?.level ||
        "",
    ).toLowerCase();

  if (level === "high") {
    return "Suspension";
  }

  if (level === "medium") {
    return "Call a Parent";
  }

  return "Warning";
};

/* =========================================================
   SCHOOL-WIDE AI HELPERS
========================================================= */

const normalizeValue = (
  value,
  fallback = "Unknown",
) => {
  if (
    value === null ||
    value === undefined ||
    String(value).trim() === ""
  ) {
    return fallback;
  }

  return String(value).trim();
};

const countBy = (
  items,
  getter,
) => {
  const counts = {};

  for (const item of items) {
    const value =
      normalizeValue(
        getter(item),
      );

    counts[value] =
      (counts[value] || 0) + 1;
  }

  return Object.entries(counts)
    .sort(
      (a, b) =>
        b[1] - a[1],
    )
    .map(
      ([name, count]) => ({
        name,
        count,
      }),
    );
};

const getStudentId = (
  item,
) => {
  const value =
    item?.studentId?._id ||
    item?.studentId ||
    item?.student?._id ||
    null;

  return value
    ? String(value)
    : null;
};

const getDateValue = (
  item,
) => {
  return (
    item?.date ||
    item?.incidentDate ||
    item?.createdAt ||
    item?.updatedAt ||
    null
  );
};

const getMonthKey = (
  dateValue,
) => {
  if (!dateValue) {
    return "Unknown";
  }

  const date =
    new Date(dateValue);

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return "Unknown";
  }

  return date
    .toISOString()
    .slice(0, 7);
};

const getDateRange = (
  items,
) => {
  const dates = items
    .map(getDateValue)
    .filter(Boolean)
    .map(
      (value) =>
        new Date(value),
    )
    .filter(
      (date) =>
        !Number.isNaN(
          date.getTime(),
        ),
    )
    .sort(
      (a, b) => a - b,
    );

  if (!dates.length) {
    return {
      earliest: null,
      latest: null,
    };
  }

  return {
    earliest:
      dates[0].toISOString(),

    latest:
      dates[
        dates.length - 1
      ].toISOString(),
  };
};

/* =========================================================
   BUILD SCHOOL-WIDE STATISTICS
========================================================= */

const buildSchoolWideStatistics = ({
  reports,
  incidents,
  students,
}) => {
  const allStudentIds =
    new Set();

  reports.forEach(
    (report) => {
      const studentId =
        getStudentId(report);

      if (studentId) {
        allStudentIds.add(
          studentId,
        );
      }
    },
  );

  incidents.forEach(
    (incident) => {
      const studentId =
        getStudentId(
          incident,
        );

      if (studentId) {
        allStudentIds.add(
          studentId,
        );
      }
    },
  );

  /* =====================================================
     SEVERITY
  ===================================================== */

  const severityDistribution =
    countBy(
      incidents,
      (incident) =>
        incident?.level ||
        incident?.riskLevel ||
        "Unknown",
    );

  /* =====================================================
     CATEGORIES
  ===================================================== */

  const categoryDistribution =
    countBy(
      incidents,
      (incident) =>
        incident?.category ||
        incident?.title ||
        "Unknown",
    );

  /* =====================================================
     OFFENSES
  ===================================================== */

  const offenseDistribution =
    countBy(
      reports,
      (report) =>
        report?.offense ||
        report?.category ||
        "Unknown",
    );

  /* =====================================================
     LOCATIONS
  ===================================================== */

  const locationDistribution =
    countBy(
      [
        ...reports,
        ...incidents,
      ],
      (item) =>
        item?.location ||
        "Unknown",
    );

  /* =====================================================
     INCIDENT STATUS
  ===================================================== */

  const incidentStatusDistribution =
    countBy(
      incidents,
      (incident) =>
        incident?.status ||
        "Unknown",
    );

  /* =====================================================
     REPORT STATUS
  ===================================================== */

  const reportStatusDistribution =
    countBy(
      reports,
      (report) =>
        report?.status ||
        "Unknown",
    );

  /* =====================================================
     REPORTER TYPES
  ===================================================== */

  const reporterDistribution =
    countBy(
      reports,
      (report) =>
        report?.reporterType ||
        "Unknown",
    );

  /* =====================================================
     MONTHLY TREND
  ===================================================== */

  const monthlyMap = {};

  reports.forEach(
    (report) => {
      const month =
        getMonthKey(
          getDateValue(
            report,
          ),
        );

      if (!monthlyMap[month]) {
        monthlyMap[month] = {
          month,
          reports: 0,
          incidents: 0,
        };
      }

      monthlyMap[month]
        .reports += 1;
    },
  );

  incidents.forEach(
    (incident) => {
      const month =
        getMonthKey(
          getDateValue(
            incident,
          ),
        );

      if (!monthlyMap[month]) {
        monthlyMap[month] = {
          month,
          reports: 0,
          incidents: 0,
        };
      }

      monthlyMap[month]
        .incidents += 1;
    },
  );

  const monthlyTrend =
    Object.values(
      monthlyMap,
    ).sort(
      (a, b) =>
        a.month.localeCompare(
          b.month,
        ),
    );

  /* =====================================================
     STUDENT BEHAVIOR SUMMARY

     We intentionally use IDs/counts only.
     No student names are sent to Gemini.
  ===================================================== */

  const studentBehaviorMap =
    {};

  incidents.forEach(
    (incident) => {
      const studentId =
        getStudentId(
          incident,
        );

      if (!studentId) {
        return;
      }

      if (
        !studentBehaviorMap[
          studentId
        ]
      ) {
        studentBehaviorMap[
          studentId
        ] = {
          studentId,
          incidentCount: 0,
          highCount: 0,
          mediumCount: 0,
          lowCount: 0,
          categories: {},
        };
      }

      const student =
        studentBehaviorMap[
          studentId
        ];

      student.incidentCount += 1;

      const level =
        String(
          incident?.level ||
            incident?.riskLevel ||
            "",
        ).toLowerCase();

      if (
        level === "high"
      ) {
        student.highCount += 1;
      }

      if (
        level === "medium"
      ) {
        student.mediumCount += 1;
      }

      if (
        level === "low"
      ) {
        student.lowCount += 1;
      }

      const category =
        normalizeValue(
          incident?.category ||
            incident?.title,
        );

      student.categories[
        category
      ] =
        (student.categories[
          category
        ] || 0) + 1;
    },
  );

  const recurringStudents =
    Object.values(
      studentBehaviorMap,
    )
      .sort(
        (a, b) =>
          b.incidentCount -
          a.incidentCount,
      )
      .slice(0, 20);

  /* =====================================================
     RISK COUNTS
  ===================================================== */

  const highIncidents =
    incidents.filter(
      (incident) => {
        const level =
          String(
            incident?.level ||
              incident?.riskLevel ||
              "",
          ).toLowerCase();

        return level === "high";
      },
    ).length;

  const mediumIncidents =
    incidents.filter(
      (incident) => {
        const level =
          String(
            incident?.level ||
              incident?.riskLevel ||
              "",
          ).toLowerCase();

        return level ===
          "medium";
      },
    ).length;

  const lowIncidents =
    incidents.filter(
      (incident) => {
        const level =
          String(
            incident?.level ||
              incident?.riskLevel ||
              "",
          ).toLowerCase();

        return level === "low";
      },
    ).length;

  return {
    totalStudents:
      students.length,

    studentsInvolved:
      allStudentIds.size,

    totalReports:
      reports.length,

    totalIncidents:
      incidents.length,

    highIncidents,

    mediumIncidents,

    lowIncidents,

    severityDistribution,

    categoryDistribution:
      categoryDistribution.slice(
        0,
        15,
      ),

    offenseDistribution:
      offenseDistribution.slice(
        0,
        15,
      ),

    locationDistribution:
      locationDistribution.slice(
        0,
        15,
      ),

    incidentStatusDistribution,

    reportStatusDistribution,

    reporterDistribution,

    monthlyTrend,

    recurringStudents,

    reportDateRange:
      getDateRange(
        reports,
      ),

    incidentDateRange:
      getDateRange(
        incidents,
      ),
  };
};

/* =========================================================
   GENERIC GENERATE
========================================================= */

router.post(
  "/generate",
  async (req, res) => {
    try {
      const { prompt } =
        req.body;

      if (!prompt) {
        return res.status(400).json({
          success: false,
          error:
            "Prompt is required",
        });
      }

      const response =
        await generateWithRetry(
          prompt,
        );

      const text =
        getGeminiText(
          response,
        );

      if (!text) {
        return res.status(500).json({
          success: false,
          error:
            "Gemini returned an empty response.",
          code:
            "GEMINI_EMPTY_RESPONSE",
        });
      }

      return res.json({
        success: true,
        text,
      });
    } catch (err) {
      console.error(
        "Gemini API error:",
        err,
      );

      if (
        err?.code ===
        "GEMINI_CONTENT_BLOCKED"
      ) {
        return res.status(422).json({
          success: false,
          error:
            "Gemini blocked this content and could not generate an AI response.",
          code:
            "GEMINI_CONTENT_BLOCKED",
          reason:
            err?.blockReason ||
            "PROHIBITED_CONTENT",
        });
      }

      if (
        err?.code ===
        "GEMINI_EMPTY_RESPONSE"
      ) {
        return res.status(500).json({
          success: false,
          error:
            "Gemini returned no generated content.",
          code:
            "GEMINI_EMPTY_RESPONSE",
        });
      }

      const status =
        getErrorStatus(err);

      if (
        Number(status) === 503
      ) {
        return res.status(503).json({
          success: false,
          error:
            "Gemini AI is temporarily experiencing high demand. Please try again in a few moments.",
          code:
            "GEMINI_UNAVAILABLE",
        });
      }

      if (
        Number(status) === 429
      ) {
        return res.status(429).json({
          success: false,
          error:
            "Gemini AI request limit has been reached. Please try again shortly.",
          code:
            "GEMINI_RATE_LIMIT",
        });
      }

      return res.status(500).json({
        success: false,
        error:
          err?.message ||
          "Failed to generate AI content.",
      });
    }
  },
);

/* =========================================================
   STUDENT AI ANALYSIS
   CURRENT INCIDENT FIRST
   WITH RESEARCH REFERENCES
========================================================= */

router.post(
  "/student-analysis",
  async (req, res) => {
    try {
      const {
        grade,
        riskLevel,
        currentIncident = null,
        previousIncidents = [],
        timeline = [],
        incidents = [],
        reports = [],
        requiredConclusionOptions =
          CONCLUSION_OPTIONS,
      } = req.body;

      /* =====================================================
         PREPARE CURRENT INCIDENT
      ===================================================== */

      const primaryIncident =
        currentIncident || null;

      /* =====================================================
         PREPARE PREVIOUS INCIDENTS
      ===================================================== */

      let supportingIncidents =
        Array.isArray(
          previousIncidents,
        )
          ? previousIncidents
          : [];

      if (
        supportingIncidents.length ===
          0 &&
        Array.isArray(
          incidents,
        )
      ) {
        supportingIncidents =
          incidents.filter(
            (incident) => {
              if (
                !primaryIncident
                  ?.incidentId
              ) {
                return true;
              }

              return (
                String(
                  incident?.incidentId,
                ) !==
                String(
                  primaryIncident.incidentId,
                )
              );
            },
          );
      }

      /* =====================================================
         VALIDATE CONCLUSION OPTIONS
      ===================================================== */

      const allowedConclusions =
        Array.isArray(
          requiredConclusionOptions,
        )
          ? requiredConclusionOptions.filter(
              (option) =>
                CONCLUSION_OPTIONS.includes(
                  option,
                ),
            )
          : CONCLUSION_OPTIONS;

      const finalConclusionOptions =
        allowedConclusions.length
          ? allowedConclusions
          : CONCLUSION_OPTIONS;

      /* =====================================================
         RESEARCH SEARCH DATA
      ===================================================== */

      console.log(
        "📚 Finding relevant research references...",
      );

      const researchReferences =
        await findRelevantResearchReferences(
          {
            grade,
            riskLevel,
            timeline,
            incidents:
              supportingIncidents,
            reports,
            currentIncident:
              primaryIncident,
            previousIncidents:
              supportingIncidents,
            limit: 5,
          },
        );

      console.log(
        `📚 Selected ${researchReferences.length} research references.`,
      );

      const researchContext =
        formatReferencesForGemini(
          researchReferences,
        );

      /* =====================================================
         CURRENT INCIDENT TEXT
      ===================================================== */

      const currentIncidentText =
        primaryIncident
          ? `
Incident ID:
${
  primaryIncident?.incidentId ||
  "N/A"
}

Report ID:
${
  primaryIncident?.reportId ||
  "N/A"
}

Title / Offense:
${
  primaryIncident?.title ||
  "N/A"
}

Category:
${
  primaryIncident?.category ||
  "N/A"
}

Severity / Level:
${
  primaryIncident?.level ||
  "N/A"
}

Current Status:
${
  primaryIncident?.status ||
  "N/A"
}

Student Statement:
${
  primaryIncident?.studentStatement ||
  "No student statement provided."
}

Report Description:
${
  primaryIncident?.reportDescription ||
  "No report description provided."
}

Location:
${
  primaryIncident?.location ||
  "Not specified"
}

Date:
${
  primaryIncident?.date ||
  "Not specified"
}

Time:
${
  primaryIncident?.time ||
  "Not specified"
}

Evidence:
${
  Array.isArray(
    primaryIncident?.evidence,
  )
    ? primaryIncident.evidence.join(
        ", ",
      )
    : primaryIncident?.evidence ||
      "No evidence details provided."
}

Recorded Action:
${
  primaryIncident?.action ||
  "No action recorded."
}

Created At:
${
  primaryIncident?.createdAt ||
  "N/A"
}
`
          : "No current incident was supplied.";

      /* =====================================================
         PREVIOUS INCIDENT TEXT
      ===================================================== */

      const previousIncidentText =
        supportingIncidents.length
          ? supportingIncidents
              .map(
                (
                  incident,
                  index,
                ) => `
Previous Incident ${
                  index + 1
                }

Incident ID:
${
  incident?.incidentId ||
  "N/A"
}

Title:
${
  incident?.title ||
  "N/A"
}

Category:
${
  incident?.category ||
  "N/A"
}

Severity / Level:
${
  incident?.level ||
  "N/A"
}

Status:
${
  incident?.status ||
  "N/A"
}

Student Statement:
${
  incident?.studentStatement ||
  "No student statement provided."
}

Action:
${
  incident?.action ||
  "No action recorded."
}

Created At:
${
  incident?.createdAt ||
  "N/A"
}
`,
              )
              .join("\n")
          : "No previous incidents were supplied.";

      /* =====================================================
         REPORT TEXT
      ===================================================== */

      const reportText =
        reports.length
          ? reports
              .map(
                (
                  report,
                  index,
                ) => `
Report ${
                  index + 1
                }

Report ID:
${
  report?.reportId ||
  "N/A"
}

Offense:
${
  report?.offense ||
  "N/A"
}

Category:
${
  report?.category ||
  "N/A"
}

Description:
${
  report?.description ||
  "N/A"
}

Location:
${
  report?.location ||
  "N/A"
}

Date:
${
  report?.date ||
  "N/A"
}

Time:
${
  report?.time ||
  "N/A"
}

Status:
${
  report?.status ||
  "N/A"
}
`,
              )
              .join("\n")
          : "No recorded reports.";

      /* =====================================================
         PROMPT
      ===================================================== */

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

${finalConclusionOptions
  .map(
    (option) =>
      `- ${option}`,
  )
  .join("\n")}

Do not create another conclusion option.

Do not use:

- Expulsion
- Probation
- Counseling
- Mediation
- Referral
- Restorative Justice
- Any other label

Those may be discussed as supporting actions inside the
recommendation if appropriate, but the final conclusion field
must use exactly one of the allowed options above.

The "conclusion" field MUST contain only the selected option.

The "recommendation" field should explain WHY that intervention
is appropriate for the CURRENT INCIDENT.

=========================================================
STUDENT INFORMATION
=========================================================

Grade:
${grade || "Not specified"}

Current recorded risk level:
${riskLevel || "Not specified"}

=========================================================
CURRENT INCIDENT
PRIMARY BASIS FOR RECOMMENDATION
=========================================================

${currentIncidentText}

=========================================================
PREVIOUS INCIDENTS
SECONDARY CONTEXT ONLY
=========================================================

${previousIncidentText}

=========================================================
RECORDED REPORTS
SECONDARY CONTEXT ONLY
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

- Do not claim to know psychological states.

- Do not make assumptions about personality.

- Risk must be based only on the recorded school information.

- Prediction must be cautious and must not present an uncertain
  outcome as fact.

- The CURRENT INCIDENT is the primary basis for intervention.

- Previous incidents are secondary context.

- Previous incidents must never automatically escalate the
  intervention.

- Do not recommend suspension simply because a previous incident
  was severe.

- Consider the actual severity, circumstances, evidence,
  student statement, and current status of the CURRENT INCIDENT.

- Keep recommendations educational and proportionate.

- Do not invent school policies that were not provided.

- Do not state that a particular intervention is legally required.

- Provide exactly 3 intervention recommendations.

- Each recommendation must have:
  - recommendation
  - conclusion
  - basis
  - referenceIds
  - references

- conclusion must be exactly one of:
  ${finalConclusionOptions.join(
    ", ",
  )}

- Each reference in "references" must correspond exactly to a
  supplied research reference.

- The citation should use the supplied author names and year.

- The DOI must exactly match the supplied DOI.

- Do not create fake citations.

- If evidence is insufficient, explicitly state so.

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

      const response =
        await generateWithRetry(
          prompt,
          {
            config: {
              responseMimeType:
                "application/json",
            },
          },
        );

      let text =
        getGeminiText(
          response,
        );

      if (!text) {
        return res.status(500).json({
          success: false,
          error:
            "Gemini returned an empty response.",
          code:
            "GEMINI_EMPTY_RESPONSE",
        });
      }

      text =
        cleanJsonText(text);

      let analysis;

      try {
        analysis =
          JSON.parse(text);
      } catch (parseError) {
        console.error(
          "❌ Research AI JSON Parse Error:",
          parseError,
        );

        console.error(
          "Gemini returned:",
          text,
        );

        return res.status(500).json({
          success: false,
          error:
            "Gemini returned invalid JSON.",
          code:
            "GEMINI_INVALID_JSON",
        });
      }

      /* =====================================================
         VALIDATE RISK
      ===================================================== */

      const validRiskLevels = [
        "Low",
        "Medium",
        "High",
      ];

      const validatedRisk =
        validRiskLevels.includes(
          analysis?.risk,
        )
          ? analysis.risk
          : analysis?.risk ||
            "Risk could not be determined.";

      /* =====================================================
         VALIDATE RESEARCH REFERENCES
      ===================================================== */

      const referenceMap =
        new Map(
          researchReferences.map(
            (reference) => [
              reference.referenceId,
              reference,
            ],
          ),
        );

      /* =====================================================
         VALIDATE INTERVENTIONS
      ===================================================== */

      const rawInterventions =
        Array.isArray(
          analysis?.interventions,
        )
          ? analysis.interventions
          : [];

      const validatedInterventions =
        rawInterventions
          .slice(0, 3)
          .map(
            (
              intervention,
            ) => {
              const validIds =
                Array.isArray(
                  intervention?.referenceIds,
                )
                  ? intervention.referenceIds.filter(
                      (id) =>
                        referenceMap.has(
                          id,
                        ),
                    )
                  : [];

              const validReferences =
                validIds.map(
                  (id) => {
                    const reference =
                      referenceMap.get(
                        id,
                      );

                    return {
                      referenceId:
                        reference.referenceId,

                      citation:
                        `${reference.authors.join(
                          ", ",
                        )} (${reference.year})`,

                      doi:
                        reference.doi ||
                        "",
                    };
                  },
                );

              let conclusion =
                normalizeConclusion(
                  intervention?.conclusion,
                );

              if (!conclusion) {
                const recommendationText =
                  String(
                    intervention?.recommendation ||
                      "",
                  ).toLowerCase();

                if (
                  recommendationText.includes(
                    "suspension",
                  )
                ) {
                  conclusion =
                    "Suspension";
                } else if (
                  recommendationText.includes(
                    "community service",
                  )
                ) {
                  conclusion =
                    "Community Service";
                } else if (
                  recommendationText.includes(
                    "call a parent",
                  ) ||
                  recommendationText.includes(
                    "parent conference",
                  )
                ) {
                  conclusion =
                    "Call a Parent";
                } else if (
                  recommendationText.includes(
                    "warning",
                  )
                ) {
                  conclusion =
                    "Warning";
                }
              }

              if (!conclusion) {
                conclusion =
                  getFallbackConclusion(
                    primaryIncident,
                  );
              }

              const recommendation =
                String(
                  intervention?.recommendation ||
                    "No recommendation generated.",
                ).trim();

              const escapedConclusion =
                conclusion.replace(
                  /[.*+?^${}()|[\]\\]/g,
                  "\\$&",
                );

              const conclusionRegex =
                new RegExp(
                  `Conclusion\\s*:\\s*${escapedConclusion}\\.?$`,
                  "i",
                );

              const finalRecommendation =
                conclusionRegex.test(
                  recommendation,
                )
                  ? recommendation
                  : `${recommendation}${
                      recommendation
                        ? " "
                        : ""
                    }Conclusion: ${conclusion}.`;

              return {
                recommendation:
                  finalRecommendation,

                conclusion,

                basis:
                  intervention?.basis ||
                  "The recommendation is primarily based on the current incident overview and supported by the available research references.",

                referenceIds:
                  validIds,

                references:
                  validReferences,
              };
            },
          );

      /* =====================================================
         GUARANTEE EXACTLY 3 INTERVENTIONS
      ===================================================== */

      while (
        validatedInterventions.length <
        3
      ) {
        const fallbackConclusion =
          getFallbackConclusion(
            primaryIncident,
          );

        validatedInterventions.push({
          recommendation:
            `Insufficient evidence in the current reference database to generate an additional evidence-supported intervention for the current incident. Conclusion: ${fallbackConclusion}.`,

          conclusion:
            fallbackConclusion,

          basis:
            "The available research references did not provide enough evidence for an additional recommendation.",

          referenceIds: [],

          references: [],
        });
      }

      /* =====================================================
         RETURN RESULT
      ===================================================== */

      return res.json({
        success: true,

        analysisBasis:
          "current-incident",

        currentIncidentId:
          primaryIncident?.incidentId ||
          null,

        summary:
          analysis?.summary ||
          "No summary was generated.",

        pattern:
          analysis?.pattern ||
          "No clear behavioral pattern was identified.",

        risk: validatedRisk,

        prediction:
          analysis?.prediction ||
          "No prediction is available.",

        interventions:
          validatedInterventions,

        notes:
          analysis?.notes ||
          "No additional notes were generated.",

        researchReferences:
          researchReferences.map(
            (reference) => ({
              referenceId:
                reference.referenceId,

              type:
                reference.type,

              category:
                reference.category,

              title:
                reference.title,

              authors:
                reference.authors,

              year:
                reference.year,

              journal:
                reference.journal,

              doi:
                reference.doi,

              sourceUrl:
                reference.sourceUrl,

              findings:
                reference.findings,

              evidenceLevel:
                reference.evidenceLevel,
            }),
          ),
      });
    } catch (err) {
      console.error(
        "❌ Research-backed AI analysis error:",
        err,
      );

      if (
        err?.code ===
        "GEMINI_CONTENT_BLOCKED"
      ) {
        return res.status(422).json({
          success: false,
          error:
            "AI analysis could not be generated because Gemini blocked the submitted content.",
          code:
            "GEMINI_CONTENT_BLOCKED",
          reason:
            err?.blockReason ||
            "PROHIBITED_CONTENT",
        });
      }

      if (
        err?.code ===
        "GEMINI_EMPTY_RESPONSE"
      ) {
        return res.status(500).json({
          success: false,
          error:
            "Gemini returned no generated content.",
          code:
            "GEMINI_EMPTY_RESPONSE",
        });
      }

      const status =
        getErrorStatus(err);

      if (
        Number(status) === 429
      ) {
        return res.status(429).json({
          success: false,
          error:
            "Gemini AI request limit has been reached. Please try again shortly.",
          code:
            "GEMINI_RATE_LIMIT",
        });
      }

      if (
        Number(status) === 503
      ) {
        return res.status(503).json({
          success: false,
          error:
            "Gemini AI is temporarily experiencing high demand. Please try again in a few moments.",
          code:
            "GEMINI_UNAVAILABLE",
        });
      }

      return res.status(500).json({
        success: false,
        error:
          err?.message ||
          "Failed to generate research-backed AI analysis.",
      });
    }
  },
);

/* =========================================================
   SCHOOL-WIDE AI ANALYSIS
   WHOLE EDUGUARD SYSTEM
========================================================= */

router.post(
  "/school-analysis",
  async (req, res) => {
    try {
      console.log(
        "🏫 Starting school-wide GuidEd AI analysis...",
      );

      /* =====================================================
         LOAD WHOLE SYSTEM DATA
      ===================================================== */

      const [
        reports,
        incidents,
        students,
      ] = await Promise.all([
        Report.find({}).lean(),

        Incident.find({}).lean(),

        Student.find({}).lean(),
      ]);

      console.log(
        `📊 School data loaded: ${reports.length} reports, ${incidents.length} incidents, ${students.length} students.`,
      );

      /* =====================================================
         BUILD SCHOOL-WIDE STATISTICS
      ===================================================== */

      const schoolStats =
        buildSchoolWideStatistics({
          reports,
          incidents,
          students,
        });

      /* =====================================================
         RECENT DATA FOR QUALITATIVE ANALYSIS

         Statistics are calculated from ALL records.

         Detailed samples are limited to prevent the Gemini
         prompt from becoming unnecessarily large.
      ===================================================== */

      const recentReports =
        [...reports]
          .sort(
            (a, b) =>
              new Date(
                getDateValue(b) || 0,
              ) -
              new Date(
                getDateValue(a) || 0,
              ),
          )
          .slice(0, 200);

      const recentIncidents =
        [...incidents]
          .sort(
            (a, b) =>
              new Date(
                getDateValue(b) || 0,
              ) -
              new Date(
                getDateValue(a) || 0,
              ),
          )
          .slice(0, 200);

      /* =====================================================
         RESEARCH REFERENCES
      ===================================================== */

      console.log(
        "📚 Finding research references for school-wide analysis...",
      );

      const researchReferences =
        await findRelevantResearchReferences(
          {
            grade: "All Grades",

            riskLevel:
              schoolStats.highIncidents >
              0
                ? "High"
                : schoolStats.mediumIncidents >
                    0
                  ? "Medium"
                  : "Low",

            timeline:
              schoolStats.monthlyTrend,

            incidents:
              recentIncidents,

            reports:
              recentReports,

            currentIncident:
              null,

            previousIncidents:
              recentIncidents,

            limit: 5,
          },
        );

      console.log(
        `📚 Selected ${researchReferences.length} school-wide research references.`,
      );

      const researchContext =
        formatReferencesForGemini(
          researchReferences,
        );

      /* =====================================================
         FORMAT REPORT SAMPLES
      ===================================================== */

      const reportText =
        recentReports.length
          ? recentReports
              .map(
                (
                  report,
                  index,
                ) => `
Report Sample ${
                  index + 1
                }

Report ID:
${
  report?.reportId ||
  "N/A"
}

Offense:
${
  report?.offense ||
  "N/A"
}

Category:
${
  report?.category ||
  "N/A"
}

Location:
${
  report?.location ||
  "N/A"
}

Reporter Type:
${
  report?.reporterType ||
  "N/A"
}

Date:
${
  report?.date ||
  "N/A"
}

Time:
${
  report?.time ||
  "N/A"
}

Status:
${
  report?.status ||
  "N/A"
}

Description:
${
  report?.description ||
  "N/A"
}
`,
              )
              .join("\n")
          : "No reports recorded.";

      /* =====================================================
         FORMAT INCIDENT SAMPLES
      ===================================================== */

      const incidentText =
        recentIncidents.length
          ? recentIncidents
              .map(
                (
                  incident,
                  index,
                ) => `
Incident Sample ${
                  index + 1
                }

Incident ID:
${
  incident?.incidentId ||
  incident?._id ||
  "N/A"
}

Title:
${
  incident?.title ||
  "N/A"
}

Category:
${
  incident?.category ||
  "N/A"
}

Severity / Level:
${
  incident?.level ||
  incident?.riskLevel ||
  "N/A"
}

Status:
${
  incident?.status ||
  "N/A"
}

Location:
${
  incident?.location ||
  "N/A"
}

Date:
${
  incident?.date ||
  "N/A"
}

Action:
${
  incident?.action ||
  "N/A"
}

Created At:
${
  incident?.createdAt ||
  "N/A"
}
`,
              )
              .join("\n")
          : "No incidents recorded.";

      /* =====================================================
         SCHOOL-WIDE GEMINI PROMPT
      ===================================================== */

      const prompt = `
You are GuidEd AI, an educational guidance and school
behavioral analytics assistant.

Your task is to analyze the OVERALL SCHOOL-WIDE BEHAVIORAL
DATA recorded in the GuidEd system.

This is NOT an analysis of one student.

This is NOT an analysis of one incident.

This is NOT a current-incident intervention assessment.

The purpose of this analysis is to identify meaningful
school-wide behavioral trends that can help authorized
guidance personnel understand the overall discipline
environment of the school.

This is NOT a medical, psychological, psychiatric, or
clinical diagnosis.

=========================================================
MOST IMPORTANT RULE: SCHOOL-WIDE ANALYSIS
=========================================================

Analyze the ENTIRE SCHOOL DATASET.

The supplied statistics were calculated from ALL available
reports, incidents, and students in the EduGuard database.

You MUST base the analysis primarily on the aggregate
school-wide statistics.

The recent reports and recent incidents are provided only
as qualitative examples to help interpret the statistics.

There is NO CURRENT INCIDENT in this analysis.

There is NO PRIMARY STUDENT.

There is NO STUDENT WHO SHOULD BE SINGLED OUT.

Do NOT behave as if you are reviewing an individual
disciplinary case.

Do NOT recommend suspension, warning, calling a parent,
or another disciplinary action for a particular student.

Instead, provide recommendations appropriate for
SCHOOL-WIDE GUIDANCE AND PREVENTION.

=========================================================
SCHOOL-WIDE DATA
=========================================================

Total Students:
${schoolStats.totalStudents}

Students Involved in Recorded Reports/Incidents:
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

${JSON.stringify(
  schoolStats.severityDistribution,
  null,
  2,
)}

=========================================================
TOP INCIDENT CATEGORIES
=========================================================

${JSON.stringify(
  schoolStats.categoryDistribution,
  null,
  2,
)}

=========================================================
TOP REPORTED OFFENSES
=========================================================

${JSON.stringify(
  schoolStats.offenseDistribution,
  null,
  2,
)}

=========================================================
LOCATION DISTRIBUTION
=========================================================

${JSON.stringify(
  schoolStats.locationDistribution,
  null,
  2,
)}

=========================================================
INCIDENT STATUS DISTRIBUTION
=========================================================

${JSON.stringify(
  schoolStats.incidentStatusDistribution,
  null,
  2,
)}

=========================================================
REPORT STATUS DISTRIBUTION
=========================================================

${JSON.stringify(
  schoolStats.reportStatusDistribution,
  null,
  2,
)}

=========================================================
REPORTER TYPE DISTRIBUTION
=========================================================

${JSON.stringify(
  schoolStats.reporterDistribution,
  null,
  2,
)}

=========================================================
MONTHLY BEHAVIORAL TREND
=========================================================

${JSON.stringify(
  schoolStats.monthlyTrend,
  null,
  2,
)}

=========================================================
REPEATED RECORDED INCIDENT PATTERNS
=========================================================

The following information contains ONLY anonymous student
identifiers and incident counts.

Use this information only to identify whether repeated
behavioral incidents exist at a school-wide level.

DO NOT diagnose these students.

DO NOT identify students by name.

DO NOT assume that repeated incidents indicate a
psychological condition.

DO NOT recommend disciplinary action for these students.

${JSON.stringify(
  schoolStats.recurringStudents,
  null,
  2,
)}

=========================================================
DATE RANGE
=========================================================

Reports:
${JSON.stringify(
  schoolStats.reportDateRange,
  null,
  2,
)}

Incidents:
${JSON.stringify(
  schoolStats.incidentDateRange,
  null,
  2,
)}

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
SCHOOL-WIDE ANALYSIS RULES
=========================================================

1. Analyze the school as a whole.

2. Use ALL aggregate statistics supplied above.

3. Do not focus on a single student.

4. Do not focus on a single incident.

5. Do not treat the most recent incident as the most
   important incident.

6. Identify recurring behavioral categories.

7. Identify changes or trends over time.

8. Identify severity distribution.

9. Identify locations where incidents appear concentrated.

10. Identify whether repeated incidents appear to be a
    meaningful school-wide pattern.

11. Identify possible areas where guidance programs,
    prevention, monitoring, communication, or student
    support could be improved.

12. Distinguish clearly between recorded facts and
    cautious interpretation.

13. Do not invent facts.

14. Do not diagnose mental health conditions.

15. Do not speculate about medical conditions.

16. Do not claim to know students' psychological states.

17. Do not assume that an incident automatically means
    intentional misconduct.

18. Do not claim that a pattern proves causation.

19. Use cautious language such as:
    "may", "can", "appears", "suggests", and "consider".

20. Do not invent school policies.

21. Do not state that an intervention is legally required.

22. Recommendations must be SCHOOL-WIDE.

23. Recommendations may include:
    - awareness programs
    - preventive education
    - guidance campaigns
    - monitoring improvements
    - teacher coordination
    - parent communication strategies
    - reporting process improvements
    - location-based supervision
    - student support programs
    - conflict prevention
    - positive behavior initiatives

24. Do NOT recommend a disciplinary action against
    a particular student.

25. Do NOT identify individual students in the final answer.

=========================================================
RESEARCH RULES
=========================================================

You MUST use the supplied research references as the
evidence base for recommendations.

1. Use ONLY the supplied research references.

2. Never invent a study.

3. Never invent an author.

4. Never invent a journal.

5. Never invent a DOI.

6. Never invent research findings.

7. Never cite a reference that was not supplied.

8. Recommendations should include supplied reference IDs
   when adequate research support exists.

9. If a recommendation cannot be adequately supported,
   say:

   "Insufficient evidence in the current reference database."

10. Research evidence should support educational guidance,
    not diagnosis.

11. Do not claim that a research finding proves that a
    particular intervention will work in this school.

=========================================================
REQUIRED OUTPUT
=========================================================

Return ONLY valid JSON.

Do not use markdown.

Do not wrap the JSON in code fences.

Do not add explanations outside the JSON.

The JSON must contain:

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

=========================================================
FIELD REQUIREMENTS
=========================================================

summary:
Provide a concise overview of the overall behavioral
environment of the school.

pattern:
Describe the most important recurring behavioral trends,
categories, locations, or time-based patterns.

risk:
Return exactly one of:

Low
Medium
High

The school-wide risk must be based on the overall
distribution of recorded incidents.

prediction:
Provide a cautious school-wide prediction about possible
behavioral trends if the observed pattern continues.

Do NOT predict the behavior of an individual student.

interventions:
Provide exactly 3 SCHOOL-WIDE recommendations.

Each recommendation must contain:

- recommendation
- basis
- referenceIds
- references

These recommendations must NOT be individual disciplinary
actions.

notes:
Mention important limitations, data gaps, or cautions about
interpreting the school-wide results.

=========================================================
IMPORTANT
=========================================================

This analysis is intended to SUPPORT guidance personnel.

It must NOT replace professional judgment.

It must NOT be treated as a diagnosis.

It must NOT be treated as proof of future student behavior.

Return ONLY the JSON object.
`;

      console.log(
        "🤖 Generating school-wide research-backed AI analysis...",
      );

      const response =
        await generateWithRetry(
          prompt,
          {
            config: {
              responseMimeType:
                "application/json",
            },
          },
        );

      let text =
        getGeminiText(
          response,
        );

      if (!text) {
        return res.status(500).json({
          success: false,
          error:
            "Gemini returned an empty response.",
          code:
            "GEMINI_EMPTY_RESPONSE",
        });
      }

      text =
        cleanJsonText(text);

      let analysis;

      try {
        analysis =
          JSON.parse(text);
      } catch (parseError) {
        console.error(
          "❌ School-wide AI JSON Parse Error:",
          parseError,
        );

        console.error(
          "Gemini returned:",
          text,
        );

        return res.status(500).json({
          success: false,
          error:
            "Gemini returned invalid JSON.",
          code:
            "GEMINI_INVALID_JSON",
        });
      }

      /* =====================================================
         VALIDATE RISK
      ===================================================== */

      const validRiskLevels = [
        "Low",
        "Medium",
        "High",
      ];

      const validatedRisk =
        validRiskLevels.includes(
          analysis?.risk,
        )
          ? analysis.risk
          : "Low";

      /* =====================================================
         VALIDATE RESEARCH REFERENCES
      ===================================================== */

      const referenceMap =
        new Map(
          researchReferences.map(
            (reference) => [
              reference.referenceId,
              reference,
            ],
          ),
        );

      /* =====================================================
         VALIDATE SCHOOL-WIDE RECOMMENDATIONS
      ===================================================== */

      const rawInterventions =
        Array.isArray(
          analysis?.interventions,
        )
          ? analysis.interventions
          : [];

      const validatedInterventions =
        rawInterventions
          .slice(0, 3)
          .map(
            (intervention) => {
              const validIds =
                Array.isArray(
                  intervention?.referenceIds,
                )
                  ? intervention.referenceIds.filter(
                      (id) =>
                        referenceMap.has(
                          id,
                        ),
                    )
                  : [];

              const validReferences =
                validIds.map(
                  (id) => {
                    const reference =
                      referenceMap.get(
                        id,
                      );

                    return {
                      referenceId:
                        reference.referenceId,

                      citation:
                        `${reference.authors.join(
                          ", ",
                        )} (${reference.year})`,

                      doi:
                        reference.doi ||
                        "",
                    };
                  },
                );

              return {
                recommendation:
                  String(
                    intervention?.recommendation ||
                      "No school-wide recommendation generated.",
                  ).trim(),

                basis:
                  String(
                    intervention?.basis ||
                      "The recommendation is based on the aggregate school-wide behavioral data and available research references.",
                  ).trim(),

                referenceIds:
                  validIds,

                references:
                  validReferences,
              };
            },
          );

      /* =====================================================
         GUARANTEE EXACTLY 3 RECOMMENDATIONS
      ===================================================== */

      while (
        validatedInterventions.length <
        3
      ) {
        validatedInterventions.push({
          recommendation:
            "Insufficient evidence in the current reference database to generate an additional evidence-supported school-wide recommendation.",

          basis:
            "The available research references did not provide enough evidence for an additional recommendation.",

          referenceIds: [],

          references: [],
        });
      }

      /* =====================================================
         RETURN SCHOOL-WIDE RESULT
      ===================================================== */

      return res.json({
        success: true,

        analysisBasis:
          "school-wide",

        scope:
          "entire-system",

        summary:
          analysis?.summary ||
          "No school-wide summary was generated.",

        pattern:
          analysis?.pattern ||
          "No clear school-wide behavioral pattern was identified.",

        risk:
          validatedRisk,

        prediction:
          analysis?.prediction ||
          "No school-wide prediction is available.",

        interventions:
          validatedInterventions,

        notes:
          analysis?.notes ||
          "No additional school-wide notes were generated.",

        schoolStats,

        researchReferences:
          researchReferences.map(
            (reference) => ({
              referenceId:
                reference.referenceId,

              type:
                reference.type,

              category:
                reference.category,

              title:
                reference.title,

              authors:
                reference.authors,

              year:
                reference.year,

              journal:
                reference.journal,

              doi:
                reference.doi,

              sourceUrl:
                reference.sourceUrl,

              findings:
                reference.findings,

              evidenceLevel:
                reference.evidenceLevel,
            }),
          ),
      });
    } catch (err) {
      console.error(
        "❌ School-wide AI analysis error:",
        err,
      );

      if (
        err?.code ===
        "GEMINI_CONTENT_BLOCKED"
      ) {
        return res.status(422).json({
          success: false,
          error:
            "AI analysis could not be generated because Gemini blocked the submitted content.",
          code:
            "GEMINI_CONTENT_BLOCKED",
          reason:
            err?.blockReason ||
            "PROHIBITED_CONTENT",
        });
      }

      if (
        err?.code ===
        "GEMINI_EMPTY_RESPONSE"
      ) {
        return res.status(500).json({
          success: false,
          error:
            "Gemini returned no generated content.",
          code:
            "GEMINI_EMPTY_RESPONSE",
        });
      }

      const status =
        getErrorStatus(err);

      if (
        Number(status) === 429
      ) {
        return res.status(429).json({
          success: false,
          error:
            "Gemini AI request limit has been reached. Please try again shortly.",
          code:
            "GEMINI_RATE_LIMIT",
        });
      }

      if (
        Number(status) === 503
      ) {
        return res.status(503).json({
          success: false,
          error:
            "Gemini AI is temporarily experiencing high demand. Please try again in a few moments.",
          code:
            "GEMINI_UNAVAILABLE",
        });
      }

      return res.status(500).json({
        success: false,
        error:
          err?.message ||
          "Failed to generate school-wide AI analysis.",
      });
    }
  },
);

/* =========================================================
   ANALYZE INCIDENT
========================================================= */

router.post(
  "/analyze-incident",
  async (req, res) => {
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

      console.log(
        "🤖 Starting GuidEd incident AI analysis...",
      );

      const response =
        await generateWithRetry(
          prompt,
          {
            config: {
              responseMimeType:
                "application/json",
            },
          },
        );

      let text =
        getGeminiText(
          response,
        );

      if (!text) {
        return res.status(500).json({
          success: false,
          error:
            "Gemini returned an empty response.",
          code:
            "GEMINI_EMPTY_RESPONSE",
        });
      }

      text =
        cleanJsonText(text);

      let analysis;

      try {
        analysis =
          JSON.parse(text);
      } catch {
        return res.status(500).json({
          success: false,
          error:
            "Gemini returned invalid JSON.",
          code:
            "GEMINI_INVALID_JSON",
        });
      }

      const validRiskLevels = [
        "Low",
        "Medium",
        "High",
      ];

      const riskLevel =
        validRiskLevels.includes(
          analysis?.riskLevel,
        )
          ? analysis.riskLevel
          : "Low";

      return res.json({
        success: true,

        category:
          analysis?.category ||
          offense ||
          "General Incident",

        confidence:
          analysis?.confidence ||
          "90%",

        riskLevel,

        pattern:
          analysis?.pattern ||
          "No recurring behavioral pattern identified.",

        prediction:
          analysis?.prediction ||
          "No prediction available based on the available information.",

        remarks:
          analysis?.remarks ||
          "No additional remarks were generated.",

        recommendation:
          analysis?.recommendation ||
          "Review the incident details and provide appropriate guidance.",
      });
    } catch (err) {
      console.error(
        "❌ Gemini Incident Analysis Error:",
        err,
      );

      if (
        err?.code ===
        "GEMINI_CONTENT_BLOCKED"
      ) {
        return res.status(422).json({
          success: false,
          error:
            "AI analysis could not be generated because Gemini blocked the incident content.",
          code:
            "GEMINI_CONTENT_BLOCKED",
          reason:
            err?.blockReason ||
            "PROHIBITED_CONTENT",
        });
      }

      if (
        err?.code ===
        "GEMINI_EMPTY_RESPONSE"
      ) {
        return res.status(500).json({
          success: false,
          error:
            "Gemini returned no generated content.",
          code:
            "GEMINI_EMPTY_RESPONSE",
        });
      }

      const status =
        getErrorStatus(err);

      if (
        Number(status) === 429
      ) {
        return res.status(429).json({
          success: false,
          error:
            "Gemini AI request limit has been reached. Please try again shortly.",
          code:
            "GEMINI_RATE_LIMIT",
        });
      }

      if (
        Number(status) === 503
      ) {
        return res.status(503).json({
          success: false,
          error:
            "Gemini AI is temporarily experiencing high demand. Please try again in a few moments.",
          code:
            "GEMINI_UNAVAILABLE",
        });
      }

      return res.status(500).json({
        success: false,
        error:
          err?.message ||
          "Failed to analyze incident.",
      });
    }
  },
);

export default router;
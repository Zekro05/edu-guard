import express from "express";
import { ai } from "../config/geminiAi.js";

import {
  findRelevantResearchReferences,
  formatReferencesForGemini,
} from "../services/researchReferenceService.js";

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

  /*
   * This is only a safety fallback.
   *
   * The AI should normally provide the
   * conclusion itself.
   */

  if (level === "high") {
    return "Suspension";
  }

  if (level === "medium") {
    return "Call a Parent";
  }

  return "Warning";
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

        /*
         * IMPORTANT:
         * currentIncident is the case currently
         * being reviewed by the guidance administrator.
         */
        currentIncident = null,

        /*
         * Previous incidents are supporting context
         * only. They must never override the current case.
         */
        previousIncidents = [],

        /*
         * Existing fields are still accepted so older
         * frontend versions do not immediately break.
         */
        timeline = [],
        incidents = [],
        reports = [],

        requiredConclusionOptions = CONCLUSION_OPTIONS,
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

      /*
       * Backward compatibility:
       *
       * If the frontend has not yet sent previousIncidents,
       * derive them from incidents while excluding the
       * current incident.
       */
      if (
        supportingIncidents.length ===
          0 &&
        Array.isArray(incidents)
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
                (incident, index) =>
                  `
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
                (report, index) =>
                  `
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
You are EduGuard AI, an educational guidance assistant.

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
    (option) => `- ${option}`,
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
            (intervention) => {
              /* =============================================
                 VALIDATE REFERENCE IDS
              ============================================= */

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

              /* =============================================
                 REBUILD REFERENCES FROM DATABASE
              ============================================= */

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

                      citation: `${reference.authors.join(
                        ", ",
                      )} (${reference.year})`,

                      doi:
                        reference.doi ||
                        "",
                    };
                  },
                );

              /* =============================================
                 VALIDATE CONCLUSION
              ============================================= */

              let conclusion =
                normalizeConclusion(
                  intervention?.conclusion,
                );

              /*
               * If Gemini failed to provide a valid conclusion,
               * try to detect one from the recommendation text.
               */

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

              /*
               * Final safety fallback.
               *
               * This is only used when Gemini does not return
               * a valid conclusion.
               */
              if (!conclusion) {
                conclusion =
                  getFallbackConclusion(
                    primaryIncident,
                  );
              }

              /* =============================================
                 RECOMMENDATION
              ============================================= */

              const recommendation =
                String(
                  intervention?.recommendation ||
                    "No recommendation generated.",
                ).trim();

              /*
               * Make sure the recommendation itself ends with
               * the required conclusion.
               */

              const conclusionRegex =
                new RegExp(
                  `Conclusion\\s*:\\s*${conclusion.replace(
                    /[.*+?^${}()|[\]\\]/g,
                    "\\$&",
                  )}\\.?$`,
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

        /*
         * Useful for frontend transparency.
         */
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
        "🤖 Starting EduGuard incident AI analysis...",
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
import ResearchReference from "../models/researchReferenceModel.js";

/* =========================================================
   NORMALIZATION
========================================================= */

const normalizeText = (value = "") => {
  return String(value)
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
};

/* =========================================================
   CONCEPT GROUPS
========================================================= */

const CONCEPT_GROUPS = {
  bullying: [
    "bully",
    "bullying",
    "bullied",
    "harassment",
    "peer harassment",
    "victimization",
    "victimisation",
    "cyberbullying",
    "cyber bullying",
    "intimidation",
    "teasing",
    "peer aggression",
  ],

  discipline: [
    "discipline",
    "disciplinary",
    "misbehavior",
    "misbehaviour",
    "misconduct",
    "rule violation",
    "rules violation",
    "school rule",
    "behavior problem",
    "behaviour problem",
    "defiance",
    "disrespect",
    "aggressive behavior",
    "aggression",
    "fighting",
    "fight",
    "physical altercation",
    "verbal altercation",
    "conflict",
  ],

  attendance: [
    "attendance",
    "absence",
    "absent",
    "absenteeism",
    "truancy",
    "truant",
    "late",
    "lateness",
    "tardy",
    "tardiness",
    "chronic absence",
    "school attendance",
  ],

  classroom: [
    "classroom",
    "classroom behavior",
    "classroom disruption",
    "disruptive",
    "disruption",
    "off task",
    "off-task",
    "class participation",
    "student behavior",
    "academic behavior",
    "teacher report",
  ],

  communication: [
    "communication",
    "parent communication",
    "family communication",
    "teacher communication",
    "school family",
    "family engagement",
    "parent involvement",
    "guardian",
  ],

  counseling: [
    "counseling",
    "counselling",
    "counselor",
    "counsellor",
    "school counselor",
    "guidance counselor",
    "guidance",
    "individual counseling",
    "group counseling",
    "student counseling",
  ],

  mentoring: [
    "mentor",
    "mentoring",
    "school mentoring",
    "peer mentoring",
    "adult mentoring",
    "supportive relationship",
    "role model",
  ],

  intervention: [
    "intervention",
    "school intervention",
    "behavior intervention",
    "behavioral intervention",
    "social emotional",
    "social-emotional",
    "sel",
    "positive behavior",
    "positive behavioral",
    "support",
    "prevention",
  ],

  engagement: [
    "engagement",
    "student engagement",
    "school engagement",
    "participation",
    "belonging",
    "connectedness",
    "school connectedness",
  ],
};

/* =========================================================
   CATEGORY ALIASES
========================================================= */

const CATEGORY_ALIASES = {
  bullying: "Bullying",
  harassment: "Bullying",
  cyberbullying: "Bullying",

  discipline: "Discipline",
  disciplinary: "Discipline",
  misconduct: "Discipline",
  misbehavior: "Discipline",
  misbehaviour: "Discipline",
  fighting: "Discipline",
  aggression: "Discipline",
  disrespect: "Discipline",

  attendance: "Attendance",
  absence: "Attendance",
  absenteeism: "Attendance",
  truancy: "Attendance",
  tardiness: "Attendance",
  late: "Attendance",

  classroom: "Classroom Behavior",
  "classroom behavior": "Classroom Behavior",
  disruption: "Classroom Behavior",
  "classroom disruption": "Classroom Behavior",

  communication: "Communication",
  "parent communication": "Communication",
  "family communication": "Communication",

  counseling: "Counseling",
  counselling: "Counseling",
  guidance: "Counseling",

  mentoring: "Mentoring",
  mentor: "Mentoring",

  intervention: "Student Intervention",
  "behavior intervention": "Student Intervention",

  engagement: "Student Engagement",
  "student engagement": "Student Engagement",
};

/* =========================================================
   FIND CONCEPTS
========================================================= */

const detectConcepts = (text = "") => {
  const normalized = normalizeText(text);

  const concepts = new Set();

  for (const [
    concept,
    keywords,
  ] of Object.entries(CONCEPT_GROUPS)) {
    for (const keyword of keywords) {
      const normalizedKeyword =
        normalizeText(keyword);

      if (
        normalized.includes(
          normalizedKeyword,
        )
      ) {
        concepts.add(concept);
        break;
      }
    }
  }

  return [...concepts];
};

/* =========================================================
   DETECT RESEARCH CATEGORIES
========================================================= */

const detectCategories = ({
  grade,
  riskLevel,
  timeline = [],
  incidents = [],
  reports = [],
}) => {
  const categoryScores = new Map();

  const addCategory = (
    category,
    score,
  ) => {
    if (!category) return;

    categoryScores.set(
      category,
      (categoryScores.get(category) || 0) +
        score,
    );
  };

  const processText = (
    text,
    baseScore = 1,
  ) => {
    const normalized = normalizeText(
      text,
    );

    if (!normalized) return;

    const concepts =
      detectConcepts(normalized);

    for (const concept of concepts) {
      const category =
        CATEGORY_ALIASES[concept];

      if (category) {
        addCategory(
          category,
          baseScore,
        );
      }
    }
  };

  /* =====================================================
     INCIDENTS
  ===================================================== */

  incidents.forEach((incident) => {
    const categoryText =
      incident?.category || "";

    const title =
      incident?.title || "";

    const action =
      incident?.action || "";

    const statement =
      incident?.studentStatement || "";

    processText(
      categoryText,
      12,
    );

    processText(title, 8);
    processText(action, 5);
    processText(statement, 4);

    /*
     * Direct category aliases receive an
     * additional score.
     */

    const normalizedCategory =
      normalizeText(
        categoryText,
      );

    const directCategory =
      CATEGORY_ALIASES[
        normalizedCategory
      ];

    if (directCategory) {
      addCategory(
        directCategory,
        15,
      );
    }
  });

  /* =====================================================
     REPORTS
  ===================================================== */

  reports.forEach((report) => {
    const category =
      report?.category || "";

    const offense =
      report?.offense || "";

    const description =
      report?.description || "";

    processText(
      category,
      12,
    );

    processText(
      offense,
      10,
    );

    processText(
      description,
      6,
    );

    const normalizedCategory =
      normalizeText(category);

    const directCategory =
      CATEGORY_ALIASES[
        normalizedCategory
      ];

    if (directCategory) {
      addCategory(
        directCategory,
        15,
      );
    }

    const normalizedOffense =
      normalizeText(offense);

    const offenseCategory =
      CATEGORY_ALIASES[
        normalizedOffense
      ];

    if (offenseCategory) {
      addCategory(
        offenseCategory,
        14,
      );
    }
  });

  /* =====================================================
     TIMELINE
  ===================================================== */

  timeline.forEach((item) => {
    const data =
      item?.data || item || {};

    processText(
      data?.category || "",
      10,
    );

    processText(
      data?.title || "",
      7,
    );

    processText(
      data?.description || "",
      6,
    );

    processText(
      data?.action || "",
      4,
    );
  });

  /* =====================================================
     CURRENT RISK
  ===================================================== */

  const normalizedRisk =
    normalizeText(riskLevel);

  if (
    normalizedRisk === "high"
  ) {
    addCategory(
      "Student Intervention",
      5,
    );

    addCategory(
      "Counseling",
      4,
    );
  }

  if (
    normalizedRisk === "medium"
  ) {
    addCategory(
      "Student Intervention",
      3,
    );
  }

  /*
   * Grade is intentionally not used as a strong
   * research-category signal.
   *
   * Grade alone should not determine an intervention.
   */

  return [...categoryScores.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([category, score]) => ({
      category,
      score,
    }));
};

/* =========================================================
   BUILD ACTIVITY TEXT
========================================================= */

const buildActivityText = ({
  grade,
  riskLevel,
  timeline = [],
  incidents = [],
  reports = [],
}) => {
  const parts = [];

  if (grade) {
    parts.push(`grade ${grade}`);
  }

  if (riskLevel) {
    parts.push(
      `current recorded risk level ${riskLevel}`,
    );
  }

  for (const incident of incidents) {
    parts.push(
      [
        incident?.category,
        incident?.title,
        incident?.action,
        incident?.studentStatement,
        incident?.status,
      ]
        .filter(Boolean)
        .join(" "),
    );
  }

  for (const report of reports) {
    parts.push(
      [
        report?.category,
        report?.offense,
        report?.description,
        report?.status,
      ]
        .filter(Boolean)
        .join(" "),
    );
  }

  for (const item of timeline) {
    const data =
      item?.data || item || {};

    parts.push(
      [
        data?.category,
        data?.title,
        data?.description,
        data?.action,
        data?.status,
      ]
        .filter(Boolean)
        .join(" "),
    );
  }

  return normalizeText(
    parts.join(" "),
  );
};

/* =========================================================
   SCORE REFERENCE
========================================================= */

const scoreReference = ({
  reference,
  activityText,
  detectedCategories,
  detectedConcepts,
}) => {
  let score = 0;

  const referenceCategory =
    normalizeText(
      reference?.category,
    );

  /* =====================================================
     CATEGORY MATCH
  ===================================================== */

  const matchingCategory =
    detectedCategories.find(
      (item) =>
        normalizeText(
          item.category,
        ) === referenceCategory,
    );

  if (matchingCategory) {
    /*
     * Strong category match.
     */
    score +=
      50 +
      Math.min(
        matchingCategory.score,
        30,
      );
  }

  /* =====================================================
     KEYWORD MATCH
  ===================================================== */

  const referenceKeywords =
    Array.isArray(
      reference?.keywords,
    )
      ? reference.keywords
      : [];

  for (const keyword of referenceKeywords) {
    const normalizedKeyword =
      normalizeText(keyword);

    if (
      normalizedKeyword &&
      activityText.includes(
        normalizedKeyword,
      )
    ) {
      score += 8;
    }

    const keywordConcepts =
      detectConcepts(
        normalizedKeyword,
      );

    for (const concept of keywordConcepts) {
      if (
        detectedConcepts.includes(
          concept,
        )
      ) {
        score += 10;
      }
    }
  }

  /* =====================================================
     RECOMMENDATION TYPE MATCH
  ===================================================== */

  const recommendationTypes =
    Array.isArray(
      reference?.recommendationTypes,
    )
      ? reference.recommendationTypes
      : [];

  for (const type of recommendationTypes) {
    const normalizedType =
      normalizeText(type);

    if (
      normalizedType &&
      activityText.includes(
        normalizedType,
      )
    ) {
      score += 4;
    }

    const typeConcepts =
      detectConcepts(
        normalizedType,
      );

    for (const concept of typeConcepts) {
      if (
        detectedConcepts.includes(
          concept,
        )
      ) {
        score += 5;
      }
    }
  }

  /* =====================================================
     FINDINGS / RECOMMENDED ACTION
  ===================================================== */

  const supportingText = normalizeText(
    [
      reference?.findings,
      reference?.recommendedAction,
      reference?.title,
    ]
      .filter(Boolean)
      .join(" "),
  );

  for (const concept of detectedConcepts) {
    const keywords =
      CONCEPT_GROUPS[concept] || [];

    for (const keyword of keywords) {
      const normalizedKeyword =
        normalizeText(keyword);

      if (
        normalizedKeyword &&
        supportingText.includes(
          normalizedKeyword,
        )
      ) {
        score += 3;
      }
    }
  }

  /* =====================================================
     EVIDENCE QUALITY
  ===================================================== */

  if (
    reference?.evidenceLevel
      ?.toLowerCase()
      .includes("systematic")
  ) {
    score += 2;
  }

  if (reference?.doi) {
    score += 1;
  }

  return score;
};

/* =========================================================
   FIND RELEVANT REFERENCES
========================================================= */

export const findRelevantResearchReferences =
  async ({
    grade,
    riskLevel,
    timeline = [],
    incidents = [],
    reports = [],
    limit = 5,
  }) => {
    const activityText =
      buildActivityText({
        grade,
        riskLevel,
        timeline,
        incidents,
        reports,
      });

    const detectedCategories =
      detectCategories({
        grade,
        riskLevel,
        timeline,
        incidents,
        reports,
      });

    const detectedConcepts =
      detectConcepts(
        activityText,
      );

    /*
     * IMPORTANT:
     *
     * Previously the database query could become too
     * restrictive before scoring happened.
     *
     * We now load ALL approved references and perform
     * the matching in application code.
     *
     * This is completely fine for a research database
     * of dozens or a few hundred references.
     */

    const references =
      await ResearchReference.find({
        approved: true,
      })
        .lean();

    const scored =
      references
        .map((reference) => ({
          reference,
          score:
            scoreReference({
              reference,
              activityText,
              detectedCategories,
              detectedConcepts,
            }),
        }))
        .sort(
          (a, b) =>
            b.score - a.score,
        );

    /*
     * If there is a genuine category match,
     * return the strongest references.
     */

    const categoryMatched =
      scored.filter(
        (item) => item.score >= 50,
      );

    if (categoryMatched.length) {
      return categoryMatched
        .slice(0, limit)
        .map((item) => item.reference);
    }

    /*
     * If the student's records contain meaningful
     * behavioral concepts but no direct category match,
     * use the strongest evidence references rather
     * than returning an empty database.
     */

    const meaningfulMatches =
      scored.filter(
        (item) => item.score >= 10,
      );

    if (meaningfulMatches.length) {
      return meaningfulMatches
        .slice(0, limit)
        .map((item) => item.reference);
    }

    /*
     * Final fallback:
     *
     * Use Student Intervention / Counseling /
     * Classroom Behavior references for students
     * with recorded activity.
     *
     * This prevents the AI from producing three
     * completely unsupported interventions when
     * the records are too vague to classify.
     */

    const fallbackCategories = [
      "Student Intervention",
      "Counseling",
      "Classroom Behavior",
      "Student Engagement",
    ];

    const fallback =
      references
        .filter((reference) =>
          fallbackCategories.includes(
            reference.category,
          ),
        )
        .slice(0, limit);

    return fallback;
  };

/* =========================================================
   FORMAT REFERENCES FOR GEMINI
========================================================= */

export const formatReferencesForGemini = (
  references = [],
) => {
  if (!references.length) {
    return "No research references are currently available.";
  }

  return references
    .map(
      (reference) => `
REFERENCE ID: ${reference.referenceId}
TYPE: ${reference.type || "RRS"}
CATEGORY: ${reference.category}
TITLE: ${reference.title}
AUTHORS: ${
        Array.isArray(reference.authors)
          ? reference.authors.join(", ")
          : ""
      }
YEAR: ${reference.year || ""}
JOURNAL: ${reference.journal || ""}
DOI: ${reference.doi || ""}
KEYWORDS: ${
        Array.isArray(reference.keywords)
          ? reference.keywords.join(", ")
          : ""
      }
FINDINGS: ${
        reference.findings || ""
      }
RECOMMENDED ACTION: ${
        reference.recommendedAction ||
        ""
      }
RECOMMENDATION TYPES: ${
        Array.isArray(
          reference.recommendationTypes,
        )
          ? reference.recommendationTypes.join(
              ", ",
            )
          : ""
      }
EVIDENCE LEVEL: ${
        reference.evidenceLevel || ""
      }
`.trim(),
    )
    .join("\n\n--------------------\n\n");
};

/* =========================================================
   SEARCH RESEARCH REFERENCES
========================================================= */

export const searchResearchReferences =
  async ({
    category,
    keyword,
    limit = 20,
  }) => {
    const query = {
      approved: true,
    };

    if (category) {
      query.category = category;
    }

    let references =
      await ResearchReference.find(
        query,
      )
        .sort({
          year: -1,
        })
        .limit(
          Math.max(limit * 3, 20),
        )
        .lean();

    if (keyword) {
      const normalizedKeyword =
        normalizeText(keyword);

      references =
        references.filter(
          (reference) => {
            const searchable =
              normalizeText(
                [
                  reference.title,
                  reference.category,
                  reference.findings,
                  reference.recommendedAction,
                  ...(reference.keywords ||
                    []),
                ].join(" "),
              );

            return searchable.includes(
              normalizedKeyword,
            );
          },
        );
    }

    return references.slice(
      0,
      limit,
    );
  };
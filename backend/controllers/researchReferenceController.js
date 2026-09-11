import {
  searchResearchReferences,
} from "../services/researchReferenceService.js";

/* =========================================================
   GET /api/research-references
========================================================= */

export const getResearchReferences = async (
  req,
  res,
) => {
  try {
    const {
      category,
      keyword,
      limit,
    } = req.query;

    const references =
      await searchResearchReferences({
        category,
        keyword,
        limit,
      });

    return res.json({
      success: true,
      count: references.length,
      references,
    });
  } catch (error) {
    console.error(
      "❌ GET RESEARCH REFERENCES ERROR:",
      error,
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to retrieve research references.",
    });
  }
};
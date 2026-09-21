import express from "express";

import {
  getTeacherClass,
  importTeacherClass,
    removeStudentsFromTeacherClass,
} from "../controllers/teacherClassController.js";

import { verifyToken } from "../middleware/verifyToken.js";

const router = express.Router();

/*
  IMPORTANT:
  These routes need to be protected by the SAME
  authentication middleware that your other protected
  routes use.

  The middleware must populate:

      req.userId

  Example:

      router.use(protectRoute);

  Use your project's actual middleware name.
*/

/* =========================================================
   GET TEACHER CLASS
========================================================= */

router.get(
  "/",
  verifyToken,
  getTeacherClass,
);

/* =========================================================
   IMPORT TEACHER CLASS JSON
========================================================= */

router.post(
  "/import",
  verifyToken,
  importTeacherClass,
);

/* =========================================================
   REMOVE ONE OR MULTIPLE STUDENTS
========================================================= */

router.delete(
  "/students",
  verifyToken,
  removeStudentsFromTeacherClass,
);

export default router;
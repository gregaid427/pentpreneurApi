import express from "express";

import {
  // =======================
  // ACADEMIC YEAR
  // =======================
  createAcademicYear,
  getAcademicYears,
  getAcademicYearById,
  updateAcademicYear,
  deleteAcademicYear,

  // =======================
  // SESSION
  // =======================
  createSession,
  getSessions,
  getSessionById,
  updateSession,
  deleteSession,
  setActiveSession,
  getActiveSession,
} from "./session.controller.js";

const router = express.Router();

/* ============================================================
   ACADEMIC YEAR ROUTES
============================================================ */
router.post("/academicyears", createAcademicYear);
router.get("/academicyears", getAcademicYears);
router.get("/academicyears/:yearId", getAcademicYearById);
router.patch("/academicyears", updateAcademicYear);
router.delete("/academicyears/:yearId", deleteAcademicYear);

/* ============================================================
   SESSION ROUTES
============================================================ */

router.get("/sessions/active", getActiveSession);   // must come before :sessionId
router.get("/sessions/:sessionId", getSessionById);
router.post("/sessions", createSession);
router.get("/sessions", getSessions);
router.patch("/sessions", updateSession);
router.delete("/sessions/:sessionId", deleteSession);

/* ============================================================
   SESSION ACTIONS
============================================================ */
router.patch("/sessions/activate", setActiveSession);

export default router;

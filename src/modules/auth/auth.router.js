import express from "express";
import {
  signin,
  forgotPassword,
  resetPassword,
} from "./auth.controller.js";
import { asyncHandler } from "../../utils/asyncHandler.js";

const router = express.Router();

/* =====================
   AUTH ROUTES
===================== */
router.post("/signin", asyncHandler(signin));
router.post("/forgot-password", asyncHandler(forgotPassword));
router.post("/reset-password", asyncHandler(resetPassword));

export default router;

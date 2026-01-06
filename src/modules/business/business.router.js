import express from "express";
import {
  createBusiness,
  fetchAllBusinesses,
  fetchBusinessById,
  fetchBusinessesByUser,
  updateBusiness,
  toggleVerifyBusiness,
  toggleActiveBusiness,
  deleteBusiness,
} from "./business.controller.js";

import { asyncHandler } from "../../utils/asyncHandler.js";

const router = express.Router();

/* =====================
   BUSINESS CRUD
===================== */
router.post("/", asyncHandler(createBusiness));
router.get("/", asyncHandler(fetchAllBusinesses));
router.get("/user/:userId", asyncHandler(fetchBusinessesByUser));
router.get("/:businessId", asyncHandler(fetchBusinessById));

/* =====================
   PATCH (INTELLIGENT)
===================== */
router.patch("/:businessId", asyncHandler(updateBusiness));

/* =====================
   TOGGLES
===================== */
router.patch("/verify/:businessId", asyncHandler(toggleVerifyBusiness));
router.patch("/active/:businessId", asyncHandler(toggleActiveBusiness));

/* =====================
   DELETE
===================== */
router.delete("/:businessId", asyncHandler(deleteBusiness));

export default router;

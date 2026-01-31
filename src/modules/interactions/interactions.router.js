import express from "express";
import { asyncHandler } from "../../utils/asyncHandler.js";

import {
  likeBusiness,
  unlikeBusiness,
  saveBusiness,
  unsaveBusiness,
  getLikedBusinesses,
  getSavedBusinesses,
  getBusinessInteractionStatus,
} from "./business.interactions.controller.js";

const router = express.Router();




/* =====================================================
   LIKES
===================================================== */
router.post("/like", asyncHandler(likeBusiness));
router.delete("/like", asyncHandler(unlikeBusiness));
 

/* =====================================================
   SAVES
===================================================== */
router.post("/save", asyncHandler(saveBusiness));
router.delete("/save", asyncHandler(unsaveBusiness));

/* =====================================================
   FETCH USER INTERACTIONS
===================================================== */
router.get("/liked/:userId", asyncHandler(getLikedBusinesses));
router.get("/saved/:userId", asyncHandler(getSavedBusinesses));

/* =====================================================
   STATUS
===================================================== */
router.get(
  "/status/:businessId/:userId",
  asyncHandler(getBusinessInteractionStatus)
);

export default router;

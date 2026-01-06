import express from "express";
import {
  createUser,
  fetchAllUsers,
  fetchUserByUserId,
  updateUser,
  resetUserPassword,
  deleteUser,
  toggleActiveStatus,
} from "./user.controller.js";
import { asyncHandler } from "../../utils/asyncHandler.js";

const router = express.Router();

/* =====================
   USER MANAGEMENT
===================== */
router.post("/", asyncHandler(createUser));
router.get("/", asyncHandler(fetchAllUsers));
router.get("/:userId", asyncHandler(fetchUserByUserId));
router.patch("/:userId", asyncHandler(updateUser));
router.patch("/:userId/password", asyncHandler(resetUserPassword));
router.patch("/toggle/:userId", asyncHandler(toggleActiveStatus));
router.delete("/:userId", asyncHandler(deleteUser));

export default router;

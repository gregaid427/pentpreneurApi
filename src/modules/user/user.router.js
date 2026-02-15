import express from "express";
import {
  // Public routes
  signup,
  verifyOtp,
  resendOtp,
  
  // User routes
  updateUserProfile,
  changePassword,
  
  // Admin routes
  createUser,
  fetchAllUsers,
  fetchUserByUserId,
  updateUser,
  resetUserPassword,
  deleteUser,
  toggleActiveStatus,
  uploadProfileImage,
  upload,
} from "./user.controller.js";
import { asyncHandler } from "../../utils/asyncHandler.js";

const router = express.Router();

/* =====================
   PUBLIC ROUTES (NO AUTH)
===================== */
router.post("/signup", asyncHandler(signup));
router.post("/verify-otp", asyncHandler(verifyOtp));
router.post("/resend-otp", asyncHandler(resendOtp));

/* =====================
   USER ROUTES (REQUIRES AUTH)
   TODO: Add authentication middleware
===================== */
router.post(
  '/profile/:userId/image',upload.single('image'), // multer middleware
 uploadProfileImage
);router.patch("/change-password/:userId", asyncHandler(changePassword));
router.patch("/profile/:userId", asyncHandler(updateUserProfile));

/* =====================
   ADMIN ROUTES (REQUIRES ADMIN AUTH)
   TODO: Add admin authentication middleware
===================== */

router.get("/:userId", asyncHandler(fetchUserByUserId));
router.patch("/:userId", asyncHandler(updateUser));
router.patch("/:userId/password", asyncHandler(resetUserPassword));
router.patch("/toggle/:userId", asyncHandler(toggleActiveStatus));
router.delete("/:userId", asyncHandler(deleteUser));
router.post("/", asyncHandler(createUser));
router.get("/", asyncHandler(fetchAllUsers));
export default router;
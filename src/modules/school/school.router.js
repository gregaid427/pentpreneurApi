import { Router } from "express";
import {
  upsertSchool,
  getSchool
} from "./school.controller.js";
import upload from "./school.upload.js";
import { upsertSchoolLogo } from "./school.controller.js";

const router = Router();

router.post("/", upsertSchool);   // create or update
router.get("/", getSchool);
router.post("/logo",upload.single("logo"),upsertSchoolLogo
);       // fetch global school info

export default router;

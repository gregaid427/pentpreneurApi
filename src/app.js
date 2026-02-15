import express from "express";
import cors from "cors";
import path from "path";
import requestLogger from "./utils/requestLogger.js";
import { fileURLToPath } from "url";
//import { fileURLToPath } from "url";

// import classListRouter  from "./modules/classlist/classlist.router.js";
// import sectionRouter  from "./modules/section/section.router.js";
// import classRouter  from "./modules/class/class.router.js";
// import StudentRouter  from "./modules/student/student.router.js";

// import subjectRouter  from "./modules/subject/subject.router.js";
import userRouter  from "./modules/user/user.router.js";
import businessRouter  from "./modules/business/business.router.js";
import interactionsRouter  from "./modules/interactions/interactions.router.js";
import auth  from "./modules/auth/auth.router.js";


import errorHandler from "./middleware/errorHandler.js"; // FIXED



const app = express();

app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(requestLogger);



// Catch unhandled promise rejections
process.on("unhandledRejection", (reason, promise) => {
  console.error("UNHANDLED REJECTION at:", promise, "reason:", reason);
});

// Catch uncaught exceptions
process.on("uncaughtException", (err) => {
  console.error("UNCAUGHT EXCEPTION:", err);
});


// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use("/api/uploads/profiles", express.static(path.join(__dirname, "../uploads/profiles")));
app.use("/api/uploads/business", express.static(path.join(__dirname, "../uploads/business")));




app.use("/api/auth", auth );

// app.use("/api/classlist", classListRouter );
// app.use("/api/section", sectionRouter);
// app.use("/api/class", classRouter);
// app.use("/api/session", sessionRouter);
// app.use("/api/students", StudentRouter);
app.use("/api/interactions", interactionsRouter);
app.use("/api/business", businessRouter);
app.use("/api/users", userRouter);

//app.use("/api/student-category", studentCartegoryRouter);



// must be LAST
app.use(errorHandler);

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`YES API running on port ${PORT}`);
});

export default app;

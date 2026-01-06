import pool from "../../config/db.js";
import AppError from "../../utils/AppError.js";
/**
 * Generate random HEX color
 */
const generateHexColor = () => {
  const chars = "0123456789ABCDEF";
  let color = "#";
  for (let i = 0; i < 6; i++) {
    color += chars[Math.floor(Math.random() * 16)];
  }
  return color;
};

/**
 * Generate unique session color
 */
const generateUniqueSessionColor = async () => {
  let color;
  let exists = true;

  while (exists) {
    color = generateHexColor();
    const [rows] = await pool.query(
      "SELECT sessionColor FROM session WHERE sessionColor=? LIMIT 1",
      [color]
    );
    exists = rows.length > 0;
  }

  return color;
};
const generateUniqueYearColor = async () => {
  let color;
  let exists = true;

  while (exists) {
    color = generateHexColor();
    const [rows] = await pool.query(
      "SELECT yearColor FROM academicyear WHERE yearColor=? LIMIT 1",
      [color]
    );
    exists = rows.length > 0;
  }

  return color;
};
/* ============================================================
   HELPERS
============================================================ */
const generateId = () => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let id = "";
  for (let i = 0; i < 8; i++) {
    id += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return id;
};
/**
 * Generate unique yearId
 */
const generateUniqueYearId = async () => {
  let yearId;
  let exists = true;

  while (exists) {
    yearId = generateId(); // hex
    const [rows] = await pool.query(
      "SELECT yearId FROM academicyear WHERE yearId=? LIMIT 1",
      [yearId]
    );
    exists = rows.length > 0;
  }

  return yearId;
};

/**
 * Fetch all academic years (global snapshot)
 */
const fetchAcademicYears = async () => {
  const [rows] = await pool.query(
    "SELECT * FROM academicyear ORDER BY createdAt DESC"
  );
  return rows;
};

/* ============================================================
   CREATE ACADEMIC YEAR
   POST /api/academicyears
============================================================ */
export const createAcademicYear = async (req, res) => {
  const { academicYearName, startDate, endDate, createdBy } = req.body;

  if (!academicYearName?.trim()) {
    throw new AppError("Academic year name is required", 400);
  }

  const yearId = await generateUniqueYearId();
  const yearColor = await generateUniqueYearColor();

  try {
    await pool.query(
      `INSERT INTO academicyear (
        yearId,
        academicYearName,
        startDate,
        endDate,
        yearColor,
        createdBy
      ) VALUES (?, ?, ?, ?, ?, ?)`,
      [yearId, academicYearName.trim(), startDate, endDate, yearColor, createdBy]
    );

    const data = await fetchAcademicYears();

    res.status(201).json({
      success: 1,
      message: "Academic year created successfully",
      info: { yearId },
      data,
    });
  } catch (err) {
    // Check for duplicate entry error code (MySQL ER_DUP_ENTRY)
    if (err.code === "ER_DUP_ENTRY") {
      return res.status(400).json({
        success: 0,
        message: `Academic year "${academicYearName}" already exists`,
      });
    }
    throw err; // rethrow other errors
  }
};


/* ============================================================
   GET ALL ACADEMIC YEARS
   GET /api/academicyears
============================================================ */
export const getAcademicYears = async (req, res) => {
  const data = await fetchAcademicYears();

  res.status(200).json({
    success: 1,
    message: "Academic years fetched",
    info: null,
    data
  });
};

/* ============================================================
   GET ACADEMIC YEAR BY ID
   GET /api/academicyears/:yearId
============================================================ */
export const getAcademicYearById = async (req, res) => {
  const { yearId } = req.params;

  const [rows] = await pool.query(
    "SELECT * FROM academicyear WHERE yearId=?",
    [yearId]
  );

  if (!rows.length) {
    throw new AppError("Academic year not found", 404);
  }

  res.status(200).json({
    success: 1,
    message: "Academic year fetched",
    info: rows[0],
    data: null
  });
};

/* ============================================================
   UPDATE ACADEMIC YEAR
   PUT /api/academicyears/:yearId
============================================================ */
export const updateAcademicYear = async (req, res) => {
  const { yearId, academicYearName } = req.body;

  if (!yearId || !academicYearName) {
    return res
      .status(400)
      .json({ message: "yearId and academicYearName are required" });
  }

  const [result] = await pool.query(
    `UPDATE academicyear SET
       academicYearName = ?
       
     WHERE yearId = ?`,
    [academicYearName, yearId]
  );

  if (!result.affectedRows) {
    return res.status(404).json({ message: "Academic year not found" });
  }

  const data = await fetchAcademicYears();

  res.status(200).json({
    success: 1,
    message: "Academic year updated successfully",
    info: { yearId },
    data,
  });
};


/* ============================================================
   DELETE ACADEMIC YEAR
   DELETE /api/academicyears/:yearId
============================================================ */
export const deleteAcademicYear = async (req, res) => {
  const { yearId } = req.params;

  const [result] = await pool.query(
    "DELETE FROM academicyear WHERE yearId=?",
    [yearId]
  );

  if (!result.affectedRows) {
    throw new AppError("Academic year not found", 404);
  }

  const data = await fetchAcademicYears();

  res.status(200).json({
    success: 1,
    message: "Academic year deleted successfully",
    info: { yearId },
    data
  });
};



/**
 * Convert boolean → DB string
 */
const toDbBoolean = (value) => (value ? "true" : "false");




const generateUniqueSessionId = async () => {
  let sessionId;
  let exists = true;

  while (exists) {
    sessionId = generateId();
    const [rows] = await pool.query(
      "SELECT sessionId FROM session WHERE sessionId=? LIMIT 1",
      [sessionId]
    );
    exists = rows.length > 0;
  }

  return sessionId;
};


/**
 * Fetch all sessions
 */
const fetchSessions = async () => {
  const [rows] = await pool.query(
    "SELECT * FROM session ORDER BY createdAt DESC"
  );

  // Convert DB string → boolean for API consumers
  return rows.map((r) => ({
    ...r,
    active: r.active === "true",
  }));
};

/* ============================================================
   CREATE SESSION
   POST /api/sessions
============================================================ */
export const createSession = async (req, res) => {
  const {
    sessionTitle,
    Academicyear,
    yearId,
    active = false,
    yearColors,
    createdBy,
  } = req.body;

  if (!sessionTitle?.trim()) {
    throw new AppError("Session title is required", 400);
  }

  const sessionId = await generateUniqueSessionId();
  const sessionColor = await generateUniqueSessionColor();

  if (active === true) {
    // enforce single active session
    await pool.query(`UPDATE session SET active='false'`);
  }

  await pool.query(
    `INSERT INTO session (
      sessionId,
      sessionTitle,
      Academicyear,
      yearId,
      active,
      yearColors,
      sessionColor,
      createdBy
    ) VALUES (?, ?,?, ?, ?, ?, ?, ?)`,
    [
      sessionId,
      sessionTitle.trim(),
      Academicyear,
      yearId,
      toDbBoolean(active),
      yearColors,
      sessionColor,
      sessionColor,
      createdBy,
    ]
  );

  const data = await fetchSessions();

  res.status(201).json({
    success: 1,
    message: "Session created successfully",
    info: { sessionId, sessionColor },
    data,
  });
};


/* ============================================================
   GET ALL SESSIONS
============================================================ */
export const getSessions = async (req, res) => {
  const data = await fetchSessions();

  res.status(200).json({
    success: 1,
    message: "Sessions fetched",
    info: null,
    data,
  });
};

/* ============================================================
   GET SESSION BY ID
============================================================ */
export const getSessionById = async (req, res) => {
  const { sessionId } = req.params;

  const [rows] = await pool.query(
    "SELECT * FROM session WHERE sessionId=?",
    [sessionId]
  );

  if (!rows.length) {
    throw new AppError("Session not found", 404);
  }

  const session = {
    ...rows[0],
    active: rows[0].active === "true",
  };

  res.status(200).json({
    success: 1,
    message: "Session fetched",
    info: session,
    data: null,
  });
};

/* ============================================================
   UPDATE SESSION
   PUT /api/sessions
============================================================ */
export const updateSession = async (req, res) => {
  const {
    sessionId,
    sessionTitle,
    Academicyear,
    yearId,
    active,
  } = req.body;

  if (!sessionId) {
    throw new AppError("sessionId is required", 400);
  }

  if (active === true) {
    await pool.query(`UPDATE session SET active='false'`);
  }

  const [result] = await pool.query(
    `UPDATE session SET
      sessionTitle = COALESCE(?, sessionTitle),
      Academicyear = COALESCE(?, Academicyear),
      yearId       = COALESCE(?, yearId),
      active       = COALESCE(?, active)
     WHERE sessionId = ?`,
    [
      sessionTitle,
      Academicyear,
      yearId,
      active === undefined ? null : toDbBoolean(active),
      sessionId,
    ]
  );

  if (!result.affectedRows) {
    throw new AppError("Session not found", 404);
  }

  const data = await fetchSessions();

  res.status(200).json({
    success: 1,
    message: "Session updated successfully",
    info: { sessionId },
    data,
  });
};
/* ============================================================
   DELETE SESSION
============================================================ */
export const deleteSession = async (req, res) => {
  const { sessionId } = req.params;

  // 1️⃣ Fetch the session first
  const [sessions] = await pool.query(
    "SELECT * FROM session WHERE sessionId=?",
    [sessionId]
  );

  if (!sessions.length) {
    return res.status(404).json({
      success: 0,
      message: "Session not found",
    });
  }

  const session = sessions[0];
console.log(session)
  // 2️⃣ Check if the session is active
  if ( session.active == "true") {
    return res.status(400).json({
      success: 0,
      message: "Cannot delete an active session",
    });
  }

  // 3️⃣ Delete if not active
  const [result] = await pool.query(
    "DELETE FROM session WHERE sessionId=?",
    [sessionId]
  );

  if (!result.affectedRows) {
    return res.status(500).json({
      success: 0,
      message: "Failed to delete session",
    });
  }

  // 4️⃣ Fetch updated sessions
  const data = await fetchSessions();

  res.status(200).json({
    success: 1,
    message: "Session deleted successfully",
    info: { sessionId },
    data,
  });
};


/* ============================================================
   SET ACTIVE SESSION
   PUT /api/sessions/activate
============================================================ */
export const setActiveSession = async (req, res) => {
  const { sessionId } = req.body;

  if (!sessionId) {
    throw new AppError("sessionId is required", 400);
  }

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    // 1. Ensure session exists
    const [exists] = await connection.query(
      "SELECT sessionId FROM session WHERE sessionId=? LIMIT 1",
      [sessionId]
    );

    if (!exists.length) {
      throw new AppError("Session not found", 404);
    }

    // 2. Deactivate all sessions
    await connection.query(
      "UPDATE session SET active='false'"
    );

    // 3. Activate target session
    await connection.query(
      "UPDATE session SET active='true' WHERE sessionId=?",
      [sessionId]
    );

    await connection.commit();
    const data = await fetchSessions();

    res.status(200).json({
      success: 1,
      message: "Session activated successfully",
      info: { sessionId },
      data: data
    });

  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
};

/* ============================================================
   GET ACTIVE SESSION
   GET /api/sessions/active
============================================================ */
export const getActiveSession = async (req, res) => {
  const [rows] = await pool.query(
    `SELECT *
     FROM session
     WHERE active='true'
     LIMIT 1`
  );

  if (!rows.length) {
    return res.status(200).json({
      success: 1,
      message: "No active session found",
      info: null,
      data: null,
    });
  }

  const session = {
    ...rows[0],
    active: true, // normalize for API consumers
  };

  res.status(200).json({
    success: 1,
    message: "Active session fetched",
    info: session,
    data: null,
  });
};

import pool from "../../config/db.js";
import AppError from "../../utils/AppError.js";

/* ============================================================
   INTERNAL HELPERS
============================================================ */
const fetchSchool = async () => {
  const [rows] = await pool.query(
    "SELECT * FROM school LIMIT 1"
  );
  return rows[0] || null;
};

/* ============================================================
   UPSERT SCHOOL INFO
   POST /school
============================================================ */
export const upsertSchool = async (req, res) => {
  const {
    name,
    address,
    contact1,
    contact2,
    email
  } = req.body;

  if (!name) {
    throw new AppError("School name is required", 400);
  }

  const existing = await fetchSchool();

  if (existing) {
    await pool.query(
      `UPDATE school
       SET name=?, address=?, contact1=?, contact2=?, email=?
       WHERE id=?`,
      [
        name,
        address,
        contact1,
        contact2,
        email,
        existing.id
      ]
    );
  } else {
    await pool.query(
      `INSERT INTO school
       (name, address, contact1, contact2, email)
       VALUES (?, ?, ?, ?, ?)`,
      [
        name,
        address,
        contact1,
        contact2,
        email
      ]
    );
  }

  const data = await fetchSchool();

  res.status(200).json({
    success: 1,
    message: "School information saved successfully",
    info: null,
    data
  });
};

/* ============================================================
   GET SCHOOL INFO
   GET /school
============================================================ */
export const getSchool = async (req, res) => {
  const data = await fetchSchool();

  res.status(200).json({
    success: 1,
    message: "School information fetched",
    info: null,
    data
  });
};


/* ============================================================
   UPSERT SCHOOL LOGO
   POST /school/logo
============================================================ */
export const upsertSchoolLogo = async (req, res) => {
  if (!req.file) {
    throw new AppError("Logo file is required", 400);
  }

  const logoFile = req.file.filename;
  const logoUrl = `${process.env.SERVER_BASE_URL}/uploads/school/${logoFile}`;

  const [rows] = await pool.query(
    "SELECT id FROM school LIMIT 1"
  );

  if (rows.length) {
    await pool.query(
      `UPDATE school
       SET logoFile=?, logoUrl=?
       WHERE id=?`,
      [logoFile, logoUrl, rows[0].id]
    );
  } else {
    await pool.query(
      `INSERT INTO school (name, logoFile, logoUrl)
       VALUES (?, ?, ?)`,
      ["My School", logoFile, logoUrl]
    );
  }

  const data = await fetchSchool();

  res.status(200).json({
    success: 1,
    message: "School logo updated successfully",
    info: null,
    data
  });
};

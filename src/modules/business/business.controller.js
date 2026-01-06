import pool from "../../config/db.js";
import AppError from "../../utils/AppError.js";

/* =====================
   HELPERS
===================== */
const generateBusinessId = () => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let out = "";
  for (let i = 0; i < 10; i++) {
    out += chars[Math.floor(Math.random() * chars.length)];
  }
  return out;
};

/**
 * Build dynamic UPDATE query
 * Only updates fields that are sent
 */
const buildUpdateQuery = (data) => {
  const fields = [];
  const values = [];

  Object.entries(data).forEach(([key, value]) => {
    if (value !== undefined) {
      fields.push(`${key}=?`);
      values.push(value);
    }
  });

  return {
    sql: fields.join(", "),
    values,
  };
};

/* =====================
   CREATE BUSINESS
===================== */
export const createBusiness = async (req, res) => {
  const {
    userId,
    title,
    subtitle,
    category,
    description,
    hours,
    address,
    country,
    region,
    gps,
    bannerUrl,
    logo,
    primaryContact,
    secondaryContact,
    businessEmail,
  } = req.body;

  if (!userId || !title) {
    throw new AppError("UserId and title are required", 400);
  }

  const businessId = generateBusinessId();

  await pool.query(
    `INSERT INTO businesses (
      businessId,
      userId,
      title,
      subtitle,
      category,
      description,
      hours,
      address,
      country,
      region,
      gps,
      bannerUrl,
      logo,
      primaryContact,
      secondaryContact,
      businessEmail
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      businessId,
      userId,
      title,
      subtitle || null,
      category || null,
      description || null,
      hours || null,
      address || null,
      country || null,
      region || null,
      gps || null,
      bannerUrl || null,
      logo || null,
      primaryContact || null,
      secondaryContact || null,
      businessEmail || null,
    ]
  );

  res.status(201).json({
    success: 1,
    message: "Business created successfully",
    businessId,
  });
};

/* =====================
   FETCH ALL BUSINESSES
===================== */
export const fetchAllBusinesses = async (_req, res) => {
  const [rows] = await pool.query(
    `SELECT *
     FROM businesses
     WHERE active=1
     ORDER BY createdAt DESC`
  );

  res.json({ success: 1, data: rows });
};

/* =====================
   FETCH BUSINESS BY ID
===================== */
export const fetchBusinessById = async (req, res) => {
  const { businessId } = req.params;

  const [rows] = await pool.query(
    "SELECT * FROM businesses WHERE businessId=?",
    [businessId]
  );

  if (!rows.length) {
    throw new AppError("Business not found", 404);
  }

  res.json({ success: 1, data: rows[0] });
};

/* =====================
   FETCH BUSINESSES BY USER
===================== */
export const fetchBusinessesByUser = async (req, res) => {
  const { userId } = req.params;

  const [rows] = await pool.query(
    `SELECT *
     FROM businesses
     WHERE userId=?
     ORDER BY createdAt DESC`,
    [userId]
  );

  res.json({ success: 1, data: rows });
};

/* =====================
   UPDATE BUSINESS (INTELLIGENT PATCH)
===================== */
export const updateBusiness = async (req, res) => {
  const { businessId } = req.params;

  const allowedFields = {
    title: req.body.title,
    subtitle: req.body.subtitle,
    category: req.body.category,
    description: req.body.description,
    hours: req.body.hours,
    address: req.body.address,
    country: req.body.country,
    region: req.body.region,
    gps: req.body.gps,
    bannerUrl: req.body.bannerUrl,
    logo: req.body.logo,
    primaryContact: req.body.primaryContact,
    secondaryContact: req.body.secondaryContact,
    businessEmail: req.body.businessEmail,
  };

  const { sql, values } = buildUpdateQuery(allowedFields);

  if (!sql) {
    throw new AppError("No valid fields provided for update", 400);
  }

  const [result] = await pool.query(
    `UPDATE businesses SET ${sql} WHERE businessId=?`,
    [...values, businessId]
  );

  if (!result.affectedRows) {
    throw new AppError("Business not found", 404);
  }

  res.json({
    success: 1,
    message: "Business updated successfully",
  });
};

/* =====================
   TOGGLE VERIFY
===================== */
export const toggleVerifyBusiness = async (req, res) => {
  const { businessId } = req.params;
  const { status } = req.body;

  if (typeof status !== "boolean") {
    throw new AppError("Status must be boolean", 400);
  }

  const [result] = await pool.query(
    "UPDATE businesses SET verified=? WHERE businessId=?",
    [status ? 1 : 0, businessId]
  );

  if (!result.affectedRows) {
    throw new AppError("Business not found", 404);
  }

  res.json({
    success: 1,
    message: `Business ${status ? "verified" : "unverified"} successfully`,
  });
};

/* =====================
   TOGGLE ACTIVE
===================== */
export const toggleActiveBusiness = async (req, res) => {
  const { businessId } = req.params;
  const { status } = req.body;

  if (typeof status !== "boolean") {
    throw new AppError("Status must be boolean", 400);
  }

  const [result] = await pool.query(
    "UPDATE businesses SET active=? WHERE businessId=?",
    [status ? 1 : 0, businessId]
  );

  if (!result.affectedRows) {
    throw new AppError("Business not found", 404);
  }

  res.json({
    success: 1,
    message: `Business ${status ? "activated" : "deactivated"} successfully`,
  });
};

/* =====================
   DELETE BUSINESS
===================== */
export const deleteBusiness = async (req, res) => {
  const { businessId } = req.params;

  const [result] = await pool.query(
    "DELETE FROM businesses WHERE businessId=?",
    [businessId]
  );

  if (!result.affectedRows) {
    throw new AppError("Business not found", 404);
  }

  res.json({
    success: 1,
    message: "Business deleted successfully",
  });
};

import pool from "../../config/db.js";
import AppError from "../../utils/AppError.js";
import bcrypt from "bcryptjs";

/* =====================
   HELPERS
===================== */
const generateUserId = () => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let out = "";
  for (let i = 0; i < 10; i++) {
    out += chars[Math.floor(Math.random() * chars.length)];
  }
  return out;
};

const fetchUsers = async () => {
  const [rows] = await pool.query(
    `SELECT
      userId,
      name,
      email,
      phone,
      member,
      country,
      area,
      district,
      localAssembly,
      profileUrl,
      isActive,
      lastLogin,
      createdAt
     FROM users
     ORDER BY createdAt DESC`
  );
  return rows;
};

/* =====================
   CREATE USER
===================== */
export const createUser = async (req, res) => {
  const {
    name,
    email,
    phone,
    password,
    member,
    country,
    area,
    district,
    localAssembly,
    profileUrl,
  } = req.body;

  if (!name || !email || !password) {
    throw new AppError("Missing required fields", 400);
  }

  const [exists] = await pool.query(
    "SELECT id FROM users WHERE email=?",
    [email.toLowerCase()]
  );
  if (exists.length) throw new AppError("User already exists", 409);

  const userId = generateUserId();
  const hashedPassword = await bcrypt.hash(password, 12);

  await pool.query(
    `INSERT INTO users (
      userId,
      name,
      email,
      phone,
      password,
      member,
      country,
      area,
      district,
      localAssembly,
      profileUrl,
      isActive
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      userId,
      name,
      email.toLowerCase(),
      phone || null,
      hashedPassword,
      member ? 1 : 0,
      country || null,
      area || null,
      district || null,
      localAssembly || null,
      profileUrl || null,
      1,
    ]
  );

  res.status(201).json({
    success: 1,
    message: "User created successfully",
    data: await fetchUsers(),
  });
};

/* =====================
   FETCH ALL USERS
===================== */
export const fetchAllUsers = async (_req, res) => {
  res.json({
    success: 1,
    data: await fetchUsers(),
  });
};

/* =====================
   FETCH SINGLE USER
===================== */
export const fetchUserByUserId = async (req, res) => {
  const { userId } = req.params;

  const [rows] = await pool.query(
    `SELECT
      userId,
      name,
      email,
      phone,
      member,
      country,
      area,
      district,
      localAssembly,
      profileUrl,
      isActive,
      lastLogin,
      createdAt
     FROM users
     WHERE userId=?`,
    [userId]
  );

  if (!rows.length) {
    throw new AppError("User not found", 404);
  }

  res.json({
    success: 1,
    data: rows[0],
  });
};

/* =====================
   UPDATE USER (NO PASSWORD)
===================== */
export const updateUser = async (req, res) => {
  const { userId } = req.params;
  const {
    name,
    phone,
    member,
    country,
    area,
    district,
    localAssembly,
    profileUrl,
    isActive,
  } = req.body;

  const [result] = await pool.query(
    `UPDATE users SET
      name=?,
      phone=?,
      member=?,
      country=?,
      area=?,
      district=?,
      localAssembly=?,
      profileUrl=?,
      isActive=?
     WHERE userId=?`,
    [
      name,
      phone,
      member ? 1 : 0,
      country,
      area,
      district,
      localAssembly,
      profileUrl,
      isActive,
      userId,
    ]
  );

  if (!result.affectedRows) {
    throw new AppError("User not found", 404);
  }

  res.json({
    success: 1,
    message: "User updated successfully",
    data: await fetchUsers(),
  });
};

/* =====================
   TOGGLE ACTIVE STATUS
===================== */
export const toggleActiveStatus = async (req, res) => {
  const { userId } = req.params;
  const { status } = req.body;

  if (typeof status !== "boolean") {
    throw new AppError("Status must be a boolean", 400);
  }

  const [result] = await pool.query(
    "UPDATE users SET isActive=? WHERE userId=?",
    [status ? 1 : 0, userId]
  );

  if (!result.affectedRows) {
    throw new AppError("User not found", 404);
  }

  res.json({
    success: 1,
    message: `User ${status ? "activated" : "deactivated"} successfully`,
    data: await fetchUsers(),
  });
};

/* =====================
   RESET USER PASSWORD (ADMIN)
===================== */
export const resetUserPassword = async (req, res) => {
  const { userId } = req.params;
  const { newPassword } = req.body;

  if (!newPassword) {
    throw new AppError("Password required", 400);
  }

  const hashed = await bcrypt.hash(newPassword, 12);

  const [result] = await pool.query(
    "UPDATE users SET password=? WHERE userId=?",
    [hashed, userId]
  );

  if (!result.affectedRows) {
    throw new AppError("User not found", 404);
  }

  res.json({
    success: 1,
    message: "Password reset successful",
  });
};

/* =====================
   DELETE USER
===================== */
export const deleteUser = async (req, res) => {
  const { userId } = req.params;

  const [result] = await pool.query(
    "DELETE FROM users WHERE userId=?",
    [userId]
  );

  if (!result.affectedRows) {
    throw new AppError("User not found", 404);
  }

  res.json({
    success: 1,
    message: "User deleted successfully",
    data: await fetchUsers(),
  });
};

import pool from "../../config/db.js";
import AppError from "../../utils/AppError.js";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { signToken } from "../../utils/jwt.js";

/* =====================
   SIGN IN
===================== */
export const signin = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new AppError("Email and password required", 400);
  }

  const [rows] = await pool.query(
    "SELECT * FROM users WHERE email=? AND isActive=1",
    [email.toLowerCase()]
  );

  if (!rows.length) {
    throw new AppError("Invalid credentials", 401);
  }

  const user = rows[0];
  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    throw new AppError("Invalid credentials", 401);
  }

  await pool.query(
    "UPDATE users SET lastLogin=NOW() WHERE id=?",
    [user.id]
  );

  const token = signToken(
    {
      id: user.id,
      userId: user.userId,
      member: user.member,
    },
    "1h"
  );

  res.json({
    success: 1,
    token,
    expiresIn: 3600,
    data: {
      userId: user.userId,
      name: user.name,
      email: user.email,
      member: !!user.member,
      profileUrl: user.profileUrl,
    },
  });
};

/* =====================
   FORGOT PASSWORD
===================== */
export const forgotPassword = async (req, res) => {
  const { email } = req.body;
  if (!email) throw new AppError("Email required", 400);

  const [rows] = await pool.query(
    "SELECT id FROM users WHERE email=?",
    [email.toLowerCase()]
  );

  if (!rows.length) throw new AppError("User not found", 404);

  const resetToken = crypto.randomBytes(32).toString("hex");
  const hashed = crypto.createHash("sha256").update(resetToken).digest("hex");
  const expires = new Date(Date.now() + 15 * 60 * 1000);

  await pool.query(
    `UPDATE users
     SET passwordResetToken=?, passwordResetExpires=?
     WHERE id=?`,
    [hashed, expires, rows[0].id]
  );

  res.json({
    success: 1,
    resetToken, // send via email in production
  });
};

/* =====================
   RESET PASSWORD
===================== */
export const resetPassword = async (req, res) => {
  const { token, newPassword } = req.body;

  if (!token || !newPassword) {
    throw new AppError("Token and password required", 400);
  }

  const hashed = crypto.createHash("sha256").update(token).digest("hex");

  const [rows] = await pool.query(
    `SELECT id FROM users
     WHERE passwordResetToken=?
     AND passwordResetExpires > NOW()`,
    [hashed]
  );

  if (!rows.length) {
    throw new AppError("Token invalid or expired", 400);
  }

  const password = await bcrypt.hash(newPassword, 12);

  await pool.query(
    `UPDATE users SET
      password=?,
      passwordResetToken=NULL,
      passwordResetExpires=NULL
     WHERE id=?`,
    [password, rows[0].id]
  );

  res.json({ success: 1, message: "Password updated successfully" });
};

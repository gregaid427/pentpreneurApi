import pool from "../../config/db.js";
import AppError from "../../utils/AppError.js";

/* =====================================================
   LIKES
===================================================== */

export const likeBusiness = async (req, res) => {
  const { businessId, userId } = req.body;

  if (!businessId || !userId) {
    throw new AppError("businessId and userId are required", 400);
  }

  try {
    await pool.query(
      "INSERT INTO business_likes (businessId, userId) VALUES (?, ?)",
      [businessId, userId]
    );

    await pool.query(
      "UPDATE businesses SET liked = liked + 1 WHERE businessId=?",
      [businessId]
    );

    res.json({ success: 1, message: "Business liked" });
  } catch (err) {
    if (err.code === "ER_DUP_ENTRY") {
      throw new AppError("Business already liked", 409);
    }
    throw err;
  }
};

export const unlikeBusiness = async (req, res) => {
  const { businessId, userId } = req.body;

  const [result] = await pool.query(
    "DELETE FROM business_likes WHERE businessId=? AND userId=?",
    [businessId, userId]
  );

  if (!result.affectedRows) {
    throw new AppError("Like not found", 404);
  }

  await pool.query(
    "UPDATE businesses SET liked = GREATEST(liked - 1, 0) WHERE businessId=?",
    [businessId]
  );

  res.json({ success: 1, message: "Like removed" });
};

/* =====================================================
   SAVES
===================================================== */

export const saveBusiness = async (req, res) => {
  const { businessId, userId } = req.body;

  if (!businessId || !userId) {
    throw new AppError("businessId and userId are required", 400);
  }

  try {
    await pool.query(
      "INSERT INTO business_saves (businessId, userId) VALUES (?, ?)",
      [businessId, userId]
    );

    await pool.query(
      "UPDATE businesses SET saved = saved + 1 WHERE businessId=?",
      [businessId]
    );

    res.json({ success: 1, message: "Business saved" });
  } catch (err) {
    if (err.code === "ER_DUP_ENTRY") {
      throw new AppError("Business already saved", 409);
    }
    throw err;
  }
};

export const unsaveBusiness = async (req, res) => {
  const { businessId, userId } = req.body;

  const [result] = await pool.query(
    "DELETE FROM business_saves WHERE businessId=? AND userId=?",
    [businessId, userId]
  );

  if (!result.affectedRows) {
    throw new AppError("Save not found", 404);
  }

  await pool.query(
    "UPDATE businesses SET saved = GREATEST(saved - 1, 0) WHERE businessId=?",
    [businessId]
  );

  res.json({ success: 1, message: "Save removed" });
};

/* =====================================================
   FETCH USER INTERACTIONS
===================================================== */

export const getLikedBusinesses = async (req, res) => {
  const { userId } = req.params;

  const [rows] = await pool.query(
    `SELECT b.*
     FROM businesses b
     JOIN business_likes l ON b.businessId = l.businessId
     WHERE l.userId=?
     ORDER BY l.createdAt DESC`,
    [userId]
  );

  res.json({ success: 1, data: rows });
};

export const getSavedBusinesses = async (req, res) => {
  const { userId } = req.params;

  const [rows] = await pool.query(
    `SELECT b.*
     FROM businesses b
     JOIN business_saves s ON b.businessId = s.businessId
     WHERE s.userId=?
     ORDER BY s.createdAt DESC`,
    [userId]
  );

  res.json({ success: 1, data: rows });
};

/* =====================================================
   STATUS (UI SUPPORT)
===================================================== */

export const getBusinessInteractionStatus = async (req, res) => {
  const { businessId, userId } = req.params;

  const [[liked]] = await pool.query(
    "SELECT id FROM business_likes WHERE businessId=? AND userId=?",
    [businessId, userId]
  );

  const [[saved]] = await pool.query(
    "SELECT id FROM business_saves WHERE businessId=? AND userId=?",
    [businessId, userId]
  );

  res.json({
    success: 1,
    liked: Boolean(liked),
    saved: Boolean(saved),
  });
};

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
      emailVerified,
      phoneVerified,
      lastLogin,
      createdAt
     FROM users
     ORDER BY createdAt DESC`
  );
  return rows;
};

/* =====================
   SIGNUP (PUBLIC)
===================== */
export const signup = async (req, res) => {
  const {
    name,
    email,
    phone,
    password,
    is_member, // Changed from 'member' to match Flutter
    country,
    area,
    district,
    local, // Changed from 'localAssembly' to match Flutter
  } = req.body;

  // Validation
  if (!name || !email || !phone || !password) {
    throw new AppError("Name, email, phone, and password are required", 400);
  }

  // Validate email format
  const emailRegex = /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/;
  if (!emailRegex.test(email)) {
    throw new AppError("Invalid email format", 400);
  }

  // Validate password length
  if (password.length < 6) {
    throw new AppError("Password must be at least 6 characters", 400);
  }

  // Validate phone number
  if (phone.length < 10) {
    throw new AppError("Invalid phone number", 400);
  }

  // Check if user already exists (by email or phone)
  const [existingUser] = await pool.query(
    "SELECT id FROM users WHERE email=? OR phone=?",
    [email.toLowerCase(), phone]
  );

  if (existingUser.length) {
    const [user] = existingUser;
    const [emailMatch] = await pool.query(
      "SELECT id FROM users WHERE email=?",
      [email.toLowerCase()]
    );
    
    if (emailMatch.length) {
      throw new AppError("Email already registered", 409);
    } else {
      throw new AppError("Phone number already registered", 409);
    }
  }

  // If member, validate church info
  if (is_member) {
    if (!country || !area || !district || !local) {
      throw new AppError(
        "Church information (country, area, district, local) is required for members",
        400
      );
    }
  }

  // Generate userId and hash password
  const userId = generateUserId();
  const hashedPassword = await bcrypt.hash(password, 12);

  // Insert user
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
      isActive,
      emailVerified,
      phoneVerified
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      userId,
      name.trim(),
      email.toLowerCase().trim(),
      phone.trim(),
      hashedPassword,
      is_member ? 1 : 0,
      is_member ? country?.trim() : null,
      is_member ? area?.trim() : null,
      is_member ? district?.trim() : null,
      is_member ? local?.trim() : null,
      1, // isActive - user is active by default
      0, // emailVerified - needs verification
      0, // phoneVerified - needs OTP verification
    ]
  );

  // Fetch the created user (without password)
  const [newUser] = await pool.query(
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
      isActive,
      emailVerified,
      phoneVerified,
      createdAt
     FROM users
     WHERE userId=?`,
    [userId]
  );

  res.status(201).json({
    error: false,
    message: "Account created successfully. Please verify your phone number.",
    data: {
      user: newUser[0],
      requiresOtp: true,
    },
  });
};

/* =====================
   VERIFY OTP
===================== */
/* =====================
   VERIFY OTP
===================== */

/* =====================
   VERIFY OTP
===================== */
export const verifyOtp = async (req, res) => {
  try {
    const { phone, otp } = req.body;

    if (!phone || !otp) {
      return res.status(400).json({
        success: 0,
        message: "Phone and OTP are required",
      });
    }

    // Fetch user by phone
    const [rows] = await pool.query(
      `SELECT id, otp, otpExpires
       FROM users
       WHERE phone = ? AND isActive = 1`,
      [phone]
    );

    if (!rows.length) {
      return res.status(404).json({
        success: 0,
        message: "User not found",
      });
    }

    const user = rows[0];
console.log(otp)
console.log(user)

    // Check OTP
    if (user.otp !== otp) {
      return res.status(400).json({
        success: 0,
        message: "Invalid OTP",
      });
    }

    // Check expiry
    if (!user.otpExpires || new Date(user.otpExpires) < new Date()) {
      return res.status(400).json({
        success: 0,
        message: "OTP expired",
      });
    }

    // OTP valid: update phoneVerified and clear OTP
    const [updateResult] = await pool.query(
      `UPDATE users
       SET phoneVerified = 1, otp = NULL, otpExpires = NULL
       WHERE id = ?`,
      [user.id]
    );

    if (!updateResult.affectedRows) {
      return res.status(500).json({
        success: 0,
        message: "Failed to verify phone",
      });
    }

    // Fetch full updated user data (excluding password)
    const [updatedRows] = await pool.query(
      `SELECT * FROM users WHERE id = ?`,
      [user.id]
    );

    const { password: _, ...userData } = updatedRows[0];

    res.json({
      success: 1,
      message: "Phone verified successfully",
      data: userData, // return all user fields except password
    });
  } catch (err) {
    console.error("OTP Verification Error:", err);
    res.status(500).json({
      success: 0,
      message: "An unexpected error occurred. Please try again.",
    });
  }
};


/* =====================
   RESEND OTP
===================== */
export const resendOtp = async (req, res) => {
  try {
    const { phone } = req.body;

    if (!phone) {
      return res.status(400).json({
        success: 0,
        message: "Phone number is required",
      });
    }

    // Check if user exists and is active
    const [rows] = await pool.query(
      "SELECT id, name FROM users WHERE phone = ? AND isActive = 1",
      [phone]
    );

    if (!rows.length) {
      return res.status(404).json({
        success: 0,
        message: "User not found",
      });
    }

    const user = rows[0];

    // Generate new 5-digit OTP
    const otp = Math.floor(10000 + Math.random() * 90000).toString();

    // Set expiry (5 minutes)
    const otpExpires = new Date(Date.now() + 5 * 60 * 1000);

    // Update OTP in database
    await pool.query(
      `UPDATE users 
       SET otp = ?, otpExpires = ? 
       WHERE id = ?`,
      [otp, otpExpires, user.id]
    );

    // TODO: Send OTP via SMS service (Twilio, etc.)
    console.log(`Resent OTP for ${phone}: ${otp}`);

    res.json({
      success: 1,
      message: "OTP sent successfully",
      data: {
        phone,
        expiresIn: 300, // 5 minutes
      },
    });
  } catch (err) {
    console.error("Resend OTP Error:", err);
    res.status(500).json({
      success: 0,
      message: "An unexpected error occurred. Please try again.",
    });
  }
};


/* =====================
   CREATE USER (ADMIN ONLY)
===================== */
/* =====================
   CREATE USER
===================== */
export const createUser = async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      password,
      is_member,
      country,
      area,
      district,
      local,
      profileUrl,
    } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: 0, message: "Missing required fields" });
    }

    // Check if email exists
    const [existsEmail] = await pool.query(
      "SELECT id FROM users WHERE email=?",
      [email.toLowerCase()]
    );
    if (existsEmail.length) {
      return res.status(400).json({ success: 0, message: "Email already taken" });
    }

    // Check if phone exists
    const [existsPhone] = await pool.query(
      "SELECT id FROM users WHERE phone=?",
      [phone]
    );
    if (existsPhone.length) {
      return res.status(400).json({ success: 0, message: "Phone number already taken" });
    }

    // Generate userId and hash password
    const userId = generateUserId();
    const hashedPassword = await bcrypt.hash(password, 12);

    // Insert user record (no OTP fields, no user data in response)
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
        isActive,
        emailVerified,
        phoneVerified
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        name,
        email.toLowerCase(),
        phone || null,
        hashedPassword,
        is_member ? 1 : 0,
        country || null,
        area || null,
        district || null,
        local || null,
        profileUrl || null,
        1,
        0, // emailVerified
        0, // phoneVerified
      ]
    );

    res.status(201).json({
      success: 1,
      message: "User created successfully. Please verify your phone.",
    });
  } catch (err) {
    if (err instanceof AppError) {
      res.status(err.statusCode).json({ success: 0, message: err.message });
    } else {
      console.error("Create User Error:", err);
      res.status(500).json({ success: 0, message: "Internal server error" });
    }
  }
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
      emailVerified,
      phoneVerified,
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
   UPDATE USER PROFILE
===================== */
export const updateUserProfile = async (req, res) => {
  const { userId } = req.params;
  const {
    name,
    phone,
    country,
    area,
    district,
    localAssembly,
    profileUrl,
  } = req.body;

  // Build dynamic update query
  const updates = [];
  const values = [];

  if (name) {
    updates.push("name=?");
    values.push(name.trim());
  }
  if (phone) {
    // Check if phone is already taken by another user
    const [existing] = await pool.query(
      "SELECT userId FROM users WHERE phone=? AND userId!=?",
      [phone, userId]
    );
    if (existing.length) {
      throw new AppError("Phone number already in use", 409);
    }
    updates.push("phone=?");
    values.push(phone.trim());
  }
  if (country) {
    updates.push("country=?");
    values.push(country.trim());
  }
  if (area) {
    updates.push("area=?");
    values.push(area.trim());
  }
  if (district) {
    updates.push("district=?");
    values.push(district.trim());
  }
  if (localAssembly) {
    updates.push("localAssembly=?");
    values.push(localAssembly.trim());
  }
  if (profileUrl !== undefined) {
    updates.push("profileUrl=?");
    values.push(profileUrl);
  }

  if (updates.length === 0) {
    throw new AppError("No fields to update", 400);
  }

  values.push(userId);

  const [result] = await pool.query(
    `UPDATE users SET ${updates.join(", ")} WHERE userId=?`,
    values
  );

  if (!result.affectedRows) {
    throw new AppError("User not found", 404);
  }

  // Fetch updated user
  const [user] = await pool.query(
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
      emailVerified,
      phoneVerified
     FROM users
     WHERE userId=?`,
    [userId]
  );

  res.json({
    error: false,
    message: "Profile updated successfully",
    data: user[0],
  });
};

/* =====================
   UPDATE USER (ADMIN)
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
   CHANGE PASSWORD (USER)
===================== */
export const changePassword = async (req, res) => {
  const { userId } = req.params;
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    throw new AppError("Current and new password are required", 400);
  }

  if (newPassword.length < 6) {
    throw new AppError("Password must be at least 6 characters", 400);
  }

  // Fetch user with password
  const [user] = await pool.query(
    "SELECT password FROM users WHERE userId=?",
    [userId]
  );

  if (!user.length) {
    throw new AppError("User not found", 404);
  }

  // Verify current password
  const isValid = await bcrypt.compare(currentPassword, user[0].password);
  if (!isValid) {
    throw new AppError("Current password is incorrect", 401);
  }

  // Hash and update new password
  const hashed = await bcrypt.hash(newPassword, 12);
  await pool.query("UPDATE users SET password=? WHERE userId=?", [
    hashed,
    userId,
  ]);

  res.json({
    error: false,
    message: "Password changed successfully",
  });
};

/* =====================
   DELETE USER
===================== */
export const deleteUser = async (req, res) => {
  const { userId } = req.params;

  const [result] = await pool.query("DELETE FROM users WHERE userId=?", [
    userId,
  ]);

  if (!result.affectedRows) {
    throw new AppError("User not found", 404);
  }

  res.json({
    success: 1,
    message: "User deleted successfully",
    data: await fetchUsers(),
  });
};
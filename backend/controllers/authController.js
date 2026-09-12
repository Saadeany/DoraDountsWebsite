const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const { User, EmailVerificationToken, PasswordResetToken } = require("../models");
const generateToken = require("../utils/generateToken");
const {
  sendWelcomeEmail, sendVerificationEmail, sendPasswordResetEmail, sendAdminNewUserEmail,
} = require("../utils/emailService");
const { notifyAdminNewUser } = require("../utils/notificationService");

const makeExpiry = (minutes) => {
  const d = new Date();
  d.setMinutes(d.getMinutes() + parseInt(minutes, 10));
  return d;
};
const generateSecureToken = () => crypto.randomBytes(48).toString("hex");
const getAdminUser = () => User.findOne({ where: { role: "admin" } });

// @route POST /api/auth/register
const register = async (req, res, next) => {
  try {
    const { first_name, last_name, email, password, phone } = req.body;
    if (!first_name || !last_name || !email || !password)
      return res.status(400).json({ message: "First name, last name, email, and password are required." });
    if (password.length < 8)
      return res.status(400).json({ message: "Password must be at least 8 characters long." });

    const existing = await User.findOne({ where: { email: email.toLowerCase().trim() } });
    if (existing) return res.status(409).json({ message: "An account with this email already exists." });

    const hashed = await bcrypt.hash(password, 12);
    const user = await User.create({
      first_name: first_name.trim(), last_name: last_name.trim(),
      email: email.toLowerCase().trim(), password: hashed,
      phone: phone || null, role: "customer", is_email_verified: false,
    });

    const token = generateSecureToken();
    await EmailVerificationToken.create({
      user_id: user.id, token,
      expires_at: makeExpiry(parseInt(process.env.EMAIL_VERIFY_EXPIRES_MIN, 10) || 30),
    });

    sendWelcomeEmail(user).catch(() => {});
    sendVerificationEmail(user, token).catch(() => {});

    const admin = await getAdminUser();
    if (admin) {
      sendAdminNewUserEmail(user).catch(() => {});
      notifyAdminNewUser(admin.id, user).catch(() => {});
    }

    const jwtToken = generateToken(user.id, user.role);
    res.status(201).json({
      message: "Account created. Please check your inbox to verify your email.",
      token: jwtToken,
      user: { id: user.id, first_name: user.first_name, last_name: user.last_name, email: user.email, role: user.role, is_email_verified: false },
    });
  } catch (error) { next(error); }
};

// @route POST /api/auth/login
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: "Email and password are required." });
    const user = await User.scope("withPassword").findOne({ where: { email: email.toLowerCase().trim() } });
    if (!user) return res.status(401).json({ message: "Invalid email or password." });
    if (user.is_blocked) return res.status(403).json({ message: "Your account has been blocked. Contact support." });
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: "Invalid email or password." });
    const token = generateToken(user.id, user.role);
    res.json({ message: "Login successful.", token, user: { id: user.id, first_name: user.first_name, last_name: user.last_name, email: user.email, role: user.role, profile_image: user.profile_image, is_email_verified: user.is_email_verified } });
  } catch (error) { next(error); }
};

const getMe = async (req, res, next) => {
  try { res.json({ user: req.user }); } catch (error) { next(error); }
};

const updateProfile = async (req, res, next) => {
  try {
    const { first_name, last_name, phone } = req.body;
    const user = req.user;
    if (first_name) user.first_name = first_name.trim();
    if (last_name) user.last_name = last_name.trim();
    if (phone !== undefined) user.phone = phone;
    if (req.file) user.profile_image = `/uploads/profiles/${req.file.filename}`;
    await user.save();
    res.json({ message: "Profile updated successfully.", user });
  } catch (error) { next(error); }
};

const changePassword = async (req, res, next) => {
  try {
    const { current_password, new_password } = req.body;
    if (!current_password || !new_password) return res.status(400).json({ message: "Both passwords are required." });
    if (new_password.length < 8) return res.status(400).json({ message: "New password must be at least 8 characters." });
    const user = await User.scope("withPassword").findByPk(req.user.id);
    const isMatch = await bcrypt.compare(current_password, user.password);
    if (!isMatch) return res.status(401).json({ message: "Current password is incorrect." });
    user.password = await bcrypt.hash(new_password, 12);
    await user.save();
    res.json({ message: "Password changed successfully." });
  } catch (error) { next(error); }
};

const updateAddresses = async (req, res, next) => {
  try {
    const { addresses } = req.body;
    if (!Array.isArray(addresses)) return res.status(400).json({ message: "Addresses must be an array." });
    req.user.addresses = addresses;
    await req.user.save();
    res.json({ message: "Addresses updated.", addresses: req.user.addresses });
  } catch (error) { next(error); }
};

// @route GET /api/auth/verify-email?token=
const verifyEmail = async (req, res, next) => {
  try {
    const { token } = req.query;
    if (!token) return res.status(400).json({ message: "Verification token is required." });
    const record = await EmailVerificationToken.findOne({ where: { token } });
    if (!record) return res.status(400).json({ message: "Invalid verification link." });
    if (record.used_at) return res.status(400).json({ message: "This link has already been used." });
    if (new Date() > new Date(record.expires_at)) return res.status(400).json({ message: "This link has expired. Please request a new one." });
    const user = await User.findByPk(record.user_id);
    if (!user) return res.status(404).json({ message: "User not found." });
    user.is_email_verified = true;
    await user.save();
    record.used_at = new Date();
    await record.save();
    res.json({ message: "Email verified successfully. You can now place orders." });
  } catch (error) { next(error); }
};

// @route POST /api/auth/resend-verification
const resendVerification = async (req, res, next) => {
  try {
    const user = req.user;
    if (user.is_email_verified) return res.status(400).json({ message: "Your email is already verified." });
    await EmailVerificationToken.destroy({ where: { user_id: user.id, used_at: null } });
    const token = generateSecureToken();
    await EmailVerificationToken.create({ user_id: user.id, token, expires_at: makeExpiry(parseInt(process.env.EMAIL_VERIFY_EXPIRES_MIN, 10) || 30) });
    sendVerificationEmail(user, token).catch(() => {});
    res.json({ message: "A new verification email has been sent." });
  } catch (error) { next(error); }
};

// @route POST /api/auth/forgot-password
const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email is required." });
    const SAFE = { message: "If an account with that email exists, a reset link has been sent." };
    const user = await User.findOne({ where: { email: email.toLowerCase().trim() } });
    if (!user) return res.json(SAFE);
    await PasswordResetToken.destroy({ where: { user_id: user.id, used_at: null } });
    const token = generateSecureToken();
    await PasswordResetToken.create({ user_id: user.id, token, expires_at: makeExpiry(parseInt(process.env.PASSWORD_RESET_EXPIRES_MIN, 10) || 15) });
    sendPasswordResetEmail(user, token).catch(() => {});
    res.json(SAFE);
  } catch (error) { next(error); }
};

// @route POST /api/auth/reset-password
const resetPassword = async (req, res, next) => {
  try {
    const { token, new_password } = req.body;
    if (!token || !new_password) return res.status(400).json({ message: "Token and new password are required." });
    if (new_password.length < 8) return res.status(400).json({ message: "Password must be at least 8 characters." });
    const record = await PasswordResetToken.findOne({ where: { token } });
    if (!record || record.used_at) return res.status(400).json({ message: "Invalid or already-used reset link." });
    if (new Date() > new Date(record.expires_at)) return res.status(400).json({ message: "This link has expired. Request a new one." });
    const user = await User.scope("withPassword").findByPk(record.user_id);
    if (!user) return res.status(404).json({ message: "User not found." });
    user.password = await bcrypt.hash(new_password, 12);
    await user.save();
    record.used_at = new Date();
    await record.save();
    res.json({ message: "Password reset successfully. You can now log in." });
  } catch (error) { next(error); }
};

module.exports = { register, login, getMe, updateProfile, changePassword, updateAddresses, verifyEmail, resendVerification, forgotPassword, resetPassword };

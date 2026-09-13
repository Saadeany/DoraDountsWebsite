const { Newsletter, User } = require("../models");
const { sendNewsletterConfirmationEmail, sendAdminNewSubscriberEmail } = require("../utils/emailService");

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const subscribe = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (typeof email !== "string") return res.status(400).json({ message: "Email is required." });

    const normalized = email.trim().toLowerCase();
    if (!EMAIL_RE.test(normalized) || normalized.length > 150) {
      return res.status(400).json({ message: "Please enter a valid email address." });
    }

    const existing = await Newsletter.findOne({ where: { email: normalized } });
    if (existing) return res.status(200).json({ message: "You're already subscribed." });

    await Newsletter.create({ email: normalized });

    sendNewsletterConfirmationEmail(normalized).catch(() => {});
    const admin = await User.findOne({ where: { role: "admin" } });
    if (admin) sendAdminNewSubscriberEmail(normalized).catch(() => {});

    res.status(201).json({ message: "Subscribed successfully. Welcome to the list!" });
  } catch (error) {
    next(error);
  }
};

module.exports = { subscribe };
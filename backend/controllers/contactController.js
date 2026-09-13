const { User } = require("../models");
const { sendAdminContactEmail } = require("../utils/emailService");
const { notifyAdminContact } = require("../utils/notificationService");

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const submitContact = async (req, res, next) => {
  try {
    const { name, email, subject, message } = req.body;

    if (typeof name !== "string" || typeof email !== "string" ||
        typeof subject !== "string" || typeof message !== "string") {
      return res.status(400).json({ message: "All fields are required." });
    }

    const trimmedName = name.trim();
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedSubject = subject.trim();
    const trimmedMessage = message.trim();

    if (!trimmedName || !trimmedEmail || !trimmedSubject || !trimmedMessage) {
      return res.status(400).json({ message: "All fields are required." });
    }
    if (trimmedName.length > 100) {
      return res.status(400).json({ message: "Name must be 100 characters or fewer." });
    }
    if (!EMAIL_RE.test(trimmedEmail) || trimmedEmail.length > 150) {
      return res.status(400).json({ message: "Please enter a valid email address." });
    }
    if (trimmedSubject.length > 150) {
      return res.status(400).json({ message: "Subject must be 150 characters or fewer." });
    }
    if (trimmedMessage.length < 5 || trimmedMessage.length > 2000) {
      return res.status(400).json({ message: "Message must be between 5 and 2000 characters." });
    }

    const admin = await User.findOne({ where: { role: "admin" } });
    if (admin) {
      sendAdminContactEmail({ name: trimmedName, email: trimmedEmail, subject: trimmedSubject, message: trimmedMessage }).catch(() => {});
      notifyAdminContact(admin.id, { name: trimmedName, email: trimmedEmail, subject: trimmedSubject, message: trimmedMessage }).catch(() => {});
    }

    res.json({ message: "Message sent. We'll get back to you within 24 hours." });
  } catch (error) { next(error); }
};

module.exports = { submitContact };
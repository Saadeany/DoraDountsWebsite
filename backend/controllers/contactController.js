const { User } = require("../models");
const { sendAdminContactEmail } = require("../utils/emailService");
const { notifyAdminContact } = require("../utils/notificationService");

// @route POST /api/contact
const submitContact = async (req, res, next) => {
  try {
    const { name, email, subject, message } = req.body;
    if (!name || !email || !subject || !message)
      return res.status(400).json({ message: "All fields are required." });

    const admin = await User.findOne({ where: { role: "admin" } });
    if (admin) {
      sendAdminContactEmail({ name, email, subject, message }).catch(() => {});
      notifyAdminContact(admin.id, { name, email, subject, message }).catch(() => {});
    }

    res.json({ message: "Message sent. We'll get back to you within 24 hours." });
  } catch (error) { next(error); }
};

module.exports = { submitContact };

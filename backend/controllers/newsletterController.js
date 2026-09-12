const { Newsletter } = require("../models");

// @route POST /api/newsletter/subscribe
const subscribe = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email is required." });

    const existing = await Newsletter.findOne({ where: { email: email.toLowerCase().trim() } });
    if (existing) return res.status(200).json({ message: "You're already subscribed." });

    await Newsletter.create({ email: email.toLowerCase().trim() });
    res.status(201).json({ message: "Subscribed successfully. Welcome to the list!" });
  } catch (error) {
    next(error);
  }
};

module.exports = { subscribe };

const express = require("express");
const router = express.Router();
const { protect, adminOnly } = require("../middleware/auth");
const { EmailLog } = require("../models");
const { Op } = require("sequelize");

router.get("/", protect, adminOnly, async (req, res, next) => {
  try {
    const { status, email_type, page = 1, limit = 50 } = req.query;
    const where = {};
    if (status) where.status = status;
    if (email_type) where.email_type = email_type;
    const pageNum = Math.max(parseInt(page, 10) || 1, 1);
    const limitNum = Math.min(parseInt(limit, 10) || 50, 200);
    const { count, rows } = await EmailLog.findAndCountAll({
      where, order: [["sent_at", "DESC"]], limit: limitNum, offset: (pageNum - 1) * limitNum,
    });
    res.json({ logs: rows, pagination: { total: count, page: pageNum, total_pages: Math.ceil(count / limitNum) } });
  } catch (error) { next(error); }
});

module.exports = router;

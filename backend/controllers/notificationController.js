const { Op } = require("sequelize");
const { Notification } = require("../models");

// @route GET /api/notifications
const getNotifications = async (req, res, next) => {
  try {
    const notifications = await Notification.findAll({
      where: { user_id: req.user.id },
      order: [["createdAt", "DESC"]],
      limit: 50,
    });
    const unread_count = notifications.filter((n) => !n.is_read).length;
    res.json({ notifications, unread_count });
  } catch (error) { next(error); }
};

// @route PUT /api/notifications/:id/read
const markRead = async (req, res, next) => {
  try {
    const n = await Notification.findOne({ where: { id: req.params.id, user_id: req.user.id } });
    if (!n) return res.status(404).json({ message: "Notification not found." });
    n.is_read = true;
    await n.save();
    res.json({ message: "Marked as read.", notification: n });
  } catch (error) { next(error); }
};

// @route PUT /api/notifications/mark-all-read
const markAllRead = async (req, res, next) => {
  try {
    await Notification.update({ is_read: true }, { where: { user_id: req.user.id, is_read: false } });
    res.json({ message: "All notifications marked as read." });
  } catch (error) { next(error); }
};

// @route DELETE /api/notifications/:id
const deleteNotification = async (req, res, next) => {
  try {
    const n = await Notification.findOne({ where: { id: req.params.id, user_id: req.user.id } });
    if (!n) return res.status(404).json({ message: "Notification not found." });
    await n.destroy();
    res.json({ message: "Notification deleted." });
  } catch (error) { next(error); }
};

// @route DELETE /api/notifications
const clearAll = async (req, res, next) => {
  try {
    await Notification.destroy({ where: { user_id: req.user.id } });
    res.json({ message: "All notifications cleared." });
  } catch (error) { next(error); }
};

module.exports = { getNotifications, markRead, markAllRead, deleteNotification, clearAll };

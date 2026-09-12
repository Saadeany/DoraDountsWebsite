const express = require("express");
const router = express.Router();
const { getNotifications, markRead, markAllRead, deleteNotification, clearAll } = require("../controllers/notificationController");
const { protect } = require("../middleware/auth");

router.use(protect);
router.get("/", getNotifications);
router.put("/mark-all-read", markAllRead);
router.put("/:id/read", markRead);
router.delete("/", clearAll);
router.delete("/:id", deleteNotification);

module.exports = router;

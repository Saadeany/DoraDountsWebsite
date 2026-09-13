const express = require("express");
const router = express.Router();
const { getActiveRushHour } = require("../controllers/rushHourController");

router.get("/active", getActiveRushHour);

module.exports = router;

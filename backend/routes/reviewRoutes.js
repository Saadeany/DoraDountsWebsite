const express = require("express");
const router = express.Router();
const { createReview, deleteReview } = require("../controllers/reviewController");
const { protect } = require("../middleware/auth");

router.use(protect);
router.post("/", createReview);
router.delete("/:id", deleteReview);

module.exports = router;

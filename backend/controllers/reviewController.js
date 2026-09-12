const { Review, Product, Order, OrderItem } = require("../models");

// @route POST /api/reviews
// Customers may only review products that appear in one of their own orders.
const createReview = async (req, res, next) => {
  try {
    const { product_id, rating, comment } = req.body;
    if (!product_id || !rating) {
      return res.status(400).json({ message: "Product ID and rating are required." });
    }
    if (rating < 1 || rating > 5) {
      return res.status(400).json({ message: "Rating must be between 1 and 5." });
    }

    const existing = await Review.findOne({ where: { user_id: req.user.id, product_id } });
    if (existing) return res.status(409).json({ message: "You already reviewed this product." });

    const purchased = await OrderItem.findOne({
      where: { product_id },
      include: [{ model: Order, where: { user_id: req.user.id, status: "delivered" } }],
    });
    if (!purchased) {
      return res.status(403).json({ message: "You can only review products you've purchased and received." });
    }

    const review = await Review.create({ user_id: req.user.id, product_id, rating, comment });
    res.status(201).json({ message: "Review submitted.", review });
  } catch (error) {
    next(error);
  }
};

// @route DELETE /api/reviews/:id
const deleteReview = async (req, res, next) => {
  try {
    const review = await Review.findOne({ where: { id: req.params.id, user_id: req.user.id } });
    if (!review) return res.status(404).json({ message: "Review not found." });
    await review.destroy();
    res.json({ message: "Review deleted." });
  } catch (error) {
    next(error);
  }
};

module.exports = { createReview, deleteReview };

const { Wishlist, Product, ProductImage } = require("../models");

// @route GET /api/wishlist
const getWishlist = async (req, res, next) => {
  try {
    const items = await Wishlist.findAll({
      where: { user_id: req.user.id },
      include: [
        {
          model: Product,
          attributes: ["id", "name", "slug", "price", "discount", "stock", "is_active"],
          include: [{ model: ProductImage, as: "images", attributes: ["image_url", "is_primary"], limit: 1 }],
        },
      ],
      order: [["createdAt", "DESC"]],
    });
    res.json({ items });
  } catch (error) {
    next(error);
  }
};

// @route POST /api/wishlist
const addToWishlist = async (req, res, next) => {
  try {
    const { product_id } = req.body;
    if (!product_id) return res.status(400).json({ message: "Product ID is required." });

    const existing = await Wishlist.findOne({ where: { user_id: req.user.id, product_id } });
    if (existing) return res.status(409).json({ message: "Already in wishlist." });

    const product = await Product.findByPk(product_id);
    if (!product) return res.status(404).json({ message: "Product not found." });

    const item = await Wishlist.create({ user_id: req.user.id, product_id });
    res.status(201).json({ message: "Added to wishlist.", item });
  } catch (error) {
    next(error);
  }
};

// @route DELETE /api/wishlist/:productId
const removeFromWishlist = async (req, res, next) => {
  try {
    const item = await Wishlist.findOne({
      where: { user_id: req.user.id, product_id: req.params.productId },
    });
    if (!item) return res.status(404).json({ message: "Item not found in wishlist." });
    await item.destroy();
    res.json({ message: "Removed from wishlist." });
  } catch (error) {
    next(error);
  }
};

module.exports = { getWishlist, addToWishlist, removeFromWishlist };

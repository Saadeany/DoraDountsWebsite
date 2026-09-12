const { Cart, Product, ProductImage } = require("../models");

const CART_INCLUDE = [
  {
    model: Product,
    attributes: ["id", "name", "slug", "price", "discount", "stock", "is_active"],
    include: [{ model: ProductImage, as: "images", attributes: ["image_url", "is_primary"], limit: 1 }],
  },
];

// @route GET /api/cart
const getCart = async (req, res, next) => {
  try {
    const items = await Cart.findAll({
      where: { user_id: req.user.id, saved_for_later: false },
      include: CART_INCLUDE,
      order: [["createdAt", "DESC"]],
    });

    let subtotal = 0;
    const enriched = items.map((item) => {
      const json = item.toJSON();
      const finalPrice = json.Product.price * (1 - (json.Product.discount || 0) / 100);
      const lineTotal = finalPrice * json.quantity;
      subtotal += lineTotal;
      return { ...json, final_price: parseFloat(finalPrice.toFixed(2)), line_total: parseFloat(lineTotal.toFixed(2)) };
    });

    res.json({ items: enriched, subtotal: parseFloat(subtotal.toFixed(2)) });
  } catch (error) {
    next(error);
  }
};

// @route GET /api/cart/saved
const getSavedForLater = async (req, res, next) => {
  try {
    const items = await Cart.findAll({
      where: { user_id: req.user.id, saved_for_later: true },
      include: CART_INCLUDE,
      order: [["createdAt", "DESC"]],
    });
    res.json({ items });
  } catch (error) {
    next(error);
  }
};

// @route POST /api/cart
const addToCart = async (req, res, next) => {
  try {
    const { product_id, size, color, quantity = 1 } = req.body;
    if (!product_id) return res.status(400).json({ message: "Product ID is required." });

    const product = await Product.findByPk(product_id);
    if (!product || !product.is_active) return res.status(404).json({ message: "Product not found." });

    if (product.stock < quantity) {
      return res.status(400).json({ message: `Only ${product.stock} unit(s) left in stock.` });
    }

    let cartItem = await Cart.findOne({
      where: { user_id: req.user.id, product_id, size: size || null, color: color || null, saved_for_later: false },
    });

    if (cartItem) {
      cartItem.quantity += parseInt(quantity, 10);
      await cartItem.save();
    } else {
      cartItem = await Cart.create({
        user_id: req.user.id,
        product_id,
        size: size || null,
        color: color || null,
        quantity,
      });
    }

    res.status(201).json({ message: "Added to cart.", item: cartItem });
  } catch (error) {
    next(error);
  }
};

// @route PUT /api/cart/:id
const updateCartItem = async (req, res, next) => {
  try {
    const { quantity } = req.body;
    const item = await Cart.findOne({ where: { id: req.params.id, user_id: req.user.id } });
    if (!item) return res.status(404).json({ message: "Cart item not found." });

    if (quantity < 1) return res.status(400).json({ message: "Quantity must be at least 1." });

    item.quantity = quantity;
    await item.save();
    res.json({ message: "Cart updated.", item });
  } catch (error) {
    next(error);
  }
};

// @route DELETE /api/cart/:id
const removeCartItem = async (req, res, next) => {
  try {
    const item = await Cart.findOne({ where: { id: req.params.id, user_id: req.user.id } });
    if (!item) return res.status(404).json({ message: "Cart item not found." });
    await item.destroy();
    res.json({ message: "Item removed from cart." });
  } catch (error) {
    next(error);
  }
};

// @route PUT /api/cart/:id/save-for-later
const toggleSaveForLater = async (req, res, next) => {
  try {
    const item = await Cart.findOne({ where: { id: req.params.id, user_id: req.user.id } });
    if (!item) return res.status(404).json({ message: "Cart item not found." });
    item.saved_for_later = !item.saved_for_later;
    await item.save();
    res.json({ message: item.saved_for_later ? "Saved for later." : "Moved back to cart.", item });
  } catch (error) {
    next(error);
  }
};

module.exports = { getCart, getSavedForLater, addToCart, updateCartItem, removeCartItem, toggleSaveForLater };

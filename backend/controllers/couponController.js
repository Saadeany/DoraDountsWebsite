const { Coupon, User } = require("../models");
const { Op } = require("sequelize");

// @route POST /api/coupons/validate
const validateCoupon = async (req, res, next) => {
  try {
    const { code, subtotal } = req.body;
    if (!code) return res.status(400).json({ message: "Coupon code is required." });

    const coupon = await Coupon.findOne({ where: { code: code.toUpperCase().trim() } });
    if (!coupon || !coupon.is_active) return res.status(404).json({ message: "Invalid coupon code." });

    // Personal coupons (Admin > Customers > Give a discount) only work for
    // the customer they were created for.
    if (coupon.user_id && coupon.user_id !== req.user.id) {
      return res.status(403).json({ message: "This coupon isn't valid for your account." });
    }

    const today = new Date().toISOString().slice(0, 10);
    if (today < coupon.start_date || today > coupon.expiry_date) {
      return res.status(400).json({ message: "This coupon has expired or is not yet active." });
    }
    if (coupon.times_used >= coupon.usage_limit) {
      return res.status(400).json({ message: "This coupon has reached its usage limit." });
    }
    // Minimum order check
    if (coupon.minimum_order_amount && subtotal !== undefined) {
      if (parseFloat(subtotal) < parseFloat(coupon.minimum_order_amount)) {
        return res.status(400).json({
          message: `This coupon requires a minimum order of ${parseFloat(coupon.minimum_order_amount).toLocaleString()} EGP. Your subtotal is ${parseFloat(subtotal).toLocaleString()} EGP.`,
          minimum_order_amount: coupon.minimum_order_amount,
        });
      }
    }

    res.json({ message: "Coupon applied.", coupon: { code: coupon.code, discount: coupon.discount, minimum_order_amount: coupon.minimum_order_amount } });
  } catch (error) { next(error); }
};

// @route GET /api/admin/coupons
const getCoupons = async (req, res, next) => {
  try {
    const coupons = await Coupon.findAll({
      include: [{ model: User, attributes: ["id", "first_name", "last_name", "email"] }],
      order: [["createdAt", "DESC"]],
    });
    res.json({ coupons });
  } catch (error) { next(error); }
};

// @route POST /api/admin/coupons
const createCoupon = async (req, res, next) => {
  try {
    const { code, discount, start_date, expiry_date, usage_limit, minimum_order_amount, user_id } = req.body;
    if (!code || !discount || !start_date || !expiry_date) {
      return res.status(400).json({ message: "Code, discount, start date, and expiry date are required." });
    }
    const existing = await Coupon.findOne({ where: { code: code.toUpperCase().trim() } });
    if (existing) return res.status(409).json({ message: "A coupon with this code already exists." });

    let targetUser = null;
    if (user_id) {
      targetUser = await User.findByPk(user_id);
      if (!targetUser) return res.status(400).json({ message: "That customer could not be found." });
    }

    const coupon = await Coupon.create({
      code: code.toUpperCase().trim(),
      discount,
      start_date,
      expiry_date,
      usage_limit: usage_limit || (targetUser ? 1 : 100),
      minimum_order_amount: minimum_order_amount ? parseFloat(minimum_order_amount) : null,
      user_id: targetUser ? targetUser.id : null,
    });
    res.status(201).json({ message: targetUser ? `Personal coupon created for ${targetUser.first_name}.` : "Coupon created.", coupon });
  } catch (error) { next(error); }
};

// @route PUT /api/admin/coupons/:id
const updateCoupon = async (req, res, next) => {
  try {
    const coupon = await Coupon.findByPk(req.params.id);
    if (!coupon) return res.status(404).json({ message: "Coupon not found." });

    const { discount, start_date, expiry_date, usage_limit, is_active, minimum_order_amount, user_id } = req.body;
    if (discount !== undefined)              coupon.discount = discount;
    if (start_date !== undefined)            coupon.start_date = start_date;
    if (expiry_date !== undefined)           coupon.expiry_date = expiry_date;
    if (usage_limit !== undefined)           coupon.usage_limit = usage_limit;
    if (is_active !== undefined)             coupon.is_active = is_active;
    if (minimum_order_amount !== undefined)  coupon.minimum_order_amount = minimum_order_amount ? parseFloat(minimum_order_amount) : null;
    if (user_id !== undefined)               coupon.user_id = user_id || null;

    await coupon.save();
    res.json({ message: "Coupon updated.", coupon });
  } catch (error) { next(error); }
};

// @route DELETE /api/admin/coupons/:id
const deleteCoupon = async (req, res, next) => {
  try {
    const coupon = await Coupon.findByPk(req.params.id);
    if (!coupon) return res.status(404).json({ message: "Coupon not found." });
    await coupon.destroy();
    res.json({ message: "Coupon deleted." });
  } catch (error) { next(error); }
};

module.exports = { validateCoupon, getCoupons, createCoupon, updateCoupon, deleteCoupon };

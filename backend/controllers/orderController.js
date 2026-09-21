const { sequelize, Order, OrderItem, Cart, Product, Coupon, User, Zone } = require("../models");
const generateOrderNumber = require("../utils/generateOrderNumber");
const { sendOrderConfirmationEmail, sendOrderStatusEmail, sendAdminNewOrderEmail, sendAdminLowStockEmail } = require("../utils/emailService");
const { notifyOrderConfirmed, notifyOrderStatus, notifyAdminNewOrder, notifyAdminLowStock } = require("../utils/notificationService");
const { getLiveRushHourDiscountMap, applyRushHourOverride } = require("../utils/rushHour");

const TAX_RATE       = parseFloat(process.env.TAX_RATE       || "0.14");
const FREE_SHIPPING_THRESHOLD = parseFloat(process.env.FREE_SHIPPING_THRESHOLD || "1500");
const LOW_STOCK_THRESHOLD     = parseInt(process.env.LOW_STOCK_THRESHOLD || "5", 10);

// Payment methods that require the customer to transfer money manually
// before the order can be processed (see emailService's transfer instructions).
const TRANSFER_METHODS = ["vodafone_cash", "instapay"];

const getAdminUser = () => User.findOne({ where: { role: "admin" } });

// Saves/updates the shipping address the customer just used onto their
// profile (User.addresses JSON) so it can be reused on future checkouts.
// Best-effort — never blocks or fails the order if something goes wrong here.
const saveShippingAddressToUser = async (user, addr) => {
  try {
    const existing = Array.isArray(user.addresses) ? [...user.addresses] : [];
    const matchIdx = existing.findIndex(
      (a) =>
        a.area === addr.area &&
        a.building_number === addr.building_number &&
        a.apartment_number === addr.apartment_number &&
        a.address === addr.address
    );

    let next;
    if (matchIdx >= 0) {
      const [match] = existing.splice(matchIdx, 1);
      next = [{ ...match, ...addr, is_default: true }, ...existing];
    } else {
      next = [{ ...addr, is_default: true }, ...existing];
    }
    next = next.map((a, i) => ({ ...a, is_default: i === 0 })).slice(0, 5);

    user.addresses = next;
    await user.save();
  } catch (err) {
    console.error("[Order] Failed to save address to user profile:", err.message);
  }
};

// @route POST /api/orders/checkout
const checkout = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const {
      shipping_full_name, shipping_phone, shipping_email,
      shipping_country, shipping_address,
      shipping_building, shipping_floor, shipping_apartment,
      shipping_lat, shipping_lng,
      zone_id,
      payment_method, coupon_code,
    } = req.body;

    if (!shipping_full_name || !shipping_phone || !shipping_email ||
        !shipping_country || !shipping_address || !payment_method) {
      await t.rollback();
      return res.status(400).json({ message: "All shipping fields and a payment method are required." });
    }

    if (!zone_id) {
      await t.rollback();
      return res.status(400).json({ message: "Please select a delivery area." });
    }

    if (!["cash_on_delivery", ...TRANSFER_METHODS].includes(payment_method)) {
      await t.rollback();
      return res.status(400).json({ message: "Invalid payment method." });
    }

    const zone = await Zone.findByPk(zone_id, { transaction: t });
    if (!zone) {
      await t.rollback();
      return res.status(400).json({ message: "The selected delivery area could not be found." });
    }
    if (!zone.is_deliverable) {
      await t.rollback();
      return res.status(400).json({ message: `We're sorry, we don't currently deliver to "${zone.name}".` });
    }

    if (!req.user.is_email_verified) {
      await t.rollback();
      return res.status(403).json({ message: "Please verify your email address before placing an order.", code: "EMAIL_NOT_VERIFIED" });
    }

    const cartItems = await Cart.findAll({
      where: { user_id: req.user.id, saved_for_later: false },
      include: [{ model: Product }],
      transaction: t,
    });
    if (cartItems.length === 0) { await t.rollback(); return res.status(400).json({ message: "Your cart is empty." }); }

    const rushHourMap = await getLiveRushHourDiscountMap();
    const effectiveDiscounts = {};
    cartItems.forEach((item) => {
      if (item.Product) {
        const json = item.Product.toJSON ? item.Product.toJSON() : item.Product;
        effectiveDiscounts[item.Product.id] = applyRushHourOverride(json, rushHourMap).discount;
      }
    });

    let subtotal = 0;
    for (const item of cartItems) {
      if (!item.Product || !item.Product.is_active) {
        await t.rollback();
        return res.status(400).json({ message: `"${item.Product?.name || "A product"}" is no longer available.` });
      }
      if (item.Product.stock < item.quantity) {
        await t.rollback();
        return res.status(400).json({ message: `Only ${item.Product.stock} unit(s) of "${item.Product.name}" left in stock.` });
      }
      subtotal += item.Product.price * (1 - effectiveDiscounts[item.Product.id] / 100) * item.quantity;
    }

    // Coupon
    let discountAmount = 0;
    let appliedCoupon = null;
    if (coupon_code) {
      const coupon = await Coupon.findOne({ where: { code: coupon_code.toUpperCase().trim() }, transaction: t });
      const today = new Date().toISOString().slice(0, 10);
      if (!coupon || !coupon.is_active || today < coupon.start_date || today > coupon.expiry_date || coupon.times_used >= coupon.usage_limit) {
        await t.rollback(); return res.status(400).json({ message: "Coupon code is invalid or expired." });
      }
      if (coupon.user_id && coupon.user_id !== req.user.id) {
        await t.rollback(); return res.status(403).json({ message: "This coupon isn't valid for your account." });
      }
      if (coupon.minimum_order_amount && subtotal < parseFloat(coupon.minimum_order_amount)) {
        await t.rollback();
        return res.status(400).json({ message: `This coupon requires a minimum order of ${coupon.minimum_order_amount} EGP.` });
      }
      discountAmount = subtotal * (coupon.discount / 100);
      appliedCoupon = coupon;
    }

    const taxable = subtotal - discountAmount;
    const tax = taxable * TAX_RATE;
    const shippingCost = taxable >= FREE_SHIPPING_THRESHOLD ? 0 : parseFloat(zone.shipping_price);
    const total = taxable + tax + shippingCost;

    const paymentStatus = TRANSFER_METHODS.includes(payment_method) ? "awaiting_transfer" : "pending";

    const order = await Order.create({
      order_number: generateOrderNumber(), user_id: req.user.id,
      subtotal: subtotal.toFixed(2), discount_amount: discountAmount.toFixed(2),
      coupon_code: appliedCoupon ? appliedCoupon.code : null,
      tax: tax.toFixed(2), shipping_cost: shippingCost.toFixed(2), total_amount: total.toFixed(2),
      payment_method, payment_status: paymentStatus,
      shipping_full_name, shipping_phone, shipping_email,
      shipping_country, shipping_city: "Cairo", shipping_address,
      zone_id: zone.id, shipping_area: zone.name,
      shipping_building: shipping_building || null,
      shipping_floor: shipping_floor || null,
      shipping_apartment: shipping_apartment || null,
      shipping_lat: shipping_lat || null,
      shipping_lng: shipping_lng || null,
    }, { transaction: t });

    const orderItemsData = [];
    const lowStockProducts = [];

    for (const item of cartItems) {
      const fp = item.Product.price * (1 - effectiveDiscounts[item.Product.id] / 100);
      const oi = await OrderItem.create({
        order_id: order.id, product_id: item.Product.id, product_name: item.Product.name,
        quantity: item.quantity, price: fp.toFixed(2),
      }, { transaction: t });
      orderItemsData.push(oi);

      item.Product.stock -= item.quantity;
      await item.Product.save({ transaction: t });

      if (item.Product.stock <= LOW_STOCK_THRESHOLD) lowStockProducts.push(item.Product);
    }

    if (appliedCoupon) { appliedCoupon.times_used += 1; await appliedCoupon.save({ transaction: t }); }
    await Cart.destroy({ where: { user_id: req.user.id, saved_for_later: false }, transaction: t });
    await t.commit();

    await saveShippingAddressToUser(req.user, {
      label: "Recent",
      full_name: shipping_full_name,
      phone: shipping_phone,
      city: "Cairo",
      area: zone.name,
      building_number: shipping_building || "",
      floor: shipping_floor || "",
      apartment_number: shipping_apartment || "",
      address: shipping_address,
      latitude: shipping_lat || null,
      longitude: shipping_lng || null,
    });

    const fullOrder = await Order.findByPk(order.id, { include: [{ model: OrderItem, as: "items" }] });

    sendOrderConfirmationEmail(req.user, fullOrder, fullOrder.items).catch(() => {});
    notifyOrderConfirmed(req.user.id, fullOrder).catch(() => {});
    getAdminUser().then((admin) => {
      if (!admin) return;
      sendAdminNewOrderEmail(fullOrder, req.user, fullOrder.items).catch(() => {});
      notifyAdminNewOrder(admin.id, fullOrder, req.user).catch(() => {});
      if (lowStockProducts.length > 0) {
        sendAdminLowStockEmail(lowStockProducts).catch(() => {});
        lowStockProducts.forEach((p) => notifyAdminLowStock(admin.id, p).catch(() => {}));
      }
    }).catch(() => {});

    res.status(201).json({ message: "Order placed successfully.", order: fullOrder });
  } catch (error) { await t.rollback(); next(error); }
};

// @route GET /api/orders/my-orders
const getMyOrders = async (req, res, next) => {
  try {
    const orders = await Order.findAll({
      where: { user_id: req.user.id },
      include: [{ model: OrderItem, as: "items" }],
      order: [["createdAt", "DESC"]],
    });
    res.json({ orders });
  } catch (error) { next(error); }
};

// @route GET /api/orders/:id
const getOrderById = async (req, res, next) => {
  try {
    const where = { id: req.params.id };
    if (req.user.role !== "admin") where.user_id = req.user.id;
    const order = await Order.findOne({
      where,
      include: [{ model: OrderItem, as: "items" }, { model: User, attributes: ["id","first_name","last_name","email"] }],
    });
    if (!order) return res.status(404).json({ message: "Order not found." });
    res.json({ order });
  } catch (error) { next(error); }
};

// @route GET /api/admin/orders
const getAllOrders = async (req, res, next) => {
  try {
    const { status, search, page = 1, limit = 20 } = req.query;
    const where = {};
    if (status) where.status = status;
    const { Op } = require("sequelize");
    if (search) {
      where[Op.or] = [
        { order_number: { [Op.like]: `%${search}%` } },
        { shipping_full_name: { [Op.like]: `%${search}%` } },
        { shipping_email: { [Op.like]: `%${search}%` } },
        { shipping_phone: { [Op.like]: `%${search}%` } },
      ];
    }
    const pageNum = Math.max(parseInt(page, 10) || 1, 1);
    const limitNum = Math.min(parseInt(limit, 10) || 20, 100);
    const { count, rows } = await Order.findAndCountAll({
      where,
      include: [
        { model: OrderItem, as: "items" },
        { model: User, attributes: ["id","first_name","last_name","email"] },
      ],
      order: [["createdAt","DESC"]], limit: limitNum, offset: (pageNum - 1) * limitNum, distinct: true,
    });
    res.json({ orders: rows, pagination: { total: count, page: pageNum, limit: limitNum, total_pages: Math.ceil(count / limitNum) } });
  } catch (error) { next(error); }
};

// @route PUT /api/admin/orders/:id/status
const updateOrderStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const validStatuses = ["pending","processing","shipped","delivered","cancelled"];
    if (!validStatuses.includes(status)) return res.status(400).json({ message: "Invalid status value." });

    const order = await Order.findByPk(req.params.id, { include: [{ model: OrderItem, as: "items" }] });
    if (!order) return res.status(404).json({ message: "Order not found." });

    if (status === "cancelled" && order.status !== "cancelled") {
      for (const item of order.items) {
        await Product.increment("stock", { by: item.quantity, where: { id: item.product_id } });
      }
    }

    order.status = status;
    await order.save();

    const customer = await User.findByPk(order.user_id);
    if (customer) {
      sendOrderStatusEmail(customer, order).catch(() => {});
      notifyOrderStatus(customer.id, order).catch(() => {});
    }

    res.json({ message: "Order status updated.", order });
  } catch (error) { next(error); }
};

// @route PUT /api/admin/orders/:id/payment-status
const updateOrderPaymentStatus = async (req, res, next) => {
  try {
    const { payment_status } = req.body;
    const validStatuses = ["pending", "awaiting_transfer", "paid", "failed", "refunded"];
    if (!validStatuses.includes(payment_status)) {
      return res.status(400).json({ message: "Invalid payment status value." });
    }

    const order = await Order.findByPk(req.params.id);
    if (!order) return res.status(404).json({ message: "Order not found." });

    order.payment_status = payment_status;
    await order.save();

    res.json({ message: "Payment status updated.", order });
  } catch (error) { next(error); }
};

module.exports = { checkout, getMyOrders, getOrderById, getAllOrders, updateOrderStatus, updateOrderPaymentStatus };
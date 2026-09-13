const { Op } = require("sequelize");
const { sequelize, RushHour, Product, ProductImage } = require("../models");
const { getLiveRushHour, getWindowEndsAt } = require("../utils/rushHour");

const RUSH_HOUR_PRODUCT_INCLUDE = {
  model: Product,
  as: "products",
  attributes: ["id", "name", "slug", "price", "discount"],
  through: { attributes: [] },
};

const validateSchedule = (body) => {
  const { schedule_type, start_time, end_time, start_at, end_at } = body;
  if (!["recurring_daily", "one_off"].includes(schedule_type)) {
    return "Schedule type must be 'recurring_daily' or 'one_off'.";
  }
  if (schedule_type === "recurring_daily") {
    if (!start_time || !end_time) return "Start time and end time are required for a daily rush hour.";
  } else {
    if (!start_at || !end_at) return "Start and end date/time are required for a one-off rush hour.";
    if (new Date(end_at) <= new Date(start_at)) return "End time must be after start time.";
  }
  return null;
};

const buildScheduleFields = (body) => {
  if (body.schedule_type === "recurring_daily") {
    return { start_time: body.start_time, end_time: body.end_time, start_at: null, end_at: null };
  }
  return { start_time: null, end_time: null, start_at: body.start_at, end_at: body.end_at };
};

// "Only one active at a time" — flipping one Rush Hour on automatically
// turns any other one off, rather than rejecting the request. Simpler for
// the admin than a hard error, and there's no ambiguity about which one wins.
const deactivateOthers = (excludeId, t) =>
  RushHour.update(
    { is_active: false },
    { where: excludeId ? { id: { [Op.ne]: excludeId } } : {}, transaction: t }
  );

// @route GET /api/admin/rush-hours (admin only)
const getAdminRushHours = async (req, res, next) => {
  try {
    const rushHours = await RushHour.findAll({
      include: [RUSH_HOUR_PRODUCT_INCLUDE],
      order: [["createdAt", "DESC"]],
    });
    res.json({ rush_hours: rushHours });
  } catch (error) { next(error); }
};

// @route POST /api/admin/rush-hours (admin only)
const createRushHour = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const { name, discount_percent, product_ids, is_active } = req.body;
    if (!name || !discount_percent) {
      await t.rollback();
      return res.status(400).json({ message: "Name and discount percentage are required." });
    }

    const scheduleError = validateSchedule(req.body);
    if (scheduleError) { await t.rollback(); return res.status(400).json({ message: scheduleError }); }

    const ids = Array.isArray(product_ids) ? product_ids : [];
    if (ids.length === 0) {
      await t.rollback();
      return res.status(400).json({ message: "Select at least one product for this rush hour." });
    }

    const rushHour = await RushHour.create({
      name,
      discount_percent,
      schedule_type: req.body.schedule_type,
      is_active: !!is_active,
      ...buildScheduleFields(req.body),
    }, { transaction: t });

    await rushHour.setProducts(ids, { transaction: t });
    if (rushHour.is_active) await deactivateOthers(rushHour.id, t);

    await t.commit();
    const full = await RushHour.findByPk(rushHour.id, { include: [RUSH_HOUR_PRODUCT_INCLUDE] });
    res.status(201).json({ message: "Rush Hour created.", rush_hour: full });
  } catch (error) { await t.rollback(); next(error); }
};

// @route PUT /api/admin/rush-hours/:id (admin only)
const updateRushHour = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const rushHour = await RushHour.findByPk(req.params.id, { transaction: t });
    if (!rushHour) { await t.rollback(); return res.status(404).json({ message: "Rush Hour not found." }); }

    const { name, discount_percent, product_ids, is_active } = req.body;

    if (req.body.schedule_type) {
      const scheduleError = validateSchedule({
        schedule_type: req.body.schedule_type,
        start_time: req.body.start_time ?? rushHour.start_time,
        end_time: req.body.end_time ?? rushHour.end_time,
        start_at: req.body.start_at ?? rushHour.start_at,
        end_at: req.body.end_at ?? rushHour.end_at,
      });
      if (scheduleError) { await t.rollback(); return res.status(400).json({ message: scheduleError }); }
      Object.assign(rushHour, buildScheduleFields(req.body));
    }

    if (name !== undefined) rushHour.name = name;
    if (discount_percent !== undefined) rushHour.discount_percent = discount_percent;
    if (is_active !== undefined) rushHour.is_active = is_active;

    await rushHour.save({ transaction: t });

    if (Array.isArray(product_ids)) {
      if (product_ids.length === 0) {
        await t.rollback();
        return res.status(400).json({ message: "Select at least one product for this rush hour." });
      }
      await rushHour.setProducts(product_ids, { transaction: t });
    }

    if (rushHour.is_active) await deactivateOthers(rushHour.id, t);

    await t.commit();
    const full = await RushHour.findByPk(rushHour.id, { include: [RUSH_HOUR_PRODUCT_INCLUDE] });
    res.json({ message: "Rush Hour updated.", rush_hour: full });
  } catch (error) { await t.rollback(); next(error); }
};

// @route DELETE /api/admin/rush-hours/:id (admin only)
const deleteRushHour = async (req, res, next) => {
  try {
    const rushHour = await RushHour.findByPk(req.params.id);
    if (!rushHour) return res.status(404).json({ message: "Rush Hour not found." });
    await rushHour.destroy();
    res.json({ message: "Rush Hour deleted." });
  } catch (error) { next(error); }
};

// @route GET /api/rush-hour/active (public — powers the storefront banner)
const getActiveRushHour = async (req, res, next) => {
  try {
    const live = await getLiveRushHour();
    if (!live) return res.json({ active: false });

    const productIds = live.products.map((p) => p.id);
    const products = productIds.length
      ? await Product.findAll({
          where: { id: { [Op.in]: productIds }, is_active: true },
          include: [{ model: ProductImage, as: "images", attributes: ["image_url", "is_primary"], limit: 1 }],
        })
      : [];

    res.json({
      active: true,
      rush_hour: {
        id: live.id,
        name: live.name,
        discount_percent: parseFloat(live.discount_percent),
        ends_at: getWindowEndsAt(live),
      },
      products: products.map((p) => ({
        id: p.id,
        name: p.name,
        slug: p.slug,
        price: p.price,
        // Only products with no existing discount actually get the rush
        // hour price — mirrors the rule enforced on checkout/product reads.
        discount: parseFloat(p.discount) === 0 ? parseFloat(live.discount_percent) : parseFloat(p.discount),
        images: p.images,
      })),
    });
  } catch (error) { next(error); }
};

module.exports = { getAdminRushHours, createRushHour, updateRushHour, deleteRushHour, getActiveRushHour };

const { Zone, Order } = require("../models");

// @route GET /api/zones  (public — powers the checkout "Area" dropdown)
const getZones = async (req, res, next) => {
  try {
    const zones = await Zone.findAll({ order: [["sort_order", "ASC"], ["name", "ASC"]] });
    res.json({ zones });
  } catch (error) {
    next(error);
  }
};

// @route GET /api/admin/zones (admin only)
const getAdminZones = async (req, res, next) => {
  try {
    const zones = await Zone.findAll({ order: [["sort_order", "ASC"], ["name", "ASC"]] });
    res.json({ zones });
  } catch (error) {
    next(error);
  }
};

// @route POST /api/admin/zones (admin only)
const createZone = async (req, res, next) => {
  try {
    const { name, shipping_price, is_deliverable, sort_order } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ message: "Zone name is required." });

    const existing = await Zone.findOne({ where: { name: name.trim() } });
    if (existing) return res.status(409).json({ message: "A zone with this name already exists." });

    const zone = await Zone.create({
      name: name.trim(),
      shipping_price: shipping_price ?? 0,
      is_deliverable: is_deliverable ?? true,
      sort_order: sort_order ?? 0,
    });
    res.status(201).json({ message: "Zone created.", zone });
  } catch (error) {
    next(error);
  }
};

// @route PUT /api/admin/zones/:id (admin only)
const updateZone = async (req, res, next) => {
  try {
    const zone = await Zone.findByPk(req.params.id);
    if (!zone) return res.status(404).json({ message: "Zone not found." });

    const { name, shipping_price, is_deliverable, sort_order } = req.body;
    if (name !== undefined && name.trim()) zone.name = name.trim();
    if (shipping_price !== undefined) zone.shipping_price = shipping_price;
    if (is_deliverable !== undefined) zone.is_deliverable = is_deliverable;
    if (sort_order !== undefined) zone.sort_order = sort_order;

    await zone.save();
    res.json({ message: "Zone updated.", zone });
  } catch (error) {
    next(error);
  }
};

// @route DELETE /api/admin/zones/:id (admin only)
const deleteZone = async (req, res, next) => {
  try {
    const zone = await Zone.findByPk(req.params.id);
    if (!zone) return res.status(404).json({ message: "Zone not found." });

    // Past orders keep a text snapshot (shipping_area), so unlinking here
    // never corrupts order history — it only removes the option going forward.
    await Order.update({ zone_id: null }, { where: { zone_id: zone.id } });
    await zone.destroy();
    res.json({ message: "Zone deleted." });
  } catch (error) {
    next(error);
  }
};

module.exports = { getZones, getAdminZones, createZone, updateZone, deleteZone };

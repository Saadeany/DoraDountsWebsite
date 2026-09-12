const { Size, Color } = require("../models");

// @route GET /api/meta/filters
// Returns the full list of sizes and colors so the Shop page can render filter checkboxes.
const getFilterOptions = async (req, res, next) => {
  try {
    const [sizes, colors] = await Promise.all([
      Size.findAll({ order: [["sort_order", "ASC"]] }),
      Color.findAll({ order: [["name", "ASC"]] }),
    ]);
    res.json({ sizes, colors });
  } catch (error) {
    next(error);
  }
};

module.exports = { getFilterOptions };

const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/db");

// A time-limited, admin-picked discount on selected products. Only one
// Rush Hour can be `is_active` at a time (enforced in the controller), and
// it only discounts products that don't already have their own discount —
// it never overrides a product's existing sale price.
const RushHour = sequelize.define(
  "RushHour",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: { notEmpty: true },
    },
    discount_percent: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
      validate: { min: 0, max: 100 },
    },
    schedule_type: {
      type: DataTypes.ENUM("recurring_daily", "one_off"),
      allowNull: false,
    },
    // ── recurring_daily fields — time-of-day only, repeats every day ──────
    start_time: { type: DataTypes.TIME, allowNull: true },
    end_time: { type: DataTypes.TIME, allowNull: true },
    // ── one_off fields — a specific date + time window, runs once ─────────
    start_at: { type: DataTypes.DATE, allowNull: true },
    end_at: { type: DataTypes.DATE, allowNull: true },
    // Master on/off switch. Even when true, the discount only actually
    // applies while the current moment falls inside the schedule above.
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
  },
  { tableName: "rush_hours" }
);

module.exports = RushHour;
const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/db");

const Coupon = sequelize.define(
  "Coupon",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    code: { type: DataTypes.STRING(50), allowNull: false, unique: true },
    discount: {
      // percentage 0-100
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
      validate: { min: 0, max: 100 },
    },
    start_date: { type: DataTypes.DATEONLY, allowNull: false },
    expiry_date: { type: DataTypes.DATEONLY, allowNull: false },
    usage_limit: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 100 },
    times_used: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    minimum_order_amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      defaultValue: null,
      comment: "Minimum cart subtotal required to use this coupon",
    },
    // When set, only this customer can redeem the coupon — used by
    // Admin > Customers "Give a discount" to reward a specific loyal
    // customer rather than issuing a store-wide code.
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: "users", key: "id" },
    },
    is_active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  },
  { tableName: "coupons" }
);

module.exports = Coupon;

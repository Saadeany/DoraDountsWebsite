const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/db");

const RushHourProduct = sequelize.define(
  "RushHourProduct",
  {
    rush_hour_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      references: { model: "rush_hours", key: "id" },
    },
    product_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      references: { model: "products", key: "id" },
    },
  },
  { tableName: "rush_hour_products", timestamps: false }
);

module.exports = RushHourProduct;

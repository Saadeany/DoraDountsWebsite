const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/db");

const ProductColor = sequelize.define(
  "ProductColor",
  {
    product_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      references: { model: "products", key: "id" },
    },
    color_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      references: { model: "colors", key: "id" },
    },
  },
  { tableName: "product_colors", timestamps: false }
);

module.exports = ProductColor;

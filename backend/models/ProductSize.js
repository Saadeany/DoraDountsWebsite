const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/db");

const ProductSize = sequelize.define(
  "ProductSize",
  {
    product_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      references: { model: "products", key: "id" },
    },
    size_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      references: { model: "sizes", key: "id" },
    },
    stock: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  },
  { tableName: "product_sizes", timestamps: false }
);

module.exports = ProductSize;

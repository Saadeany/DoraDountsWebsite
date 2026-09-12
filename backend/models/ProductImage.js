const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/db");

const ProductImage = sequelize.define(
  "ProductImage",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    product_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: "products", key: "id" },
    },
    image_url: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    is_primary: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    sort_order: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
  },
  { tableName: "product_images" }
);

module.exports = ProductImage;

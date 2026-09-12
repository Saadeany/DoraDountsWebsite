const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/db");

const Product = sequelize.define(
  "Product",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    name: {
      type: DataTypes.STRING(150),
      allowNull: false,
      validate: { notEmpty: true },
    },
    slug: {
      type: DataTypes.STRING(180),
      allowNull: false,
      unique: true,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: { min: 0 },
    },
    discount: {
      // percentage 0-100
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
      defaultValue: 0,
      validate: { min: 0, max: 100 },
    },
    stock: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: { min: 0 },
    },
    category_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: "categories", key: "id" },
    },
    material: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    brand: {
      type: DataTypes.STRING(100),
      allowNull: true,
      defaultValue: "Felt & Form",
    },
    gender: {
      type: DataTypes.ENUM("men", "women", "unisex"),
      allowNull: false,
      defaultValue: "unisex",
    },
    tags: {
      // JSON array, e.g. ["new", "best_seller", "trending", "sale"]
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: [],
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
  },
  {
    tableName: "products",
    indexes: [
      { fields: ["category_id"] },
      { fields: ["price"] },
      { fields: ["name"] },
    ],
  }
);

module.exports = Product;

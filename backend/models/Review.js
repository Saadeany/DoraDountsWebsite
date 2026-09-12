const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/db");

const Review = sequelize.define(
  "Review",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: "users", key: "id" },
    },
    product_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: "products", key: "id" },
    },
    rating: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: { min: 1, max: 5 },
    },
    comment: { type: DataTypes.TEXT, allowNull: true },
  },
  {
    tableName: "reviews",
    indexes: [{ unique: true, fields: ["user_id", "product_id"] }],
  }
);

module.exports = Review;

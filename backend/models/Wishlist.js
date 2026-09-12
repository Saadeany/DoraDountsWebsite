const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/db");

const Wishlist = sequelize.define(
  "Wishlist",
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
  },
  {
    tableName: "wishlist",
    indexes: [{ unique: true, fields: ["user_id", "product_id"] }],
  }
);

module.exports = Wishlist;

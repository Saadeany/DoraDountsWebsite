const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/db");

const Cart = sequelize.define(
  "Cart",
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
    size: { type: DataTypes.STRING(20), allowNull: true },
    color: { type: DataTypes.STRING(30), allowNull: true },
    quantity: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
    saved_for_later: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  },
  {
    tableName: "cart",
    indexes: [{ unique: true, fields: ["user_id", "product_id", "size", "color"] }],
  }
);

module.exports = Cart;

const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/db");

const Notification = sequelize.define(
  "Notification",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: "users", key: "id" },
    },
    title: { type: DataTypes.STRING(150), allowNull: false },
    message: { type: DataTypes.TEXT, allowNull: false },
    type: {
      // order_* = customer order events; promo/coupon = marketing;
      // admin_* = admin-only alerts. admin_new_return covers both new
      // return AND cancellation requests — it's what drives the red dot
      // on the "Returns" tab in the admin sidebar.
      type: DataTypes.ENUM(
        "order_confirmed", "order_processing", "order_shipped",
        "order_delivered", "order_cancelled",
        "promo", "coupon",
        "admin_new_order", "admin_low_stock", "admin_new_user", "admin_contact",
        "admin_new_return"
      ),
      allowNull: false,
      defaultValue: "promo",
    },
    is_read: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    meta: {
      // optional JSON blob: { order_id, order_number, product_id, etc. }
      type: DataTypes.JSON,
      allowNull: true,
    },
  },
  { tableName: "notifications", updatedAt: false }
);

module.exports = Notification;

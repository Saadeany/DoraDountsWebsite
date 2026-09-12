const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/db");

const Order = sequelize.define(
  "Order",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    order_number: { type: DataTypes.STRING(20), allowNull: false, unique: true },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: "users", key: "id" },
    },
    subtotal: { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0 },
    discount_amount: { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0 },
    coupon_code: { type: DataTypes.STRING(50), allowNull: true },
    tax: { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0 },
    shipping_cost: { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0 },
    total_amount: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    status: {
      type: DataTypes.ENUM("pending", "processing", "shipped", "delivered", "cancelled"),
      allowNull: false,
      defaultValue: "pending",
    },
    // Credit card removed — the store only supports COD and manual transfer
    // (Vodafone Cash / InstaPay), confirmed by the admin after the customer
    // sends a WhatsApp screenshot of the transfer.
    payment_method: {
      type: DataTypes.ENUM("cash_on_delivery", "vodafone_cash", "instapay"),
      allowNull: false,
    },
    // "awaiting_transfer" = customer chose Vodafone Cash / InstaPay and the
    // order is on hold until an admin confirms the money actually arrived.
    payment_status: {
      type: DataTypes.ENUM("pending", "awaiting_transfer", "paid", "failed", "refunded"),
      allowNull: false,
      defaultValue: "pending",
    },
    shipping_full_name: { type: DataTypes.STRING(100), allowNull: false },
    shipping_phone: { type: DataTypes.STRING(20), allowNull: false },
    shipping_email: { type: DataTypes.STRING(150), allowNull: false },
    shipping_country: { type: DataTypes.STRING(100), allowNull: false },
    // Always "Cairo" today (enforced by the frontend), kept as a free field
    // in case the store ever expands to other cities.
    shipping_city: { type: DataTypes.STRING(100), allowNull: false },
    shipping_address: { type: DataTypes.STRING(255), allowNull: false },

    // ── Delivery zone / extended address (new) ────────────────────────────
    zone_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: "zones", key: "id" },
    },
    // Snapshot of the zone name at order time — survives the zone being
    // renamed or deleted later.
    shipping_area: { type: DataTypes.STRING(100), allowNull: true },
    shipping_building: { type: DataTypes.STRING(50), allowNull: true },
    shipping_floor: { type: DataTypes.STRING(20), allowNull: true },
    shipping_apartment: { type: DataTypes.STRING(20), allowNull: true },
    // Optional pin dropped by the customer (browser geolocation). Nullable —
    // most orders won't have this.
    shipping_lat: { type: DataTypes.DECIMAL(10, 7), allowNull: true },
    shipping_lng: { type: DataTypes.DECIMAL(10, 7), allowNull: true },
  },
  { tableName: "orders" }
);

module.exports = Order;

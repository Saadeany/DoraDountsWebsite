const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/db");

// Delivery zones — the "Area" the customer picks at checkout (e.g. Nasr City,
// Masr El Gedida, Zahraa). Each order snapshots the zone name + price into
// Order.shipping_area / Order.shipping_cost at checkout time, so editing or
// deleting a zone later never rewrites the history of past orders.
const Zone = sequelize.define(
  "Zone",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
      validate: { notEmpty: true },
    },
    shipping_price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
      validate: { min: 0 },
    },
    // When false, this area is shown to customers as "not currently
    // deliverable" and checkout is blocked server-side even if the client
    // is tampered with.
    is_deliverable: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    sort_order: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
  },
  { tableName: "zones" }
);

module.exports = Zone;

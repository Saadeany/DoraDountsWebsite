const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/db");

const ReturnRequest = sequelize.define("ReturnRequest", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  request_number: { type: DataTypes.STRING(25), allowNull: false, unique: true },
  order_id: { type: DataTypes.INTEGER, allowNull: false, references: { model:"orders", key:"id" } },
  user_id:  { type: DataTypes.INTEGER, allowNull: false, references: { model:"users",  key:"id" } },

  type: {
    type: DataTypes.ENUM("cancellation", "return", "exchange"),
    allowNull: false,
  },

  // ── What the customer says ─────────────────────────────────────────────
  reason: {
    type: DataTypes.ENUM(
      // Cancellation reasons
      "changed_mind",
      "found_better_price",
      "duplicate_order",
      "wrong_item_ordered",
      "delivery_too_slow",
      // Return/exchange reasons
      "item_damaged",
      "item_defective",
      "wrong_item_received",
      "wrong_size",
      "wrong_color",
      "item_not_as_described",
      "quality_not_acceptable",
      "missing_parts",
      "other"
    ),
    allowNull: false,
  },
  description: { type: DataTypes.TEXT, allowNull: true },

  // Items involved (JSON: [{ order_item_id, product_name, size, color, quantity, reason }])
  items: { type: DataTypes.JSON, allowNull: false, defaultValue: [] },

  // ── Evidence ──────────────────────────────────────────────────────────
  // Array of uploaded image paths
  images: { type: DataTypes.JSON, allowNull: true, defaultValue: [] },

  // ── Workflow status ────────────────────────────────────────────────────
  status: {
    type: DataTypes.ENUM(
      "pending",    // just submitted, waiting for admin review
      "reviewing",  // admin opened it
      "approved",   // admin approved — refund/exchange in progress
      "rejected",   // admin rejected with reason
      "refunded",   // money returned
      "exchanged",  // replacement shipped
      "closed"      // completed / no further action
    ),
    allowNull: false,
    defaultValue: "pending",
  },

  // ── Admin fields ───────────────────────────────────────────────────────
  admin_notes: { type: DataTypes.TEXT, allowNull: true },
  rejection_reason: { type: DataTypes.TEXT, allowNull: true },

  refund_amount: { type: DataTypes.DECIMAL(10,2), allowNull: true },
  refund_method: {
    type: DataTypes.ENUM("original_payment", "store_credit", "bank_transfer"),
    allowNull: true,
  },
  refund_reference: { type: DataTypes.STRING(100), allowNull: true }, // bank/payment ref

  reviewed_by: { type: DataTypes.INTEGER, allowNull: true, references: { model:"users", key:"id" } },
  reviewed_at: { type: DataTypes.DATE, allowNull: true },
  resolved_at: { type: DataTypes.DATE, allowNull: true },
}, {
  tableName: "return_requests",
  indexes: [
    { fields: ["order_id"] },
    { fields: ["user_id"] },
    { fields: ["status"] },
  ],
});

module.exports = ReturnRequest;

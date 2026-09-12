const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/db");

const EmailLog = sequelize.define(
  "EmailLog",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: "users", key: "id" },
    },
    email_type: {
      type: DataTypes.ENUM(
        "welcome", "verify_email", "password_reset",
        "order_confirmation", "order_status_update",
        "admin_new_order", "admin_low_stock", "admin_new_user", "admin_contact"
      ),
      allowNull: false,
    },
    recipient: { type: DataTypes.STRING(150), allowNull: false },
    subject: { type: DataTypes.STRING(255), allowNull: false },
    status: {
      type: DataTypes.ENUM("sent", "failed"),
      allowNull: false,
      defaultValue: "sent",
    },
    error_message: { type: DataTypes.TEXT, allowNull: true },
    sent_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  },
  { tableName: "email_logs", timestamps: false }
);

module.exports = EmailLog;

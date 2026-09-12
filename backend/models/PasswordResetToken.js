const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/db");

const PasswordResetToken = sequelize.define(
  "PasswordResetToken",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: "users", key: "id" },
    },
    token: {
      type: DataTypes.STRING(128),
      allowNull: false,
      unique: true,
    },
    expires_at: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    used_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  { tableName: "password_reset_tokens", updatedAt: false }
);

module.exports = PasswordResetToken;

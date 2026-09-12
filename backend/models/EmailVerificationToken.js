const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/db");

const EmailVerificationToken = sequelize.define(
  "EmailVerificationToken",
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
  { tableName: "email_verification_tokens", updatedAt: false }
);

module.exports = EmailVerificationToken;

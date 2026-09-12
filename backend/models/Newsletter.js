const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/db");

const Newsletter = sequelize.define(
  "Newsletter",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    email: { type: DataTypes.STRING(150), allowNull: false, unique: true, validate: { isEmail: true } },
  },
  { tableName: "newsletter", timestamps: false }
);

module.exports = Newsletter;

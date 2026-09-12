const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/db");

const Size = sequelize.define(
  "Size",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    name: { type: DataTypes.STRING(20), allowNull: false, unique: true },
    sort_order: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  },
  { tableName: "sizes", timestamps: false }
);

module.exports = Size;

const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/db");

const User = sequelize.define(
  "User",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    first_name: {
      type: DataTypes.STRING(50),
      allowNull: false,
      validate: { notEmpty: true, len: [1, 50] },
    },
    last_name: {
      type: DataTypes.STRING(50),
      allowNull: false,
      validate: { notEmpty: true, len: [1, 50] },
    },
    email: {
      type: DataTypes.STRING(150),
      allowNull: false,
      unique: true,
      validate: { isEmail: true },
    },
    password: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    phone: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    role: {
      type: DataTypes.ENUM("customer", "admin"),
      allowNull: false,
      defaultValue: "customer",
    },
    profile_image: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    is_email_verified: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    is_blocked: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    addresses: {
      // JSON array of saved addresses: [{label, full_name, phone, country, city, address, is_default}]
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: [],
    },
  },
  {
    tableName: "users",
    defaultScope: {
      attributes: { exclude: ["password"] },
    },
    scopes: {
      withPassword: { attributes: {} },
    },
  }
);

module.exports = User;

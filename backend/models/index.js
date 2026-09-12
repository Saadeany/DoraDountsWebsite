const { sequelize } = require("../config/db");

const User = require("./User");
const Category = require("./Category");
const Product = require("./Product");
const ProductImage = require("./ProductImage");
const Size = require("./Size");
const Color = require("./Color");
const ProductSize = require("./ProductSize");
const ProductColor = require("./ProductColor");
const Order = require("./Order");
const OrderItem = require("./OrderItem");
const Wishlist = require("./Wishlist");
const Cart = require("./Cart");
const Coupon = require("./Coupon");
const Review = require("./Review");
const Newsletter = require("./Newsletter");
const EmailVerificationToken = require("./EmailVerificationToken");
const PasswordResetToken = require("./PasswordResetToken");
const Notification = require("./Notification");
const EmailLog = require("./EmailLog");
const Zone = require("./Zone");

// Category <-> Product
Category.hasMany(Product, { foreignKey: "category_id", onDelete: "SET NULL" });
Product.belongsTo(Category, { foreignKey: "category_id" });

// Product <-> ProductImage
Product.hasMany(ProductImage, { foreignKey: "product_id", as: "images", onDelete: "CASCADE" });
ProductImage.belongsTo(Product, { foreignKey: "product_id" });

// Product <-> Size (M2M)
Product.belongsToMany(Size, { through: ProductSize, foreignKey: "product_id", otherKey: "size_id", as: "sizes" });
Size.belongsToMany(Product, { through: ProductSize, foreignKey: "size_id", otherKey: "product_id" });
ProductSize.belongsTo(Size, { foreignKey: "size_id" });
ProductSize.belongsTo(Product, { foreignKey: "product_id" });
Size.hasMany(ProductSize, { foreignKey: "size_id" });
Product.hasMany(ProductSize, { foreignKey: "product_id" });

// Product <-> Color (M2M)
Product.belongsToMany(Color, { through: ProductColor, foreignKey: "product_id", otherKey: "color_id", as: "colors" });
Color.belongsToMany(Product, { through: ProductColor, foreignKey: "color_id", otherKey: "product_id" });

// User <-> Order
User.hasMany(Order, { foreignKey: "user_id", onDelete: "CASCADE" });
Order.belongsTo(User, { foreignKey: "user_id" });

// Zone <-> Order
Zone.hasMany(Order, { foreignKey: "zone_id", onDelete: "SET NULL" });
Order.belongsTo(Zone, { foreignKey: "zone_id" });

// Order <-> OrderItem
Order.hasMany(OrderItem, { foreignKey: "order_id", as: "items", onDelete: "CASCADE" });
OrderItem.belongsTo(Order, { foreignKey: "order_id" });
Product.hasMany(OrderItem, { foreignKey: "product_id" });
OrderItem.belongsTo(Product, { foreignKey: "product_id" });

// User <-> Wishlist <-> Product
User.hasMany(Wishlist, { foreignKey: "user_id", onDelete: "CASCADE" });
Wishlist.belongsTo(User, { foreignKey: "user_id" });
Product.hasMany(Wishlist, { foreignKey: "product_id", onDelete: "CASCADE" });
Wishlist.belongsTo(Product, { foreignKey: "product_id" });

// User <-> Cart <-> Product
User.hasMany(Cart, { foreignKey: "user_id", onDelete: "CASCADE" });
Cart.belongsTo(User, { foreignKey: "user_id" });
Product.hasMany(Cart, { foreignKey: "product_id", onDelete: "CASCADE" });
Cart.belongsTo(Product, { foreignKey: "product_id" });

// User <-> Review <-> Product
User.hasMany(Review, { foreignKey: "user_id", onDelete: "CASCADE" });
Review.belongsTo(User, { foreignKey: "user_id" });
Product.hasMany(Review, { foreignKey: "product_id", as: "reviews", onDelete: "CASCADE" });
Review.belongsTo(Product, { foreignKey: "product_id" });

// User <-> Coupon (personal / loyalty coupons)
User.hasMany(Coupon, { foreignKey: "user_id", onDelete: "CASCADE" });
Coupon.belongsTo(User, { foreignKey: "user_id" });

// User <-> EmailVerificationToken
User.hasMany(EmailVerificationToken, { foreignKey: "user_id", onDelete: "CASCADE" });
EmailVerificationToken.belongsTo(User, { foreignKey: "user_id" });

// User <-> PasswordResetToken
User.hasMany(PasswordResetToken, { foreignKey: "user_id", onDelete: "CASCADE" });
PasswordResetToken.belongsTo(User, { foreignKey: "user_id" });

// User <-> Notification
User.hasMany(Notification, { foreignKey: "user_id", onDelete: "CASCADE" });
Notification.belongsTo(User, { foreignKey: "user_id" });

// User <-> EmailLog
User.hasMany(EmailLog, { foreignKey: "user_id", onDelete: "SET NULL" });
EmailLog.belongsTo(User, { foreignKey: "user_id" });

module.exports = {
  sequelize, User, Category, Product, ProductImage,
  Size, Color, ProductSize, ProductColor,
  Order, OrderItem, Wishlist, Cart, Coupon, Review, Newsletter,
  EmailVerificationToken, PasswordResetToken, Notification, EmailLog,
  Zone,
};

// Loaded at bottom to avoid circular reference issues
const ReturnRequest = require("./ReturnRequest");
User.hasMany(ReturnRequest, { foreignKey: "user_id", onDelete: "CASCADE" });
ReturnRequest.belongsTo(User, { foreignKey: "user_id" });
Order.hasMany(ReturnRequest, { foreignKey: "order_id", as: "return_requests", onDelete: "CASCADE" });
ReturnRequest.belongsTo(Order, { foreignKey: "order_id" });

module.exports.ReturnRequest = ReturnRequest;

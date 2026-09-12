const { Op, fn, col, literal } = require("sequelize");
const { User, Product, Order } = require("../models");

// @route GET /api/admin/stats
const getDashboardStats = async (req, res, next) => {
  try {
    const LOW_STOCK = parseInt(process.env.LOW_STOCK_THRESHOLD, 10) || 5;

    const [totalUsers, totalProducts, totalOrders, revenueResult, lowStockProducts] = await Promise.all([
      User.count({ where: { role: "customer" } }),
      Product.count({ where: { is_active: true } }),
      Order.count(),
      Order.sum("total_amount", { where: { status: { [Op.ne]: "cancelled" } } }),
      Product.findAll({
        where: { stock: { [Op.lte]: LOW_STOCK }, is_active: true },
        attributes: ["id", "name", "stock", "category_id"],
        order: [["stock", "ASC"]],
        limit: 10,
      }),
    ]);

    const totalSales = revenueResult || 0;

    const monthlyRaw = await Order.findAll({
      attributes: [
        [fn("DATE_FORMAT", col("created_at"), "%Y-%m"), "month"],
        [fn("SUM", col("total_amount")), "revenue"],
        [fn("COUNT", col("id")), "order_count"],
      ],
      where: {
        status: { [Op.ne]: "cancelled" },
        created_at: { [Op.gte]: literal("DATE_SUB(NOW(), INTERVAL 6 MONTH)") },
      },
      group: [literal("month")],
      order: [[literal("month"), "ASC"]],
      raw: true,
    });

    const ordersByStatus = await Order.findAll({
      attributes: ["status", [fn("COUNT", col("id")), "count"]],
      group: ["status"],
      raw: true,
    });

    res.json({
      total_users: totalUsers,
      total_products: totalProducts,
      total_orders: totalOrders,
      total_revenue: parseFloat(totalSales).toFixed(2),
      monthly_revenue: monthlyRaw.map(m => ({
        month: m.month,
        revenue: parseFloat(m.revenue).toFixed(2),
        order_count: parseInt(m.order_count, 10),
      })),
      orders_by_status: ordersByStatus,
      low_stock_products: lowStockProducts,
      low_stock_threshold: LOW_STOCK,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getDashboardStats };

const { Notification } = require("../models");

/**
 * Creates one or more in-app notifications.
 * Never throws — notification failures should never crash the main request.
 */
const createNotification = async ({ user_id, title, message, type, meta = null }) => {
  try {
    await Notification.create({ user_id, title, message, type, meta });
  } catch (err) {
    console.error("[Notification] Failed to create:", err.message);
  }
};

// ── Convenience helpers ────────────────────────────────────────────────────

const notifyOrderConfirmed = (userId, order) =>
  createNotification({
    user_id: userId,
    title: "Order Confirmed",
    message: `Your order ${order.order_number} has been placed successfully.`,
    type: "order_confirmed",
    meta: { order_id: order.id, order_number: order.order_number },
  });

const notifyOrderStatus = (userId, order) => {
  const messages = {
    processing: `Your order ${order.order_number} is now being processed.`,
    shipped:    `Your order ${order.order_number} has been shipped and is on its way.`,
    delivered:  `Your order ${order.order_number} has been delivered. Enjoy!`,
    cancelled:  `Your order ${order.order_number} has been cancelled.`,
  };
  const titles = {
    processing: "Order Processing",
    shipped:    "Order Shipped",
    delivered:  "Order Delivered",
    cancelled:  "Order Cancelled",
  };
  if (!messages[order.status]) return Promise.resolve();
  return createNotification({
    user_id: userId,
    title: titles[order.status],
    message: messages[order.status],
    type: `order_${order.status}`,
    meta: { order_id: order.id, order_number: order.order_number },
  });
};

const notifyAdminNewOrder = (adminId, order, customer) =>
  createNotification({
    user_id: adminId,
    title: "New Order Received",
    message: `${customer.first_name} ${customer.last_name} placed order ${order.order_number} for ${parseFloat(order.total_amount).toLocaleString()} EGP.`,
    type: "admin_new_order",
    meta: { order_id: order.id, order_number: order.order_number },
  });

const notifyAdminLowStock = (adminId, product) =>
  createNotification({
    user_id: adminId,
    title: "Low Stock Alert",
    message: `"${product.name}" is ${product.stock === 0 ? "sold out" : `down to ${product.stock} unit(s)`}. Restock soon.`,
    type: "admin_low_stock",
    meta: { product_id: product.id },
  });

const notifyAdminNewUser = (adminId, user) =>
  createNotification({
    user_id: adminId,
    title: "New Customer Registered",
    message: `${user.first_name} ${user.last_name} (${user.email}) just created an account.`,
    type: "admin_new_user",
    meta: { user_id: user.id },
  });

const notifyAdminContact = (adminId, form) =>
  createNotification({
    user_id: adminId,
    title: "New Contact Message",
    message: `${form.name} sent a message: "${form.subject}"`,
    type: "admin_contact",
    meta: { from_email: form.email },
  });

module.exports = {
  createNotification,
  notifyOrderConfirmed,
  notifyOrderStatus,
  notifyAdminNewOrder,
  notifyAdminLowStock,
  notifyAdminNewUser,
  notifyAdminContact,
};

// Return/cancel notifications
const notifyReturnSubmitted = (userId, request) =>
  createNotification({
    user_id: userId,
    title: `${request.type === "cancellation" ? "Cancellation" : "Return"} Request Received`,
    message: `Your request ${request.request_number} is under review. We'll update you within 24–48 hours.`,
    type: "order_confirmed",
    meta: { return_request_id: request.id, request_number: request.request_number },
  });

const notifyReturnStatusUpdate = (userId, request) => {
  const statusMessages = {
    approved: { title: "Request Approved", msg: `Your ${request.type} request ${request.request_number} has been approved.` },
    rejected: { title: "Request Update",   msg: `Your ${request.type} request ${request.request_number} could not be approved. Check your email for details.` },
    refunded: { title: "Refund Processed", msg: `Your refund for request ${request.request_number} has been processed.` },
    exchanged: { title: "Exchange Shipped", msg: `Your replacement for request ${request.request_number} has been dispatched.` },
  };
  const { title, msg } = statusMessages[request.status] || { title: "Request Update", msg: `Your request ${request.request_number} status: ${request.status}.` };
  return createNotification({ user_id: userId, title, message: msg, type: "order_processing", meta: { return_request_id: request.id } });
};

// Admin alert for a new return/cancellation request. Uses its own
// "admin_new_return" type (distinct from admin_new_order) so the admin
// sidebar can show a red dot on "Returns" specifically, and clear it
// independently of new-order notifications.
const notifyAdminNewReturn = (adminId, request, user) =>
  createNotification({
    user_id: adminId,
    title: `New ${request.type === "cancellation" ? "Cancellation" : "Return"} Request`,
    message: `${user.first_name} ${user.last_name} submitted ${request.request_number} — reason: ${request.reason.replace(/_/g, " ")}.`,
    type: "admin_new_return",
    meta: { return_request_id: request.id },
  });

module.exports.notifyReturnSubmitted   = notifyReturnSubmitted;
module.exports.notifyReturnStatusUpdate = notifyReturnStatusUpdate;
module.exports.notifyAdminNewReturn    = notifyAdminNewReturn;

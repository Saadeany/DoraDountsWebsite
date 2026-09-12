const crypto = require("crypto");
const path = require("path");
const fs = require("fs");
const { Op } = require("sequelize");
const { ReturnRequest, Order, OrderItem, User, Product } = require("../models");
const {
  sendReturnConfirmEmail,
  sendReturnApprovedEmail,
  sendReturnRejectedEmail,
  sendAdminNewReturnEmail,
} = require("../utils/emailService");
const {
  notifyReturnSubmitted,
  notifyReturnStatusUpdate,
  notifyAdminNewReturn,
} = require("../utils/notificationService");

// ── Return eligibility policy ──────────────────────────────────────────────
const RETURN_POLICY = {
  // Max days after delivery to submit a return
  return_window_days: 14,
  // Cancellation: only allowed while order is pending or processing
  cancellable_statuses: ["pending", "processing"],
  // These reasons require photo evidence
  photo_required_reasons: ["item_damaged", "item_defective", "wrong_item_received", "missing_parts"],
};

const generateRequestNumber = () => {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const rand = crypto.randomBytes(3).toString("hex").toUpperCase();
  return `RET-${date}-${rand}`;
};

const getAdminUser = () => User.findOne({ where: { role: "admin" } });

// @route POST /api/returns  (customer)
const submitRequest = async (req, res, next) => {
  try {
    const { order_id, type, reason, description, items } = req.body;

    if (!order_id || !type || !reason) {
      return res.status(400).json({ message: "order_id, type, and reason are required." });
    }
    if (!["cancellation", "return", "exchange"].includes(type)) {
      return res.status(400).json({ message: "Invalid request type." });
    }

    const order = await Order.findOne({
      where: { id: order_id, user_id: req.user.id },
      include: [{ model: OrderItem, as: "items" }],
    });
    if (!order) return res.status(404).json({ message: "Order not found." });

    // ── Eligibility checks ────────────────────────────────────────────────
    if (type === "cancellation") {
      if (!RETURN_POLICY.cancellable_statuses.includes(order.status)) {
        return res.status(400).json({
          message: `Orders can only be cancelled while in Pending or Processing status. This order is currently "${order.status}".`,
          code: "ORDER_NOT_CANCELLABLE",
        });
      }
    }

    if (type === "return" || type === "exchange") {
      if (order.status !== "delivered") {
        return res.status(400).json({
          message: "Returns and exchanges are only available for delivered orders.",
          code: "ORDER_NOT_DELIVERED",
        });
      }
      // Check return window
      const deliveredDaysAgo = Math.floor(
        (Date.now() - new Date(order.updatedAt).getTime()) / (1000 * 60 * 60 * 24)
      );
      if (deliveredDaysAgo > RETURN_POLICY.return_window_days) {
        return res.status(400).json({
          message: `Returns must be submitted within ${RETURN_POLICY.return_window_days} days of delivery. This order was delivered ${deliveredDaysAgo} days ago.`,
          code: "RETURN_WINDOW_EXPIRED",
        });
      }
    }

    // ── Duplicate check ───────────────────────────────────────────────────
    const existing = await ReturnRequest.findOne({
      where: {
        order_id,
        user_id: req.user.id,
        type,
        status: { [Op.notIn]: ["rejected", "closed"] },
      },
    });
    if (existing) {
      return res.status(409).json({
        message: `A ${type} request for this order is already ${existing.status}. Request number: ${existing.request_number}.`,
        existing_request: existing,
      });
    }

    // ── Photo requirement check ───────────────────────────────────────────
    const uploadedImages = req.files ? req.files.map((f) => `/uploads/returns/${f.filename}`) : [];
    if (RETURN_POLICY.photo_required_reasons.includes(reason) && uploadedImages.length === 0) {
      return res.status(400).json({
        message: `Photo evidence is required for "${reason.replace(/_/g, " ")}" requests. Please upload at least one photo.`,
        code: "PHOTO_REQUIRED",
      });
    }

    const parsedItems = typeof items === "string" ? JSON.parse(items) : items || order.items.map((i) => ({
      order_item_id: i.id,
      product_name: i.product_name,
      size: i.size,
      color: i.color,
      quantity: i.quantity,
    }));

    const request = await ReturnRequest.create({
      request_number: generateRequestNumber(),
      order_id,
      user_id: req.user.id,
      type,
      reason,
      description: description || null,
      items: parsedItems,
      images: uploadedImages,
      status: "pending",
    });

    // Fire notifications (non-blocking)
    sendReturnConfirmEmail(req.user, request, order).catch(() => {});
    notifyReturnSubmitted(req.user.id, request).catch(() => {});
    getAdminUser().then((admin) => {
      if (!admin) return;
      sendAdminNewReturnEmail(request, req.user, order).catch(() => {});
      notifyAdminNewReturn(admin.id, request, req.user).catch(() => {});
    }).catch(() => {});

    res.status(201).json({ message: "Request submitted successfully.", request });
  } catch (error) {
    next(error);
  }
};

// @route GET /api/returns/my-requests  (customer)
const getMyRequests = async (req, res, next) => {
  try {
    const requests = await ReturnRequest.findAll({
      where: { user_id: req.user.id },
      include: [{ model: Order, attributes: ["id", "order_number", "total_amount", "status"] }],
      order: [["createdAt", "DESC"]],
    });
    res.json({ requests });
  } catch (error) {
    next(error);
  }
};

// @route GET /api/returns/:id  (customer or admin)
const getRequestById = async (req, res, next) => {
  try {
    const where = { id: req.params.id };
    if (req.user.role !== "admin") where.user_id = req.user.id;

    const request = await ReturnRequest.findOne({
      where,
      include: [
        { model: Order, include: [{ model: OrderItem, as: "items" }] },
        { model: User, attributes: ["id", "first_name", "last_name", "email", "phone"] },
      ],
    });
    if (!request) return res.status(404).json({ message: "Request not found." });
    res.json({ request });
  } catch (error) {
    next(error);
  }
};

// @route GET /api/admin/returns  (admin only)
const getAllRequests = async (req, res, next) => {
  try {
    const { status, type, page = 1, limit = 20 } = req.query;
    const where = {};
    if (status) where.status = status;
    if (type) where.type = type;

    const pageNum = Math.max(parseInt(page, 10) || 1, 1);
    const limitNum = Math.min(parseInt(limit, 10) || 20, 100);

    const { count, rows } = await ReturnRequest.findAndCountAll({
      where,
      include: [
        { model: Order, attributes: ["id", "order_number", "total_amount", "status"] },
        { model: User, attributes: ["id", "first_name", "last_name", "email", "phone"] },
      ],
      order: [["createdAt", "DESC"]],
      limit: limitNum,
      offset: (pageNum - 1) * limitNum,
    });

    res.json({
      requests: rows,
      pagination: { total: count, page: pageNum, limit: limitNum, total_pages: Math.ceil(count / limitNum) },
    });
  } catch (error) {
    next(error);
  }
};

// @route PUT /api/admin/returns/:id  (admin only — update status, add notes, set refund)
const updateRequest = async (req, res, next) => {
  try {
    const { status, admin_notes, rejection_reason, refund_amount, refund_method, refund_reference } = req.body;

    const validStatuses = ["pending", "reviewing", "approved", "rejected", "refunded", "exchanged", "closed"];
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status." });
    }

    const request = await ReturnRequest.findByPk(req.params.id, {
      include: [
        { model: Order, include: [{ model: OrderItem, as: "items" }] },
        { model: User },
      ],
    });
    if (!request) return res.status(404).json({ message: "Request not found." });

    const previousStatus = request.status;

    if (status) request.status = status;
    if (admin_notes !== undefined) request.admin_notes = admin_notes;
    if (rejection_reason !== undefined) request.rejection_reason = rejection_reason;
    if (refund_amount !== undefined) request.refund_amount = refund_amount;
    if (refund_method !== undefined) request.refund_method = refund_method;
    if (refund_reference !== undefined) request.refund_reference = refund_reference;

    if (status && status !== previousStatus) {
      request.reviewed_by = req.user.id;
      request.reviewed_at = new Date();
      if (["refunded", "exchanged", "closed"].includes(status)) {
        request.resolved_at = new Date();
      }
    }

    await request.save();

    // Notify customer on meaningful status changes
    if (status && status !== previousStatus) {
      const customer = request.User;
      const order = request.Order;

      if (status === "approved" || status === "refunded" || status === "exchanged") {
        sendReturnApprovedEmail(customer, request, order).catch(() => {});
      } else if (status === "rejected") {
        sendReturnRejectedEmail(customer, request, order).catch(() => {});
      }
      notifyReturnStatusUpdate(customer.id, request).catch(() => {});
    }

    res.json({ message: "Request updated.", request });
  } catch (error) {
    next(error);
  }
};

// @route DELETE /api/admin/returns/:id/images/:index  (admin — remove an evidence photo)
const deleteRequestImage = async (req, res, next) => {
  try {
    const request = await ReturnRequest.findByPk(req.params.id);
    if (!request) return res.status(404).json({ message: "Request not found." });

    const idx = parseInt(req.params.index, 10);
    const images = request.images || [];
    if (idx < 0 || idx >= images.length) return res.status(400).json({ message: "Invalid image index." });

    const [removed] = images.splice(idx, 1);
    const filePath = path.join(__dirname, "..", removed);
    fs.unlink(filePath, () => {});
    request.images = images;
    await request.save();

    res.json({ message: "Image removed.", images: request.images });
  } catch (error) {
    next(error);
  }
};

// @route GET /api/returns/policy  (public — returns the policy constants for the frontend)
const getPolicy = (req, res) => {
  res.json({ policy: RETURN_POLICY });
};

module.exports = {
  submitRequest,
  getMyRequests,
  getRequestById,
  getAllRequests,
  updateRequest,
  deleteRequestImage,
  getPolicy,
};

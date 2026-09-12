require("dotenv").config();
const nodemailer = require("nodemailer");
const { EmailLog } = require("../models");

// ── Transporter ────────────────────────────────────────────────────────────
const createTransporter = () =>
  nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: parseInt(process.env.SMTP_PORT, 10) || 587,
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    tls: { rejectUnauthorized: false }, // allow self-signed in dev
  });

const FROM = `"${process.env.EMAIL_FROM_NAME || "Dora Donuts"}" <${
  process.env.EMAIL_FROM_ADDRESS || "doradounts@gmail.com"
}>`;

// ── Brand tokens ───────────────────────────────────────────────────────────
const B = {
        // ── DORA Donuts & Pastry palette ──────────────────────────
  ink: "#FF0090",       // primary text / buttons / accents — pink
  charcoal: "#000000",  // secondary text / footer text — black       stone: "#45cbdd",     // darker cyan accent
  beige: "#45cbdd",     // darker cyan accent
  cream: "#45cbdd",     // darker cyan accent
  paper: "#FFFFFF",     // page background — white
  white: "#FFFFFF",
  green: "#16a34a",
  red: "#dc2626",
  name: process.env.EMAIL_FROM_NAME || "Dora Donuts",
  fromAddress: process.env.EMAIL_FROM_ADDRESS || "doradounts@gmail.com",
  website: process.env.CLIENT_URL || "http://localhost:5173",
  // Manual-transfer payment details — shown on the order confirmation email
  // whenever the customer pays via Vodafone Cash or InstaPay.
  vodafoneCashNumber: process.env.VODAFONE_CASH_NUMBER || "+20 100 000 0000",
  instapayNumber: process.env.INSTAPAY_NUMBER || "+20 100 000 0000 / instapay.me/feltandform",
  whatsappNumber: process.env.WHATSAPP_NUMBER || "+20 100 000 0000",
};

// ── Base layout ────────────────────────────────────────────────────────────
const baseLayout = (title, bodyHtml) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { background-color: ${B.cream}; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: ${B.ink}; }
    a { color: ${B.ink}; }
    .wrapper { max-width: 600px; margin: 32px auto; background: ${B.paper}; border: 1px solid rgba(26,26,26,0.08); }
    .header { background-color: ${B.ink}; padding: 32px 40px; text-align: center; }
    .header-logo { color: ${B.paper}; font-size: 24px; letter-spacing: 0.18em; font-weight: 400; text-decoration: none; }
    .header-sub { color: rgba(250,248,244,0.55); font-size: 11px; letter-spacing: 0.12em; text-transform: uppercase; margin-top: 6px; }
    .body { padding: 40px; }
    .eyebrow { font-size: 11px; text-transform: uppercase; letter-spacing: 0.14em; color: ${B.stone}; margin-bottom: 8px; }
    h1 { font-size: 28px; font-weight: 400; line-height: 1.25; margin-bottom: 16px; }
    h2 { font-size: 16px; font-weight: 600; margin-bottom: 10px; }
    p { font-size: 14px; line-height: 1.7; color: rgba(26,26,26,0.75); margin-bottom: 12px; }
    .divider { border: none; border-top: 1px dashed rgba(26,26,26,0.15); margin: 24px 0; }
    .btn { display: inline-block; background-color: ${B.ink}; color: ${B.paper} !important; text-decoration: none; padding: 14px 32px; font-size: 12px; letter-spacing: 0.1em; text-transform: uppercase; margin: 16px 0; }
    .btn-outline { background-color: transparent; color: ${B.ink} !important; border: 1.5px solid ${B.ink}; }
    .info-table { width: 100%; border-collapse: collapse; margin: 16px 0; }
    .info-table td { padding: 10px 0; font-size: 13px; border-bottom: 1px solid rgba(26,26,26,0.07); vertical-align: top; }
    .info-table td:first-child { color: ${B.stone}; width: 42%; }
    .product-row { display: flex; align-items: flex-start; gap: 14px; padding: 12px 0; border-bottom: 1px solid rgba(26,26,26,0.07); }
    .badge { display: inline-block; padding: 3px 10px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; border-radius: 2px; }
    .badge-green  { background: #dcfce7; color: #15803d; }
    .badge-blue   { background: #dbeafe; color: #1d4ed8; }
    .badge-purple { background: #f3e8ff; color: #7e22ce; }
    .badge-red    { background: #fee2e2; color: #b91c1c; }
    .badge-yellow { background: #fef9c3; color: #854d0e; }
    .badge-grey   { background: #f3f4f6; color: #374151; }
    .summary-box { background: ${B.cream}; padding: 20px 24px; margin: 20px 0; }
    .summary-row { display: flex; justify-content: space-between; font-size: 13px; padding: 5px 0; }
    .summary-total { font-size: 15px; font-weight: 600; border-top: 1px solid rgba(26,26,26,0.15); margin-top: 8px; padding-top: 10px; }
    .alert-box { border-left: 3px solid ${B.ink}; padding: 14px 18px; background: ${B.cream}; margin: 20px 0; font-size: 13px; }
    .transfer-box { border-left: 3px solid #d97706; padding: 16px 20px; background: #fffbeb; margin: 20px 0; font-size: 13px; line-height: 1.7; }
    .transfer-number { font-size: 18px; font-weight: 700; letter-spacing: 0.02em; color: ${B.ink}; }
    .footer { background: ${B.charcoal}; padding: 28px 40px; text-align: center; }
    .footer p { color: rgba(250,248,244,0.45); font-size: 11px; margin-bottom: 4px; }
    .footer a { color: rgba(250,248,244,0.6); text-decoration: none; }
    @media (max-width: 600px) {
      .body { padding: 24px 20px; }
      h1 { font-size: 22px; }
      .btn { display: block; text-align: center; }
    }
  </style>
</head>
<body>
<div class="wrapper">
  <div class="header">
    <a href="${B.website}" class="header-logo">${B.name.toUpperCase()}</a>
    <div class="header-sub">Cairo · Egypt</div>
  </div>
  <div class="body">${bodyHtml}</div>
  <div class="footer">
    <p>${B.name} · 48 El Fardous Compound Al Ahly Club, Nasr City, Cairo, Egypt</p>
    <p><a href="${B.website}">${B.website}</a> &nbsp;|&nbsp; <a href="mailto:${B.fromAddress}">${B.fromAddress}</a></p>
    <p style="margin-top:10px;">You're receiving this because you have an account at ${B.name}.</p>
  </div>
</div>
</body>
</html>`;

// ── Status badge helper ────────────────────────────────────────────────────
const statusBadge = (status) => {
  const map = {
    pending: ["badge-yellow", "Pending"],
    processing: ["badge-blue", "Processing"],
    shipped: ["badge-purple", "Shipped"],
    delivered: ["badge-green", "Delivered"],
    cancelled: ["badge-red", "Cancelled"],
  };
  const [cls, label] = map[status] || ["badge-grey", status];
  return `<span class="badge ${cls}">${label}</span>`;
};

// ── Payment method label ───────────────────────────────────────────────────
const paymentLabel = (method) =>
  ({ cash_on_delivery: "Cash on Delivery", vodafone_cash: "Vodafone Cash", instapay: "InstaPay" }[method] || method);

// Payment methods that require a manual transfer before processing.
const TRANSFER_METHODS = ["vodafone_cash", "instapay"];

// ── Product rows for order emails ─────────────────────────────────────────
const productRows = (items = []) =>
  items
    .map(
      (i) => `
    <tr>
      <td style="padding:12px 0;border-bottom:1px solid rgba(26,26,26,0.07);font-size:13px;">
        <strong>${i.product_name}</strong>
        ${i.size ? `<br><span style="color:${B.stone};font-size:12px;">Size: ${i.size}</span>` : ""}
        ${i.color ? `<span style="color:${B.stone};font-size:12px;"> · Color: ${i.color}</span>` : ""}
      </td>
      <td style="padding:12px 0;border-bottom:1px solid rgba(26,26,26,0.07);font-size:13px;text-align:center;">×${i.quantity}</td>
      <td style="padding:12px 0;border-bottom:1px solid rgba(26,26,26,0.07);font-size:13px;text-align:right;">${(parseFloat(i.price) * i.quantity).toLocaleString()} EGP</td>
    </tr>`
    )
    .join("");

// ── Order summary block ────────────────────────────────────────────────────
const orderSummaryBlock = (order) => `
<div class="summary-box">
  <div class="summary-row"><span>Subtotal</span><span>${parseFloat(order.subtotal).toLocaleString()} EGP</span></div>
  ${parseFloat(order.discount_amount) > 0 ? `<div class="summary-row" style="color:#16a34a;"><span>Discount${order.coupon_code ? ` (${order.coupon_code})` : ""}</span><span>-${parseFloat(order.discount_amount).toLocaleString()} EGP</span></div>` : ""}
  <div class="summary-row"><span>Tax (14%)</span><span>${parseFloat(order.tax).toLocaleString()} EGP</span></div>
  <div class="summary-row"><span>Shipping</span><span>${parseFloat(order.shipping_cost) === 0 ? "Free" : parseFloat(order.shipping_cost).toLocaleString() + " EGP"}</span></div>
  <div class="summary-row summary-total"><span>Total</span><span>${parseFloat(order.total_amount).toLocaleString()} EGP</span></div>
</div>`;

// Manual-transfer instructions — shown whenever the order was paid via
// Vodafone Cash or InstaPay. The order stays "awaiting_transfer" until an
// admin sees the WhatsApp screenshot and confirms it in the admin panel.
const transferInstructionsBlock = (order) => {
  if (!TRANSFER_METHODS.includes(order.payment_method)) return "";
  const number = order.payment_method === "vodafone_cash" ? B.vodafoneCashNumber : B.instapayNumber;
  return `
  <div class="transfer-box">
    <strong>One more step to complete your order</strong><br/><br/>
    Please transfer <strong>${parseFloat(order.total_amount).toLocaleString()} EGP</strong> via
    <strong>${paymentLabel(order.payment_method)}</strong> to:
    <br/><span class="transfer-number">${number}</span>
    <br/><br/>
    Then send a screenshot of the transfer <strong>on WhatsApp</strong> to
    <strong>${B.whatsappNumber}</strong>, along with your order number
    <strong>${order.order_number}</strong>. We'll confirm receipt and start
    processing your order as soon as we see it — orders aren't shipped until
    the transfer is confirmed.
  </div>`;
};

// ── Estimated delivery string ──────────────────────────────────────────────
const estimatedDelivery = () => {
  const d = new Date();
  d.setDate(d.getDate() + 4);
  return d.toLocaleDateString("en-EG", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
};

// ══════════════════════════════════════════════════════════════════════════
// EMAIL TEMPLATE BUILDERS
// ══════════════════════════════════════════════════════════════════════════

const templates = {

  welcome: (user) => ({
    subject: `Welcome to ${B.name} — Your account is ready`,
    html: baseLayout("Welcome", `
      <p class="eyebrow">You're in</p>
      <h1>Welcome, ${user.first_name}.</h1>
      <p>Your ${B.name} account has been created. We build clothing that holds up — and we're glad you found us.</p>
      <p>Before you can place orders, please verify your email address using the link we sent separately.</p>
      <a href="${B.website}/shop" class="btn">Explore the Collection</a>
      <hr class="divider" />
      <h2>What to do next</h2>
      <table class="info-table">
        <tr><td>✓ Verify email</td><td>Check your inbox for the verification link</td></tr>
        <tr><td>✓ Browse the shop</td><td><a href="${B.website}/shop">${B.website}/shop</a></td></tr>
        <tr><td>✓ Your account</td><td><a href="${B.website}/profile">${B.website}/profile</a></td></tr>
      </table>
      <p style="font-size:12px;color:${B.stone};">Questions? Email us at <a href="mailto:${B.fromAddress}">${B.fromAddress}</a></p>
    `),
  }),

  verifyEmail: (user, verifyUrl) => ({
    subject: `Verify your ${B.name} email address`,
    html: baseLayout("Verify Email", `
      <p class="eyebrow">Action required</p>
      <h1>Confirm your email.</h1>
      <p>Hi ${user.first_name}, please verify your email address to activate your account and start shopping.</p>
      <div class="alert-box">
        This link expires in <strong>${process.env.EMAIL_VERIFY_EXPIRES_MIN || 30} minutes</strong>.
      </div>
      <a href="${verifyUrl}" class="btn">Verify My Email</a>
      <p style="font-size:12px;color:${B.stone};margin-top:16px;">If the button doesn't work, copy and paste this URL into your browser:</p>
      <p style="font-size:11px;word-break:break-all;color:${B.stone};">${verifyUrl}</p>
      <hr class="divider" />
      <p style="font-size:12px;color:${B.stone};">If you didn't create a ${B.name} account, you can safely ignore this email.</p>
    `),
  }),

  passwordReset: (user, resetUrl) => ({
    subject: `Reset your ${B.name} password`,
    html: baseLayout("Password Reset", `
      <p class="eyebrow">Security</p>
      <h1>Reset your password.</h1>
      <p>Hi ${user.first_name}, we received a request to reset the password for your ${B.name} account.</p>
      <div class="alert-box">
        This link expires in <strong>${process.env.PASSWORD_RESET_EXPIRES_MIN || 15} minutes</strong>.
      </div>
      <a href="${resetUrl}" class="btn">Reset Password</a>
      <p style="font-size:12px;color:${B.stone};margin-top:16px;">If the button doesn't work, copy and paste this URL:</p>
      <p style="font-size:11px;word-break:break-all;color:${B.stone};">${resetUrl}</p>
      <hr class="divider" />
      <p style="font-size:12px;color:${B.stone};">If you didn't request a password reset, your account is safe — you can ignore this email. The link will expire automatically.</p>
    `),
  }),

  orderConfirmation: (user, order, items) => ({
    subject: `Order confirmed — ${order.order_number}`,
    html: baseLayout(`Order ${order.order_number}`, `
      <p class="eyebrow">Order confirmed</p>
      <h1>We've got your order.</h1>
      <p>Hi ${user.first_name}, thank you for shopping at ${B.name}. Your order has been received${TRANSFER_METHODS.includes(order.payment_method) ? " and is on hold pending your transfer" : " and is being prepared"}.</p>

      <table class="info-table">
        <tr><td>Order number</td><td><strong>${order.order_number}</strong></td></tr>
        <tr><td>Order date</td><td>${new Date(order.createdAt).toLocaleDateString("en-EG", { day:"numeric",month:"long",year:"numeric" })}</td></tr>
        <tr><td>Payment method</td><td>${paymentLabel(order.payment_method)}</td></tr>
        <tr><td>Estimated delivery</td><td><strong>${estimatedDelivery()}</strong></td></tr>
      </table>

      ${transferInstructionsBlock(order)}

      <hr class="divider" />
      <h2>Items ordered</h2>
      <table style="width:100%;border-collapse:collapse;">
        <thead>
          <tr>
            <th style="text-align:left;font-size:11px;text-transform:uppercase;letter-spacing:0.1em;color:${B.stone};padding-bottom:8px;">Product</th>
            <th style="text-align:center;font-size:11px;text-transform:uppercase;letter-spacing:0.1em;color:${B.stone};padding-bottom:8px;">Qty</th>
            <th style="text-align:right;font-size:11px;text-transform:uppercase;letter-spacing:0.1em;color:${B.stone};padding-bottom:8px;">Price</th>
          </tr>
        </thead>
        <tbody>${productRows(items)}</tbody>
      </table>

      ${orderSummaryBlock(order)}

      <hr class="divider" />
      <h2>Shipping to</h2>
      <table class="info-table">
        <tr><td>Name</td><td>${order.shipping_full_name}</td></tr>
        <tr><td>Phone</td><td>${order.shipping_phone}</td></tr>
        <tr><td>Area</td><td>${order.shipping_area || "—"}</td></tr>
        <tr><td>Address</td><td>${order.shipping_address}${order.shipping_building ? `, Bldg ${order.shipping_building}` : ""}${order.shipping_floor ? `, Floor ${order.shipping_floor}` : ""}${order.shipping_apartment ? `, Apt ${order.shipping_apartment}` : ""}, ${order.shipping_city}, ${order.shipping_country}</td></tr>
      </table>

      <a href="${B.website}/profile/orders" class="btn btn-outline" style="margin-top:8px;">Track My Order</a>
    `),
  }),

  orderStatusUpdate: (user, order) => {
    const messages = {
      processing: { eyebrow: "Update", title: "Your order is being processed.", body: "Our team is reviewing and preparing your items. You'll hear from us when it ships." },
      shipped:    { eyebrow: "On its way", title: "Your order has been shipped.", body: "Your package is now with our delivery partner and is on its way to you." },
      delivered:  { eyebrow: "Delivered", title: "Your order has arrived.", body: "We hope you love what you ordered. If anything isn't right, contact us within 14 days." },
      cancelled:  { eyebrow: "Cancelled", title: "Your order has been cancelled.", body: "Your order has been cancelled. If you paid online, a refund will be processed within 5–7 business days." },
    };
    const { eyebrow, title, body } = messages[order.status] || { eyebrow: "Update", title: `Order status: ${order.status}`, body: "Your order status has been updated." };

    return {
      subject: `Order ${order.order_number} — ${order.status.charAt(0).toUpperCase() + order.status.slice(1)}`,
      html: baseLayout(`Order Update`, `
        <p class="eyebrow">${eyebrow}</p>
        <h1>${title}</h1>
        <p>${body}</p>

        <table class="info-table">
          <tr><td>Order number</td><td><strong>${order.order_number}</strong></td></tr>
          <tr><td>Status</td><td>${statusBadge(order.status)}</td></tr>
          <tr><td>Updated</td><td>${new Date().toLocaleDateString("en-EG", { day:"numeric",month:"long",year:"numeric",hour:"2-digit",minute:"2-digit" })}</td></tr>
          <tr><td>Total</td><td>${parseFloat(order.total_amount).toLocaleString()} EGP</td></tr>
        </table>

        ${order.status === "delivered" ? `
          <div class="alert-box" style="border-left-color:${B.green};">
            Enjoying your purchase? Leave a review to help other customers.
          </div>
          <a href="${B.website}/profile/orders" class="btn">Leave a Review</a>
        ` : `<a href="${B.website}/profile/orders" class="btn btn-outline">View Order Details</a>`}
      `),
    };
  },

  adminNewOrder: (order, user, items) => ({
    subject: `[${B.name}] New Order — ${order.order_number} (${parseFloat(order.total_amount).toLocaleString()} EGP)`,
    html: baseLayout("New Order", `
      <p class="eyebrow">Admin alert</p>
      <h1>New order placed.</h1>
      <table class="info-table">
        <tr><td>Order</td><td><strong>${order.order_number}</strong></td></tr>
        <tr><td>Customer</td><td>${user.first_name} ${user.last_name} &lt;${user.email}&gt;</td></tr>
        <tr><td>Phone</td><td>${order.shipping_phone}</td></tr>
        <tr><td>Area</td><td>${order.shipping_area || "—"}, ${order.shipping_city}</td></tr>
        <tr><td>Payment</td><td>${paymentLabel(order.payment_method)}${order.payment_status === "awaiting_transfer" ? " — <strong>awaiting transfer confirmation</strong>" : ""}</td></tr>
        <tr><td>Total</td><td><strong>${parseFloat(order.total_amount).toLocaleString()} EGP</strong></td></tr>
      </table>
      <hr class="divider" />
      <h2>Items</h2>
      <table style="width:100%;border-collapse:collapse;">
        <tbody>${productRows(items)}</tbody>
      </table>
      ${orderSummaryBlock(order)}
      <a href="${B.website}/admin/orders" class="btn">Manage Order</a>
    `),
  }),

  adminLowStock: (products) => ({
    subject: `[${B.name}] Low Stock Alert — ${products.length} product${products.length > 1 ? "s" : ""} need attention`,
    html: baseLayout("Low Stock", `
      <p class="eyebrow">Inventory alert</p>
      <h1>${products.length} product${products.length > 1 ? "s" : ""} running low.</h1>
      <p>The following products are at or below the low-stock threshold (${process.env.LOW_STOCK_THRESHOLD || 5} units).</p>
      <table class="info-table">
        <tr>
          <td style="font-weight:600;font-size:12px;text-transform:uppercase;letter-spacing:0.08em;">Product</td>
          <td style="font-weight:600;font-size:12px;text-transform:uppercase;letter-spacing:0.08em;">Stock</td>
        </tr>
        ${products.map((p) => `<tr><td>${p.name}</td><td style="color:${p.stock === 0 ? B.red : "#d97706"};">${p.stock === 0 ? "Sold Out" : `${p.stock} remaining`}</td></tr>`).join("")}
      </table>
      <a href="${B.website}/admin/products" class="btn">Manage Inventory</a>
    `),
  }),

  adminNewUser: (user) => ({
    subject: `[${B.name}] New customer — ${user.first_name} ${user.last_name}`,
    html: baseLayout("New Customer", `
      <p class="eyebrow">Admin alert</p>
      <h1>New customer registered.</h1>
      <table class="info-table">
        <tr><td>Name</td><td>${user.first_name} ${user.last_name}</td></tr>
        <tr><td>Email</td><td>${user.email}</td></tr>
        <tr><td>Phone</td><td>${user.phone || "—"}</td></tr>
        <tr><td>Registered</td><td>${new Date().toLocaleDateString("en-EG", { day:"numeric",month:"long",year:"numeric" })}</td></tr>
      </table>
      <a href="${B.website}/admin/customers" class="btn btn-outline">View Customers</a>
    `),
  }),

  adminContact: (form) => ({
    subject: `[${B.name}] Contact — ${form.subject}`,
    html: baseLayout("Contact Message", `
      <p class="eyebrow">Customer message</p>
      <h1>New contact form submission.</h1>
      <table class="info-table">
        <tr><td>From</td><td>${form.name} &lt;${form.email}&gt;</td></tr>
        <tr><td>Subject</td><td>${form.subject}</td></tr>
      </table>
      <div class="alert-box" style="white-space:pre-line;">${form.message}</div>
      <a href="mailto:${form.email}?subject=Re: ${encodeURIComponent(form.subject)}" class="btn">Reply to Customer</a>
    `),
  }),
};

// ── Core send function ─────────────────────────────────────────────────────
const sendEmail = async ({ to, subject, html, userId = null, emailType = "welcome" }) => {
  const transporter = createTransporter();
  let status = "sent";
  let errorMessage = null;

  try {
    await transporter.sendMail({ from: FROM, to, subject, html });
  } catch (err) {
    status = "failed";
    errorMessage = err.message;
    console.error(`[Email] Failed to send "${emailType}" to ${to}:`, err.message);
  }

  EmailLog.create({
    user_id: userId || null,
    email_type: emailType,
    recipient: to,
    subject,
    status,
    error_message: errorMessage,
    sent_at: new Date(),
  }).catch(() => {});

  return status === "sent";
};

// ══════════════════════════════════════════════════════════════════════════
// PUBLIC SEND HELPERS  — called from controllers
// ══════════════════════════════════════════════════════════════════════════

const sendWelcomeEmail = (user) => {
  const t = templates.welcome(user);
  return sendEmail({ to: user.email, ...t, userId: user.id, emailType: "welcome" });
};

const sendVerificationEmail = (user, token) => {
  const url = `${process.env.CLIENT_URL}/verify-email?token=${token}`;
  const t = templates.verifyEmail(user, url);
  return sendEmail({ to: user.email, ...t, userId: user.id, emailType: "verify_email" });
};

const sendPasswordResetEmail = (user, token) => {
  const url = `${process.env.CLIENT_URL}/reset-password?token=${token}`;
  const t = templates.passwordReset(user, url);
  return sendEmail({ to: user.email, ...t, userId: user.id, emailType: "password_reset" });
};

const sendOrderConfirmationEmail = (user, order, items) => {
  const t = templates.orderConfirmation(user, order, items);
  return sendEmail({ to: user.email, ...t, userId: user.id, emailType: "order_confirmation" });
};

const sendOrderStatusEmail = (user, order) => {
  const t = templates.orderStatusUpdate(user, order);
  return sendEmail({ to: user.email, ...t, userId: user.id, emailType: "order_status_update" });
};

const sendAdminNewOrderEmail = (order, user, items) => {
  const adminEmail = process.env.ADMIN_NOTIFY_EMAIL;
  if (!adminEmail) return Promise.resolve(false);
  const t = templates.adminNewOrder(order, user, items);
  return sendEmail({ to: adminEmail, ...t, emailType: "admin_new_order" });
};

const sendAdminLowStockEmail = (products) => {
  const adminEmail = process.env.ADMIN_NOTIFY_EMAIL;
  if (!adminEmail || products.length === 0) return Promise.resolve(false);
  const t = templates.adminLowStock(products);
  return sendEmail({ to: adminEmail, ...t, emailType: "admin_low_stock" });
};

const sendAdminNewUserEmail = (user) => {
  const adminEmail = process.env.ADMIN_NOTIFY_EMAIL;
  if (!adminEmail) return Promise.resolve(false);
  const t = templates.adminNewUser(user);
  return sendEmail({ to: adminEmail, ...t, emailType: "admin_new_user" });
};

const sendAdminContactEmail = (form) => {
  const adminEmail = process.env.ADMIN_NOTIFY_EMAIL;
  if (!adminEmail) return Promise.resolve(false);
  const t = templates.adminContact(form);
  return sendEmail({ to: adminEmail, ...t, emailType: "admin_contact" });
};

module.exports = {
  sendEmail,
  sendWelcomeEmail,
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendOrderConfirmationEmail,
  sendOrderStatusEmail,
  sendAdminNewOrderEmail,
  sendAdminLowStockEmail,
  sendAdminNewUserEmail,
  sendAdminContactEmail,
};

// ── 10. Customer: Return/Cancel request received ──────────────────────────
const returnRequestConfirmTemplate = (user, request, order) => {
  const typeLabel = { cancellation:"Cancellation", return:"Return", exchange:"Exchange" }[request.type] || request.type;
  const statusMsg = request.type === "cancellation"
    ? "We will review your cancellation request and get back to you within 24 hours."
    : "We will review your return request within 24–48 hours and provide you with further instructions.";
  return {
    subject: `${typeLabel} request received — ${request.request_number}`,
    html: baseLayout(`${typeLabel} Request`, `
      <p class="eyebrow">Request received</p>
      <h1>Your ${typeLabel.toLowerCase()} request is under review.</h1>
      <p>Hi ${user.first_name}, we've received your ${typeLabel.toLowerCase()} request for order <strong>${order.order_number}</strong>. ${statusMsg}</p>
      <table class="info-table">
        <tr><td>Request number</td><td><strong>${request.request_number}</strong></td></tr>
        <tr><td>Order</td><td>${order.order_number}</td></tr>
        <tr><td>Type</td><td>${typeLabel}</td></tr>
        <tr><td>Reason</td><td>${request.reason.replace(/_/g," ")}</td></tr>
        <tr><td>Status</td><td><span class="badge badge-yellow">Pending Review</span></td></tr>
      </table>
      <hr class="divider"/>
      <h2>What happens next?</h2>
      <table class="info-table">
        ${request.type === "cancellation" ? `
          <tr><td>1. Review</td><td>Our team will check your order status (24h)</td></tr>
          <tr><td>2. Decision</td><td>You'll receive an email with the outcome</td></tr>
          <tr><td>3. Refund</td><td>If approved, refund processed within 5–7 business days</td></tr>
        ` : `
          <tr><td>1. Review</td><td>Our team will review your request and photos (24–48h)</td></tr>
          <tr><td>2. Instructions</td><td>You'll receive return shipping instructions</td></tr>
          <tr><td>3. Inspection</td><td>We inspect the item upon receipt</td></tr>
          <tr><td>4. Resolution</td><td>Refund or exchange processed within 5–7 business days</td></tr>
        `}
      </table>
      <a href="${B.website}/profile/orders" class="btn btn-outline" style="margin-top:16px;">View My Orders</a>
    `),
  };
};

// ── 11. Customer: Request approved ───────────────────────────────────────
const returnApprovedTemplate = (user, request, order) => {
  const typeLabel = { cancellation:"Cancellation", return:"Return", exchange:"Exchange" }[request.type] || request.type;
  const refundMethodLabel = { original_payment:"Original payment method", store_credit:"Store credit", bank_transfer:"Bank transfer" }[request.refund_method] || "";
  return {
    subject: `${typeLabel} approved — ${request.request_number}`,
    html: baseLayout(`${typeLabel} Approved`, `
      <p class="eyebrow">Good news</p>
      <h1>Your ${typeLabel.toLowerCase()} has been approved.</h1>
      <p>Hi ${user.first_name}, we've reviewed and approved your ${typeLabel.toLowerCase()} request for order <strong>${order.order_number}</strong>.</p>
      <table class="info-table">
        <tr><td>Request</td><td>${request.request_number}</td></tr>
        <tr><td>Status</td><td><span class="badge badge-green">Approved</span></td></tr>
        ${request.refund_amount ? `<tr><td>Refund amount</td><td><strong>${parseFloat(request.refund_amount).toLocaleString()} EGP</strong></td></tr>` : ""}
        ${request.refund_method ? `<tr><td>Refund via</td><td>${refundMethodLabel}</td></tr>` : ""}
      </table>
      ${request.admin_notes ? `<div class="alert-box">${request.admin_notes}</div>` : ""}
      ${request.type === "return" ? `
        <hr class="divider"/>
        <h2>Return instructions</h2>
        <p>Please pack the item securely in its original packaging if possible. Contact us at <a href="mailto:${B.fromAddress}">${B.fromAddress}</a> to arrange a pickup or drop-off.</p>
        <div class="alert-box"><strong>Important:</strong> Items must be unworn, unwashed, and in original condition with tags attached.</div>
      ` : ""}
      <a href="${B.website}/profile/orders" class="btn" style="margin-top:16px;">View My Orders</a>
    `),
  };
};

// ── 12. Customer: Request rejected ───────────────────────────────────────
const returnRejectedTemplate = (user, request, order) => {
  const typeLabel = { cancellation:"Cancellation", return:"Return", exchange:"Exchange" }[request.type] || request.type;
  return {
    subject: `${typeLabel} request update — ${request.request_number}`,
    html: baseLayout(`${typeLabel} Update`, `
      <p class="eyebrow">Request update</p>
      <h1>Your ${typeLabel.toLowerCase()} request could not be approved.</h1>
      <p>Hi ${user.first_name}, after reviewing your request <strong>${request.request_number}</strong> for order <strong>${order.order_number}</strong>, we were unable to process it at this time.</p>
      <table class="info-table">
        <tr><td>Request</td><td>${request.request_number}</td></tr>
        <tr><td>Status</td><td><span class="badge badge-red">Not Approved</span></td></tr>
      </table>
      ${request.rejection_reason ? `<div class="alert-box" style="border-left-color:#dc2626;"><strong>Reason:</strong> ${request.rejection_reason}</div>` : ""}
      <p>If you believe this decision is incorrect, please contact our support team.</p>
      <a href="mailto:${B.fromAddress}?subject=Re: ${request.request_number}" class="btn" style="margin-top:16px;">Contact Support</a>
    `),
  };
};

// ── 13. Admin: new return/cancel request ─────────────────────────────────
const adminNewReturnTemplate = (request, user, order) => {
  const typeLabel = { cancellation:"Cancellation", return:"Return", exchange:"Exchange" }[request.type] || request.type;
  return {
    subject: `[${B.name}] New ${typeLabel} Request — ${request.request_number}`,
    html: baseLayout(`New ${typeLabel}`, `
      <p class="eyebrow">Admin alert</p>
      <h1>New ${typeLabel.toLowerCase()} request.</h1>
      <table class="info-table">
        <tr><td>Request</td><td><strong>${request.request_number}</strong></td></tr>
        <tr><td>Type</td><td>${typeLabel}</td></tr>
        <tr><td>Order</td><td>${order.order_number} (${parseFloat(order.total_amount).toLocaleString()} EGP)</td></tr>
        <tr><td>Customer</td><td>${user.first_name} ${user.last_name} &lt;${user.email}&gt;</td></tr>
        <tr><td>Reason</td><td>${request.reason.replace(/_/g," ")}</td></tr>
        ${request.description ? `<tr><td>Details</td><td>${request.description}</td></tr>` : ""}
        ${request.images?.length > 0 ? `<tr><td>Photos</td><td>${request.images.length} uploaded</td></tr>` : ""}
      </table>
      <a href="${B.website}/admin/returns" class="btn" style="margin-top:16px;">Review Request</a>
    `),
  };
};

const sendReturnConfirmEmail = (user, request, order) => {
  const t = returnRequestConfirmTemplate(user, request, order);
  return sendEmail({ to: user.email, ...t, userId: user.id, emailType: "order_status_update" });
};
const sendReturnApprovedEmail = (user, request, order) => {
  const t = returnApprovedTemplate(user, request, order);
  return sendEmail({ to: user.email, ...t, userId: user.id, emailType: "order_status_update" });
};
const sendReturnRejectedEmail = (user, request, order) => {
  const t = returnRejectedTemplate(user, request, order);
  return sendEmail({ to: user.email, ...t, userId: user.id, emailType: "order_status_update" });
};
const sendAdminNewReturnEmail = (request, user, order) => {
  const adminEmail = process.env.ADMIN_NOTIFY_EMAIL;
  if (!adminEmail) return Promise.resolve(false);
  const t = adminNewReturnTemplate(request, user, order);
  return sendEmail({ to: adminEmail, ...t, emailType: "admin_new_order" });
};

module.exports.sendReturnConfirmEmail  = sendReturnConfirmEmail;
module.exports.sendReturnApprovedEmail = sendReturnApprovedEmail;
module.exports.sendReturnRejectedEmail = sendReturnRejectedEmail;
module.exports.sendAdminNewReturnEmail = sendAdminNewReturnEmail;

const logger = require("../utils/securityLogger");

// Logs security-relevant outcomes AFTER the response is sent, based purely on
// method + path + status code. It never touches controllers, so it can't
// change any request behavior.
const AUTH_EVENTS = {
  "POST /api/auth/login": {
    200: ["login_success", "info"],
    401: ["login_failed", "warn"],
    403: ["login_blocked", "warn"],
  },
  "POST /api/auth/register": {
    201: ["register_success", "info"],
    409: ["register_duplicate_email", "warn"],
  },
  "POST /api/auth/forgot-password": {
    200: ["password_reset_requested", "info"],
  },
  "POST /api/auth/reset-password": {
    200: ["password_reset_completed", "info"],
    400: ["password_reset_failed", "warn"],
  },
  "PUT /api/auth/change-password": {
    200: ["password_changed", "info"],
    401: ["password_change_failed", "warn"], // only when req.user is set (see below)
  },
};

// Polled on every page load by the frontend — a 401 here is normal for
// logged-out visitors and would flood the logs.
const QUIET_401_PATHS = new Set(["/api/auth/me"]);

module.exports = (req, res, next) => {
  const started = Date.now();

  res.on("finish", () => {
    try {
      const status = res.statusCode;
      const ctx = logger.fromReq(req);
      ctx.status = status;
      ctx.ms = Date.now() - started;

      let handled = false;

      const authEvent = AUTH_EVENTS[`${req.method} ${ctx.path}`]?.[status];
      if (authEvent) {
        const [event, level] = authEvent;
        // A 401 on change-password can also come from the `protect`
        // middleware (bad/missing token). Only call it a failed password
        // change if the user was actually authenticated.
        if (!(event === "password_change_failed" && !req.user)) {
          const fields = { ...ctx };
          if (ctx.path === "/api/auth/login" || ctx.path === "/api/auth/register") {
            const email = req.body && req.body.email;
            if (typeof email === "string") fields.email = email.trim().toLowerCase().slice(0, 150);
          }
          logger[level](event, fields);
          handled = true;
        }
      }

      if (!handled && status === 429) {
        logger.warn("rate_limited", ctx);
        handled = true;
      }

      if (!handled && (status === 401 || status === 403) && !QUIET_401_PATHS.has(ctx.path)) {
        logger.warn("access_denied", ctx);
        handled = true;
      }

      // Every state-changing admin request, success or failure.
      if (ctx.path.startsWith("/api/admin/") && req.method !== "GET") {
        logger[status >= 400 ? "warn" : "info"]("admin_action", ctx);
      }

      if (status >= 500) logger.error("server_error", ctx);
    } catch {
      // Logging must never break a request.
    }
  });

  next();
};

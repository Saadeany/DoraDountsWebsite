const fs = require("fs");
const logger = require("./securityLogger");

const PRIVATE_IP = /^(::ffff:)?(10\.|127\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)|^::1$/;

// Heuristic: are we running somewhere that isn't a plain local dev machine?
// (inside Docker, or talking to a non-local DB host)
const looksDeployed = () => {
  try {
    if (fs.existsSync("/.dockerenv")) return true;
  } catch { /* ignore */ }
  const host = process.env.DB_HOST;
  return !!host && !["localhost", "127.0.0.1"].includes(host);
};

// Returns a list of human-readable problems. Empty list = healthy.
const findProblems = (app) => {
  const problems = [];
  const env = process.env;

  if (env.NODE_ENV !== "production") {
    problems.push(`NODE_ENV is "${env.NODE_ENV || "(unset)"}" but this looks like a deployed environment — expected "production". Error details and cookie/HTTPS behavior depend on it.`);
  }

  const trust = app.get("trust proxy");
  if (!trust) {
    problems.push('Express "trust proxy" is not set — rate limiting will treat every visitor as one IP (the proxy).');
  }

  const jwt = env.JWT_SECRET || "";
  if (jwt.length < 32 || /change_?me|secret|example/i.test(jwt)) {
    problems.push("JWT_SECRET is missing, shorter than 32 chars, or still a placeholder. Generate one with: openssl rand -hex 64");
  }

  if (!/^https:\/\//i.test(env.CLIENT_URL || "")) {
    problems.push(`CLIENT_URL is "${env.CLIENT_URL || "(unset)"}" — production should be an https:// origin (secure cookies and CORS depend on it).`);
  }

  const dbPass = env.DB_PASSWORD || "";
  if (!dbPass || /change_?me|dora_password_123|password/i.test(dbPass)) {
    problems.push("DB_PASSWORD is empty or a known default/placeholder.");
  }

  if (!env.SMTP_USER || !env.SMTP_PASS || /change_?me/i.test(env.SMTP_PASS)) {
    problems.push("SMTP credentials are missing or placeholders — verification and order emails will fail.");
  }

  return problems;
};

// Call once at startup, AFTER app.set("trust proxy", ...).
// Warn-only by default so it can't take down a running deployment;
// set STRICT_ENV_CHECK=true to refuse to boot on problems.
const checkProductionEnv = (app) => {
  const relevant = env => env.NODE_ENV === "production" || looksDeployed();
  if (!relevant(process.env)) return; // plain local dev — nothing to check

  const problems = findProblems(app);
  if (problems.length === 0) {
    logger.info("env_check_ok", { nodeEnv: process.env.NODE_ENV, trustProxy: app.get("trust proxy") });
    return;
  }

  problems.forEach((p) => logger.warn("env_check_problem", { problem: p }));

  if (process.env.STRICT_ENV_CHECK === "true") {
    logger.error("env_check_fatal", { count: problems.length });
    process.exit(1);
  }
};

// One-shot middleware: on the first request that carries X-Forwarded-For it
// logs what Express resolved as the client IP. If that IP is a private/Docker
// address, the proxy hop count is too low and rate limiting is not per-visitor.
let probed = false;
const proxyTrustProbe = (req, res, next) => {
  const xff = req.headers["x-forwarded-for"];
  if (!probed && xff) {
    probed = true;
    const privateIp = PRIVATE_IP.test(req.ip || "");
    logger[privateIp ? "warn" : "info"]("proxy_trust_probe", {
      resolvedIp: req.ip,
      forwardedFor: logger.trunc(String(xff), 200),
      trustProxy: req.app.get("trust proxy"),
      verdict: privateIp
        ? "resolvedIp is a private address — raise TRUST_PROXY_HOPS by 1 (ignore if you're testing from your own LAN)"
        : "resolvedIp looks like a public client address — hop count is correct",
    });
  }
  next();
};

module.exports = { checkProductionEnv, proxyTrustProbe };

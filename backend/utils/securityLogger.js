// Structured (JSON-lines) security logger. Writes to stdout/stderr so
// `docker compose logs backend` picks it up with no extra dependencies.
// Never pass passwords, tokens, or request bodies into these helpers.

const trunc = (v, n) => (typeof v === "string" ? v.slice(0, n) : undefined);

const write = (level, event, fields = {}) => {
  const line = JSON.stringify({
    ts: new Date().toISOString(),
    level,
    type: "security",
    event,
    ...fields,
  });
  // JSON.stringify escapes newlines, so user input can't forge log lines.
  (level === "error" ? process.stderr : process.stdout).write(line + "\n");
};

// Common request context. Query strings are dropped on purpose — they can
// contain one-time tokens (e.g. /verify-email?token=...).
const fromReq = (req) => ({
  ip: req.ip,
  method: req.method,
  path: (req.originalUrl || "").split("?")[0],
  userId: req.user ? req.user.id : undefined,
  ua: trunc(req.headers && req.headers["user-agent"], 120),
});

module.exports = {
  info: (event, fields) => write("info", event, fields),
  warn: (event, fields) => write("warn", event, fields),
  error: (event, fields) => write("error", event, fields),
  fromReq,
  trunc,
};

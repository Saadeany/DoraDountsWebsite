# ── Felt & Form — Backend Dockerfile ─────────────────────────────────────
# Place this file at backend/Dockerfile in the repo.

FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev

FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production

# Only what's needed to run — no dev deps, no test files, no .env
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Uploads must exist and be writable by the non-root user.
# In production this directory is replaced by a mounted volume anyway,
# but we still create it so a fresh container boots cleanly.
RUN mkdir -p uploads/products uploads/categories uploads/profiles uploads/returns \
    && chown -R node:node /app

USER node
EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=5 \
  CMD wget -qO- http://127.0.0.1:5000/api/health || exit 1

CMD ["node", "server.js"]

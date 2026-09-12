# ── Felt & Form — Frontend Dockerfile ────────────────────────────────────
# Place this file at frontend/Dockerfile in the repo.
# Because frontend/src/api/axios.js uses a relative baseURL ("/api"), no
# build-time API URL is needed — nginx below proxies /api and /uploads to
# the backend container over the internal Docker network.

FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:1.27-alpine
RUN rm /etc/nginx/conf.d/default.conf
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=5 \
  CMD wget -qO- http://127.0.0.1:80/ || exit 1

CMD ["nginx", "-g", "daemon off;"]

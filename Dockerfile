# ---- Build stage ----
FROM node:22-slim AS build
WORKDIR /app

# Install all workspace dependencies (root + client + server).
COPY package.json package-lock.json* ./
COPY client/package.json ./client/
COPY server/package.json ./server/
RUN npm install

# Build client and server.
COPY . .
RUN npm run build

# Prune to production dependencies for the runtime image.
RUN npm prune --omit=dev

# ---- Runtime stage ----
FROM node:22-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=8080
ENV CACHE_DIR=/app/cache

# Server runtime + built artifacts.
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/server/package.json ./server/package.json
COPY --from=build /app/server/dist ./server/dist
COPY --from=build /app/client/dist ./client/dist

RUN mkdir -p /app/cache
EXPOSE 8080

CMD ["node", "server/dist/index.js"]

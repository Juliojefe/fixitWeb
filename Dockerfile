# ---- Build stage ----
FROM node:20-bullseye-slim AS builder
WORKDIR /app

# Accept build arg for runtime public envs (so values are baked into the build)
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

# Install deps (use lockfile for reproducible builds)
COPY package.json package-lock.json ./
RUN npm ci --unsafe-perm

# Copy source & build
COPY . .
RUN npm run build

# ---- Runtime stage ----
FROM node:20-bullseye-slim AS runner
WORKDIR /app
ENV NODE_ENV=production

# Copy package metadata and install production deps
COPY --from=builder /app/package.json /app/package-lock.json ./
RUN npm ci --only=production --no-audit --no-fund --unsafe-perm
COPY --from=builder /app/next.config.js ./

# Copy built output & static assets
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public

EXPOSE 3000
CMD ["npm", "run", "start"]
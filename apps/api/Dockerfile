FROM node:20-alpine AS base
WORKDIR /app

# Install dependencies
FROM base AS deps
COPY package.json package-lock.json* ./
COPY packages/shared-types/package.json ./packages/shared-types/
COPY packages/database/package.json ./packages/database/
COPY apps/api/package.json ./apps/api/
# Skip Puppeteer's bundled Chrome download — we install system Chromium instead
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
RUN npm ci --ignore-scripts

# Build
FROM deps AS builder
RUN npm install -g typescript@5
COPY tsconfig.base.json ./
COPY packages/shared-types ./packages/shared-types
COPY packages/database ./packages/database
COPY apps/api ./apps/api
RUN cd packages/shared-types && tsc
RUN cd packages/database && tsc
RUN cd apps/api && tsc

# Production image
FROM node:20-alpine AS runner
WORKDIR /app

# Install Chromium and required fonts for Puppeteer PDF generation
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    harfbuzz \
    ca-certificates \
    ttf-freefont

ENV NODE_ENV=production
# Point Puppeteer at the system Chromium
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

COPY package.json package-lock.json* ./
COPY packages/shared-types/package.json ./packages/shared-types/
COPY packages/database/package.json ./packages/database/
COPY apps/api/package.json ./apps/api/
RUN npm ci --omit=dev --ignore-scripts

COPY --from=builder /app/packages/shared-types/dist ./packages/shared-types/dist
COPY --from=builder /app/packages/database/dist ./packages/database/dist
COPY --from=builder /app/apps/api/dist ./apps/api/dist

EXPOSE 3000 3001

CMD ["node", "apps/api/dist/index.js"]

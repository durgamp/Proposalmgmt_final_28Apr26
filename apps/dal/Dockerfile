FROM node:20-alpine AS base
WORKDIR /app

# Install dependencies
FROM base AS deps
COPY package.json package-lock.json* ./
COPY packages/shared-types/package.json ./packages/shared-types/
COPY packages/database/package.json ./packages/database/
COPY apps/dal/package.json ./apps/dal/
RUN npm ci --ignore-scripts

# Build
FROM deps AS builder
RUN npm install -g typescript@5
COPY tsconfig.base.json ./
COPY packages/shared-types ./packages/shared-types
COPY packages/database ./packages/database
COPY apps/dal ./apps/dal
RUN cd packages/shared-types && tsc
RUN cd packages/database && tsc
RUN cd apps/dal && tsc

# Production image
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

COPY package.json package-lock.json* ./
COPY packages/shared-types/package.json ./packages/shared-types/
COPY packages/database/package.json ./packages/database/
COPY apps/dal/package.json ./apps/dal/
RUN npm ci --omit=dev --ignore-scripts

COPY --from=builder /app/packages/shared-types/dist ./packages/shared-types/dist
COPY --from=builder /app/packages/database/dist ./packages/database/dist
COPY --from=builder /app/apps/dal/dist ./apps/dal/dist

EXPOSE 5000

CMD ["node", "apps/dal/dist/index.js"]

FROM node:22-alpine AS base

# Install pnpm via Corepack
RUN corepack enable && corepack prepare pnpm@latest --activate

# Install system dependencies
RUN apk add --no-cache curl wget

# Set working directory
WORKDIR /app

# Copy package files for better caching
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY apps/server/package.json ./apps/server/
COPY apps/web/package.json ./apps/web/
COPY packages/*/package.json ./packages/*/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Generate Prisma client and build everything
RUN pnpm db:generate && pnpm build

# Expose ports for both services
EXPOSE 3000 3001

# Health check for both services
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || curl -f http://localhost:3001/health || exit 1

# Start both services using Turbo
CMD ["pnpm", "start"]

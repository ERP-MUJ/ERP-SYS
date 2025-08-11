FROM node:22-alpine

# Install pnpm (via Corepack)
RUN corepack enable && corepack prepare pnpm@latest --activate

# Install curl/wget for health checks
RUN apk add --no-cache curl wget

# Set workspace root
WORKDIR /app

# Copy monorepo (needed for pnpm workspace and prisma)
COPY . .

# Install all workspace dependencies (allow lockfile update inside image)
RUN pnpm -r install --no-frozen-lockfile

# Generate Prisma client from packages/db/prisma
RUN cd packages/db/prisma && npx prisma generate

# Build the server application
RUN cd apps/server && pnpm build

# Switch to server app for runtime
WORKDIR /app/apps/server

# Expose API port
EXPOSE 3001

# Default port env
ENV PORT=3001

# Add health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3001/ || exit 1

# Start backend in production mode
CMD ["pnpm", "start:prod"]


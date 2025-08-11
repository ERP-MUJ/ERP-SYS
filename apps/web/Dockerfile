FROM node:22-alpine
WORKDIR /app

# Install pnpm (via Corepack) and wget for health checks
RUN corepack enable && corepack prepare pnpm@latest --activate
RUN apk add --no-cache wget

# Copy the whole monorepo so workspace deps resolve
COPY . .

# Install workspace deps and build the web app
RUN pnpm -r install --no-frozen-lockfile
WORKDIR /app/apps/web
RUN pnpm build

# Expose frontend port
EXPOSE 3000

# Add health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/ || exit 1

# Start frontend
CMD ["pnpm", "start"]

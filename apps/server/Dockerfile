FROM node:22-alpine

# Install pnpm (via Corepack)
RUN corepack enable && corepack prepare pnpm@latest --activate

# Set workspace root
WORKDIR /app

# Copy monorepo (needed for pnpm workspace and prisma)
COPY . .

# Install workspace dependencies
RUN pnpm install --frozen-lockfile

# Generate Prisma client from packages/db/prisma
RUN cd packages/db/prisma && npx prisma generate

# Switch to server app for runtime
WORKDIR /app/apps/server

# Expose API port
EXPOSE 3001

# Default port env
ENV PORT=3001

# Start backend
CMD ["pnpm", "start"]


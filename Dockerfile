# Monorepo single-container build for web (Next.js) + server (NestJS)
FROM node:20-alpine

WORKDIR /app

# Tools
RUN apk add --no-cache libc6-compat && npm install -g pnpm

# Copy source
COPY . .

# Install workspace deps
RUN pnpm install

# Generate Prisma client
RUN pnpm --filter=@repo/db db:generate

# Build apps
RUN pnpm build

# Expose both ports (web 3000, server 3001)
EXPOSE 3000 3001

# Start: deploy DB migrations, then run both apps
CMD sh -lc "pnpm --filter=@repo/db db:deploy && node apps/server/dist/main.js & PORT=3000 pnpm --filter=web start"

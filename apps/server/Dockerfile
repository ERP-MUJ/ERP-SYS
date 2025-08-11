FROM node:20 AS builder
WORKDIR /app

# Enable pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy only dependency files for caching
COPY package.json pnpm-lock.yaml turbo.json ./
COPY apps/nestjs/package.json ./apps/nestjs/
COPY packages/db/package.json ./packages/db/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy full project
COPY . .

# Generate Prisma client & run migrations using Supabase env vars
# DATABASE_URL and DIRECT_URL must be provided in Coolify
RUN pnpm turbo run db:generate
RUN pnpm prisma migrate deploy --schema=packages/db/prisma/schema.prisma

# Build NestJS
RUN pnpm --filter=apps/nestjs build

FROM node:20 AS runner
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@latest --activate

COPY --from=builder /app ./

CMD ["pnpm", "--filter=apps/nestjs", "start:prod"]

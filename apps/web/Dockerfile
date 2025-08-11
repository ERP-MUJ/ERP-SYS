FROM node:20 AS builder
WORKDIR /app

# Enable pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy only dependency files for caching
COPY package.json pnpm-lock.yaml turbo.json ./
COPY apps/web/package.json ./apps/web/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy the rest of the repo
COPY . .

# Build Web
RUN pnpm --filter=apps/web build

FROM node:20 AS runner
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@latest --activate

COPY --from=builder /app ./

CMD ["pnpm", "--filter=apps/web", "start"]

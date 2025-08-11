FROM node:20 AS builder
WORKDIR /app

# Enable pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy only dependency files for caching
COPY package.json pnpm-lock.yaml turbo.json ./
COPY apps/nextjs/package.json ./apps/nextjs/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy the rest of the repo
COPY . .

# Build Next.js
RUN pnpm --filter=apps/nextjs build

FROM node:20 AS runner
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@latest --activate

COPY --from=builder /app ./

CMD ["pnpm", "--filter=apps/nextjs", "start"]

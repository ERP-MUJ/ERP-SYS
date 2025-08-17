FROM node:22-alpine

# Install pnpm via Corepack
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Copy everything
COPY . .

# Install dependencies
RUN pnpm install --frozen-lockfile

# Generate Prisma client and build everything
RUN pnpm db:generate && pnpm build

# Expose ports for both services
EXPOSE 3000 3001

# Start both services using Turbo
CMD ["pnpm", "start"]

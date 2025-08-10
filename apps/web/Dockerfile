FROM node:20-alpine

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm && apk add --no-cache libc6-compat

# Copy the entire workspace (simplified for Coolify)
COPY . .

# Install dependencies for the monorepo
RUN pnpm install

# Generate Prisma client for DB package (needed during build or runtime)
RUN pnpm --filter=@repo/db db:generate

# Build the web app
RUN pnpm --filter=web build

# Run the web app
WORKDIR /app/apps/web
EXPOSE 3000
CMD ["pnpm", "start"]

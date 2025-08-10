FROM node:20-alpine

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm && apk add --no-cache libc6-compat

# Copy the entire workspace (simplified for Coolify)
COPY . .

# Install dependencies for the monorepo
RUN pnpm install 

# Generate Prisma client for DB package
RUN pnpm --filter=@repo/db db:generate

# Build the server app
RUN pnpm --filter=server build

# Run the server
WORKDIR /app/apps/server
EXPOSE 3001
CMD ["node", "dist/main.js"]

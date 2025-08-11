FROM node:20

# Set working directory
WORKDIR /app

# Enable pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy all files
COPY . .

# Install deps
RUN pnpm install --frozen-lockfile

# Generate Prisma client (if needed)
RUN pnpm prisma generate

# Expose your backend port (change if different)
EXPOSE 3001

# Start app
CMD ["pnpm", "start"]


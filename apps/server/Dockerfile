FROM guergeiro/pnpm:22-10
WORKDIR /app

RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy only backend files
COPY . .

# Install dependencies
RUN pnpm install --frozen-lockfile

# Generate Prisma client
RUN pnpm prisma generate

# Expose API port
EXPOSE 3001

# Start backend
CMD ["pnpm", "start"]


FROM guergeiro/pnpm:22-10

# Generate Prisma client
RUN pnpm db:generate

RUN cd apps/server

RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy only backend files
COPY . .

# Install dependencies
RUN pnpm install --frozen-lockfile



# Expose API port
EXPOSE 3001

# Start backend
CMD ["pnpm", "start"]


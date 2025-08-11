FROM guergeiro/pnpm:22-10

# Generate Prisma client
RUN npx prisma generate


WORKDIR /app/server

RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy only backend files
COPY . .

# Install dependencies
RUN pnpm install --frozen-lockfile



# Expose API port
EXPOSE 3001

# Start backend
CMD ["pnpm", "start"]


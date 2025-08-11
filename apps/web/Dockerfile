FROM guergeiro/pnpm:22-10
WORKDIR /app/web

RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy only frontend files
COPY . .

# Install dependencies and build
RUN pnpm install --frozen-lockfile
RUN pnpm build

# Expose frontend port
EXPOSE 3000

# Start frontend
CMD ["pnpm", "start"]

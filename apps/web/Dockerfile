FROM node:22-alpine
WORKDIR /app

# Install pnpm (via Corepack)
RUN corepack enable && corepack prepare pnpm@latest --activate

## Copy the whole monorepo so workspace deps resolve
COPY . .

## Install workspace deps and build the web app
RUN pnpm install --frozen-lockfile
WORKDIR /app/apps/web
RUN pnpm build

# Expose frontend port
EXPOSE 3000

## Start frontend
CMD ["pnpm", "start"]

FROM node:22-alpine AS base

# Install pnpm via Corepack
RUN corepack enable && corepack prepare pnpm@latest --activate

# Install system dependencies
RUN apk add --no-cache curl wget

# Set working directory
WORKDIR /app

# Copy package files for better caching
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY apps/server/package.json ./apps/server/
COPY apps/web/package.json ./apps/web/
COPY packages/*/package.json ./packages/*/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Copy environment files if they exist, or create placeholders
RUN if [ -f apps/server/.env ]; then cp apps/server/.env apps/server/.env.backup; fi
RUN if [ -f apps/web/.env ]; then cp apps/web/.env apps/web/.env.backup; fi
RUN if [ -f packages/db/.env ]; then cp packages/db/.env packages/db/.env.backup; fi

# Create default environment files with placeholders
RUN echo "# Backend Environment - Set these in Coolify\n\
PORT=${PORT:-3001}\n\
NODE_ENV=${NODE_ENV:-production}\n\
JWT_SECRET=${JWT_SECRET:-your-jwt-secret}\n\
JWT_EXPIRES_IN=${JWT_EXPIRES_IN:-30d}\n\
DATABASE_URL=${DATABASE_URL}\n\
DIRECT_URL=${DIRECT_URL}\n\
GOOGLE_CLIENT_ID=${GOOGLE_CLIENT_ID}\n\
GOOGLE_CLIENT_SECRET=${GOOGLE_CLIENT_SECRET}\n\
GOOGLE_CALLBACK_URL=${GOOGLE_CALLBACK_URL:-https://erp.arunabha.in/api/auth/callback/google}\n\
SMTP_HOST=${SMTP_HOST:-smtp.gmail.com}\n\
SMTP_PORT=${SMTP_PORT:-465}\n\
SMTP_USER=${SMTP_USER}\n\
SMTP_PASSWORD=${SMTP_PASSWORD}\n\
MAIL_FROM=${MAIL_FROM}\n\
SMTP_FROM_NAME=${SMTP_FROM_NAME:-ERP System}\n\
GEMINI_API_KEY=${GEMINI_API_KEY}\n\
GEMINI_BASE_URL=${GEMINI_BASE_URL:-https://generativelanguage.googleapis.com}" > apps/server/.env

RUN echo "# Frontend Environment - Set these in Coolify\n\
NEXT_PUBLIC_APP_URL=${NEXT_PUBLIC_APP_URL:-https://erp.arunabha.in}\n\
NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL:-https://erp-backend.arunabha.in}\n\
NEXTAUTH_SECRET=${NEXTAUTH_SECRET:-your-nextauth-secret}\n\
NEXTAUTH_URL=${NEXTAUTH_URL:-https://erp.arunabha.in}\n\
GOOGLE_CLIENT_ID=${GOOGLE_CLIENT_ID}\n\
GOOGLE_CLIENT_SECRET=${GOOGLE_CLIENT_SECRET}\n\
NODE_ENV=${NODE_ENV:-production}" > apps/web/.env

RUN echo "# Database Environment - Set these in Coolify\n\
DATABASE_URL=${DATABASE_URL}\n\
DIRECT_URL=${DIRECT_URL}" > packages/db/.env

# Generate Prisma client and build everything
RUN pnpm db:generate && pnpm build

# Expose ports for both services
EXPOSE 3000 3001

# Health check for both services
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || curl -f http://localhost:3001/health || exit 1

# Start both services using Turbo
CMD ["pnpm", "start"]

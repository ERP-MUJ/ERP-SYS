# Coolify Deployment Guide for ERP System

## Project Overview
This is a Turborepo monorepo with:
- **Frontend**: Next.js app (`apps/web`) - Port 3000
- **Backend**: NestJS API (`apps/server`) - Port 3001
- **Database**: Prisma with PostgreSQL (`packages/db`)

## Deployment Strategy

### Option 1: Docker Compose Deployment (Recommended)

Deploy as a single Docker Compose stack with multiple services:

1. **Backend Service** - NestJS API server
2. **Frontend Service** - Next.js web application  
3. **Migration Service** - Database migration runner (runs once)

### Prerequisites

1. **PostgreSQL Database**
   - Create a PostgreSQL database in Coolify first
   - Note the connection string for environment variables

2. **Google OAuth Setup**
   - Create OAuth credentials in Google Cloud Console
   - Add your Coolify domain to authorized redirect URIs

## Step-by-Step Deployment Instructions

### 1. Create New Resource in Coolify

1. Go to your Coolify dashboard
2. Click "New Resource" → "Docker Compose"
3. Choose your server and project
4. Give it a name like "erp-system"

### 2. Configure the Docker Compose

1. Upload or paste the `docker-compose.yml` file
2. Coolify will automatically detect the services and create the environment variables UI

### 3. Set Environment Variables

Configure these required environment variables in Coolify's UI:

#### Database Configuration
```bash
DATABASE_URL=postgresql://username:password@host:5432/database_name
DIRECT_URL=postgresql://username:password@host:5432/database_name
```

#### Google OAuth
```bash
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

#### SMTP Configuration (for email notifications)
```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
MAIL_FROM=noreply@yourdomain.com
SMTP_FROM_NAME=ERP System
```

#### AI Integration (Optional)
```bash
GEMINI_API_KEY=your-gemini-api-key
GEMINI_BASE_URL=https://generativelanguage.googleapis.com
```

### 4. Configure Domain & SSL

1. Set up your domain in the "Domains" section
2. Enable SSL/TLS certificates
3. Configure the following service domains:
   - Frontend: `your-domain.com` (main domain)
   - Backend API: `your-domain.com/api` (path-based routing)

### 5. Deploy

1. Click "Deploy" to start the deployment
2. Monitor the build logs for any issues
3. The migration service will run database migrations automatically

## Important Notes

### Build Process
- Uses Turborepo for efficient building
- Installs all dependencies in the container
- Generates Prisma client automatically
- Builds optimized production bundles

### Environment Variables
- Coolify automatically generates secure passwords for JWT and NextAuth
- Service FQDNs are automatically configured for internal communication
- Use Coolify's magic variables for dynamic configuration

### Health Checks
- Both services have health checks configured
- Frontend waits for backend to be healthy before starting
- Migration service is excluded from health checks (runs once)

### Networking
- All services communicate through internal Docker network
- Only frontend and backend API endpoints are exposed publicly

## Troubleshooting

### Common Issues

1. **Build Failures**
   - Check if all required environment variables are set
   - Verify database connection string format
   - Ensure Google OAuth credentials are correct

2. **Database Connection Issues**
   - Verify DATABASE_URL and DIRECT_URL are identical for MongoDB
   - Check database server is running and accessible

3. **Authentication Problems**
   - Verify Google OAuth redirect URIs match your domain
   - Check NEXTAUTH_SECRET is properly generated

### Logs
Monitor these logs in Coolify:
- Build logs for compilation issues
- Runtime logs for application errors
- Migration logs for database issues

## Alternative Deployment: Separate Services

If you prefer to deploy each service separately:

### Service 1: Backend API
- **Build Context**: Root directory
- **Dockerfile**: `apps/server/Dockerfile`
- **Port**: 3001
- **Health Check**: `/health`

### Service 2: Frontend Web
- **Build Context**: Root directory  
- **Dockerfile**: `apps/web/Dockerfile`
- **Port**: 3000
- **Dependencies**: Backend API service

## Post-Deployment

1. Access your application at your configured domain
2. Test authentication with Google OAuth
3. Verify database connectivity and data persistence
4. Monitor application logs and performance

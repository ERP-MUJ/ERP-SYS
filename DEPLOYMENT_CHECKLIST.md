# ERP System - Coolify Deployment Checklist

## Pre-Deployment Setup

### 1. Database Setup

- [ ] Create PostgreSQL database in Coolify
- [ ] Note down the database connection URL
- [ ] Ensure database has necessary extensions enabled

### 2. Google OAuth Setup

- [ ] Go to [Google Cloud Console](https://console.cloud.google.com/)
- [ ] Create new project or select existing one
- [ ] Enable Google+ API
- [ ] Create OAuth 2.0 credentials
- [ ] Add authorized redirect URIs:
  - `https://yourdomain.com/api/auth/callback/google`
- [ ] Note down Client ID and Client Secret

### 3. Email Configuration (Optional)

- [ ] Set up Gmail App Password or SMTP service
- [ ] Note down SMTP credentials

### 4. AI Integration (Optional)

- [ ] Get Gemini API key from Google AI Studio
- [ ] Note down the API key

## Coolify Deployment Steps

### 1. Create New Resource

- [ ] Login to Coolify dashboard
- [ ] Click "New Resource" → "Docker Compose"
- [ ] Select your server and project
- [ ] Name: "erp-system"

### 2. Upload Configuration

- [ ] Upload `docker-compose.yml` from your repository
- [ ] Coolify will parse and create environment variable fields

### 3. Configure Environment Variables

#### Required Variables:

- [ ] `DATABASE_URL` - PostgreSQL connection string
- [ ] `DIRECT_URL` - Same as DATABASE_URL
- [ ] `GOOGLE_CLIENT_ID` - From Google Cloud Console
- [ ] `GOOGLE_CLIENT_SECRET` - From Google Cloud Console

#### Optional Variables:

- [ ] `SMTP_HOST` - Email server (default: smtp.gmail.com)
- [ ] `SMTP_PORT` - Email port (default: 465)
- [ ] `SMTP_USER` - Email username
- [ ] `SMTP_PASSWORD` - Email password/app password
- [ ] `MAIL_FROM` - From email address
- [ ] `SMTP_FROM_NAME` - Display name for emails
- [ ] `GEMINI_API_KEY` - For AI features
- [ ] `GEMINI_BASE_URL` - AI API endpoint

### 4. Domain Configuration

- [ ] Set up domain in Coolify
- [ ] Configure SSL/TLS certificates
- [ ] Map services:
  - Frontend: `yourdomain.com`
  - Backend API: `yourdomain.com/api`

### 5. Deploy

- [ ] Click "Deploy" button
- [ ] Monitor build logs for errors
- [ ] Wait for all services to be healthy

## Post-Deployment Verification

### 1. Application Access

- [ ] Visit `https://yourdomain.com`
- [ ] Verify frontend loads correctly
- [ ] Check API documentation at `https://yourdomain.com/api/docs`

### 2. Authentication Testing

- [ ] Test Google OAuth login
- [ ] Verify user session persistence
- [ ] Check JWT token generation

### 3. Database Connectivity

- [ ] Verify database migrations ran successfully
- [ ] Test data creation and retrieval
- [ ] Check Prisma client functionality

### 4. Email Functionality (if configured)

- [ ] Test email sending functionality
- [ ] Verify email templates render correctly

### 5. Performance & Monitoring

- [ ] Monitor application logs in Coolify
- [ ] Check resource usage (CPU, Memory)
- [ ] Verify health checks are passing

## Troubleshooting Common Issues

### Build Failures

- [ ] Check environment variables are set correctly
- [ ] Verify database connection string format
- [ ] Ensure all required secrets are provided

### Authentication Issues

- [ ] Verify Google OAuth redirect URIs
- [ ] Check NEXTAUTH_SECRET is generated
- [ ] Confirm domain matches OAuth settings

### Database Problems

- [ ] Verify DATABASE_URL format
- [ ] Check database server accessibility
- [ ] Ensure migration service completed

### Email Issues

- [ ] Verify SMTP credentials
- [ ] Check firewall settings for SMTP ports
- [ ] Test email provider connectivity

## Monitoring & Maintenance

### Regular Tasks

- [ ] Monitor application logs weekly
- [ ] Check database performance metrics
- [ ] Review security updates
- [ ] Backup database regularly

### Scaling Considerations

- [ ] Monitor resource usage trends
- [ ] Plan for horizontal scaling if needed
- [ ] Consider CDN for static assets
- [ ] Implement caching strategies

## Support Resources

- [Coolify Documentation](https://coolify.io/docs/)
- [Docker Compose Reference](https://docs.docker.com/compose/)
- [NestJS Deployment Guide](https://docs.nestjs.com/deployment)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Prisma Production Guide](https://www.prisma.io/docs/guides/deployment)

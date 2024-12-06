# Deployment Checklist for Windsurf Gear Tracker Pro

## Pre-Deployment Steps

1. Environment Setup
   - [ ] Copy `production.env` to `.env`
   - [ ] Update JWT_SECRET with a secure key
   - [ ] Configure email service credentials
   - [ ] Set up MongoDB connection string for production

2. Security Checks
   - [ ] Ensure all sensitive data is properly encrypted
   - [ ] Verify JWT token expiration settings
   - [ ] Check rate limiting configuration
   - [ ] Review access control policies

3. Database Setup
   - [ ] Create production MongoDB database
   - [ ] Set up database user with minimal required permissions
   - [ ] Configure database backups
   - [ ] Test database connection with production credentials

4. Performance Optimization
   - [ ] Enable Node.js production mode
   - [ ] Configure PM2 for process management
   - [ ] Set up proper logging
   - [ ] Configure compression middleware

## Deployment Steps

1. Server Setup
   ```bash
   # Install PM2 globally
   npm install -g pm2

   # Install dependencies
   npm install --production

   # Start the application with PM2
   pm2 start src/index.js --name "windsurf-gear-api"

   # Save PM2 configuration
   pm2 save

   # Setup PM2 startup script
   pm2 startup
   ```

2. Monitoring Setup
   ```bash
   # Monitor the application
   pm2 monitor

   # View logs
   pm2 logs windsurf-gear-api
   ```

## Post-Deployment Checks

1. API Health Check
   - [ ] Test user registration and login
   - [ ] Verify email verification flow
   - [ ] Test all CRUD operations for locations
   - [ ] Test all CRUD operations for categories
   - [ ] Verify file upload functionality

2. Performance Verification
   - [ ] Check API response times
   - [ ] Monitor memory usage
   - [ ] Verify database query performance
   - [ ] Test concurrent user load

3. Security Verification
   - [ ] Verify SSL/TLS configuration
   - [ ] Test CORS settings
   - [ ] Verify authentication flows
   - [ ] Check rate limiting effectiveness

## Maintenance Plan

1. Regular Tasks
   - Daily database backups
   - Log rotation
   - Performance monitoring
   - Security updates

2. Emergency Procedures
   - Database restore process
   - Rollback procedures
   - Emergency contacts list

## Production Environment Variables

```env
NODE_ENV=production
PORT=3001
MONGODB_URI=mongodb://[username]:[password]@[host]:[port]/windsurf-gear
JWT_SECRET=[secure-random-string]
EMAIL_SERVICE=[your-email-service]
EMAIL_USER=[your-email]
EMAIL_PASSWORD=[your-email-password]
```

## Useful Commands

```bash
# Start application
pm2 start src/index.js --name "windsurf-gear-api"

# View logs
pm2 logs

# Monitor application
pm2 monit

# Restart application
pm2 restart windsurf-gear-api

# Stop application
pm2 stop windsurf-gear-api

# View application status
pm2 status
```

## Support and Troubleshooting

For issues or support:
1. Check application logs: `pm2 logs windsurf-gear-api`
2. Monitor system resources: `pm2 monit`
3. Review MongoDB logs
4. Check Node.js process status

## Backup and Recovery

1. Database Backup
   ```bash
   mongodump --uri="mongodb://[username]:[password]@[host]:[port]/windsurf-gear" --out=/backup/$(date +%Y%m%d)
   ```

2. Database Restore
   ```bash
   mongorestore --uri="mongodb://[username]:[password]@[host]:[port]/windsurf-gear" /backup/[backup-date]
   ```

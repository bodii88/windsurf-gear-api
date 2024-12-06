const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuration
const config = {
    backupDir: path.join(__dirname, '../backups'),
    envFile: path.join(__dirname, '../production.env'),
    targetEnvFile: path.join(__dirname, '../.env')
};

// Utility functions
const log = (message) => console.log(`[${new Date().toISOString()}] ${message}`);
const error = (message) => console.error(`[${new Date().toISOString()}] ERROR: ${message}`);

// Execute command with error handling
function execute(command, errorMessage) {
    try {
        log(`Executing: ${command}`);
        execSync(command, { stdio: 'inherit' });
        return true;
    } catch (err) {
        error(`${errorMessage}: ${err.message}`);
        return false;
    }
}

// Main deployment function
async function deploy() {
    log('Starting deployment process...');

    // 1. Check if production.env exists
    if (!fs.existsSync(config.envFile)) {
        error('production.env file not found. Please create it first.');
        process.exit(1);
    }

    // 2. Create backup directory if it doesn't exist
    if (!fs.existsSync(config.backupDir)) {
        fs.mkdirSync(config.backupDir, { recursive: true });
    }

    // 3. Backup current .env if it exists
    if (fs.existsSync(config.targetEnvFile)) {
        const backupPath = path.join(config.backupDir, `.env.backup.${Date.now()}`);
        fs.copyFileSync(config.targetEnvFile, backupPath);
        log(`Backed up current .env to ${backupPath}`);
    }

    // 4. Copy production.env to .env
    fs.copyFileSync(config.envFile, config.targetEnvFile);
    log('Copied production.env to .env');

    // 5. Install production dependencies
    if (!execute('npm ci --production', 'Failed to install dependencies')) {
        process.exit(1);
    }

    // 6. Run database migrations if they exist
    if (fs.existsSync(path.join(__dirname, '../migrations'))) {
        if (!execute('npm run migrate', 'Failed to run migrations')) {
            process.exit(1);
        }
    }

    // 7. Stop existing PM2 process if running
    execute('pm2 stop windsurf-gear-api', 'Failed to stop existing process');

    // 8. Start application with PM2
    if (!execute('pm2 start ecosystem.config.js --env production', 'Failed to start application')) {
        process.exit(1);
    }

    // 9. Save PM2 process list
    if (!execute('pm2 save', 'Failed to save PM2 process list')) {
        process.exit(1);
    }

    // 10. Setup PM2 startup script
    execute('pm2 startup', 'Failed to setup PM2 startup');

    // 11. Start monitoring
    if (!execute('node scripts/monitor.js', 'Failed to start monitoring')) {
        log('Warning: Monitoring script failed to start');
    }

    // 12. Setup daily backups
    const cronJob = '0 0 * * * node scripts/backup.js';
    execute(`(crontab -l 2>/dev/null; echo "${cronJob}") | crontab -`, 'Failed to setup backup cron job');

    log('Deployment completed successfully!');
    log('Next steps:');
    log('1. Verify application is running: pm2 status');
    log('2. Check logs: pm2 logs windsurf-gear-api');
    log('3. Monitor application: pm2 monit');
    log('4. Test all endpoints');
}

// Run deployment
deploy().catch(err => {
    error('Deployment failed:', err);
    process.exit(1);
});

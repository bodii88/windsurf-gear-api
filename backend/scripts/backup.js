const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const BACKUP_DIR = path.join(__dirname, '../backups');
const MAX_BACKUPS = 7; // Keep a week's worth of backups

// Ensure backup directory exists
if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

// Generate backup filename with timestamp
const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const backupPath = path.join(BACKUP_DIR, `backup-${timestamp}`);

// MongoDB backup command
const mongodump = `mongodump --uri="${process.env.MONGODB_URI}" --out="${backupPath}"`;

console.log('Starting database backup...');

exec(mongodump, (error, stdout, stderr) => {
    if (error) {
        console.error('Backup failed:', error);
        process.exit(1);
    }

    console.log('Backup completed successfully');
    console.log('Backup location:', backupPath);

    // Clean up old backups
    const backups = fs.readdirSync(BACKUP_DIR)
        .filter(file => fs.statSync(path.join(BACKUP_DIR, file)).isDirectory())
        .sort((a, b) => b.localeCompare(a)); // Sort in descending order

    // Remove old backups
    if (backups.length > MAX_BACKUPS) {
        backups.slice(MAX_BACKUPS).forEach(backup => {
            const backupPath = path.join(BACKUP_DIR, backup);
            fs.rmSync(backupPath, { recursive: true, force: true });
            console.log(`Removed old backup: ${backup}`);
        });
    }

    // Create backup report
    const report = {
        timestamp: new Date().toISOString(),
        backupPath,
        status: 'success',
        remainingBackups: Math.min(backups.length, MAX_BACKUPS)
    };

    fs.writeFileSync(
        path.join(BACKUP_DIR, 'backup-report.json'),
        JSON.stringify(report, null, 2)
    );
});

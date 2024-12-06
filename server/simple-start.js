const { execSync } = require('child_process');
const path = require('path');

try {
    // Set memory limit and other options
    process.env.NODE_OPTIONS = '--max-old-space-size=256';
    
    console.log('Starting server in development mode...');
    console.log('Current working directory:', process.cwd());
    
    // Run ts-node
    execSync('npx ts-node --transpile-only ./src/server.ts', {
        stdio: 'inherit',
        env: {
            ...process.env,
            NODE_ENV: 'development',
            PORT: '3001',
            DEBUG: 'express:*'
        }
    });
} catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
}

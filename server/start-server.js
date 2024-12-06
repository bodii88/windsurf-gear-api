const { spawn } = require('child_process');
const path = require('path');

// Resource management configuration
process.env.UV_THREADPOOL_SIZE = '4'; // Limit thread pool size
process.env.NODE_OPTIONS = '--max-old-space-size=512'; // Limit max memory to 512MB

// Kill any existing node processes
const cleanup = spawn('taskkill', ['/F', '/IM', 'node.exe'], {
    shell: true
});

cleanup.on('close', () => {
    console.log('Starting server with optimized settings...');
    
    // Start the server with explicit resource limits
    const server = spawn('npx', [
        'ts-node',
        '--transpile-only', // Skip type checking for better performance
        '--max-old-space-size=512',
        './src/server.ts'
    ], {
        env: {
            ...process.env,
            NODE_ENV: 'development',
            TS_NODE_PROJECT: path.resolve(__dirname, 'tsconfig.json'),
            UV_THREADPOOL_SIZE: '4'
        }
    });

    server.stdout.on('data', (data) => {
        console.log(`[Server] ${data}`);
    });

    server.stderr.on('data', (data) => {
        console.error(`[Error] ${data}`);
    });

    server.on('error', (error) => {
        console.error('[Fatal Error]:', error);
        process.exit(1);
    });

    let startupTimeout = setTimeout(() => {
        console.error('Server startup timeout exceeded');
        process.exit(1);
    }, 30000); // 30 second timeout

    server.stdout.on('data', (data) => {
        if (data.toString().includes('Server is running')) {
            clearTimeout(startupTimeout);
        }
    });

    server.on('close', (code) => {
        console.log(`Server process exited with code ${code}`);
        process.exit(code);
    });
});

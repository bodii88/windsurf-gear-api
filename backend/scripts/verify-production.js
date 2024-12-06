const axios = require('axios');
const mongoose = require('mongoose');
require('dotenv').config();

const checks = {
    passed: 0,
    failed: 0,
    warnings: 0
};

async function runChecks() {
    console.log('🔍 Starting Production Verification Checks\n');

    // 1. Environment Variables Check
    console.log('1️⃣ Checking Environment Variables...');
    const requiredEnvVars = [
        'NODE_ENV',
        'PORT',
        'MONGODB_URI',
        'JWT_SECRET',
        'EMAIL_SERVICE',
        'EMAIL_USER',
        'EMAIL_PASSWORD',
        'FRONTEND_URL'
    ];

    requiredEnvVars.forEach(varName => {
        if (!process.env[varName]) {
            console.log(`❌ Missing ${varName}`);
            checks.failed++;
        } else {
            if (varName === 'JWT_SECRET' && process.env[varName].length < 32) {
                console.log(`⚠️ JWT_SECRET might not be strong enough`);
                checks.warnings++;
            } else if (varName === 'NODE_ENV' && process.env[varName] !== 'production') {
                console.log(`⚠️ NODE_ENV is not set to production`);
                checks.warnings++;
            } else {
                console.log(`✅ ${varName} is set`);
                checks.passed++;
            }
        }
    });

    // 2. Database Connection Check
    console.log('\n2️⃣ Checking Database Connection...');
    try {
        await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log('✅ Database connection successful');
        checks.passed++;

        // Check indexes
        const collections = ['locations', 'categories', 'users'];
        for (const collection of collections) {
            const indexes = await mongoose.connection.collection(collection).indexes();
            console.log(`✅ ${collection} collection has ${indexes.length} indexes`);
            checks.passed++;
        }
    } catch (error) {
        console.log('❌ Database connection failed:', error.message);
        checks.failed++;
    }

    // 3. API Health Check
    console.log('\n3️⃣ Checking API Health...');
    try {
        const response = await axios.get(`http://localhost:${process.env.PORT}/health`);
        if (response.data.status === 'healthy') {
            console.log('✅ API health check passed');
            checks.passed++;
        } else {
            console.log('⚠️ API health check returned unexpected status');
            checks.warnings++;
        }
    } catch (error) {
        console.log('❌ API health check failed:', error.message);
        checks.failed++;
    }

    // 4. Security Headers Check
    console.log('\n4️⃣ Checking Security Headers...');
    try {
        const response = await axios.get(`http://localhost:${process.env.PORT}/health`);
        const headers = response.headers;
        const requiredHeaders = [
            'x-content-type-options',
            'x-frame-options',
            'x-xss-protection'
        ];

        requiredHeaders.forEach(header => {
            if (headers[header]) {
                console.log(`✅ ${header} is set`);
                checks.passed++;
            } else {
                console.log(`❌ Missing ${header} header`);
                checks.failed++;
            }
        });
    } catch (error) {
        console.log('❌ Security headers check failed:', error.message);
        checks.failed++;
    }

    // 5. PM2 Process Check
    console.log('\n5️⃣ Checking PM2 Process...');
    try {
        const pm2List = require('child_process')
            .execSync('pm2 list')
            .toString();
        
        if (pm2List.includes('windsurf-gear-api')) {
            console.log('✅ PM2 process is running');
            checks.passed++;
        } else {
            console.log('❌ PM2 process not found');
            checks.failed++;
        }
    } catch (error) {
        console.log('❌ PM2 check failed:', error.message);
        checks.failed++;
    }

    // 6. Memory Usage Check
    console.log('\n6️⃣ Checking Memory Usage...');
    const memoryUsage = process.memoryUsage();
    const heapUsedMB = Math.round(memoryUsage.heapUsed / 1024 / 1024);
    const heapTotalMB = Math.round(memoryUsage.heapTotal / 1024 / 1024);
    const heapUsagePercent = Math.round((heapUsedMB / heapTotalMB) * 100);

    if (heapUsagePercent > 80) {
        console.log(`⚠️ High memory usage: ${heapUsagePercent}%`);
        checks.warnings++;
    } else {
        console.log(`✅ Memory usage is acceptable: ${heapUsagePercent}%`);
        checks.passed++;
    }

    // Summary
    console.log('\n📊 Verification Summary');
    console.log('====================');
    console.log(`✅ Passed: ${checks.passed}`);
    console.log(`❌ Failed: ${checks.failed}`);
    console.log(`⚠️ Warnings: ${checks.warnings}`);

    if (checks.failed > 0) {
        console.log('\n❌ Production verification failed! Please fix the issues above before deploying.');
        process.exit(1);
    } else if (checks.warnings > 0) {
        console.log('\n⚠️ Production verification passed with warnings. Review warnings before proceeding.');
    } else {
        console.log('\n✅ All production checks passed! System is ready for deployment.');
    }

    // Cleanup
    await mongoose.disconnect();
    process.exit(checks.failed > 0 ? 1 : 0);
}

// Run checks
runChecks().catch(error => {
    console.error('Verification script failed:', error);
    process.exit(1);
});

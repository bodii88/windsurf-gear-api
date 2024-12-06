const axios = require('axios');
const nodemailer = require('nodemailer');
require('dotenv').config();

const ALERT_THRESHOLD = {
    responseTime: 1000, // 1 second
    memoryUsage: 80, // 80% of total memory
    errorRate: 5 // 5% error rate
};

// Email configuration
const transporter = nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
    }
});

// Monitor endpoints
const endpoints = [
    '/health',
    '/api/auth/login',
    '/api/categories',
    '/api/locations'
];

// Monitoring function
async function monitorEndpoint(endpoint) {
    const startTime = Date.now();
    try {
        const response = await axios.get(`http://localhost:${process.env.PORT}${endpoint}`, {
            timeout: 5000
        });
        const responseTime = Date.now() - startTime;

        return {
            endpoint,
            status: response.status,
            responseTime,
            error: null
        };
    } catch (error) {
        return {
            endpoint,
            status: error.response?.status || 500,
            responseTime: Date.now() - startTime,
            error: error.message
        };
    }
}

// Send alert
async function sendAlert(message) {
    try {
        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: process.env.ALERT_EMAIL,
            subject: 'Windsurf Gear API Alert',
            text: message
        });
        console.log('Alert sent:', message);
    } catch (error) {
        console.error('Failed to send alert:', error);
    }
}

// Main monitoring loop
async function monitor() {
    console.log('Starting monitoring...');

    try {
        // Check endpoints
        const results = await Promise.all(endpoints.map(monitorEndpoint));
        
        // Analyze results
        const issues = results.filter(result => {
            return (
                result.status !== 200 ||
                result.responseTime > ALERT_THRESHOLD.responseTime ||
                result.error
            );
        });

        // Get system metrics
        const memoryUsage = process.memoryUsage();
        const heapUsedPercent = (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100;

        // Check for issues
        if (issues.length > 0 || heapUsedPercent > ALERT_THRESHOLD.memoryUsage) {
            let alertMessage = 'API Monitoring Alert:\n\n';

            if (issues.length > 0) {
                alertMessage += 'Endpoint Issues:\n';
                issues.forEach(issue => {
                    alertMessage += `- ${issue.endpoint}: ${issue.status} (${issue.responseTime}ms)`;
                    if (issue.error) alertMessage += ` - Error: ${issue.error}`;
                    alertMessage += '\n';
                });
            }

            if (heapUsedPercent > ALERT_THRESHOLD.memoryUsage) {
                alertMessage += `\nHigh Memory Usage: ${heapUsedPercent.toFixed(2)}%\n`;
            }

            await sendAlert(alertMessage);
        }

        // Log results
        console.log('Monitoring Results:', {
            timestamp: new Date().toISOString(),
            endpoints: results,
            memoryUsage: {
                heapUsedPercent: heapUsedPercent.toFixed(2) + '%',
                heapUsed: (memoryUsage.heapUsed / 1024 / 1024).toFixed(2) + 'MB',
                heapTotal: (memoryUsage.heapTotal / 1024 / 1024).toFixed(2) + 'MB'
            }
        });

    } catch (error) {
        console.error('Monitoring failed:', error);
        await sendAlert(`Monitoring system error: ${error.message}`);
    }
}

// Run monitoring every 5 minutes
setInterval(monitor, 5 * 60 * 1000);
monitor(); // Initial run

require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const compression = require('compression');

// Import routes
const authRoutes = require('./routes/auth');
const categoryRoutes = require('./routes/categories');
const locationRoutes = require('./routes/locations');
const itemRoutes = require('./routes/items');

const app = express();

// Security middleware
app.use(helmet());
app.use(compression());

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: process.env.NODE_ENV === 'production' ? 100 : 1000,
    message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// CORS configuration
const corsOptions = {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// Body parser middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/locations', locationRoutes);
app.use('/api/items', itemRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date(),
        uptime: process.uptime()
    });
});

// Root route handler
app.get('/', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Windsurf Gear API</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    max-width: 800px;
                    margin: 0 auto;
                    padding: 20px;
                    line-height: 1.6;
                }
                .container {
                    background-color: #f5f5f5;
                    border-radius: 5px;
                    padding: 20px;
                    margin-top: 20px;
                }
                h1 {
                    color: #333;
                    border-bottom: 2px solid #ddd;
                    padding-bottom: 10px;
                }
                .endpoint {
                    margin: 10px 0;
                    padding: 10px;
                    background-color: #fff;
                    border-radius: 3px;
                }
                .method {
                    font-weight: bold;
                    color: #0066cc;
                }
            </style>
        </head>
        <body>
            <h1>Windsurf Gear API</h1>
            <div class="container">
                <h2>API Status: Online</h2>
                <p>The Windsurf Gear API is running. This is the backend service for the Windsurf Gear application.</p>
                
                <h3>Available Endpoints:</h3>
                <div class="endpoint">
                    <span class="method">GET</span> /api/health - Health check endpoint
                </div>
                <div class="endpoint">
                    <span class="method">POST</span> /api/auth/register - User registration
                </div>
                <div class="endpoint">
                    <span class="method">POST</span> /api/auth/login - User login
                </div>
                <div class="endpoint">
                    <span class="method">GET</span> /api/categories - Get all categories
                </div>
                <div class="endpoint">
                    <span class="method">GET</span> /api/items - Get all items
                </div>
                <div class="endpoint">
                    <span class="method">GET</span> /api/locations - Get all locations
                </div>
            </div>
        </body>
        </html>
    `);
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});

// MongoDB connection with retry logic
const connectWithRetry = async (retries = 5, interval = 5000) => {
    for (let i = 0; i < retries; i++) {
        try {
            console.log(`MongoDB connection attempt ${i + 1}`);
            await mongoose.connect(process.env.MONGODB_URI, {
                family: 4
            });
            console.log('MongoDB connected successfully');
            return;
        } catch (err) {
            console.log(`MongoDB connection attempt ${i + 1} failed:`, err.message);
            if (i === retries - 1) {
                console.log('Max retries reached. Exiting...');
                process.exit(1);
            }
            await new Promise(resolve => setTimeout(resolve, interval));
        }
    }
};

// Connect to MongoDB
connectWithRetry();

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received. Performing graceful shutdown...');
    mongoose.connection.close(false, () => {
        console.log('MongoDB connection closed.');
        process.exit(0);
    });
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
    console.error('Unhandled Promise Rejection:', err);
    // Close server & exit process
    app.close(() => process.exit(1));
});

module.exports = app; // For testing purposes

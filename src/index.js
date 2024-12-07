require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
const path = require('path');

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
    max: process.env.NODE_ENV === 'production' ? 100 : 1000, // limit each IP to 100 requests per windowMs in production
    message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// CORS configuration
const corsOptions = {
    origin: process.env.NODE_ENV === 'production' 
        ? process.env.FRONTEND_URL 
        : 'http://localhost:3000',
    credentials: true,
    optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// Body parser middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// MongoDB connection with retry logic
const connectWithRetry = async () => {
    const maxRetries = 5;
    let retries = 0;

    while (retries < maxRetries) {
        try {
            await mongoose.connect(process.env.MONGODB_URI, {
                useNewUrlParser: true,
                useUnifiedTopology: true
            });
            console.log('MongoDB connected successfully');
            break;
        } catch (err) {
            retries++;
            console.error(`MongoDB connection attempt ${retries} failed:`, err.message);
            if (retries === maxRetries) {
                console.error('Max retries reached. Exiting...');
                process.exit(1);
            }
            // Wait for 5 seconds before retrying
            await new Promise(resolve => setTimeout(resolve, 5000));
        }
    }
};

// Connect to MongoDB
connectWithRetry();

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        success: false,
        message: process.env.NODE_ENV === 'production' 
            ? 'Internal server error' 
            : err.message
    });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/locations', locationRoutes);
app.use('/api/items', itemRoutes); 

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV,
        uptime: process.uptime()
    });
});

// Serve static files from the public directory if it exists
if (process.env.NODE_ENV === 'production') {
    const publicPath = path.join(__dirname, '../public');
    
    // Log the public directory path for debugging
    console.log('Public directory path:', publicPath);
    
    // Check if public directory exists
    const fs = require('fs');
    if (fs.existsSync(publicPath)) {
        console.log('Public directory exists');
        app.use(express.static(publicPath));
        
        // Handle SPA routing - send all requests to index.html
        app.get('*', (req, res) => {
            if (!req.path.startsWith('/api/')) {
                const indexPath = path.join(publicPath, 'index.html');
                if (fs.existsSync(indexPath)) {
                    res.sendFile(indexPath);
                } else {
                    console.log('index.html not found at:', indexPath);
                    res.status(404).send('Not found');
                }
            }
        });
    } else {
        console.log('Public directory does not exist');
    }
}

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received. Performing graceful shutdown...');
    mongoose.connection.close(false, () => {
        console.log('MongoDB connection closed.');
        process.exit(0);
    });
});

const PORT = process.env.PORT || 3001;
const server = app.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
    console.error('Unhandled Promise Rejection:', err);
    // Close server & exit process
    server.close(() => process.exit(1));
});

module.exports = app; // For testing purposes

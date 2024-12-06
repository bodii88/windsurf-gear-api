const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = async (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        
        if (!token) {
            return res.status(401).json({ 
                success: false,
                message: 'Authentication required' 
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.userId);

        if (!user) {
            return res.status(401).json({ 
                success: false,
                message: 'User not found' 
            });
        }

        // Record login information
        const ip = req.ip || req.connection.remoteAddress;
        const userAgent = req.headers['user-agent'];
        await user.recordLogin(ip, userAgent);

        req.token = token;
        req.user = user;
        next();
    } catch (error) {
        res.status(401).json({ 
            success: false,
            message: 'Invalid token',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// Middleware for checking admin role
const requireAdmin = async (req, res, next) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({
            success: false,
            message: 'Admin access required'
        });
    }
    next();
};

// Middleware for checking verified status
const requireVerified = async (req, res, next) => {
    if (!req.user.isVerified) {
        return res.status(403).json({
            success: false,
            message: 'Email verification required'
        });
    }
    next();
};

module.exports = {
    auth,
    requireAdmin,
    requireVerified
};

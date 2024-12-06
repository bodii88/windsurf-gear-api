const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    password: {
        type: String,
        required: true
    },
    firstName: {
        type: String,
        trim: true
    },
    lastName: {
        type: String,
        trim: true
    },
    role: {
        type: String,
        enum: ['admin', 'user'],
        default: 'user'
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    verificationToken: String,
    resetPasswordToken: String,
    resetPasswordExpires: Date,
    preferences: {
        theme: {
            type: String,
            enum: ['light', 'dark'],
            default: 'light'
        },
        notifications: {
            email: {
                type: Boolean,
                default: true
            },
            maintenance: {
                type: Boolean,
                default: true
            },
            usage: {
                type: Boolean,
                default: true
            }
        },
        defaultLocation: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Location'
        }
    },
    lastLogin: Date,
    loginHistory: [{
        date: Date,
        ip: String,
        userAgent: String
    }],
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Update timestamp on save
userSchema.pre('save', async function(next) {
    this.updatedAt = Date.now();
    
    // Only hash password if it has been modified
    if (!this.isModified('password')) return next();
    
    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// Method to verify password
userSchema.methods.verifyPassword = async function(password) {
    return bcrypt.compare(password, this.password);
};

// Method to record login
userSchema.methods.recordLogin = function(ip, userAgent) {
    this.lastLogin = new Date();
    this.loginHistory.push({
        date: this.lastLogin,
        ip,
        userAgent
    });
    
    // Keep only last 10 login records
    if (this.loginHistory.length > 10) {
        this.loginHistory = this.loginHistory.slice(-10);
    }
    
    return this.save();
};

// Virtual for full name
userSchema.virtual('fullName').get(function() {
    if (this.firstName && this.lastName) {
        return `${this.firstName} ${this.lastName}`;
    }
    return this.firstName || this.lastName || 'User';
});

const User = mongoose.model('User', userSchema);

module.exports = User;

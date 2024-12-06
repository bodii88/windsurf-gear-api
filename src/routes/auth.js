const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const { auth } = require('../middleware/auth');
const sendEmail = require('../utils/email');

// Register
router.post('/register', async (req, res) => {
    try {
        const { email, password, firstName, lastName } = req.body;
        
        // Validate input
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Email and password are required'
            });
        }

        // Check if user exists
        const existingUser = await User.findOne({ email: email.toLowerCase() });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'User already exists'
            });
        }

        // Generate verification token
        const verificationToken = crypto.randomBytes(32).toString('hex');

        // Create new user
        const user = await User.create({
            email: email.toLowerCase(),
            password,
            firstName,
            lastName,
            verificationToken,
            isVerified: process.env.NODE_ENV === 'test' // Auto-verify in test mode
        });

        // Send verification email (skip in test mode)
        if (process.env.NODE_ENV !== 'test') {
            const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`;
            await sendEmail({
                to: user.email,
                subject: 'Verify your email',
                text: `Please verify your email by clicking: ${verificationUrl}`,
                html: `
                    <h1>Welcome to Windsurf Gear Tracker!</h1>
                    <p>Please verify your email by clicking the link below:</p>
                    <a href="${verificationUrl}">Verify Email</a>
                `
            });
        }

        // Generate token
        const token = jwt.sign(
            { userId: user._id },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.status(201).json({ 
            success: true,
            message: 'Registration successful. Please check your email for verification.',
            token,
            user: { 
                id: user._id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                isVerified: user.isVerified
            }
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({
            success: false,
            message: 'Registration failed',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        // Validate input
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Email and password are required'
            });
        }

        // Find user
        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user) {
            return res.status(400).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        // Check password
        const isValid = await user.verifyPassword(password);
        if (!isValid) {
            return res.status(400).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        // Generate token
        const token = jwt.sign(
            { userId: user._id },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        // Record login
        const ip = req.ip || req.connection.remoteAddress;
        const userAgent = req.headers['user-agent'];
        await user.recordLogin(ip, userAgent);

        res.json({ 
            success: true,
            token, 
            user: { 
                id: user._id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                isVerified: user.isVerified,
                role: user.role,
                preferences: user.preferences
            } 
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Login failed',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Verify Email
router.post('/verify-email', async (req, res) => {
    try {
        const { token } = req.body;

        const user = await User.findOne({ verificationToken: token });
        if (!user) {
            return res.status(400).json({
                success: false,
                message: 'Invalid verification token'
            });
        }

        user.isVerified = true;
        user.verificationToken = undefined;
        await user.save();

        res.json({
            success: true,
            message: 'Email verified successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Email verification failed',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Request Password Reset
router.post('/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;

        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user) {
            return res.status(400).json({
                success: false,
                message: 'If a user with this email exists, a password reset link will be sent'
            });
        }

        // Generate reset token
        const resetToken = crypto.randomBytes(32).toString('hex');
        user.resetPasswordToken = resetToken;
        user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
        await user.save();

        // Send reset email
        const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
        await sendEmail({
            to: user.email,
            subject: 'Reset your password',
            text: `Reset your password by clicking: ${resetUrl}`,
            html: `
                <h1>Password Reset Request</h1>
                <p>Click the link below to reset your password:</p>
                <a href="${resetUrl}">Reset Password</a>
                <p>This link will expire in 1 hour.</p>
            `
        });

        res.json({
            success: true,
            message: 'If a user with this email exists, a password reset link will be sent'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Password reset request failed',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Reset Password
router.post('/reset-password', async (req, res) => {
    try {
        const { token, password } = req.body;

        const user = await User.findOne({
            resetPasswordToken: token,
            resetPasswordExpires: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({
                success: false,
                message: 'Invalid or expired reset token'
            });
        }

        user.password = password;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        await user.save();

        res.json({
            success: true,
            message: 'Password reset successful'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Password reset failed',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Get Current User Profile
router.get('/profile', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user._id)
            .select('-password -resetPasswordToken -resetPasswordExpires');

        res.json({
            success: true,
            user
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to fetch profile',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Update User Profile
router.put('/profile', auth, async (req, res) => {
    try {
        const { firstName, lastName, preferences } = req.body;
        const updates = { firstName, lastName };

        if (preferences) {
            updates.preferences = {
                ...req.user.preferences,
                ...preferences
            };
        }

        const user = await User.findByIdAndUpdate(
            req.user._id,
            { $set: updates },
            { new: true }
        ).select('-password -resetPasswordToken -resetPasswordExpires');

        res.json({
            success: true,
            message: 'Profile updated successfully',
            user
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to update profile',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Change Password
router.put('/change-password', auth, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        const user = await User.findById(req.user._id);
        const isValid = await user.verifyPassword(currentPassword);

        if (!isValid) {
            return res.status(400).json({
                success: false,
                message: 'Current password is incorrect'
            });
        }

        user.password = newPassword;
        await user.save();

        res.json({
            success: true,
            message: 'Password changed successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to change password',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

module.exports = router;

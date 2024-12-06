const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const User = require('../models/User');

// Email transporter setup
const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: false,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// Register
router.post('/register', async (req, res) => {
    try {
        const { email, password, name } = req.body;
        
        // Check if user exists
        const existingUser = await User.findByEmail(email);
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Create verification token
        const verificationToken = jwt.sign(
            { email },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        // Create new user
        const user = await User.create({
            email,
            password,
            name,
            verificationToken
        });

        // Send verification email
        const verificationLink = `http://localhost:5000/api/auth/verify/${verificationToken}`;
        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Verify your Gear Tracker account',
            html: `Please click <a href="${verificationLink}">here</a> to verify your account.`
        });

        res.status(201).json({ message: 'User created. Please check your email for verification.' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        // Find user
        const user = await User.findByEmail(email);
        if (!user) {
            return res.status(400).json({ message: 'User not found' });
        }

        // Check if verified
        if (!user.isVerified) {
            return res.status(400).json({ message: 'Please verify your email first' });
        }

        // Check password
        const isValid = await User.verifyPassword(user, password);
        if (!isValid) {
            return res.status(400).json({ message: 'Invalid password' });
        }

        // Generate token
        const token = jwt.sign(
            { userId: user.id },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.json({ token, user: { id: user.id, email: user.email, name: user.name } });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Verify email
router.get('/verify/:token', async (req, res) => {
    try {
        const { token } = req.params;
        
        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findByEmail(decoded.email);
        
        if (!user) {
            return res.status(400).json({ message: 'Invalid verification token' });
        }

        // Update user verification status
        user.isVerified = true;
        user.verificationToken = null;
        await User.updateUser(user.id, user);

        res.json({ message: 'Email verified successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;

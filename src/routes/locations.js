const express = require('express');
const router = express.Router();
const { auth, requireVerified } = require('../middleware/auth');
const Location = require('../models/Location');

// Get all locations
router.get('/', auth, async (req, res) => {
    try {
        const locations = await Location.find({ createdBy: req.user._id });
        res.json({
            success: true,
            locations
        });
    } catch (error) {
        console.error('Error fetching locations:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch locations',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Create location
router.post('/', [auth, requireVerified], async (req, res) => {
    try {
        const { name, description, coordinates, type, windConditions } = req.body;

        // Basic validation
        if (!name || !coordinates) {
            return res.status(400).json({
                success: false,
                message: 'Name and coordinates are required'
            });
        }

        // Validate coordinates
        if (coordinates) {
            const { latitude, longitude } = coordinates;
            if (typeof latitude !== 'number' || typeof longitude !== 'number') {
                return res.status(400).json({
                    success: false,
                    message: 'Latitude and longitude must be numbers'
                });
            }
            if (latitude < -90 || latitude > 90) {
                return res.status(400).json({
                    success: false,
                    message: 'Latitude must be between -90 and 90'
                });
            }
            if (longitude < -180 || longitude > 180) {
                return res.status(400).json({
                    success: false,
                    message: 'Longitude must be between -180 and 180'
                });
            }
        }

        // Validate wind conditions if provided
        if (windConditions) {
            const { averageSpeed, direction } = windConditions;
            if (averageSpeed !== undefined) {
                if (typeof averageSpeed !== 'number' || averageSpeed < 0) {
                    return res.status(400).json({
                        success: false,
                        message: 'Wind speed must be a positive number'
                    });
                }
            }
            if (direction) {
                const validDirections = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
                if (!validDirections.includes(direction)) {
                    return res.status(400).json({
                        success: false,
                        message: 'Invalid wind direction'
                    });
                }
            }
        }

        // Check for duplicate name
        const existingLocation = await Location.findOne({
            name,
            createdBy: req.user._id
        });

        if (existingLocation) {
            return res.status(400).json({
                success: false,
                message: 'A location with this name already exists'
            });
        }

        const location = await Location.create({
            name,
            description,
            coordinates,
            type,
            windConditions,
            createdBy: req.user._id
        });

        res.status(201).json({
            success: true,
            message: 'Location created successfully',
            location
        });
    } catch (error) {
        console.error('Error creating location:', error);
        if (error.name === 'ValidationError') {
            return res.status(400).json({
                success: false,
                message: 'Validation error',
                errors: Object.values(error.errors).map(err => err.message)
            });
        }
        res.status(500).json({
            success: false,
            message: 'Failed to create location',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Get location by id
router.get('/:id', auth, async (req, res) => {
    try {
        const location = await Location.findOne({
            _id: req.params.id,
            createdBy: req.user._id
        });

        if (!location) {
            return res.status(404).json({
                success: false,
                message: 'Location not found'
            });
        }

        res.json({
            success: true,
            location
        });
    } catch (error) {
        console.error('Error fetching location:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch location',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Update location
router.put('/:id', [auth, requireVerified], async (req, res) => {
    try {
        const { name, description, coordinates, type, windConditions } = req.body;

        // Validate coordinates if provided
        if (coordinates) {
            const { latitude, longitude } = coordinates;
            if (typeof latitude !== 'number' || typeof longitude !== 'number') {
                return res.status(400).json({
                    success: false,
                    message: 'Latitude and longitude must be numbers'
                });
            }
            if (latitude < -90 || latitude > 90) {
                return res.status(400).json({
                    success: false,
                    message: 'Latitude must be between -90 and 90'
                });
            }
            if (longitude < -180 || longitude > 180) {
                return res.status(400).json({
                    success: false,
                    message: 'Longitude must be between -180 and 180'
                });
            }
        }

        // Validate wind conditions if provided
        if (windConditions) {
            const { averageSpeed, direction } = windConditions;
            if (averageSpeed !== undefined) {
                if (typeof averageSpeed !== 'number' || averageSpeed < 0) {
                    return res.status(400).json({
                        success: false,
                        message: 'Wind speed must be a positive number'
                    });
                }
            }
            if (direction) {
                const validDirections = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
                if (!validDirections.includes(direction)) {
                    return res.status(400).json({
                        success: false,
                        message: 'Invalid wind direction'
                    });
                }
            }
        }

        const location = await Location.findOne({
            _id: req.params.id,
            createdBy: req.user._id
        });

        if (!location) {
            return res.status(404).json({
                success: false,
                message: 'Location not found'
            });
        }

        // Check for duplicate name if name is being changed
        if (name && name !== location.name) {
            const existingLocation = await Location.findOne({
                name,
                createdBy: req.user._id,
                _id: { $ne: req.params.id }
            });

            if (existingLocation) {
                return res.status(400).json({
                    success: false,
                    message: 'A location with this name already exists'
                });
            }
        }

        // Update fields
        if (name) location.name = name;
        if (description) location.description = description;
        if (coordinates) location.coordinates = coordinates;
        if (type) location.type = type;
        if (windConditions) location.windConditions = windConditions;

        await location.save();

        res.json({
            success: true,
            message: 'Location updated successfully',
            location
        });
    } catch (error) {
        console.error('Error updating location:', error);
        if (error.name === 'ValidationError') {
            return res.status(400).json({
                success: false,
                message: 'Validation error',
                errors: Object.values(error.errors).map(err => err.message)
            });
        }
        res.status(500).json({
            success: false,
            message: 'Failed to update location',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Delete location
router.delete('/:id', [auth, requireVerified], async (req, res) => {
    try {
        const location = await Location.findOneAndDelete({
            _id: req.params.id,
            createdBy: req.user._id
        });

        if (!location) {
            return res.status(404).json({
                success: false,
                message: 'Location not found'
            });
        }

        res.json({
            success: true,
            message: 'Location deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting location:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete location',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

module.exports = router;

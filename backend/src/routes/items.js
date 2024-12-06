const express = require('express');
const router = express.Router();
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { auth, requireVerified } = require('../middleware/auth');
const Item = require('../models/Item');
const WeatherService = require('../services/weather');
const QRCode = require('qrcode');
const mongoose = require('mongoose');

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// Configure Multer for image upload
const storage = multer.memoryStorage();
const upload = multer({
    storage,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
    },
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Not an image! Please upload an image.'), false);
        }
    }
});

// Create new item
router.post('/', [auth, requireVerified], upload.array('images', 5), async (req, res) => {
    try {
        const itemData = {
            ...req.body,
            createdBy: req.user._id
        };

        // Upload images to Cloudinary if provided
        if (req.files && req.files.length > 0) {
            itemData.images = await Promise.all(req.files.map(async (file, index) => {
                const result = await cloudinary.uploader.upload(`data:${file.mimetype};base64,${file.buffer.toString('base64')}`, {
                    folder: 'windsurf-gear'
                });
                return {
                    url: result.secure_url,
                    caption: req.body[`caption${index}`] || '',
                    isPrimary: index === 0
                };
            }));
        }

        // Generate QR code
        const qrData = {
            type: 'windsurf-gear',
            id: new mongoose.Types.ObjectId(), // Generate new ID for QR code
            name: itemData.name,
            brand: itemData.brand
        };
        itemData.qrCode = await QRCode.toDataURL(JSON.stringify(qrData));
        itemData._id = qrData.id; // Use same ID as in QR code

        const item = await Item.create(itemData);

        res.status(201).json({
            success: true,
            message: 'Item created successfully',
            item
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to create item',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Get all items for user with filtering and sorting
router.get('/', auth, async (req, res) => {
    try {
        const {
            category,
            location,
            search,
            sort = 'name',
            order = 'asc',
            page = 1,
            limit = 10
        } = req.query;

        // Build query
        const query = { createdBy: req.user._id };
        if (category) query.category = category;
        if (location) query.location = location;
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { brand: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } }
            ];
        }

        // Execute query with pagination
        const items = await Item.find(query)
            .populate('category', 'name color')
            .populate('location', 'name')
            .sort({ [sort]: order === 'asc' ? 1 : -1 })
            .skip((page - 1) * limit)
            .limit(limit);

        // Get total count for pagination
        const total = await Item.countDocuments(query);

        res.json({
            success: true,
            items,
            pagination: {
                total,
                page: parseInt(page),
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to fetch items',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Get item by id
router.get('/:id', auth, async (req, res) => {
    try {
        const item = await Item.findOne({
            _id: req.params.id,
            createdBy: req.user._id
        })
        .populate('category', 'name color')
        .populate('location', 'name address coordinates');

        if (!item) {
            return res.status(404).json({
                success: false,
                message: 'Item not found'
            });
        }

        // Get weather data if location has coordinates
        let weather = null;
        if (item.location?.coordinates?.latitude && item.location?.coordinates?.longitude) {
            weather = await WeatherService.getCurrentWeather(
                item.location.coordinates.latitude,
                item.location.coordinates.longitude
            );
        }

        res.json({
            success: true,
            item,
            weather
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to fetch item',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Update item
router.put('/:id', [auth, requireVerified], upload.array('images', 5), async (req, res) => {
    try {
        const item = await Item.findOne({
            _id: req.params.id,
            createdBy: req.user._id
        });

        if (!item) {
            return res.status(404).json({
                success: false,
                message: 'Item not found'
            });
        }

        // Handle image uploads
        if (req.files && req.files.length > 0) {
            const newImages = await Promise.all(req.files.map(async (file, index) => {
                const result = await cloudinary.uploader.upload(`data:${file.mimetype};base64,${file.buffer.toString('base64')}`, {
                    folder: 'windsurf-gear'
                });
                return {
                    url: result.secure_url,
                    caption: req.body[`caption${index}`] || '',
                    isPrimary: index === 0
                };
            }));

            // Combine existing and new images
            item.images = [...(item.images || []), ...newImages];
        }

        // Update other fields
        Object.assign(item, req.body);

        // Save changes
        await item.save();

        res.json({
            success: true,
            message: 'Item updated successfully',
            item
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to update item',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Add maintenance record
router.post('/:id/maintenance', [auth, requireVerified], upload.array('attachments', 5), async (req, res) => {
    try {
        const item = await Item.findOne({
            _id: req.params.id,
            createdBy: req.user._id
        });

        if (!item) {
            return res.status(404).json({
                success: false,
                message: 'Item not found'
            });
        }

        const maintenanceRecord = {
            ...req.body,
            date: new Date(),
            attachments: []
        };

        // Upload attachments if provided
        if (req.files && req.files.length > 0) {
            maintenanceRecord.attachments = await Promise.all(req.files.map(async file => {
                const result = await cloudinary.uploader.upload(`data:${file.mimetype};base64,${file.buffer.toString('base64')}`, {
                    folder: 'windsurf-gear-maintenance'
                });
                return result.secure_url;
            }));
        }

        item.maintenanceRecords.push(maintenanceRecord);
        
        // Update maintenance schedule
        if (item.maintenanceSchedule?.frequency) {
            item.maintenanceSchedule.lastMaintenance = new Date();
            item.maintenanceSchedule.nextMaintenance = item.calculateNextMaintenance();
        }

        await item.save();
        
        res.json({
            success: true,
            message: 'Maintenance record added successfully',
            item
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to add maintenance record',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Add usage record
router.post('/:id/usage', [auth, requireVerified], async (req, res) => {
    try {
        const item = await Item.findOne({
            _id: req.params.id,
            createdBy: req.user._id
        });

        if (!item) {
            return res.status(404).json({
                success: false,
                message: 'Item not found'
            });
        }

        const usageRecord = {
            ...req.body,
            date: new Date()
        };

        // Get weather data if location provided
        if (req.body.location) {
            const location = await Location.findById(req.body.location);
            if (location?.coordinates?.latitude && location?.coordinates?.longitude) {
                const weather = await WeatherService.getCurrentWeather(
                    location.coordinates.latitude,
                    location.coordinates.longitude
                );
                usageRecord.weatherConditions = {
                    windSpeed: weather.windSpeed,
                    windDirection: weather.windDirection,
                    temperature: weather.temperature,
                    conditions: weather.conditions
                };
            }
        }

        item.usageRecords.push(usageRecord);
        await item.save();
        
        res.json({
            success: true,
            message: 'Usage record added successfully',
            item
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to add usage record',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Delete item
router.delete('/:id', [auth, requireVerified], async (req, res) => {
    try {
        const item = await Item.findOneAndDelete({
            _id: req.params.id,
            createdBy: req.user._id
        });

        if (!item) {
            return res.status(404).json({
                success: false,
                message: 'Item not found'
            });
        }

        // Delete images from Cloudinary
        if (item.images && item.images.length > 0) {
            await Promise.all(item.images.map(image => {
                const publicId = image.url.split('/').pop().split('.')[0];
                return cloudinary.uploader.destroy(`windsurf-gear/${publicId}`);
            }));
        }

        res.json({
            success: true,
            message: 'Item deleted successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to delete item',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Generate new QR code
router.post('/:id/qr', [auth, requireVerified], async (req, res) => {
    try {
        const item = await Item.findOne({
            _id: req.params.id,
            createdBy: req.user._id
        });

        if (!item) {
            return res.status(404).json({
                success: false,
                message: 'Item not found'
            });
        }

        const qrData = {
            type: 'windsurf-gear',
            id: item._id,
            name: item.name,
            brand: item.brand
        };

        item.qrCode = await QRCode.toDataURL(JSON.stringify(qrData));
        await item.save();

        res.json({
            success: true,
            message: 'QR code regenerated successfully',
            qrCode: item.qrCode
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to generate QR code',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

module.exports = router;

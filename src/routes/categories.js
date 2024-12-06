const express = require('express');
const router = express.Router();
const { auth, requireVerified } = require('../middleware/auth');
const Category = require('../models/Category');
const Item = require('../models/Item');

// Get all categories with filtering and sorting
router.get('/', auth, async (req, res) => {
    try {
        const {
            search,
            sort = 'name',
            order = 'asc',
            page = 1,
            limit = 10
        } = req.query;

        // Build query
        const query = { createdBy: req.user._id };
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } }
            ];
        }

        // Execute query with pagination
        const categories = await Category.find(query)
            .sort({ [sort]: order === 'asc' ? 1 : -1 })
            .skip((page - 1) * limit)
            .limit(limit);

        // Get total count for pagination
        const total = await Category.countDocuments(query);

        // Get item count for each category
        const categoriesWithCount = await Promise.all(categories.map(async (category) => {
            const itemCount = await Item.countDocuments({
                category: category._id,
                createdBy: req.user._id
            });
            return {
                ...category.toObject(),
                itemCount
            };
        }));

        res.json({
            success: true,
            categories: categoriesWithCount,
            pagination: {
                total,
                page: parseInt(page),
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to fetch categories',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Create category
router.post('/', [auth, requireVerified], async (req, res) => {
    try {
        const { name, description, color } = req.body;

        // Validate input
        if (!name) {
            return res.status(400).json({
                success: false,
                message: 'Category name is required'
            });
        }

        // Check if category with same name exists
        const existingCategory = await Category.findOne({
            name: { $regex: new RegExp(`^${name}$`, 'i') },
            createdBy: req.user._id
        });

        if (existingCategory) {
            return res.status(400).json({
                success: false,
                message: 'Category with this name already exists'
            });
        }

        // Create category
        const category = await Category.create({
            name,
            description,
            color,
            createdBy: req.user._id
        });

        res.status(201).json({
            success: true,
            message: 'Category created successfully',
            category
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to create category',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Get category by id with items count
router.get('/:id', auth, async (req, res) => {
    try {
        const category = await Category.findOne({
            _id: req.params.id,
            createdBy: req.user._id
        });

        if (!category) {
            return res.status(404).json({
                success: false,
                message: 'Category not found'
            });
        }

        // Get items count for this category
        const itemCount = await Item.countDocuments({
            category: category._id,
            createdBy: req.user._id
        });

        res.json({
            success: true,
            category: {
                ...category.toObject(),
                itemCount
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to fetch category',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Update category
router.put('/:id', [auth, requireVerified], async (req, res) => {
    try {
        const { name, description, color } = req.body;

        // Check if category exists
        const category = await Category.findOne({
            _id: req.params.id,
            createdBy: req.user._id
        });

        if (!category) {
            return res.status(404).json({
                success: false,
                message: 'Category not found'
            });
        }

        // If name is being changed, check for duplicates
        if (name && name !== category.name) {
            const existingCategory = await Category.findOne({
                name: { $regex: new RegExp(`^${name}$`, 'i') },
                createdBy: req.user._id,
                _id: { $ne: category._id }
            });

            if (existingCategory) {
                return res.status(400).json({
                    success: false,
                    message: 'Category with this name already exists'
                });
            }
        }

        // Update category
        Object.assign(category, {
            name: name || category.name,
            description: description || category.description,
            color: color || category.color
        });

        await category.save();

        res.json({
            success: true,
            message: 'Category updated successfully',
            category
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to update category',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Delete category
router.delete('/:id', [auth, requireVerified], async (req, res) => {
    try {
        // Check if category exists
        const category = await Category.findOne({
            _id: req.params.id,
            createdBy: req.user._id
        });

        if (!category) {
            return res.status(404).json({
                success: false,
                message: 'Category not found'
            });
        }

        // Check if category has items
        const itemCount = await Item.countDocuments({
            category: category._id,
            createdBy: req.user._id
        });

        if (itemCount > 0) {
            return res.status(400).json({
                success: false,
                message: `Cannot delete category. It contains ${itemCount} items.`
            });
        }

        // Delete category
        await category.deleteOne();

        res.json({
            success: true,
            message: 'Category deleted successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to delete category',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Bulk delete categories
router.post('/bulk-delete', [auth, requireVerified], async (req, res) => {
    try {
        const { categoryIds } = req.body;

        if (!Array.isArray(categoryIds) || categoryIds.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Please provide an array of category IDs'
            });
        }

        // Check if any category has items
        const categoriesWithItems = await Item.distinct('category', {
            category: { $in: categoryIds },
            createdBy: req.user._id
        });

        if (categoriesWithItems.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Cannot delete categories that contain items'
            });
        }

        // Delete categories
        const result = await Category.deleteMany({
            _id: { $in: categoryIds },
            createdBy: req.user._id
        });

        res.json({
            success: true,
            message: `Successfully deleted ${result.deletedCount} categories`
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to delete categories',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

module.exports = router;

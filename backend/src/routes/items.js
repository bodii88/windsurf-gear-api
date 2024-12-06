const express = require('express');
const router = express.Router();
const Item = require('../models/Item');
const auth = require('../middleware/auth');

// Create new item
router.post('/', auth, async (req, res) => {
    try {
        const itemData = {
            ...req.body,
            userId: req.user.id
        };

        const item = await Item.create(itemData);
        res.status(201).json(item);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get all items for user
router.get('/', auth, async (req, res) => {
    try {
        const items = await Item.findByUser(req.user.id);
        res.json(items);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get item by id
router.get('/:id', auth, async (req, res) => {
    try {
        const item = await Item.findById(req.params.id);
        if (!item || item.userId !== req.user.id) {
            return res.status(404).json({ message: 'Item not found' });
        }
        res.json(item);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Update item
router.patch('/:id', auth, async (req, res) => {
    try {
        const item = await Item.findById(req.params.id);
        if (!item || item.userId !== req.user.id) {
            return res.status(404).json({ message: 'Item not found' });
        }

        const updatedItem = await Item.update(req.params.id, req.body);
        res.json(updatedItem);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Add maintenance record
router.post('/:id/maintenance', auth, async (req, res) => {
    try {
        const item = await Item.findById(req.params.id);
        if (!item || item.userId !== req.user.id) {
            return res.status(404).json({ message: 'Item not found' });
        }
        
        item.maintenanceRecords.push(req.body);
        await item.save();
        
        res.json(item);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Delete item
router.delete('/:id', auth, async (req, res) => {
    try {
        const item = await Item.findById(req.params.id);
        if (!item || item.userId !== req.user.id) {
            return res.status(404).json({ message: 'Item not found' });
        }

        await Item.delete(req.params.id);
        res.json({ message: 'Item deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;

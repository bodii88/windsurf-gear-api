const mongoose = require('mongoose');
const QRCode = require('qrcode');

const maintenanceRecordSchema = new mongoose.Schema({
    type: {
        type: String,
        required: true,
        enum: ['repair', 'inspection', 'cleaning', 'upgrade', 'other']
    },
    date: {
        type: Date,
        required: true
    },
    description: String,
    cost: {
        type: Number,
        min: 0
    },
    performedBy: String,
    attachments: [{
        type: String // URLs to uploaded files
    }]
});

const usageRecordSchema = new mongoose.Schema({
    date: {
        type: Date,
        required: true
    },
    duration: {
        type: Number, // in minutes
        required: true
    },
    location: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Location'
    },
    weatherConditions: {
        windSpeed: Number,
        windDirection: String,
        temperature: Number,
        conditions: String
    },
    notes: String
});

const itemSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    brand: {
        type: String,
        trim: true
    },
    model: {
        type: String,
        trim: true
    },
    serialNumber: {
        type: String,
        unique: true,
        sparse: true
    },
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        required: true
    },
    location: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Location',
        required: true
    },
    purchaseDate: {
        type: Date
    },
    purchasePrice: {
        type: Number,
        min: 0
    },
    condition: {
        type: String,
        enum: ['new', 'excellent', 'good', 'fair', 'poor'],
        default: 'good'
    },
    description: {
        type: String,
        trim: true
    },
    specifications: {
        type: Map,
        of: String
    },
    images: [{
        url: String,
        caption: String,
        isPrimary: Boolean
    }],
    qrCode: {
        type: String
    },
    maintenanceSchedule: {
        frequency: {
            type: String,
            enum: ['weekly', 'monthly', 'quarterly', 'yearly', 'custom']
        },
        lastMaintenance: Date,
        nextMaintenance: Date
    },
    maintenanceRecords: [maintenanceRecordSchema],
    usageRecords: [usageRecordSchema],
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
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
itemSchema.pre('save', async function(next) {
    this.updatedAt = Date.now();
    
    // Generate QR code if not exists
    if (!this.qrCode) {
        try {
            const qrData = {
                id: this._id,
                name: this.name,
                brand: this.brand,
                serialNumber: this.serialNumber
            };
            this.qrCode = await QRCode.toDataURL(JSON.stringify(qrData));
        } catch (error) {
            console.error('Error generating QR code:', error);
        }
    }
    next();
});

// Virtual for total usage hours
itemSchema.virtual('totalUsageHours').get(function() {
    return this.usageRecords.reduce((total, record) => total + (record.duration / 60), 0);
});

// Virtual for total maintenance cost
itemSchema.virtual('totalMaintenanceCost').get(function() {
    return this.maintenanceRecords.reduce((total, record) => total + (record.cost || 0), 0);
});

// Method to check if maintenance is due
itemSchema.methods.isMaintenanceDue = function() {
    if (!this.maintenanceSchedule.nextMaintenance) return false;
    return new Date() >= this.maintenanceSchedule.nextMaintenance;
};

// Method to calculate next maintenance date
itemSchema.methods.calculateNextMaintenance = function() {
    if (!this.maintenanceSchedule.frequency) return null;
    
    const lastMaintenance = this.maintenanceSchedule.lastMaintenance || new Date();
    let nextDate = new Date(lastMaintenance);
    
    switch(this.maintenanceSchedule.frequency) {
        case 'weekly':
            nextDate.setDate(nextDate.getDate() + 7);
            break;
        case 'monthly':
            nextDate.setMonth(nextDate.getMonth() + 1);
            break;
        case 'quarterly':
            nextDate.setMonth(nextDate.getMonth() + 3);
            break;
        case 'yearly':
            nextDate.setFullYear(nextDate.getFullYear() + 1);
            break;
    }
    
    return nextDate;
};

const Item = mongoose.model('Item', itemSchema);

module.exports = Item;

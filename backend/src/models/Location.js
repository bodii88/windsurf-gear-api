const mongoose = require('mongoose');

const locationSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Location name is required'],
        trim: true,
        minlength: [2, 'Name must be at least 2 characters long'],
        maxlength: [100, 'Name cannot exceed 100 characters']
    },
    description: {
        type: String,
        trim: true,
        maxlength: [1000, 'Description cannot exceed 1000 characters']
    },
    address: {
        street: String,
        city: String,
        state: String,
        country: String,
        postalCode: String
    },
    coordinates: {
        latitude: {
            type: Number,
            required: [true, 'Latitude is required'],
            min: [-90, 'Latitude must be between -90 and 90'],
            max: [90, 'Latitude must be between -90 and 90']
        },
        longitude: {
            type: Number,
            required: [true, 'Longitude is required'],
            min: [-180, 'Longitude must be between -180 and 180'],
            max: [180, 'Longitude must be between -180 and 180']
        }
    },
    type: {
        type: String,
        enum: {
            values: ['Lake', 'Ocean', 'River', 'Bay', 'Other'],
            message: '{VALUE} is not a valid location type'
        }
    },
    windConditions: {
        averageSpeed: {
            type: Number,
            min: [0, 'Wind speed cannot be negative'],
            max: [200, 'Wind speed seems unrealistic']
        },
        direction: {
            type: String,
            enum: {
                values: ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'],
                message: '{VALUE} is not a valid wind direction'
            }
        }
    },
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
locationSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

// Add unique compound index for name and createdBy
locationSchema.index({ name: 1, createdBy: 1 }, { unique: true });

const Location = mongoose.model('Location', locationSchema);

module.exports = Location;

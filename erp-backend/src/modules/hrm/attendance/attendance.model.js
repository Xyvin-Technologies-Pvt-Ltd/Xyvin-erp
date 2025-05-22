const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
    employee: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Employee',
        required: true
    },
    date: {
        type: Date,
        required: true
    },
    checkIn: {
        time: Date,
        // location: {
        //     type: {
        //         type: String,
        //         enum: ['Point'],
        //         default: 'Point'
        //     },
        //     coordinates: {
        //         type: [Number]
        //     }
        // },
        device: {
            type: String,
            enum: ['Web', 'Mobile', 'Biometric']
        },
        ipAddress: String
    },
    checkOut: {
        time: Date,
        // location: {
        //     type: {
        //         type: String,
        //         enum: ['Point'],
        //         default: 'Point'
        //     },
        //     coordinates: {
        //         type: [Number]
        //     }
        // },
        device: {
            type: String,
            enum: ['Web', 'Mobile', 'Biometric']
        },
        ipAddress: String
    },
    status: {
        type: String,
        enum: ['Present', 'Absent', 'Half-Day', 'Late', 'Early-Leave', 'Holiday', 'On-Leave', "Day-Off"],
        required: true
    },
    workHours: {
        type: Number,
        default: 0
    },
    overtime: {
        hours: {
            type: Number,
            default: 0
        },
        approved: {
            type: Boolean,
            default: false
        },
        approvedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Employee'
        },
        approvalDate: Date
    },
    breaks: [{
        startTime: Date,
        endTime: Date,
        duration: Number, // in minutes
        type: {
            type: String,
            enum: ['Lunch', 'Tea', 'Other']
        }
    }],
    notes: {
        type: String,
        trim: true
    },
    attachments: [{
        name: String,
        path: String,
        uploadedAt: {
            type: Date,
            default: Date.now
        }
    }],
    shift: {
        type: String,
        enum: ['Morning', 'Evening', 'Night'],
        required: true
    },
    isHoliday: {
        type: Boolean,
        default: false
    },
    isWeekend: {
        type: Boolean,
        default: false
    },
    isLeave: {
        type: Boolean,
        default: false
    },
    leaveType: {
        type: String,
        enum: ['Annual', 'Sick', 'Personal', 'Maternity', 'Paternity', 'Unpaid'],
        required: function() {
            return this.isLeave === true;
        }
    },
    leaveId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Leave',
        required: function() {
            return this.isLeave === true;
        }
    },
    sequence: {
        type: Number,
        default: 1
    },
    isDeleted: {
        type: Boolean,
        default: false
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, {
    timestamps: true
});

// Drop all indexes and create new ones
attendanceSchema.pre('save', async function(next) {
    try {
        const model = mongoose.model('Attendance');
        await model.collection.dropIndexes();
    } catch (error) {
        console.log('No indexes to drop or already dropped');
    }
    next();
});

// Create compound indexes for efficient querying
attendanceSchema.index({ 
    employee: 1, 
    date: 1, 
    status: 1,
    isDeleted: 1
}, { 
    background: true,
    name: 'attendance_query_index'
});

// Index for date range queries
attendanceSchema.index({ 
    date: 1,
    isDeleted: 1
}, { 
    background: true,
    name: 'attendance_date_index'
});

// Index for employee queries
attendanceSchema.index({ 
    employee: 1,
    isDeleted: 1
}, { 
    background: true,
    name: 'attendance_employee_index'
});

// Index for status queries
attendanceSchema.index({ 
    status: 1,
    isDeleted: 1
}, { 
    background: true,
    name: 'attendance_status_index'
});

// Calculate work hours before saving
attendanceSchema.pre('save', function(next) {
    // Skip work hours calculation for leave records
    if (this.isLeave) {
        this.workHours = 0; // Leave records should have 0 work hours
        return next();
    }

    if (this.checkIn && this.checkOut) {
        const checkInTime = new Date(this.checkIn.time);
        const checkOutTime = new Date(this.checkOut.time);
        
        // Calculate total break duration
        const totalBreakDuration = this.breaks.reduce((total, breakItem) => {
            if (breakItem.startTime && breakItem.endTime) {
                return total + (new Date(breakItem.endTime) - new Date(breakItem.startTime)) / (1000 * 60 * 60);
            }
            return total;
        }, 0);

        // Calculate work hours excluding breaks
        this.workHours = (checkOutTime - checkInTime) / (1000 * 60 * 60) - totalBreakDuration;
        
        // Round to 2 decimal places
        this.workHours = Math.round(this.workHours * 100) / 100;
    }
    next();
});

// Validate check-in and check-out times
attendanceSchema.pre('save', function(next) {
    // Skip validation for leave records
    if (this.isLeave) {
        return next();
    }

    if (this.checkIn && this.checkOut && this.checkIn.time > this.checkOut.time) {
        throw new Error('Check-out time cannot be before check-in time');
    }
    next();
});

// Method to check if employee is currently checked in
attendanceSchema.statics.isCheckedIn = async function(employeeId) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const attendance = await this.findOne({
        employee: employeeId,
        date: today,
        isLeave: false,
        'checkIn.time': { $exists: true },
        'checkOut.time': { $exists: false }
    }).sort({ createdAt: -1 });
    
    return !!attendance;
};

module.exports = mongoose.model('Attendance', attendanceSchema); 
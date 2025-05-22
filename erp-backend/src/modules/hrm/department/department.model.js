const mongoose = require('mongoose');

const departmentSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    code: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    description: {
        type: String,
        required: true,
        trim: true
    },
    location: {
        type: String,
        required: true,
        trim: true
    },
    budget: {
        type: Number,
        required: true,
        min: 0
    },
    manager: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Employee',
        validate: {
            validator: async function(value) {
                if (!value) return true; // Allow null/undefined manager
                const Employee = mongoose.model('Employee');
                const employee = await Employee.findById(value);
                return employee && employee.role === 'manager','IT Manager','Project Manager','HR Manager','Finance Manager','Sales Manager'; // Ensure the employee is a manager
            },
            message: 'Invalid manager. Manager must be an existing employee with manager role.'
        }
    },
    employeeCount: {
        type: Number,
        default: 0
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Virtual for getting all employees in this department
departmentSchema.virtual('employees', {
    ref: 'Employee',
    localField: '_id',
    foreignField: 'department'
});

// Method to update employee count
departmentSchema.methods.updateEmployeeCount = async function() {
    const Employee = mongoose.model('Employee');
    const count = await Employee.countDocuments({ department: this._id, status: 'active' });
    this.employeeCount = count;
    await this.save();
};

const Department = mongoose.model('Department', departmentSchema);

module.exports = Department; 
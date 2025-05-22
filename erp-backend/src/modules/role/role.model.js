const mongoose = require('mongoose');

const roleSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        enum: [
            'ERP System Administrator',
            'IT Manager',
            'Project Manager',
            'Business Analyst',
            'Developer',
            'Quality Assurance Specialist',
            'HR Manager',
            'Finance Manager',
            'Sales Manager',
            'Employee'
        ],
    },
    description: {
        type: String,
        required: true,
    }
   
})

const Role = mongoose.model('Role', roleSchema);

module.exports = Role;

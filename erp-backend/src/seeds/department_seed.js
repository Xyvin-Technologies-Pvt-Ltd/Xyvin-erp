const Department = require('../modules/hrm/department/department.model');
const mongoose = require('mongoose');

const seedDepartments = async () => {
    try {
        console.log('Starting department seed...');

        // Check database connection
        if (mongoose.connection.readyState !== 1) {
            throw new Error('Database not connected');
        }

        // Check if departments already exist
        const existingDepartments = await Department.countDocuments();
        if (existingDepartments > 0) {
            console.log(`${existingDepartments} departments already exist in the database`);
            return;
        }

        // Sample department data
        const departmentsData = [
            {
                name: 'Administration',
                code: 'ADMIN',
                description: 'Responsible for overall management and administration of the organization',
                location: 'Headquarters - Floor 5',
                budget: 500000,
                employeeCount: 0,
                isActive: true
            },
            {
                name: 'Human Resources',
                code: 'HR',
                description: 'Manages recruitment, employee relations, benefits, and organizational development',
                location: 'Headquarters - Floor 4',
                budget: 350000,
                employeeCount: 0,
                isActive: true
            },
           
        ];

        console.log('Attempting to create departments...');

        // Insert all departments
        const createdDepartments = await Department.create(departmentsData);
        console.log(`Successfully created ${createdDepartments.length} departments`);

        console.log('Department seed completed');
    } catch (error) {
        console.error('Error seeding departments:', error);
        if (error.errors) {
            Object.keys(error.errors).forEach(key => {
                console.error(`Validation error for ${key}:`, error.errors[key].message);
            });
        }
        throw error;
    }
};

module.exports = seedDepartments; 
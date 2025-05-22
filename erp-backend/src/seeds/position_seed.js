const Position = require('../modules/hrm/position/position.model');
const Department = require('../modules/hrm/department/department.model');
const mongoose = require('mongoose');

const seedPositions = async () => {
    try {
        console.log('Starting position seed...');

        // Check database connection
        if (mongoose.connection.readyState !== 1) {
            throw new Error('Database not connected');
        }

        // Check if positions already exist
        const existingPositions = await Position.countDocuments();
        if (existingPositions > 0) {
            console.log(`${existingPositions} positions already exist in the database`);
            return;
        }

        // Get departments to reference in positions
        const departments = await Department.find();
        if (departments.length === 0) {
            throw new Error('No departments found. Please run department seeds first.');
        }

        // Create a mapping of department names to department IDs for easier access
        const departmentMap = {};
        departments.forEach(dept => {
            departmentMap[dept.name] = dept._id;
        });

        // Sample position data
        const positionsData = [
            
           

            // Human Resources Department Positions
            {
                title: 'HR Manager',
                code: 'HRM',
                department: departmentMap['Human Resources'],
                description: 'Manages HR operations and personnel matters',
                responsibilities: [
                    'Oversee recruitment and hiring processes',
                    'Manage employee relations and benefits',
                    'Develop HR policies and procedures'
                ],
                requirements: [
                    'Bachelor\'s degree in HR or related field',
                    '5+ years of HR experience',
                    'Knowledge of labor laws and regulations'
                ],
                employmentType: 'Full-time',
                level: 3,
                maxPositions: 1,
                isActive: true
            },

           
        ];

        console.log('Attempting to create positions...');

        // Insert all positions
        const createdPositions = await Position.create(positionsData);
        console.log(`Successfully created ${createdPositions.length} positions`);

        console.log('Position seed completed');
    } catch (error) {
        console.error('Error seeding positions:', error);
        if (error.errors) {
            Object.keys(error.errors).forEach(key => {
                console.error(`Validation error for ${key}:`, error.errors[key].message);
            });
        }
        throw error;
    }
};

module.exports = seedPositions; 
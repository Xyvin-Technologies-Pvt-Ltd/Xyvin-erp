const Employee = require('../modules/hrm/employee/employee.model');
// const Role = require('../modules/role/role.model');
const Department = require('../modules/hrm/department/department.model');
const Position = require('../modules/hrm/position/position.model');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const seedEmployees = async () => {
    try {
        console.log('Starting employee seed...');

        // Check database connection
        if (mongoose.connection.readyState !== 1) {
            throw new Error('Database not connected');
        }

        // Check if employees already exist
        const existingEmployees = await Employee.countDocuments();
        if (existingEmployees > 0) {
            console.log(`${existingEmployees} employees already exist in the database`);
            return;
        }

        // Find roles
        // console.log('Fetching roles...');
        // const roles = await Role.find();

        // if (roles.length === 0) {
        //     throw new Error('No roles found. Please run role seeds first.');
        // }

        // Find departments and positions
        const departments = await Department.find();
        const positions = await Position.find();

        if (departments.length === 0 || positions.length === 0) {
            throw new Error('Departments or positions not found. Please run department and position seeds first.');
        }

        // Create a mapping of role names to role IDs for easier access
        // const roleMap = {};
        // roles.forEach(role => {
        //     roleMap[role.name] = role._id;
        // });

        // Sample employee data with different roles
        const employeesData = [
            {
                firstName: 'Admin',
                lastName: 'User',
                department: departments[0]._id,
                position: positions[0]._id,
                joiningDate: new Date('2022-01-01'),
                salary: 120000,
                employeeId: 'EMP001',
                email: 'admin@xyvin-erp.com',
                password: await bcrypt.hash('123456', 10),
                role: 'ERP System Administrator',
                phone: '1234567890',
                status: 'active',
                personalInfo: {
                    dateOfBirth: new Date('1985-05-15'),
                    gender: 'Male',
                    maritalStatus: 'Married',
                    bloodGroup: 'O+',
                    address: {
                        street: '123 Admin St',
                        city: 'Tech City',
                        state: 'CA',
                        country: 'USA',
                        zipCode: '94103'
                    }
                }
            },
            
        ];

        console.log('Attempting to create employees...');

        // Create employees one by one to better handle errors
        const createdEmployees = [];
        for (const employeeData of employeesData) {
            try {
                // Create employee with pre-hashed password and skip the pre-save hashing
                const employee = new Employee(employeeData);
                employee.$__skipPasswordHashing = true; // Skip hashing since we already hashed the password
                await employee.save();
                createdEmployees.push(employee);
                console.log(`Created employee: ${employee.firstName} ${employee.lastName}`);
            } catch (error) {
                console.error(`Error creating employee ${employeeData.firstName} ${employeeData.lastName}:`, error.message);
                if (error.errors) {
                    Object.keys(error.errors).forEach(key => {
                        console.error(`Validation error for ${key}:`, error.errors[key].message);
                    });
                }
            }
        }

        console.log(`Successfully created ${createdEmployees.length} employees`);
        console.log('Employee seed completed');
    } catch (error) {
        console.error('Detailed error in employee seed:', error);
        if (error.errors) {
            Object.keys(error.errors).forEach(key => {
                console.error(`Validation error for ${key}:`, error.errors[key].message);
            });
        }
        throw error;
    }
};

module.exports = seedEmployees;


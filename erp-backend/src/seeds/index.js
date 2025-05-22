const seedRoles = require('./role_seed');
const seedDepartments = require('./department_seed');
const seedPositions = require('./position_seed');
const seedEmployees = require('./employee_seed');


async function runSeeds() {
    try {
        // Execute seeds in the correct order
        console.log('Starting seed process...');

        // 1. Seed roles first (required for employees)
        await seedRoles();
        console.log('Role seeding completed');

        // 2. Seed departments (required for positions and employees)
        await seedDepartments();
        console.log('Department seeding completed');

        // 3. Seed positions (required for employees)
        await seedPositions();
        console.log('Position seeding completed');

        // 4. Seed employees (depends on roles, departments, and positions)
        await seedEmployees();
        console.log('Employee seeding completed');

        console.log('All seeds executed successfully');
    } catch (error) {
        console.error('Error running seeds:', error);
        process.exit(1);
    }
}

module.exports = runSeeds;

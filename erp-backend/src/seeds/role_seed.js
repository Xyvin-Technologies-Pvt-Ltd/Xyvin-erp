const Role = require('../modules/role/role.model');

const seedRoles = async () => {
    try {
        const existingRoles = await Role.find();
        if (existingRoles.length > 0) {
            console.log('Roles already seeded');
            return;
        }

        const roles = [
            {
                name: 'ERP System Administrator',
                description: 'Full access to all ERP system features and administration',
            },
           
           
        ];

        await Role.insertMany(roles);
        console.log('Roles seeded successfully');
    } catch (error) {
        console.error('Error seeding roles:', error);
        process.exit(1);
    }
}

module.exports = seedRoles;


const runSeeds = require('../seeds/index');

async function runDatabaseSeeds(node_env) {
    try {

        if (node_env !== 'development') {
            console.log('Seeding is disabled in non-development environments');
            return;
        }

        // Clear order of seeding - roles must come first
        console.log('Starting seeds...');

            runSeeds().then(() => {
            console.log('All seeds executed successfully');
            
        }).catch((error) => {
            console.error('Error seeding:', error);
            
        });
    } catch (error) {
        console.error('Error seeding:', error);
        
    }
}



module.exports = {runDatabaseSeeds};



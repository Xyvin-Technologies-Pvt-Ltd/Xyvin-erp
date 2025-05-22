/**
 * Graceful shutdown configuration
 * Handles proper shutdown of the application
 */

const clc = require('cli-color');
const { logger } = require('../middleware/logger');
const { disconnectDatabase } = require('./database');

/**
 * Setup graceful shutdown handlers
 * @param {Object} server - HTTP server instance
 */
function setupGracefulShutdown(server) {
    // Function to handle graceful shutdown
    async function gracefulShutdown(signal) {
        logger.info(`Received ${signal}. Starting graceful shutdown...`);
        console.log(clc.yellowBright(`\n⚠️ Received ${signal}. Starting graceful shutdown...`));

        // Close the HTTP server
        server.close(() => {
            logger.info('HTTP server closed');
            console.log(clc.yellowBright('✓ HTTP server closed'));
        });

        try {
            // Disconnect from database
            await disconnectDatabase();
            logger.info('Database connections closed');
            console.log(clc.yellowBright('✓ Database connections closed'));

            // Add other cleanup tasks here (e.g., close Redis connections, etc.)

            logger.info('Graceful shutdown completed');
            console.log(clc.greenBright('✓ Graceful shutdown completed'));
            process.exit(0);
        } catch (error) {
            logger.error(`Error during graceful shutdown: ${error.message}`, { stack: error.stack });
            console.log(clc.redBright(`❌ Error during graceful shutdown: ${error.message}`));
            process.exit(1);
        }
    }

    // Register signal handlers
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    logger.info('Graceful shutdown handlers registered');
}

module.exports = {
    setupGracefulShutdown
}; 
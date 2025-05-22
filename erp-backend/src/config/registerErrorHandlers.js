/**
 * Error handlers configuration
 * Sets up global error handlers for the application
 */

const { logger } = require('../middleware/logger');

/**
 * Register global error handlers
 */
function registerErrorHandlers() {
    // Handle uncaught exceptions globally
    process.on('uncaughtException', (err) => {
        logger.error(`Uncaught Exception: ${err.message}`, { stack: err.stack });
        process.exit(1);
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
        console.log('Unhandled Rejection', { reason, promise });
        logger.error('Unhandled Rejection', { reason, promise });
    });
}

module.exports = {
    registerErrorHandlers
}; 
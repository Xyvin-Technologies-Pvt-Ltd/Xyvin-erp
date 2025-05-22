/**
 * Server startup
 * Initializes and starts the Express server
 */

const clc = require("cli-color");
const { PORT, NODE_ENV, BASE_PATH } = require("./config/env");
const { initializeExpress } = require("./config/express");
const { initializeRoutes } = require("./config/routes");
const { connectDatabase, isDatabaseConnected } = require("./config/database");
const { runDatabaseSeeds } = require("./config/seed");
const { setupGracefulShutdown } = require("./config/graceful_shutdown");
const { logger } = require("./middleware/logger");
const { registerErrorHandlers } = require("./config/registerErrorHandlers");
const cors = require('cors');
const express = require('express');

/**
 * Initialize and start the server
 */
async function startServer() {
  try {
    // Register global error handlers
    registerErrorHandlers();

    // Initialize Express application
    const app = initializeExpress();

    // Connect to database
    await connectDatabase();

    // Verify database connection
    if (!isDatabaseConnected()) {
      throw new Error("Database connection verification failed");
    }

    // Add health check endpoint
    app.get('/health', (req, res) => {
      res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
    });

    // Add CORS middleware with proper configuration
    app.use(cors({
      origin: ['http://localhost:5173', 'http://localhost:8080', 'https://erp-xyvin-859e2.web.app'],
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
      credentials: true
    }));

    // Register routes
    initializeRoutes(app, BASE_PATH);

    // Also ensure you have body-parser or express.json() middleware
    app.use(express.json());

    // Start the server
    const server = app.listen(PORT, () => {
      const port_message = clc.redBright(`✓ App is running on port: ${PORT}`);
      const env_message = clc.yellowBright(
        `✓ Environment: ${NODE_ENV || "development"}`
      );
      const status_message = clc.greenBright(
        "✓ Server is up and running smoothly 🚀"
      );

      logger.info(
        `Server started on port ${PORT} in ${NODE_ENV || "development"} mode`
      );

      console.log(`${port_message}\n${env_message}\n${status_message}`);

      // Initialize scheduled jobs
      // startScheduledJobs();

      // Run database seeds in development mode
      runDatabaseSeeds(NODE_ENV);
    });

    // Setup graceful shutdown
    setupGracefulShutdown(server);

    return server;
  } catch (error) {
    logger.error(`Failed to start server: ${error.message}`, {
      stack: error.stack,
    });
    console.error(clc.redBright(`❌ Failed to start server: ${error.stack}`));
    process.exit(1);
  }
}

// Start the server
module.exports = startServer;

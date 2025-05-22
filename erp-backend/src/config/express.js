const express = require('express');
const cors = require('cors');
const env = require('./env');
const helmet = require('helmet');
const compression = require('compression');
const xss = require('xss-clean');
const morgan = require('morgan');

const app = express();


function initializeExpress() {
    app.use(helmet());

    // Compress response bodies
    app.use(compression());

    // Enable Cross-Origin Resource Sharing (CORS)
    app.use(cors(env.CORS_ORIGIN));

    // Parse JSON request bodies
    app.use(express.json());

    // Parse URL-encoded request body
    app.use(express.urlencoded({ extended: true }));

    // Sanitize request data against XSS
    app.use(xss());

    // Log requests
    app.use(morgan('dev'));

    return app;
}


module.exports = {
    initializeExpress
};
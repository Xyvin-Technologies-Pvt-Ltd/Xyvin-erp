const express = require('express');
const path = require('path');
const swaggerUi = require('swagger-ui-express');
const { swaggerSpec, swagger_options } = require('../swagger/config');
const { logger } = require('../middleware/logger');
const response_handler = require('../utils/responseHandlers');



// Helper function to create separate swagger setup handlers
const useSchema =
    (schema, options) =>
        (...args) =>
            swaggerUi.setup(schema, options)(...args);

function initializeRoutes(app, base_path) {


    // Define a route for the API root
    app.get(base_path, (req, res) => {
        logger.info("API root accessed", { endpoint: base_path });
        return response_handler(
            res,
            200,
            "🔐 Access point secured! Only those with the key may proceed. Do you dare to unlock the secrets within? 🚀"
        );
    });



    // Main API Swagger setup with useSchema function
    app.use(
        `${base_path}/api-docs`,
        (req, res, next) => {
            console.log("Swagger UI accessed", { endpoint: `${base_path}/api-docs` });
            next();
        },
        swaggerUi.serve,
        useSchema(swaggerSpec, swagger_options)
    );

    // Serve static files from the public directory with CORS enabled
    app.use('/public', (req, res, next) => {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
        next();
    }, express.static(path.join(__dirname, '..', 'public')));



    app.use(`${base_path}/auth`, require('../modules/auth/index'));
    app.use(`${base_path}/hrm`, require('../modules/hrm/routes'));
    app.use(`${base_path}/frm`, require('../modules/frm/routes'));
    app.use(`${base_path}/clients`, require('../modules/client/client.routes'));
    app.use(`${base_path}/projects`, require('../modules/project/project.routes'));
    app.use(`${base_path}/tasks`, require('../modules/project/task/task.routes'));

}
module.exports = {
    initializeRoutes
};

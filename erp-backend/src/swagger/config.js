const swaggerJsDoc = require('swagger-jsdoc');
const env = require('../config/env');




const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Xyvin ERP API Documentation',
      version: '1.0.0',
      description: 'API documentation for Xyvin ERP system',
      contact: {
        name: 'API Support',
        email: 'support@xyvin-erp.com'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: `http://localhost:${env.PORT || 5000}${env.BASE_PATH}`,
        description: 'Development server'
      },
      {
        url: process.env.PRODUCTION_API_URL,
        description: 'Production server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      },
      responses: {
        UnauthorizedError: {
          description: 'Access token is missing or invalid',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  message: {
                    type: 'string',
                    example: 'Unauthorized'
                  }
                }
              }
            }
          }
        },
        NotFoundError: {
          description: 'Resource not found',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  message: {
                    type: 'string',
                    example: 'Resource not found'
                  }
                }
              }
            }
          }
        }
      }
    },
    security: [{
      bearerAuth: []
    }],
    tags: [
      { name: 'Auth', description: 'Authentication endpoints' },
      { name: 'Users', description: 'User management endpoints' },
      { name: 'Departments', description: 'Department management endpoints' },
      { name: 'Positions', description: 'Position management endpoints' },
      { name: 'Employees', description: 'Employee management endpoints' }
    ]
  },
  apis: [
    './src/swagger/schemas/*.yaml',
    './src/swagger/paths/*.yaml'
  ]
};

const swagger_options = {
  swaggerOptions: {
    docExpansion: "none",
    filter: true,
    tagsSorter: "alpha",
    operationsSorter: "alpha",

  },
};

const swaggerSpec = swaggerJsDoc(options);




module.exports = { swaggerSpec, swagger_options }; 
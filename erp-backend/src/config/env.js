require('dotenv').config();

module.exports = {
    PORT: process.env.PORT || 8080,
    BASE_PATH: process.env.BASE_PATH || '/api/v1',
    NODE_ENV: process.env.NODE_ENV || 'development',
    MONGO_URL: process.env.MONGO_URL || 'mongodb+srv://admin:QOUTdL5uXqbE67rv@xyvin.6p93v.mongodb.net/xyvin-erp',
    JWT_SECRET: process.env.JWT_SECRET || 'your-secret-key',
    JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '1d',
    NODE_ENV: process.env.NODE_ENV || 'development',
    // CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:3001/api/v1',
    CORS_ORIGIN: process.env.CORS_ORIGIN || 'https://erp-xyvin-859e2.web.app',
    FILE_UPLOAD_PATH: process.env.FILE_UPLOAD_PATH || 'uploads',
    MAX_FILE_SIZE: process.env.MAX_FILE_SIZE || 1024 * 1024 * 5, // 5MB
    SMTP_HOST: process.env.SMTP_HOST,
    SMTP_PORT: process.env.SMTP_PORT,
    SMTP_USER: process.env.SMTP_USER,
    SMTP_PASS: process.env.SMTP_PASS,
    FROM_EMAIL: process.env.FROM_EMAIL,
    FROM_NAME: process.env.FROM_NAME
}; 
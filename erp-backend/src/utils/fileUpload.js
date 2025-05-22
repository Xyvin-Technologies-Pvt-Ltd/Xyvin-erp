const path = require('path');
const fs = require('fs').promises;

/**
 * Upload a file to the server
 * @param {Object} file - The file object from multer
 * @returns {Promise<string>} The URL of the uploaded file
 */
const uploadFile = async (file) => {
  try {
    // Get the file extension
    const ext = path.extname(file.originalname);
    
    // Create a unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const filename = file.fieldname + '-' + uniqueSuffix + ext;
    
    // Move file from temp location to uploads directory
    const uploadPath = path.join(__dirname, '../../public/uploads', filename);
    await fs.rename(file.path, uploadPath);
    
    // Return the public URL
    return `/public/uploads/${filename}`;
  } catch (error) {
    throw new Error('Failed to upload file: ' + error.message);
  }
};

module.exports = {
  uploadFile
}; 
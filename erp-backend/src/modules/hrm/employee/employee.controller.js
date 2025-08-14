const Employee = require('./employee.model');
const catchAsync = require('../../../utils/catchAsync');
const { createError } = require('../../../utils/errors');
const mongoose = require('mongoose');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const fsSync = require('fs');
const   Position  = require('../position/position.model');
const Department = require('../department/department.model')


// Configure multer for file upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = 'public/uploads/profile-pictures';
    // Create directory if it doesn't exist
    fs.mkdir(uploadDir, { recursive: true })
      .then(() => cb(null, uploadDir))
      .catch(err => cb(err));
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'profile-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
      return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
  }
});

/**
 * Get all employees with filtering
 */
const getAllEmployees = catchAsync(async (req, res) => {
  try {
    const filter = {};
    
    // Apply filters if provided
    if (req.query.department) filter.department = req.query.department;
    if (req.query.position) filter.position = req.query.position;
    if (req.query.status) filter.status = req.query.status;
    if (req.query.role) filter.role = req.query.role;

    console.log('Fetching employees with filter:', filter);

    // Parse include parameter
    const includeFields = req.query.include ? req.query.include.split(',') : [];
    const excludeFields = ['-password'];
    
    // Only exclude documents if not specifically requested
    if (!includeFields.includes('documents')) {
      excludeFields.push('-documents');
    }

    const employees = await Employee.find(filter)
      .populate('department', 'name')
      .populate('position', 'title code description')
      .select(excludeFields.join(' '));

    console.log('Found employees:', employees);

    if (!employees) {
      throw createError(404, 'No employees found');
    }

    res.status(200).json({
      status: 'success',
      data: {
        employees: employees.map(emp => {
          // Clean up profile picture path
          let profilePicture = emp.profilePicture;
          if (profilePicture) {
            profilePicture = profilePicture
              .replace(/^\/public/, '')  // Remove leading /public
              .replace(/^public/, '')    // Remove leading public without slash
              .replace(/\/+/g, '/');     // Replace multiple slashes with single slash
            
            // Ensure the path starts with a slash
            if (!profilePicture.startsWith('/')) {
              profilePicture = '/' + profilePicture;
            }
          }

          // Clean up document URLs
          const documents = emp.documents ? emp.documents.map(doc => ({
            ...doc.toObject(),
            url: doc.url.replace(/^\/public/, '').replace(/^public/, '').replace(/\/+/g, '/')
          })) : [];

          return {
            id: emp._id,
            employeeId: emp.employeeId,
            firstName: emp.firstName,
            lastName: emp.lastName,
            name: `${emp.firstName} ${emp.lastName}`,
            fullName: `${emp.firstName} ${emp.lastName}`,
            email: emp.email,
            phone: emp.phone,
            department: emp.department,
            position: {
              id: emp.position?._id,
              title: emp.position?.title,
              code: emp.position?.code,
              description: emp.position?.description
            },
            role: emp.role || 'Employee',
            status: emp.status || 'active',
            isActive: emp.isActive !== false,
            joiningDate: emp.joiningDate,
            salary: emp.salary,
            emergencyContact: emp.emergencyContact,
            documents: documents,
            profilePicture: profilePicture,
            statusBadgeColor: emp.status === 'inactive' ? 'red' : 
                         emp.status === 'on_leave' ? 'yellow' : 
                         emp.status === 'suspended' ? 'orange' : 'green'
          };
        })
      }
    });
  } catch (error) {
    console.error('Error in getAllEmployees:', error);
    if (error instanceof mongoose.Error) {
      throw createError(500, 'Database error occurred');
    }
    throw error;
  }
});

/**
 * Get employee by ID
 */
const getEmployeeById = catchAsync(async (req, res) => {
  const employee = await Employee.findById(req.params.id)
    .populate('department', 'name')
    .populate('position', 'title')
    .populate('createdBy', 'name');

  if (!employee) {
    throw createError(404, 'Employee not found');
  }

  // Clean up profile picture path
  let profilePicture = employee.profilePicture;
  if (profilePicture) {
    profilePicture = profilePicture
      .replace(/^\/public/, '')  // Remove leading /public
      .replace(/^public/, '')    // Remove leading public without slash
      .replace(/\/+/g, '/');     // Replace multiple slashes with single slash
    
    // Ensure the path starts with a slash
    if (!profilePicture.startsWith('/')) {
      profilePicture = '/' + profilePicture;
    }
  }

  // Clean up document URLs
  const documents = employee.documents ? employee.documents.map(doc => ({
    ...doc.toObject(),
    url: doc.url.replace(/^\/public/, '').replace(/^public/, '').replace(/\/+/g, '/')
  })) : [];

  const employeeData = {
    ...employee.toObject(),
    profilePicture: profilePicture,
    documents: documents
  };

  res.status(200).json({
    status: 'success',
    data: { employee: employeeData }
  });
});

/**
 * Get the next employee ID
 */
const getNextEmployeeId = catchAsync(async (req, res) => {
  try {
    console.log('Generating next employee ID...');
    const nextId = await generateEmployeeId();
    console.log('Generated ID:', nextId);
    
    res.status(200).json({
      status: 'success',
      data: {
        employee: {
          employeeId: nextId
        }
      }
    });
  } catch (error) {
    console.error('Error in getNextEmployeeId:', error);
    throw createError(500, 'Failed to generate employee ID');
  }
});

/**
 * Generate employee ID
 */
const generateEmployeeId = async () => {
  try {
    console.log('Starting employee ID generation...');
    // Get all employees and sort by employeeId in descending order
    const employees = await Employee.find({})
      .sort({ employeeId: -1 })
      .limit(1)
      .lean();

    console.log('Latest employee:', employees[0]);

    if (!employees || employees.length === 0) {
      console.log('No employees found, starting with EMP001');
      return 'EMP001';
    }

    const latestEmployee = employees[0];
    console.log('Latest employee ID:', latestEmployee.employeeId);
    
    // Extract the numeric part
    const matches = latestEmployee.employeeId.match(/EMP(\d+)/);
    
    if (!matches || !matches[1]) {
      console.log('Invalid ID format, starting with EMP001');
      return 'EMP001';
    }

    const currentNumber = parseInt(matches[1], 10);
    if (isNaN(currentNumber)) {
      console.log('Invalid number format, starting with EMP001');
      return 'EMP001';
    }

    const nextNumber = currentNumber + 1;
    const paddedNumber = nextNumber.toString().padStart(3, '0');
    const nextId = `EMP${paddedNumber}`;
    
    console.log('Generated next ID:', nextId);
    return nextId;

  } catch (error) {
    console.error('Error generating employee ID:', error);
    throw new Error('Failed to generate employee ID');
  }
};

/**
 * Create new employee
 */
const createEmployee = catchAsync(async (req, res) => {
  // Generate employee ID first
  const employeeId = await generateEmployeeId();

  const {
    firstName,
    lastName,
    email,
    password,
    phone,
    department,
    position,
    role,
    salary,
    joiningDate,
    address,
    emergencyContact,
    bankDetails,
    documents
  } = req.body;

  // Check if email already exists
  const emailExists = await Employee.findOne({ email });
  if (emailExists) {
    throw createError(400, 'Email already exists');
  }

  // Validate department
  const departmentExists = await Department.findById(department);
  if (!departmentExists) {
    throw createError(404, 'Department not found');
  }

  // Validate position
  const positionExists = await Position.findById(position);
  if (!positionExists) {
    throw createError(404, 'Position not found');
  }

  const employee = await Employee.create({
    employeeId, // Auto-generated ID
    firstName,
    lastName,
    email,
    password,
    phone,
    department,
    position,
    role,
    salary,
    joiningDate,
    address,
    emergencyContact,
    bankDetails,
    documents,
    createdBy: req.user.id
  });
  console.log(Department);
  console.log(Position);
  // Populate necessary fields before sending response
  await employee.populate('department', 'name');
  await employee.populate('position', 'title');

  res.status(201).json({
    status: 'success',
    data: { 
      employee: {
        ...employee.toObject(),
        fullName: `${employee.firstName} ${employee.lastName}`
      }
    }
  });
});

/**
 * Update employee
 */
const updateEmployee = catchAsync(async (req, res) => {
  console.log('Update Employee Request Body:', { 
    ...req.body, 
    password: req.body.password ? '[FILTERED]' : undefined 
  });
  
  const {
    firstName,
    lastName,
    email,
    phone,
    department,
    position,
    role,
    salary,
    status,
    address,
    emergencyContact,
    bankDetails,
    personalInfo,
    documents,
    password,
  } = req.body;

  // Check if employee exists
  const employee = await Employee.findById(req.params.id).select('+password');
  if (!employee) {
    throw createError(404, 'Employee not found');
  }

  // Update only provided fields
  if (firstName) employee.firstName = firstName;
  if (lastName) employee.lastName = lastName;
  if (email) employee.email = email;
  if (phone) employee.phone = phone;
  if (department) employee.department = department;
  if (position) employee.position = position;
  if (role) employee.role = role;
  if (salary) employee.salary = salary;
  if (status) {
    employee.status = status;
    employee.isActive = status === 'active';
  }
  if (address) employee.address = address;
  if (bankDetails) employee.bankDetails = bankDetails;
  if (personalInfo) employee.personalInfo = personalInfo;
  if (documents) employee.documents = documents;
  
  // Handle password update
  if (password) {
    console.log('Updating password...');
    employee.password = password;
  }

  // Handle emergency contact
  if (emergencyContact) {
    console.log('Received emergency contact:', emergencyContact);
    employee.emergencyContact = {
      name: emergencyContact.name || '',
      relationship: emergencyContact.relationship || '',
      phone: emergencyContact.phone || '',
      email: emergencyContact.email || ''
    };
    console.log('Setting emergency contact data:', employee.emergencyContact);
  }

  // Save employee - this will trigger password hashing if password was updated
  const updatedEmployee = await employee.save();
  console.log('Employee updated successfully');

  // Populate necessary fields
  await updatedEmployee.populate('department', 'name');
  await updatedEmployee.populate('position', 'title');

  res.status(200).json({
    status: 'success',
    data: { 
      employee: {
        ...updatedEmployee.toObject(),
        fullName: `${updatedEmployee.firstName} ${updatedEmployee.lastName}`
      }
    }
  });
});

/**
 * Delete employee
 */
const deleteEmployee = catchAsync(async (req, res) => {
  const employee = await Employee.findById(req.params.id);
  
  if (!employee) {
    throw createError(404, 'Employee not found');
  }

  await employee.deleteOne();

  res.status(200).json({
    status: 'success',
    message: 'Employee deleted successfully'
  });
});

/**
 * Upload employee document
 */
const uploadDocument = catchAsync(async (req, res) => {
  console.log('Starting document upload process');
  
  if (!req.file) {
    console.error('No file in request');
    throw createError(400, 'Please provide a document file');
  }

  console.log('File received:', {
    originalname: req.file.originalname,
    mimetype: req.file.mimetype,
    size: req.file.size,
    path: req.file.path
  });

  const employeeId = req.params.id;
  console.log('Employee ID:', employeeId);

  const employee = await Employee.findById(employeeId);
  if (!employee) {
    console.error('Employee not found:', employeeId);
    throw createError(404, 'Employee not found');
  }

  // Create documents directory if it doesn't exist
  const uploadDir = 'public/uploads/documents';
  console.log('Creating directory:', uploadDir);
  await fs.mkdir(uploadDir, { recursive: true });

  // Generate unique filename
  const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
  const filename = 'document-' + uniqueSuffix + path.extname(req.file.originalname);
  const finalPath = path.join(uploadDir, filename);
  console.log('Target file path:', finalPath);

  try {
    // Move file from temp to documents directory
    console.log('Moving file from:', req.file.path);
    console.log('Moving file to:', finalPath);
    await fs.rename(req.file.path, finalPath);

    // Create document record
    const document = {
      type: req.body.type,
      title: req.file.originalname,
      url: '/uploads/documents/' + filename,
      uploadedAt: new Date()
    };
    console.log('Created document record:', document);

    // Add document to employee's documents array
    employee.documents = employee.documents || [];
    employee.documents.push(document);
    await employee.save();
    console.log('Document saved to employee record');

    res.status(200).json({
      status: 'success',
      data: { document }
    });
  } catch (error) {
    console.error('Error in document upload:', error);
    // Clean up uploaded file if there was an error
    if (req.file) {
      try {
        await fs.unlink(req.file.path);
        console.log('Cleaned up temporary file:', req.file.path);
      } catch (unlinkError) {
        console.error('Error deleting uploaded file:', unlinkError);
      }
    }
    throw error;
  }
});

/**
 * Update employee profile picture
 */
const updateProfilePicture = catchAsync(async (req, res) => {
  try {
    if (!req.file) {
      throw createError(400, 'Please provide an image file');
    }

    // Get employee ID from params or authenticated user
    const employeeId = req.params.id || req.user.id;

    const employee = await Employee.findById(employeeId);
    if (!employee) {
      throw createError(404, 'Employee not found');
    }

    // Delete old profile picture if exists
    if (employee.profilePicture) {
      try {
        // Clean up the old path by removing any leading /public or public/
        const oldPath = path.join(
          process.cwd(),
          'public',
          employee.profilePicture
            .replace(/^\//, '')
            .replace(/^public\//, '')
            .replace(/^uploads\//, '')
        );
        
        console.log('Attempting to delete old profile picture:', oldPath);
        
        // Check if file exists before trying to delete
        const fileExists = await fs.access(oldPath).then(() => true).catch(() => false);
        if (fileExists) {
          await fs.unlink(oldPath);
          console.log('Successfully deleted old profile picture:', oldPath);
        } else {
          console.log('Old profile picture not found at path:', oldPath);
        }
      } catch (error) {
        console.error('Error deleting old profile picture:', error);
        // Log error but continue with upload
      }
    }

    // Move file from temp to profile-pictures directory
    const uploadDir = 'public/uploads/profile-pictures';
    await fs.mkdir(uploadDir, { recursive: true });

    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const filename = 'profile-' + uniqueSuffix + path.extname(req.file.originalname);
    const filePath = path.join(uploadDir, filename);

    await fs.rename(req.file.path, filePath);

    // Update employee with relative profile picture path
    const profilePicturePath = '/' + filePath.replace(/\\/g, '/');
    employee.profilePicture = profilePicturePath;
    await employee.save();

    // Populate necessary fields
    await employee.populate('department', 'name');
    await employee.populate('position', 'title');

    // Clean up profile picture path for response
    const cleanProfilePicturePath = profilePicturePath
      .replace(/^\/public/, '')  // Remove leading /public
      .replace(/^public/, '')    // Remove leading public without slash
      .replace(/\/+/g, '/');     // Replace multiple slashes with single slash

    res.status(200).json({
      status: 'success',
      data: {
        employee: {
          ...employee.toObject(),
          profilePicture: cleanProfilePicturePath,
          fullName: `${employee.firstName} ${employee.lastName}`
        }
      }
    });
  } catch (error) {
    // Delete uploaded file if there was an error
    if (req.file) {
      try {
        await fs.unlink(req.file.path);
        console.log('Cleaned up temporary file after error');
      } catch (unlinkError) {
        console.error('Error deleting uploaded file:', unlinkError);
      }
    }
    throw error;
  }
});

/**
 * Get current employee profile
 */
const getCurrentEmployee = catchAsync(async (req, res) => {
  const employee = await Employee.findById(req.user.id)
    .populate('department', 'name')
    .populate('position', 'title')
    .select('-password');

  if (!employee) {
    throw createError(404, 'Employee not found');
  }

  let profilePicture = employee.profilePicture;
  if (profilePicture) {
    profilePicture = profilePicture
      .replace(/^\/?public\/?/, '/')
      .replace(/^\/+/, '/')
      .replace(/\/+/g, '/');
    if (!profilePicture.startsWith('/uploads')) {
      const withoutPublic = employee.profilePicture
        .toString()
        .replace(/^\/?public\/?/, '/')
        .replace(/^\/+/, '/');
      profilePicture = withoutPublic;
    }
  }

  const responseEmployee = {
    ...employee.toObject(),
    profilePicture: profilePicture || employee.profilePicture,
    fullName: `${employee.firstName} ${employee.lastName}`
  };

  res.status(200).json({
    status: 'success',
    data: { 
      employee: responseEmployee
    }
  });
});

/**
 * Update current employee profile
 */
const updateCurrentEmployee = catchAsync(async (req, res) => {
  const {
    firstName,
    lastName,
    email,
    phone,
    emergencyContact,
    personalInfo,
    password
  } = req.body;

  // Check if email is being changed and already exists
  if (email) {
    const emailExists = await Employee.findOne({
      email,
      _id: { $ne: req.user.id }
    });
    if (emailExists) {
      throw createError(400, 'Email already exists');
    }
  }

  // Find employee and include password field
  const employee = await Employee.findById(req.user.id).select('+password');
  if (!employee) {
    throw createError(404, 'Employee not found');
  }

  // Update fields
  if (firstName) employee.firstName = firstName;
  if (lastName) employee.lastName = lastName;
  if (email) employee.email = email;
  if (phone) employee.phone = phone;
  if (password) {
    console.log('Updating password in updateCurrentEmployee...');
    employee.password = password;
  }
  if (emergencyContact) {
    employee.emergencyContact = {
      name: emergencyContact.name || '',
      relationship: emergencyContact.relationship || '',
      phone: emergencyContact.phone || '',
      email: emergencyContact.email || ''
    };
  }
  if (personalInfo) employee.personalInfo = personalInfo;

  // Save employee - this will trigger password hashing if password was updated
  const updatedEmployee = await employee.save();
  console.log('Employee profile updated successfully');

  // Populate necessary fields
  await updatedEmployee.populate('department', 'name');
  await updatedEmployee.populate('position', 'title');

  // Remove password from response
  const employeeResponse = updatedEmployee.toObject();
  delete employeeResponse.password;

  res.status(200).json({
    status: 'success',
    data: { 
      employee: {
        ...employeeResponse,
        fullName: `${updatedEmployee.firstName} ${updatedEmployee.lastName}`
      }
    }
  });
});

// @desc    Get employee documents
// @route   GET /api/v1/hrm/employees/:id/documents
// @access  Private
const getEmployeeDocuments = catchAsync(async (req, res) => {
  console.log('Getting documents for employee:', req.params.id);
  
  const employee = await Employee.findById(req.params.id);
  if (!employee) {
    throw createError(404, 'Employee not found');
  }

  // Return documents array with proper URLs
  const documents = (employee.documents || []).map(doc => {
    const docObj = doc.toObject();
    // Remove /public from the start of the URL if it exists
    const url = docObj.url.replace(/^\/public/, '');
    return {
      ...docObj,
      url: url // URL without /public prefix
    };
  });

  console.log('Found documents:', documents);

  res.status(200).json({
    success: true,
    documents: documents
  });
});

// @desc    Download employee document
// @route   GET /api/v1/hrm/employees/:employeeId/documents/:documentId/download
// @access  Private
const downloadDocument = catchAsync(async (req, res) => {
  const { employeeId, documentId } = req.params;
  console.log('Downloading document:', { employeeId, documentId });

  // Find employee
  const employee = await Employee.findById(employeeId);
  if (!employee) {
    throw createError(404, 'Employee not found');
  }

  // Find the specific document
  const document = employee.documents.id(documentId);
  if (!document) {
    throw createError(404, 'Document not found');
  }

  console.log('Document found:', document);

  // Get the file path - handle both cases where url might start with /public or not
  const relativePath = document.url.replace(/^\/?(public\/)?/, '');
  const filePath = path.join(process.cwd(), 'public', relativePath);
  console.log('Attempting to read file from:', filePath);

  // Check if file exists
  if (!fsSync.existsSync(filePath)) {
    console.error('File not found at path:', filePath);
    throw createError(404, 'File not found on server');
  }

  // Set headers for file download
  res.setHeader('Content-Type', 'application/octet-stream');
  res.setHeader('Content-Disposition', `attachment; filename="${document.title}"`);

  // Stream the file
  const fileStream = fsSync.createReadStream(filePath);
  fileStream.pipe(res);

  // Handle errors
  fileStream.on('error', (error) => {
    console.error('Error streaming file:', error);
    if (!res.headersSent) {
      res.status(500).json({
        status: 'error',
        message: 'Error downloading file'
      });
    }
  });
});

/**
 * Delete employee document
 */
const deleteDocument = catchAsync(async (req, res) => {
  const { employeeId, documentId } = req.params;
  console.log('Deleting document:', { employeeId, documentId });

  // Find employee
  const employee = await Employee.findById(employeeId);
  if (!employee) {
    throw createError(404, 'Employee not found');
  }

  // Find the document
  const document = employee.documents.id(documentId);
  if (!document) {
    throw createError(404, 'Document not found');
  }

  // Get the file path and remove the file
  const filePath = path.join(process.cwd(), document.url.replace(/^\//, ''));
  try {
    await fs.unlink(filePath);
    console.log('File deleted from filesystem:', filePath);
  } catch (error) {
    console.error('Error deleting file:', error);
    // Continue even if file deletion fails
  }

  // Remove document from employee's documents array
  employee.documents = employee.documents.filter(doc => doc._id.toString() !== documentId);
  await employee.save();

  res.status(200).json({
    status: 'success',
    message: 'Document deleted successfully'
  });
});

module.exports = {
  getAllEmployees,
  getEmployeeById,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  uploadDocument,
  updateProfilePicture,
  upload,
  getCurrentEmployee,
  updateCurrentEmployee,
  getNextEmployeeId,
  getEmployeeDocuments,
  downloadDocument,
  deleteDocument
}; 
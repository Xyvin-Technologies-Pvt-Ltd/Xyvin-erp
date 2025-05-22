
const Employee = require('./employee.model');
const catchAsync = require('../../../utils/catchAsync');
const { createError } = require('../../../utils/errors');
const mongoose = require('mongoose');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
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

    const employees = await Employee.find(filter)
      .populate('department', 'name')
      .populate('position', 'title code description')
      .select('-documents -password');

    console.log('Found employees:', employees);

    if (!employees) {
      throw createError(404, 'No employees found');
    }

    res.status(200).json({
      status: 'success',
      data: {
        employees: employees.map(emp => ({
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
          statusBadgeColor: emp.status === 'inactive' ? 'red' : 
                           emp.status === 'on_leave' ? 'yellow' : 
                           emp.status === 'suspended' ? 'orange' : 'green'
        }))
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

  res.status(200).json({
    status: 'success',
    data: { employee }
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
    emergencyContact
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
    personalInfo
  } = req.body;

  // Check if employee exists
  const employee = await Employee.findById(req.params.id);
  if (!employee) {
    throw createError(404, 'Employee not found');
  }

  // Check if email is being changed and already exists
  if (email && email !== employee.email) {
    const emailExists = await Employee.findOne({
      email,
      _id: { $ne: req.params.id }
    });
    if (emailExists) {
      throw createError(400, 'Email already exists');
    }
  }

  // If position is being changed, validate it exists
  if (position && position !== employee.position.toString()) {
    const newPosition = await Position.findById(position);
    if (!newPosition) {
      throw createError(404, 'Position not found');
    }
  }

  // If department is being changed, validate it exists
  if (department && department !== employee.department.toString()) {
    const departmentExists = await Department.findById(department);
    if (!departmentExists) {
      throw createError(404, 'Department not found');
    }
  }

  // Update only provided fields
  const updateData = {};
  if (firstName) updateData.firstName = firstName;
  if (lastName) updateData.lastName = lastName;
  if (email) updateData.email = email;
  if (phone) updateData.phone = phone;
  if (department) updateData.department = department;
  if (position) updateData.position = position;
  if (role) updateData.role = role;
  if (salary) updateData.salary = salary;
  if (status) {
    updateData.status = status;
    updateData.isActive = status === 'active';
  }
  if (address) updateData.address = address;
  if (emergencyContact) updateData.emergencyContact = emergencyContact;
  if (bankDetails) updateData.bankDetails = bankDetails;
  if (personalInfo) updateData.personalInfo = personalInfo;

  const updatedEmployee = await Employee.findByIdAndUpdate(
    req.params.id,
    updateData,
    { 
      new: true, 
      runValidators: true 
    }
  )
    .populate('department', 'name')
    .populate('position', 'title')
    .select('-password');

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
  const { type, title } = req.body;
  const employee = await Employee.findById(req.params.id);

  if (!employee) {
    throw createError(404, 'Employee not found');
  }

  // Here you would typically:
  // 1. Upload the file to a storage service (e.g., S3)
  // 2. Get the URL of the uploaded file
  // For now, we'll just simulate it
  const documentUrl = `https://storage.example.com/${req.params.id}/${type}/${Date.now()}`;

  employee.documents.push({
    type,
    title,
    url: documentUrl
  });

  await employee.save();

  res.status(200).json({
    status: 'success',
    message: 'Document uploaded successfully',
    data: {
      document: employee.documents[employee.documents.length - 1]
    }
  });
});

/**
 * Update employee profile picture
 */
const updateProfilePicture = catchAsync(async (req, res) => {
  try {
    if (!req.file) {
      throw createError(400, 'Please provide an image file');
    }

    // Get employee ID from authenticated user
    const employeeId = req.user.id;

    const employee = await Employee.findById(employeeId);
    if (!employee) {
      throw createError(404, 'Employee not found');
    }

    // Delete old profile picture if exists
    if (employee.profilePicture) {
      try {
        const oldPath = path.join(process.cwd(), employee.profilePicture.replace(/^\//, ''));
        if (await fs.access(oldPath).then(() => true).catch(() => false)) {
          await fs.unlink(oldPath);
        }
      } catch (error) {
        console.error('Error deleting old profile picture:', error);
      }
    }

    // Update employee with new profile picture path
    const profilePicturePath = '/' + req.file.path.replace(/\\/g, '/');
    employee.profilePicture = profilePicturePath;
    await employee.save();

    // Populate necessary fields
    await employee.populate('department', 'name');
    await employee.populate('position', 'title');

    res.status(200).json({
      status: 'success',
      data: {
        employee: {
          ...employee.toObject(),
          profilePicture: profilePicturePath,
          fullName: `${employee.firstName} ${employee.lastName}`
        }
      }
    });
  } catch (error) {
    // Delete uploaded file if there was an error
    if (req.file) {
      try {
        await fs.unlink(req.file.path);
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

  res.status(200).json({
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
 * Update current employee profile
 */
const updateCurrentEmployee = catchAsync(async (req, res) => {
  const {
    firstName,
    lastName,
    email,
    phone,
    emergencyContact,
    personalInfo
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

  const employee = await Employee.findByIdAndUpdate(
    req.user.id,
    {
      firstName,
      lastName,
      email,
      phone,
      emergencyContact,
      personalInfo
    },
    { 
      new: true, 
      runValidators: true 
    }
  )
    .populate('department', 'name')
    .populate('position', 'title')
    .select('-password');

  if (!employee) {
    throw createError(404, 'Employee not found');
  }

  res.status(200).json({
    status: 'success',
    data: { 
      employee: {
        ...employee.toObject(),
        fullName: `${employee.firstName} ${employee.lastName}`
      }
    }
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
  getNextEmployeeId
}; 
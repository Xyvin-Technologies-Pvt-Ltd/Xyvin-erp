const Department = require('./department.model');
const catchAsync = require('../../../utils/catchAsync');
const { createError } = require('../../../utils/errors');

/**
 * Get all departments
 */
const getAllDepartments = catchAsync(async (req, res) => {
  const departments = await Department.find()
    .populate('manager', 'firstName lastName email');
  
  res.status(200).json({
    status: 'success',
    data: {
      departments: departments.map(dept => ({
        id: dept._id,
        name: dept.name,
        code: dept.code,
        description: dept.description,
        location: dept.location,
        budget: dept.budget,
        manager: dept.manager,
        isActive: dept.isActive,
        employeeCount: dept.employeeCount
      }))
    }
  });
});

/**
 * Get department by ID
 */
const getDepartment = catchAsync(async (req, res) => {
  const department = await Department.findById(req.params.id)
    .populate('manager', 'firstName lastName email');
  
  if (!department) {
    throw createError(404, 'Department not found');
  }

  res.status(200).json({
    status: 'success',
    data: {
      department: {
        id: department._id,
        name: department.name,
        code: department.code,
        description: department.description,
        location: department.location,
        budget: department.budget,
        manager: department.manager,
        isActive: department.isActive,
        employeeCount: department.employeeCount
      }
    }
  });
});

/**
 * Generate department code
 */
const generateDepartmentCode = async () => {
  try {
    // Get all departments and sort by code in descending order
    const departments = await Department.find({})
      .sort({ code: -1 })
      .limit(1)
      .lean();

    console.log('Latest department:', departments[0]); // Debug log

    if (!departments || departments.length === 0) {
      console.log('No departments found, starting with DEP001');
      return 'DEP001';
    }

    const latestDepartment = departments[0];
    console.log('Latest department code:', latestDepartment.code); // Debug log

    // Extract the numeric part
    const matches = latestDepartment.code.match(/DEP(\d+)/);
    
    if (!matches || !matches[1]) {
      console.log('Invalid code format, starting with DEP001');
      return 'DEP001';
    }

    const currentNumber = parseInt(matches[1], 10);
    if (isNaN(currentNumber)) {
      console.log('Invalid number format, starting with DEP001');
      return 'DEP001';
    }

    const nextNumber = currentNumber + 1;
    const paddedNumber = nextNumber.toString().padStart(3, '0');
    const nextCode = `DEP${paddedNumber}`;
    
    console.log('Generated next code:', nextCode); // Debug log
    return nextCode;

  } catch (error) {
    console.error('Error generating department code:', error);
    throw new Error('Failed to generate department code');
  }
};

/**
 * Create new department
 */
const createDepartment = catchAsync(async (req, res) => {
  // Generate the department code
  const departmentCode = await generateDepartmentCode();
  
  // Create department with auto-generated code
  const department = new Department({
    ...req.body,
    code: departmentCode
  });
  
  const newDepartment = await department.save();
  await newDepartment.populate('manager', 'firstName lastName email');

  res.status(201).json({
    status: 'success',
    data: {
      department: {
        id: newDepartment._id,
        name: newDepartment.name,
        code: newDepartment.code,
        description: newDepartment.description,
        location: newDepartment.location,
        budget: newDepartment.budget,
        manager: newDepartment.manager,
        isActive: newDepartment.isActive,
        employeeCount: newDepartment.employeeCount
      }
    }
  });
});

/**
 * Update department
 */
const updateDepartment = catchAsync(async (req, res) => {
  const department = await Department.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true, runValidators: true }
  ).populate('manager', 'firstName lastName email');

  if (!department) {
    throw createError(404, 'Department not found');
  }

  res.status(200).json({
    status: 'success',
    data: {
      department: {
        id: department._id,
        name: department.name,
        code: department.code,
        description: department.description,
        location: department.location,
        budget: department.budget,
        manager: department.manager,
        isActive: department.isActive,
        employeeCount: department.employeeCount
      }
    }
  });
});

/**
 * Delete department
 */
const deleteDepartment = catchAsync(async (req, res) => {
  const department = await Department.findByIdAndDelete(req.params.id);
  
  if (!department) {
    throw createError(404, 'Department not found');
  }

  // Check if department has employees
  if (department.employeeCount > 0) {
    throw createError(400, 'Cannot delete department with active employees');
  }

  res.status(200).json({
    status: 'success',
    message: 'Department deleted successfully'
  });
});

/**
 * Get the next department code
 */
const getNextDepartmentCode = catchAsync(async (req, res) => {
  try {
    const nextCode = await generateDepartmentCode();
    console.log('Sending next code:', nextCode); // Debug log
    
    res.status(200).json({
      status: 'success',
      data: {
        department: {
          code: nextCode
        }
      }
    });
  } catch (error) {
    console.error('Error in getNextDepartmentCode:', error);
    throw createError(500, 'Failed to generate department code');
  }
});

const departmentController = {
  getAllDepartments,
  getDepartment,
  createDepartment,
  updateDepartment,
  deleteDepartment,
  getNextDepartmentCode
};

module.exports = departmentController; 
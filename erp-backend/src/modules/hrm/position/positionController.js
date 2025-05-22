const Position = require('./position.model');
const catchAsync = require('../../../utils/catchAsync');
const { createError } = require('../../../utils/errors');
const { validatePosition } = require('../validation');

/**
 * Get all positions
 */
const getAllPositions = catchAsync(async (req, res) => {
  const positions = await Position.find()
    .populate('department', 'name')
    .lean();

  res.status(200).json({
    status: 'success',
    data: {
      positions: positions.map(pos => ({
        id: pos._id,
        title: pos.title,
        code: pos.code,
        description: pos.description,
        department: pos.department,
        responsibilities: pos.responsibilities,
        requirements: pos.requirements,
        isActive: pos.isActive,
        employeeCount: pos.employeeCount,
        maxPositions: pos.maxPositions,
        currentOccupancy: pos.currentOccupancy,
        employmentType: pos.employmentType,
        reportingTo: pos.reportingTo
      }))
    }
  });
});

/**
 * Get position by ID
 */
const getPosition = catchAsync(async (req, res) => {
  const position = await Position.findById(req.params.id)
    .populate('department', 'name');

  if (!position) {
    throw createError(404, 'Position not found');
  }

  res.status(200).json({
    status: 'success',
    data: { position }
  });
});

/**
 * Generate position code
 */
const generatePositionCode = async () => {
  try {
    // Find the latest position by sorting in descending order by createdAt
    const latestPosition = await Position.findOne()
      .sort({ createdAt: -1, code: -1 })
      .select('code')
      .lean();

    if (!latestPosition) {
      return 'POS001';
    }

    // Extract the numeric part and increment
    const currentCode = latestPosition.code;
    const numericPart = parseInt(currentCode.replace('POS', ''));
    const nextNumber = numericPart + 1;
    const nextCode = `POS${String(nextNumber).padStart(3, '0')}`;

    return nextCode;
  } catch (error) {
    console.error('Error generating position code:', error);
    throw new Error('Failed to generate position code');
  }
};

/**
 * Get the next position code
 */
const getNextPositionCode = catchAsync(async (req, res) => {
  try {
    const nextCode = await generatePositionCode();
    console.log('Sending next code:', nextCode); // Debug log
    
    res.status(200).json({
      status: 'success',
      data: {
        position: {
          code: nextCode
        }
      }
    });
  } catch (error) {
    console.error('Error in getNextPositionCode:', error);
    throw createError(500, 'Failed to generate position code');
  }
});

/**
 * Create new position
 */
const createPosition = catchAsync(async (req, res) => {
  const {
    title,
    description,
    department,
    responsibilities,
    requirements,
    maxPositions,
    isActive
  } = req.body;

  // Generate the position code
  const positionCode = await generatePositionCode();

  const position = await Position.create({
    title,
    code: positionCode, // Use the generated code
    description,
    department,
    responsibilities,
    requirements,
    maxPositions,
    isActive
  });

  res.status(201).json({
    status: 'success',
    data: { position }
  });
});

/**
 * Update position
 */
const updatePosition = catchAsync(async (req, res) => {
  const {
    title,
    description,
    department,
    responsibilities,
    requirements,
    maxPositions,
    isActive
  } = req.body;

  const position = await Position.findByIdAndUpdate(
    req.params.id,
    {
      title,
      description,
      department,
      responsibilities,
      requirements,
      maxPositions,
      isActive
    },
    { new: true, runValidators: true }
  ).populate('department', 'name');

  if (!position) {
    throw createError(404, 'Position not found');
  }

  res.status(200).json({
    status: 'success',
    data: { position }
  });
});

/**
 * Delete position
 */
const deletePosition = catchAsync(async (req, res) => {
  const position = await Position.findById(req.params.id);

  if (!position) {
    throw createError(404, 'Position not found');
  }

  // Check if position has employees
  if (position.employeeCount > 0) {
    throw createError(400, 'Cannot delete position with active employees');
  }

  await position.deleteOne();

  res.status(200).json({
    status: 'success',
    message: 'Position deleted successfully'
  });
});

// Get position statistics
exports.getPositionStats = catchAsync(async (req, res) => {
  const { departmentId } = req.query;

  let matchStage = {};
  if (departmentId) {
    matchStage.department = departmentId;
  }

  const stats = await Position.aggregate([
    {
      $match: matchStage
    },
    {
      $lookup: {
        from: 'employees',
        localField: '_id',
        foreignField: 'position',
        as: 'employees'
      }
    },
    {
      $project: {
        title: 1,
        department: 1,
        minSalary: 1,
        maxSalary: 1,
        employeeCount: { $size: '$employees' },
        activeEmployees: {
          $size: {
            $filter: {
              input: '$employees',
              as: 'employee',
              cond: { $eq: ['$$employee.status', 'active'] }
            }
          }
        },
        avgSalary: {
          $avg: '$employees.salary'
        }
      }
    },
    {
      $group: {
        _id: '$department',
        positions: {
          $push: {
            id: '$_id',
            title: '$title',
            employeeCount: '$employeeCount',
            activeEmployees: '$activeEmployees',
            minSalary: '$minSalary',
            maxSalary: '$maxSalary',
            avgSalary: '$avgSalary'
          }
        },
        totalPositions: { $sum: 1 },
        totalEmployees: { $sum: '$employeeCount' },
        totalActiveEmployees: { $sum: '$activeEmployees' },
        avgDepartmentSalary: { $avg: '$avgSalary' }
      }
    },
    {
      $lookup: {
        from: 'departments',
        localField: '_id',
        foreignField: '_id',
        as: 'department'
      }
    },
    {
      $unwind: '$department'
    },
    {
      $project: {
        department: '$department.name',
        positions: 1,
        totalPositions: 1,
        totalEmployees: 1,
        totalActiveEmployees: 1,
        avgDepartmentSalary: 1
      }
    }
  ]);

  res.status(200).json({
    status: 'success',
    data: { stats }
  });
});

module.exports = {
  getAllPositions,
  getPosition,
  createPosition,
  updatePosition,
  deletePosition,
  getNextPositionCode
}; 
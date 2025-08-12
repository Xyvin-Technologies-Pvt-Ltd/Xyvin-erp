const Attendance = require('./attendance.model');
const Employee = require('../employee/employee.model');
const catchAsync = require('../../../utils/catchAsync');
const { createError } = require('../../../utils/errors');

// Get all attendance records
exports.getAllAttendance = catchAsync(async (req, res) => {
  const { startDate, endDate, employeeId, departmentId, positionId, employeeName, date } = req.query;
  
  let query = { isDeleted: false };
  
  if (date) {
    const selectedDate = new Date(date);
    if (isNaN(selectedDate.getTime())) {
      throw createError(400, 'Invalid date format provided');
    }
    const dayStart = new Date(selectedDate);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(selectedDate);
    dayEnd.setHours(23, 59, 59, 999);
    
    query.date = {
      $gte: dayStart,
      $lte: dayEnd
    };
  }
  // Date range filter (only if single date not provided)
  else if (startDate && endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      throw createError(400, 'Invalid date range format provided');
    }
    
    if (start > end) {
      throw createError(400, 'Start date cannot be after end date');
    }
    
    query.date = {
      $gte: start,
      $lte: end
    };
  }
  
  // Employee filter
  if (employeeId) {
    if (!employeeId.match(/^[0-9a-fA-F]{24}$/)) {
      throw createError(400, 'Invalid employee ID format');
    }
    query.employee = employeeId;
  }
  
  // Department filter
  if (departmentId) {
    if (!departmentId.match(/^[0-9a-fA-F]{24}$/)) {
      throw createError(400, 'Invalid department ID format');
    }
    const employees = await Employee.find({ department: departmentId }).select('_id');
    if (employees.length === 0) {
      throw createError(404, 'No employees found in the specified department');
    }
    query.employee = { $in: employees.map(emp => emp._id) };
  }

  // Position filter
  if (positionId) {
    if (!positionId.match(/^[0-9a-fA-F]{24}$/)) {
      throw createError(400, 'Invalid position ID format');
    }
    const employees = await Employee.find({ position: positionId }).select('_id');
    if (employees.length === 0) {
      throw createError(404, 'No employees found with the specified position');
    }
    
    if (query.employee && query.employee.$in) {
      // If department filter is also applied, intersect the results
      const departmentEmployees = query.employee.$in;
      const positionEmployees = employees.map(emp => emp._id);
      const intersection = departmentEmployees.filter(id => 
        positionEmployees.some(posId => posId.toString() === id.toString())
      );
      
      if (intersection.length === 0) {
        throw createError(404, 'No employees found matching both department and position filters');
      }
      
      query.employee = { $in: intersection };
    } else {
      query.employee = { $in: employees.map(emp => emp._id) };
    }
  }

  // Employee name filter (search in first name and last name)
  if (employeeName && employeeName.trim()) {
    const trimmedName = employeeName.trim();
    if (trimmedName.length < 2) {
      throw createError(400, 'Employee name must be at least 2 characters long');
    }
    
    const nameRegex = new RegExp(trimmedName, 'i');
    const matchingEmployees = await Employee.find({
      $or: [
        { firstName: { $regex: nameRegex } },
        { lastName: { $regex: nameRegex } }
      ]
    }).select('_id');
    
    if (matchingEmployees.length === 0) {
      throw createError(404, `No employees found matching the name "${trimmedName}"`);
    }
    
    if (query.employee && query.employee.$in) {
      // If other filters are applied, intersect the results
      const existingEmployees = query.employee.$in;
      const nameEmployees = matchingEmployees.map(emp => emp._id);
      const intersection = existingEmployees.filter(id => 
        nameEmployees.some(nameId => nameId.toString() === id.toString())
      );
      
      if (intersection.length === 0) {
        throw createError(404, 'No employees found matching all applied filters');
      }
      
      query.employee = { $in: intersection };
    } else {
      query.employee = { $in: matchingEmployees.map(emp => emp._id) };
    }
  }

  const attendance = await Attendance.find(query)
    .populate({
      path: 'employee',
      select: 'firstName lastName department position',
      populate: [
        { path: 'department', select: 'name' },
        { path: 'position', select: 'title' }
      ]
    })
    .sort('-date');

  res.status(200).json({
    status: 'success',
    results: attendance.length,
    data: { attendance }
  });
});

// Get single attendance record
exports.getAttendance = catchAsync(async (req, res) => {
  const attendance = await Attendance.findById(req.params.id)
    .populate({
      path: 'employee',
      select: 'firstName lastName department position',
      populate: [
        { path: 'department', select: 'name' },
        { path: 'position', select: 'title' }
      ]
    });

  if (!attendance) {
    throw createError(404, 'No attendance record found with that ID');
  }

  res.status(200).json({
    status: 'success',
    data: { attendance }
  });
});

// Create attendance record
exports.createAttendance = catchAsync(async (req, res) => {
  const { employee, date, checkIn, status, notes, shift = 'Morning' } = req.body;

  // Normalize date to day range and prevent duplicates
  const providedDate = new Date(date);
  if (isNaN(providedDate.getTime())) {
    throw createError(400, 'Invalid date format');
  }
  const dayStart = new Date(providedDate);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(providedDate);
  dayEnd.setHours(23, 59, 59, 999);

  const existingAttendance = await Attendance.findOne({
    employee,
    date: { $gte: dayStart, $lte: dayEnd },
    isDeleted: false
  });

  if (existingAttendance) {
    throw createError(400, 'Attendance record already exists for this date');
  }

  // Create attendance with check-in only
  const attendance = await Attendance.create({
    employee,
    date: providedDate,
    checkIn: {
      time: checkIn?.time || new Date(),
      device: checkIn?.device || 'Web',
      ipAddress: checkIn?.ipAddress
    },
    status: status || 'Present',
    notes,
    shift,
    workHours: 0 // Initialize work hours as 0
  });

  const populatedAttendance = await Attendance.findById(attendance._id)
    .populate({
      path: 'employee',
      select: 'firstName lastName department position',
      populate: [
        { path: 'department', select: 'name' },
        { path: 'position', select: 'title' }
      ]
    });

  res.status(201).json({
    status: 'success',
    data: { attendance: populatedAttendance }
  });
});

// Create bulk attendance records
exports.createBulkAttendance = catchAsync(async (req, res) => {
  const attendanceRecords = req.body;

  // Validate input
  if (!Array.isArray(attendanceRecords) || attendanceRecords.length === 0) {
    throw createError(400, 'Please provide an array of attendance records');
  }

  // Validate each record has required fields and proper date format
  attendanceRecords.forEach((record, index) => {
    if (!record.employee) {
      throw createError(400, `Employee ID is required for record at index ${index}`);
    }
    if (!record.date) {
      throw createError(400, `Date is required for record at index ${index}`);
    }
    
    // Validate date format
    const date = new Date(record.date);
    if (isNaN(date.getTime())) {
      throw createError(400, `Invalid date format for record at index ${index}`);
    }
  });

  const employeeIds = [...new Set(attendanceRecords.map(record => record.employee))];

  if (employeeIds.length === 0) {
    throw createError(400, 'No valid employee IDs provided');
  }

  // Check if employees exist and are active
  const employees = await Employee.find({
    _id: { $in: employeeIds }
  }).select('_id status');

  if (employees.length !== employeeIds.length) {
    throw createError(400, 'One or more employees not found');
  }

  // Verify all employees are active
  const inactiveEmployees = employees.filter(emp => emp.status !== 'active');
  if (inactiveEmployees.length > 0) {
    throw createError(400, `Found ${inactiveEmployees.length} inactive employee(s)`);
  }

  const results = [];
  const errors = [];

  // Process each attendance record
  for (const record of attendanceRecords) {
    try {
      // Parse and validate date
      const ProvidedDate = new Date(record.date);
      if (isNaN(ProvidedDate.getTime())) {
        throw createError(400, 'Invalid date format');
      }
      const dayStart = new Date(ProvidedDate);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(ProvidedDate);
      dayEnd.setHours(23, 59, 59, 999);

      // Find existing attendance for the day using range
      const existingAttendance = await Attendance.findOne({
        employee: record.employee,
        date: { $gte: dayStart, $lte: dayEnd },
        isDeleted: false
      });

      // If an attendance record exists for that day
      if (existingAttendance) {
        // Prevent duplicate check-in attempts via bulk
        if (record.checkIn) {
          errors.push({
            employee: record.employee,
            date: record.date,
            error: 'Attendance already marked for this date'
          });
          continue;
        }

        // Handle checkout updates via bulk
        if (record.checkOut) {
          const checkInTime = existingAttendance.checkIn?.time;
          const alreadyCheckedOut = !!existingAttendance.checkOut?.time;

          if (!checkInTime) {
            errors.push({
              employee: record.employee,
              date: record.date,
              error: 'Cannot checkout without an existing check-in'
            });
            continue;
          }

          if (alreadyCheckedOut) {
            errors.push({
              employee: record.employee,
              date: record.date,
              error: 'Checkout already recorded for this date'
            });
            continue;
          }

          const checkOutTime = new Date(record.checkOut.time || new Date());
          const workHours = calculateWorkHours(checkInTime, checkOutTime);

          const updatedAttendance = await Attendance.findByIdAndUpdate(
            existingAttendance._id,
            {
              $set: {
                checkOut: {
                  time: checkOutTime,
                  device: record.checkOut.device || 'Web',
                  ipAddress: record.checkOut.ipAddress
                },
                workHours,
                status: determineStatus(checkInTime, checkOutTime, workHours),
                updatedBy: req.user._id
              }
            },
            { new: true }
          ).populate({
            path: 'employee',
            select: 'firstName lastName department position',
            populate: [
              { path: 'department', select: 'name' },
              { path: 'position', select: 'title' }
            ]
          });

          results.push(updatedAttendance);
          continue;
        }

        // If neither checkIn nor checkOut provided properly
        errors.push({
          employee: record.employee,
          date: record.date,
          error: 'Invalid attendance payload'
        });
        continue;
      }

      // No existing record for the day
      if (record.checkOut) {
        // Do not allow creating a new record with only checkout
        errors.push({
          employee: record.employee,
          date: record.date,
          error: 'Cannot checkout without an existing check-in'
        });
        continue;
      }

      // Create new attendance record for check-in (default Present)
      const checkInTime = record.checkIn?.time ? new Date(record.checkIn.time) : new Date();
      if (isNaN(checkInTime.getTime())) {
        throw createError(400, 'Invalid check-in time format');
      }

      const attendanceData = {
        employee: record.employee,
        date: ProvidedDate,
        status: record.status || 'Present',
        notes: record.notes,
        shift: record.shift || 'Morning',
        workHours: 0,
        createdBy: req.user._id,
        updatedBy: req.user._id,
        checkIn: {
          time: checkInTime,
          device: record.checkIn?.device || 'Web',
          ipAddress: record.checkIn?.ipAddress
        }
      };

      const newAttendance = await Attendance.create(attendanceData);

      const populatedAttendance = await Attendance.findById(newAttendance._id)
        .populate({
          path: 'employee',
          select: 'firstName lastName department position',
          populate: [
            { path: 'department', select: 'name' },
            { path: 'position', select: 'title' }
          ]
        });

      results.push(populatedAttendance);
    } catch (error) {
      console.error(`Error processing record for employee ${record.employee}:`, error);
      errors.push({
        employee: record.employee,
        date: record.date,
        error: error.message
      });
      continue;
    }
  }

  res.status(201).json({
    status: 'success',
    results: results.length,
    data: { 
      attendance: results,
      errors: errors.length > 0 ? errors : undefined
    }
  });
});

// Helper function to calculate work hours
const calculateWorkHours = (checkInTime, checkOutTime) => {
  if (!checkInTime || !checkOutTime) return 0;
  
  const checkIn = new Date(checkInTime);
  const checkOut = new Date(checkOutTime);
  
  // Validate dates
  if (isNaN(checkIn.getTime()) || isNaN(checkOut.getTime())) {
    return 0;
  }
  
  // Ensure checkOut is after checkIn
  if (checkOut <= checkIn) {
    return 0;
  }
  
  const diffInHours = (checkOut - checkIn) / (1000 * 60 * 60); // Convert milliseconds to hours
  return Math.max(0, Math.round(diffInHours * 100) / 100); // Round to 2 decimal places, ensure non-negative
};

// Update attendance for checkout
exports.checkOut = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { checkOut } = req.body;

  // Find the attendance record
  const attendance = await Attendance.findById(id);

  if (!attendance) {
    throw createError(404, 'No attendance record found with that ID');
  }

  if (!attendance.checkIn || !attendance.checkIn.time) {
    throw createError(400, 'Cannot checkout without a check-in record');
  }

  if (attendance.checkOut && attendance.checkOut.time) {
    throw createError(400, 'Employee has already checked out');
  }

  const checkInTime = new Date(attendance.checkIn.time);
  const checkOutTime = new Date(checkOut?.time || new Date());

  // Validate checkout time is after checkin
  if (checkOutTime <= checkInTime) {
    throw createError(400, 'Check-out time must be after check-in time');
  }

  // Calculate work hours
  const workHours = calculateWorkHours(checkInTime, checkOutTime);

  // Update the attendance record with checkout and work hours
  const updatedAttendance = await Attendance.findByIdAndUpdate(
    id,
    {
      $set: {
        checkOut: {
          time: checkOutTime,
          device: checkOut?.device || 'Web',
          ipAddress: checkOut?.ipAddress
        },
        workHours,
        status: determineStatus(checkInTime, checkOutTime, workHours)
      }
    },
    {
      new: true,
      runValidators: true
    }
  ).populate({
    path: 'employee',
    select: 'firstName lastName department position',
    populate: [
      { path: 'department', select: 'name' },
      { path: 'position', select: 'title' }
    ]
  });

  res.status(200).json({
    status: 'success',
    data: { attendance: updatedAttendance }
  });
});

// Helper function to determine attendance status
const determineStatus = (checkInTime, checkOutTime, workHours) => {
  // You can customize these thresholds based on your requirements
  const fullDayHours = 8; // Standard work hours for a full day
  const halfDayHours = 4; // Standard work hours for a half day
  
  if (workHours >= fullDayHours) {
    return 'Present';
  } else if (workHours >= halfDayHours) {
    return 'Half-Day';
  } else if (workHours > 0) {
    return 'Early-Leave';
  } else {
    return 'Absent';
  }
};

// Delete attendance record (Soft Delete)
exports.deleteAttendance = catchAsync(async (req, res) => {
  const attendance = await Attendance.findById(req.params.id);

  if (!attendance) {
    throw createError(404, 'No attendance record found with that ID');
  }

  // Implement soft delete
  attendance.isDeleted = true;
  await attendance.save();

  res.status(200).json({
    status: 'success',
    message: 'Attendance record deleted successfully'
  });
});

// Get attendance statistics
exports.getAttendanceStats = catchAsync(async (req, res) => {
  const { startDate, endDate, departmentId } = req.query;

  try {
    // Validate and set date range for current month
    const validStartDate = startDate ? new Date(startDate) : new Date();
    validStartDate.setHours(0, 0, 0, 0);
    
    const validEndDate = endDate ? new Date(endDate) : new Date();
    validEndDate.setHours(23, 59, 59, 999);

    if (isNaN(validStartDate.getTime()) || isNaN(validEndDate.getTime())) {
      throw createError(400, 'Invalid date format provided');
    }

    // Get total active employees count
    let employeeQuery = { status: 'active' };
    if (departmentId) {
      employeeQuery.department = departmentId;
    }
    const totalEmployees = await Employee.countDocuments(employeeQuery);
    const employees = await Employee.find(employeeQuery).select('_id');
    const employeeIds = employees.map(emp => emp._id);

    // Build base match stage for attendance queries
    let baseMatchStage = { 
      isDeleted: false,
      employee: { $in: employeeIds }
    };

    // Get current period stats with employee details
    let currentPeriodMatch = { 
      ...baseMatchStage,
      date: {
        $gte: validStartDate,
        $lte: validEndDate
      }
    };

    const currentPeriodStats = await Attendance.aggregate([
      {
        $match: currentPeriodMatch
      },
      {
        $lookup: {
          from: 'employees',
          localField: 'employee',
          foreignField: '_id',
          as: 'employeeDetails'
        }
      },
      {
        $unwind: '$employeeDetails'
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          uniqueEmployees: { $addToSet: '$employee' },
          totalWorkHours: { $sum: '$workHours' },
          records: {
            $push: {
              _id: '$_id',
              date: '$date',
              employee: '$employeeDetails',
              checkIn: '$checkIn',
              checkOut: '$checkOut',
              status: '$status',
              workHours: '$workHours'
            }
          }
        }
      }
    ]);

    // Calculate previous period dates
    const prevPeriodStart = new Date(validStartDate);
    prevPeriodStart.setMonth(prevPeriodStart.getMonth() - 1);
    prevPeriodStart.setHours(0, 0, 0, 0);

    const prevPeriodEnd = new Date(validEndDate);
    prevPeriodEnd.setMonth(prevPeriodEnd.getMonth() - 1);
    prevPeriodEnd.setHours(23, 59, 59, 999);

    // Get previous period stats
    let prevPeriodMatch = { 
      ...baseMatchStage,
      date: {
        $gte: prevPeriodStart,
        $lte: prevPeriodEnd
      }
    };

    const prevPeriodStats = await Attendance.aggregate([
      {
        $match: prevPeriodMatch
      },
      {
        $lookup: {
          from: 'employees',
          localField: 'employee',
          foreignField: '_id',
          as: 'employeeDetails'
        }
      },
      {
        $unwind: '$employeeDetails'
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          uniqueEmployees: { $addToSet: '$employee' },
          totalWorkHours: { $sum: '$workHours' }
        }
      }
    ]);

    // Process current period stats
    const processedStats = {
      present: 0,
      absent: 0,
      late: 0,
      halfDay: 0,
      earlyLeave: 0,
      onLeave: 0,
      holiday: 0,
      dayOff: 0,
      totalWorkHours: 0,
      records: [] // Store all attendance records
    };

    // Process stats and collect records
    currentPeriodStats.forEach(stat => {
      if (!stat._id) return;
      
      switch(stat._id) {
        case 'Present':
          processedStats.present = stat.count;
          processedStats.records.push(...stat.records);
          break;
        case 'Absent':
          processedStats.absent = stat.count;
          processedStats.records.push(...stat.records);
          break;
        case 'Late':
          processedStats.late = stat.count;
          processedStats.records.push(...stat.records);
          break;
        case 'Half-Day':
          processedStats.halfDay = stat.count;
          processedStats.records.push(...stat.records);
          break;
        case 'Early-Leave':
          processedStats.earlyLeave = stat.count;
          processedStats.records.push(...stat.records);
          break;
        case 'On-Leave':
          processedStats.onLeave = stat.count;
          processedStats.records.push(...stat.records);
          break;
        case 'Holiday':
          processedStats.holiday = stat.count;
          processedStats.records.push(...stat.records);
          break;
        case 'Day-Off':
          processedStats.dayOff = stat.count;
          processedStats.records.push(...stat.records);
          break;
      }
      processedStats.totalWorkHours += stat.totalWorkHours || 0;
    });

    // Process previous period stats
    const prevStats = {
      present: 0,
      absent: 0,
      late: 0,
      halfDay: 0,
      earlyLeave: 0,
      onLeave: 0,
      holiday: 0,
      dayOff: 0,
      totalWorkHours: 0
    };

    prevPeriodStats.forEach(stat => {
      if (!stat._id) return;
      switch(stat._id) {
        case 'Present':
          prevStats.present = stat.count;
          break;
        case 'Absent':
          prevStats.absent = stat.count;
          break;
        case 'Late':
          prevStats.late = stat.count;
          break;
        case 'Half-Day':
          prevStats.halfDay = stat.count;
          break;
        case 'Early-Leave':
          prevStats.earlyLeave = stat.count;
          break;
        case 'On-Leave':
          prevStats.onLeave = stat.count;
          break;
        case 'Holiday':
          prevStats.holiday = stat.count;
          break;
        case 'Day-Off':
          prevStats.dayOff = stat.count;
          break;
      }
      prevStats.totalWorkHours += stat.totalWorkHours || 0;
    });

    // Calculate percentage changes
    const calculateChange = (currentValue, prevValue) => {
      if (prevValue === 0) return currentValue > 0 ? '+100%' : '0%';
      const change = ((currentValue - prevValue) / prevValue) * 100;
      return `${change > 0 ? '+' : ''}${change.toFixed(1)}%`;
    };

    // Calculate changes
    const changes = {
      present: calculateChange(processedStats.present, prevStats.present),
      absent: calculateChange(processedStats.absent, prevStats.absent),
      late: calculateChange(processedStats.late, prevStats.late),
      halfDay: calculateChange(processedStats.halfDay, prevStats.halfDay),
      earlyLeave: calculateChange(processedStats.earlyLeave, prevStats.earlyLeave),
      onLeave: calculateChange(processedStats.onLeave, prevStats.onLeave),
      holiday: calculateChange(processedStats.holiday, prevStats.holiday),
      dayOff: calculateChange(processedStats.dayOff, prevStats.dayOff),
      totalWorkHours: calculateChange(processedStats.totalWorkHours, prevStats.totalWorkHours)
    };

    // Get previous month's employee count
    const prevMonthTotalEmployees = await Employee.countDocuments({
      ...employeeQuery,
      updatedAt: { $lte: prevPeriodEnd }
    });

    // Sort records by date
    processedStats.records.sort((a, b) => new Date(b.date) - new Date(a.date));

    res.status(200).json({
      status: 'success',
      data: {
        stats: processedStats,
        totalEmployees,
        changes: {
          ...changes,
          employees: calculateChange(totalEmployees, prevMonthTotalEmployees)
        },
        dateRange: {
          current: { 
            startDate: validStartDate.toISOString(), 
            endDate: validEndDate.toISOString() 
          },
          previous: { 
            startDate: prevPeriodStart.toISOString(), 
            endDate: prevPeriodEnd.toISOString() 
          }
        }
      }
    });
  } catch (error) {
    console.error('Stats calculation error:', error);
    throw error;
  }
});

// Update attendance record
exports.updateAttendance = catchAsync(async (req, res) => {
  const { date, checkIn, checkOut, status, notes, shift } = req.body;
  
  const attendance = await Attendance.findById(req.params.id);
  
  if (!attendance) {
    throw createError(404, 'No attendance record found with that ID');
  }

  // Calculate work hours if both checkIn and checkOut are provided
  let workHours = attendance.workHours;
  if (checkIn?.time && checkOut?.time) {
    const checkInTime = new Date(checkIn.time);
    const checkOutTime = new Date(checkOut.time);
    workHours = calculateWorkHours(checkInTime, checkOutTime);
  }

  const updatedAttendance = await Attendance.findByIdAndUpdate(
    req.params.id,
    {
      date: date ? new Date(date) : attendance.date,
      checkIn: checkIn ? {
        time: new Date(checkIn.time),
        device: checkIn.device || 'Web',
        ipAddress: checkIn.ipAddress
      } : attendance.checkIn,
      checkOut: checkOut ? {
        time: new Date(checkOut.time),
        device: checkOut.device || 'Web',
        ipAddress: checkOut.ipAddress
      } : attendance.checkOut,
      status: status || attendance.status,
      notes: notes !== undefined ? notes : attendance.notes,
      shift: shift || attendance.shift,
      workHours
    },
    {
      new: true,
      runValidators: true
    }
  ).populate({
    path: 'employee',
    select: 'firstName lastName department position',
    populate: [
      { path: 'department', select: 'name' },
      { path: 'position', select: 'title' }
    ]
  });

  res.status(200).json({
    status: 'success',
    data: { attendance: updatedAttendance }
  });
});

// Get employee attendance by date range
exports.getEmployeeAttendance = catchAsync(async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    
    // Get employee ID from user object
    let employeeId;
    
    // If user has department, they are an Employee model instance
    if (req.user.department) {
      employeeId = req.user._id;
    } else {
      // Try to find associated employee by email
      const employee = await Employee.findOne({ email: req.user.email });
      if (!employee) {
        return next(createError(404, 'No employee record found for this user'));
      }
      employeeId = employee._id;
    }
    
    let query = { 
      employee: employeeId,
      isDeleted: false 
    };
    
    // Add date range filter if provided
    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const attendance = await Attendance.find(query)
      .populate({
        path: 'employee',
        select: 'firstName lastName department position email',
        populate: [
          { path: 'department', select: 'name' },
          { path: 'position', select: 'title' }
        ]
      })
      .sort('-date')
      .lean();

    // Get employee details
    const employeeDetails = attendance[0]?.employee || null;

    // Calculate overall statistics
    const overallStats = {
      total: attendance.length,
      present: attendance.filter(a => a.status === 'Present').length,
      absent: attendance.filter(a => a.status === 'Absent').length,
      late: attendance.filter(a => a.status === 'Late').length,
      halfDay: attendance.filter(a => a.status === 'Half-Day').length,
      earlyLeave: attendance.filter(a => a.status === 'Early-Leave').length,
      onLeave: attendance.filter(a => a.status === 'On-Leave').length,
      totalWorkHours: Number(attendance.reduce((sum, record) => sum + (record.workHours || 0), 0).toFixed(2)),
      averageWorkHours: Number((attendance.reduce((sum, record) => sum + (record.workHours || 0), 0) / (attendance.length || 1)).toFixed(2))
    };

    // Format attendance records with proper date strings
    const formattedAttendance = attendance.map(record => ({
      ...record,
      date: new Date(record.date).toISOString(),
      checkIn: record.checkIn ? {
        ...record.checkIn,
        time: record.checkIn.time ? new Date(record.checkIn.time).toISOString() : null
      } : null,
      checkOut: record.checkOut ? {
        ...record.checkOut,
        time: record.checkOut.time ? new Date(record.checkOut.time).toISOString() : null
      } : null,
      monthYear: new Date(record.date).toLocaleString('default', { month: 'long', year: 'numeric' })
    }));

    // Group by month for statistics
    const monthlyStats = formattedAttendance.reduce((acc, record) => {
      const monthYear = record.monthYear;
      if (!acc[monthYear]) {
        acc[monthYear] = {
          total: 0,
          present: 0,
          absent: 0,
          late: 0,
          halfDay: 0,
          earlyLeave: 0,
          onLeave: 0,
          totalWorkHours: 0,
          averageWorkHours: 0
        };
      }
      
      acc[monthYear].total++;
      acc[monthYear][record.status.toLowerCase()] = (acc[monthYear][record.status.toLowerCase()] || 0) + 1;
      acc[monthYear].totalWorkHours += record.workHours || 0;
      acc[monthYear].averageWorkHours = Number((acc[monthYear].totalWorkHours / acc[monthYear].total).toFixed(2));
      
      return acc;
    }, {});

    res.status(200).json({
      status: 'success',
      data: {
        employee: employeeDetails,
        attendance: formattedAttendance,
        monthlyStats,
        overallStats,
        dateRange: {
          startDate,
          endDate
        }
      }
    });
  } catch (error) {
    console.error('Error in getEmployeeAttendance:', error);
    return next(createError(500, 'Error retrieving attendance records'));
  }
});

// Get attendance records by employee ID
exports.getAttendanceByEmployeeId = catchAsync(async (req, res) => {
  const { employeeId } = req.params;
  const { startDate, endDate, status } = req.query;
  
  // Build query
  let query = { 
    employee: employeeId,
    isDeleted: false 
  };
  
  // Add date range filter if provided
  if (startDate && endDate) {
    query.date = {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    };
  }

  // Add status filter if provided
  if (status) {
    query.status = status;
  }

  const attendance = await Attendance.find(query)
    .populate({
      path: 'employee',
      select: 'firstName lastName department position',
      populate: [
        { path: 'department', select: 'name' },
        { path: 'position', select: 'title' }
      ]
    })
    .sort('-date');

  // Calculate statistics
  const stats = {
    total: attendance.length,
    present: attendance.filter(a => a.status === 'Present').length,
    absent: attendance.filter(a => a.status === 'Absent').length,
    late: attendance.filter(a => a.status === 'Late').length,
    halfDay: attendance.filter(a => a.status === 'Half-Day').length,
    earlyLeave: attendance.filter(a => a.status === 'Early-Leave').length,
    onLeave: attendance.filter(a => a.status === 'On-Leave').length,
    totalWorkHours: attendance.reduce((sum, record) => sum + (record.workHours || 0), 0)
  };

  res.status(200).json({
    status: 'success',
    data: {
      attendance,
      stats
    }
  });
}); 

// Get unique departments and positions from attendance data
exports.getAttendanceFilters = catchAsync(async (req, res) => {
  try {
    // Get unique departments from attendance records
    const departments = await Attendance.aggregate([
      { $match: { isDeleted: false } },
      {
        $lookup: {
          from: 'employees',
          localField: 'employee',
          foreignField: '_id',
          as: 'employeeDetails'
        }
      },
      { $unwind: '$employeeDetails' },
      {
        $lookup: {
          from: 'departments',
          localField: 'employeeDetails.department',
          foreignField: '_id',
          as: 'departmentDetails'
        }
      },
      { $unwind: '$departmentDetails' },
      {
        $group: {
          _id: '$departmentDetails._id',
          name: { $first: '$departmentDetails.name' }
        }
      },
      { $sort: { name: 1 } }
    ]);

    // Get unique positions from attendance records
    const positions = await Attendance.aggregate([
      { $match: { isDeleted: false } },
      {
        $lookup: {
          from: 'employees',
          localField: 'employee',
          foreignField: '_id',
          as: 'employeeDetails'
        }
      },
      { $unwind: '$employeeDetails' },
      {
        $lookup: {
          from: 'positions',
          localField: 'employeeDetails.position',
          foreignField: '_id',
          as: 'positionDetails'
        }
      },
      { $unwind: '$positionDetails' },
      {
        $group: {
          _id: '$positionDetails._id',
          title: { $first: '$positionDetails.title' }
        }
      },
      { $sort: { title: 1 } }
    ]);

    res.status(200).json({
      status: 'success',
      data: {
        departments: departments.map(dept => ({
          _id: dept._id,
          name: dept.name
        })),
        positions: positions.map(pos => ({
          _id: pos._id,
          title: pos.title
        }))
      }
    });
  } catch (error) {
    console.error('Error getting attendance filters:', error);
    throw error;
  }
}); 
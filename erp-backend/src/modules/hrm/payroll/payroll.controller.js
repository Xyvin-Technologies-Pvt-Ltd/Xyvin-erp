const Payroll = require('./payroll.model');
const Employee = require('../employee/employee.model');
const { createError } = require('../../../utils/errors');

// Get all payroll records
exports.getAllPayroll = async (req, res, next) => {
  try {
    const payrolls = await Payroll.find()
      .populate({
        path: 'employee',
        populate: [
          { path: 'department', select: 'name' },
          { path: 'position', select: 'title' }
        ]
      })
      .sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: payrolls });
  } catch (error) {
    next(error);
  }
};

// Get payroll by ID
exports.getPayrollById = async (req, res, next) => {
  try {
    const payroll = await Payroll.findById(req.params.id)
      .populate({
        path: 'employee',
        populate: [
          { path: 'department', select: 'name' },
          { path: 'position', select: 'title' }
        ]
      });
    
    if (!payroll) {
      return next(createError(404, 'Payroll record not found'));
    }
    
    res.status(200).json({ success: true, data: payroll });
  } catch (error) {
    next(error);
  }
};

// Create new payroll
exports.createPayroll = async (req, res, next) => {
  try {
    const { employee: employeeId, allowances, deductions, ...payrollData } = req.body;
    
    // Get employee to fetch salary
    const employee = await Employee.findById(employeeId);
    if (!employee) {
      return next(createError(404, 'Employee not found'));
    }

    // Calculate total allowances
    const totalAllowances = Object.values(allowances || {}).reduce((sum, value) => sum + (Number(value) || 0), 0);

    // Calculate total deductions
    const totalDeductions = Object.values(deductions || {}).reduce((sum, value) => sum + (Number(value) || 0), 0);

    // Calculate net salary
    const netSalary = (employee.salary || 0) + totalAllowances - totalDeductions;

    const payroll = new Payroll({
      ...payrollData,
      employee: employeeId,
      basicSalary: employee.salary,
      allowances: {
        mobile: allowances?.mobile || 0,
        transport: allowances?.transport || 0,
        bonus: allowances?.bonus || 0,
        other: allowances?.other || 0
      },
      deductions: {
        pf: deductions?.pf || 0,
        other: deductions?.other || 0
      },
      netSalary
    });
    
    await payroll.save();
    
    const populatedPayroll = await Payroll.findById(payroll._id)
      .populate({
        path: 'employee',
        populate: [
          { path: 'department', select: 'name' },
          { path: 'position', select: 'title' }
        ]
      });
    
    res.status(201).json({ success: true, data: populatedPayroll });
  } catch (error) {
    next(error);
  }
};

// Update payroll
exports.updatePayroll = async (req, res, next) => {
  try {
    const { allowances, deductions, basicSalary, ...updateData } = req.body;

    // Calculate total allowances if provided
    let totalAllowances = 0;
    if (allowances) {
      totalAllowances = Object.values(allowances).reduce((sum, value) => sum + (Number(value) || 0), 0);
    }

    // Calculate total deductions if provided
    let totalDeductions = 0;
    if (deductions) {
      totalDeductions = Object.values(deductions).reduce((sum, value) => sum + (Number(value) || 0), 0);
    }

    // Get current payroll to use existing values if not provided
    const currentPayroll = await Payroll.findById(req.params.id);
    if (!currentPayroll) {
      return next(createError(404, 'Payroll record not found'));
    }

    // Use existing or new values for calculations
    const finalBasicSalary = basicSalary || currentPayroll.basicSalary || 0;
    const finalAllowances = allowances || currentPayroll.allowances;
    const finalDeductions = deductions || currentPayroll.deductions;

    // Calculate final net salary
    const netSalary = finalBasicSalary + 
      Object.values(finalAllowances).reduce((sum, value) => sum + (Number(value) || 0), 0) -
      Object.values(finalDeductions).reduce((sum, value) => sum + (Number(value) || 0), 0);

    const payroll = await Payroll.findByIdAndUpdate(
      req.params.id,
      { 
        $set: {
          ...updateData,
          basicSalary: finalBasicSalary,
          allowances: finalAllowances,
          deductions: finalDeductions,
          netSalary
        } 
      },
      { new: true }
    ).populate({
      path: 'employee',
      populate: [
        { path: 'department', select: 'name' },
        { path: 'position', select: 'title' }
      ]
    });
    
    if (!payroll) {
      return next(createError(404, 'Payroll record not found'));
    }
    
    res.status(200).json({ success: true, data: payroll });
  } catch (error) {
    next(error);
  }
};

// Delete payroll
exports.deletePayroll = async (req, res, next) => {
  try {
    const payroll = await Payroll.findByIdAndDelete(req.params.id);
    
    if (!payroll) {
      return next(createError(404, 'Payroll record not found'));
    }
    
    res.status(200).json({ success: true, message: 'Payroll record deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// Generate payroll
exports.generatePayroll = async (req, res, next) => {
  try {
    const { employeeId, period, allowances, deductions } = req.body;
    
    // Get employee to fetch salary
    const employee = await Employee.findById(employeeId);
    if (!employee) {
      return next(createError(404, 'Employee not found'));
    }
    
    const payrollData = {
      employee: employeeId,
      period,
      basicSalary: employee.salary,
      allowances: {
        mobile: allowances?.mobile || 0,
        transport: allowances?.transport || 0,
        bonus: allowances?.bonus || 0,
        other: allowances?.other || 0
      },
      deductions: {
        pf: deductions?.pf || 0,
        other: deductions?.other || 0
      }
    };
    
    const payroll = new Payroll(payrollData);
    await payroll.save();
    
    const populatedPayroll = await Payroll.findById(payroll._id)
      .populate({
        path: 'employee',
        populate: [
          { path: 'department', select: 'name' },
          { path: 'position', select: 'title' }
        ]
      });
    
    res.status(201).json({ success: true, data: populatedPayroll });
  } catch (error) {
    next(error);
  }
};

// Get employee salary
exports.getEmployeeSalary = async (req, res, next) => {
  try {
    const { employeeId } = req.params;
    
    const employee = await Employee.findById(employeeId)
      .select('salary firstName lastName position')
      .populate('position', 'title');
    
    if (!employee) {
      return next(createError(404, 'Employee not found'));
    }
    
    res.status(200).json({ success: true, data: employee });
  } catch (error) {
    next(error);
  }
};

// Download payroll
exports.downloadPayroll = async (req, res, next) => {
  try {
    const payroll = await Payroll.findById(req.params.id)
      .populate({
        path: 'employee',
        populate: [
          { path: 'department', select: 'name' },
          { path: 'position', select: 'title' }
        ]
      });
    
    if (!payroll) {
      return next(createError(404, 'Payroll record not found'));
    }
    
    // TODO: Generate PDF document
    // For now, just return the payroll data
    res.status(200).json({ success: true, data: payroll });
  } catch (error) {
    next(error);
  }
};

// Get my payroll records (for employees)
exports.getMyPayroll = async (req, res, next) => {
  try {
    const employeeId = req.user.employeeId;
    
    if (!employeeId) {
      return next(createError(400, 'Employee ID not found in user data'));
    }

    // First find the employee document using employeeId
    const employee = await Employee.findOne({ employeeId });
    
    if (!employee) {
      return next(createError(404, 'Employee not found'));
    }

    const payrolls = await Payroll.find({ employee: employee._id })
      .populate({
        path: 'employee',
        populate: [
          { path: 'department', select: 'name' },
          { path: 'position', select: 'title' }
        ]
      })
      .sort({ period: -1 });

    res.status(200).json({ success: true, data: payrolls });
  } catch (error) {
    next(error);
  }
}; 
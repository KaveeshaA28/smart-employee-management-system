/**
 * Employee Controller
 * ============================================================
 * CRUD for employees with search, filter, document upload.
 *
 * Business Rules:
 * - Admin: Full access (add, update, delete)
 * - HR: View all, update non-salary fields
 * - Manager: View team members
 * - Employee: View own profile only
 */

const Employee = require('../models/Employee');
const path = require('path');
const fs = require('fs');

/**
 * @desc    Get all employees (with search and filter)
 * @route   GET /api/employees
 * @access  Private - Admin, HR, Manager
 */
const getAllEmployees = async (req, res, next) => {
  try {
    const {
      search,
      department,
      role,
      status,
      employmentType,
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = req.query;

    // Build filter query
    const filter = { isDeleted: false };

    if (search) {
      const searchRegex = new RegExp(search, 'i');
      filter.$or = [
        { firstName: searchRegex },
        { lastName: searchRegex },
        { email: searchRegex },
        { employeeId: searchRegex },
        { designation: searchRegex },
      ];
    }
    if (department) filter.department = department;
    if (role) filter.role = role;
    if (status) filter.status = status;
    if (employmentType) filter.employmentType = employmentType;

    // Managers can only see their own team
    if (req.user.role === 'Manager') {
      filter.manager = req.user._id;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

    const [employees, total] = await Promise.all([
      Employee.find(filter)
        .populate('manager', 'firstName lastName employeeId')
        .select('-password -resetPasswordToken -resetPasswordExpire')
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit)),
      Employee.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      count: employees.length,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit)),
      data: employees,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single employee by ID
 * @route   GET /api/employees/:id
 * @access  Private
 */
const getEmployee = async (req, res, next) => {
  try {
    const employee = await Employee.findOne({ _id: req.params.id, isDeleted: false })
      .populate('manager', 'firstName lastName employeeId designation email')
      .select('-password -resetPasswordToken -resetPasswordExpire');

    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee not found.' });
    }

    // Employees can only see their own record
    if (req.user.role === 'Employee' && employee._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    res.status(200).json({ success: true, data: employee });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Add new employee
 * @route   POST /api/employees
 * @access  Private - Admin only
 */
const addEmployee = async (req, res, next) => {
  try {
    const {
      firstName, lastName, email, password, role, department,
      designation, phone, basicSalary, manager, employmentType, joinDate, address,
    } = req.body;

    const existing = await Employee.findOne({ email });
    if (existing) {
      return res.status(409).json({ success: false, message: 'Employee with this email already exists.' });
    }

    const employee = await Employee.create({
      firstName, lastName, email,
      password: password || 'EMS@123456', // Default password
      role: role || 'Employee',
      department, designation, phone,
      basicSalary: basicSalary || 0,
      manager: manager || null,
      employmentType: employmentType || 'Full-Time',
      joinDate: joinDate || new Date(),
      address,
    });

    // Populate manager field
    const populatedEmployee = await Employee.findById(employee._id)
      .populate('manager', 'firstName lastName employeeId')
      .select('-password');

    res.status(201).json({
      success: true,
      message: `Employee added successfully. Employee ID: ${employee.employeeId}`,
      data: populatedEmployee,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update employee
 * @route   PUT /api/employees/:id
 * @access  Private - Admin, HR
 */
const updateEmployee = async (req, res, next) => {
  try {
    // Remove sensitive fields from update
    const { password, employeeId, ...updateData } = req.body;

    // HR cannot update salary or role
    if (req.user.role === 'HR') {
      delete updateData.basicSalary;
      delete updateData.role;
    }

    const employee = await Employee.findOneAndUpdate(
      { _id: req.params.id, isDeleted: false },
      { $set: updateData },
      { new: true, runValidators: true }
    ).populate('manager', 'firstName lastName employeeId').select('-password');

    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee not found.' });
    }

    res.status(200).json({
      success: true,
      message: 'Employee updated successfully.',
      data: employee,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Soft delete employee (mark as deleted + Terminated)
 * @route   DELETE /api/employees/:id
 * @access  Private - Admin only
 */
const deleteEmployee = async (req, res, next) => {
  try {
    // Prevent self-deletion
    if (req.params.id === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'You cannot delete your own account.' });
    }

    const employee = await Employee.findOneAndUpdate(
      { _id: req.params.id, isDeleted: false },
      { $set: { isDeleted: true, status: 'Terminated' } },
      { new: true }
    );

    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee not found.' });
    }

    res.status(200).json({
      success: true,
      message: `Employee '${employee.fullName}' has been terminated and removed.`,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Upload employee document
 * @route   POST /api/employees/:id/documents
 * @access  Private - Admin, HR
 */
const uploadEmployeeDocument = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No document uploaded.' });
    }

    const { documentName } = req.body;
    const docUrl = `/uploads/documents/${req.file.filename}`;

    const employee = await Employee.findByIdAndUpdate(
      req.params.id,
      {
        $push: {
          documents: {
            name: documentName || req.file.originalname,
            url: docUrl,
            uploadedAt: new Date(),
          },
        },
      },
      { new: true }
    ).select('-password');

    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee not found.' });
    }

    res.status(200).json({
      success: true,
      message: 'Document uploaded successfully.',
      documents: employee.documents,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete employee document
 * @route   DELETE /api/employees/:id/documents/:docId
 * @access  Private - Admin, HR
 */
const deleteEmployeeDocument = async (req, res, next) => {
  try {
    const employee = await Employee.findById(req.params.id);
    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee not found.' });
    }

    const doc = employee.documents.id(req.params.docId);
    if (!doc) {
      return res.status(404).json({ success: false, message: 'Document not found.' });
    }

    // Delete physical file
    const filePath = path.join(__dirname, '..', doc.url);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

    employee.documents.pull(req.params.docId);
    await employee.save();

    res.status(200).json({ success: true, message: 'Document deleted successfully.' });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get employee statistics
 * @route   GET /api/employees/stats
 * @access  Private - Admin, HR
 */
const getEmployeeStats = async (req, res, next) => {
  try {
    const [
      totalActive,
      totalByDept,
      totalByRole,
      totalByStatus,
      recentJoins,
    ] = await Promise.all([
      Employee.countDocuments({ status: 'Active', isDeleted: false }),
      Employee.aggregate([
        { $match: { isDeleted: false } },
        { $group: { _id: '$department', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      Employee.aggregate([
        { $match: { isDeleted: false } },
        { $group: { _id: '$role', count: { $sum: 1 } } },
      ]),
      Employee.aggregate([
        { $match: { isDeleted: false } },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      Employee.find({ isDeleted: false })
        .sort({ createdAt: -1 })
        .limit(5)
        .select('firstName lastName employeeId department role createdAt'),
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalActive,
        byDepartment: totalByDept,
        byRole: totalByRole,
        byStatus: totalByStatus,
        recentJoins,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllEmployees,
  getEmployee,
  addEmployee,
  updateEmployee,
  deleteEmployee,
  uploadEmployeeDocument,
  deleteEmployeeDocument,
  getEmployeeStats,
};

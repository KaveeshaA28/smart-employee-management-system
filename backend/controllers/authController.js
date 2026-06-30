/**
 * Auth Controller
 * ============================================================
 * Handles: Register, Login, Logout, Profile, Token Refresh
 *
 * Business Rules:
 * - Only Admin can register new users
 * - JWT tokens expire after 8h
 * - Session tracking on login/logout
 */

const jwt = require('jsonwebtoken');
const Employee = require('../models/Employee');
const { startSession, endSession } = require('../utils/sessionTracker');
const { sendWelcomeEmail } = require('../services/emailService');

// ─── Helper: Generate JWT ──────────────────────────────────────────────────────
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '8h',
  });
};

// ─── Helper: Format Employee Response ─────────────────────────────────────────
const formatEmployee = (emp) => ({
  _id: emp._id,
  employeeId: emp.employeeId,
  firstName: emp.firstName,
  lastName: emp.lastName,
  fullName: emp.fullName || `${emp.firstName} ${emp.lastName}`,
  email: emp.email,
  role: emp.role,
  department: emp.department,
  designation: emp.designation,
  status: emp.status,
  avatar: emp.avatar,
  lastLogin: emp.lastLogin,
});

/**
 * @desc    Register a new employee/user
 * @route   POST /api/auth/register
 * @access  Private - Admin only
 */
const register = async (req, res, next) => {
  try {
    const {
      firstName,
      lastName,
      name,
      email,
      password,
      role,
      department,
      designation,
      phone,
      basicSalary,
      manager,
      employmentType,
      joinDate,
    } = req.body;

    const providedFirstName = firstName || '';
    const providedLastName = lastName || '';
    let finalFirstName = providedFirstName.trim();
    let finalLastName = providedLastName.trim();

    if (!finalFirstName && name) {
      const nameParts = name.trim().split(' ');
      finalFirstName = nameParts.shift() || '';
      finalLastName = nameParts.join(' ') || '';
    }

    if (!finalFirstName || !finalLastName) {
      return res.status(400).json({ success: false, message: 'First name and last name are required.' });
    }

    if (!password || password.length < 8) {
      return res.status(400).json({ success: false, message: 'Password must be at least 8 characters long.' });
    }

    const existingEmployee = await Employee.findOne({ email });
    if (existingEmployee) {
      return res.status(409).json({ success: false, message: 'An account with this email already exists.' });
    }

    const isAdminRegistering = req.user && req.user.role === 'Admin';
    const finalRole = isAdminRegistering ? (role || 'Employee') : 'Employee';

    const employee = await Employee.create({
      firstName: finalFirstName,
      lastName: finalLastName,
      email,
      password,
      role: finalRole,
      department,
      designation,
      phone,
      basicSalary: basicSalary || 0,
      manager: manager || null,
      employmentType: employmentType || 'Full-Time',
      joinDate: joinDate || new Date(),
    });

    // Send welcome email (non-blocking)
    sendWelcomeEmail(employee).catch(console.error);

    res.status(201).json({
      success: true,
      message: `Employee '${employee.fullName}' registered successfully with ID: ${employee.employeeId}`,
      data: formatEmployee(employee),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Login user and return JWT token
 * @route   POST /api/auth/login
 * @access  Public
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }

    // Find employee and include password for comparison
    const employee = await Employee.findOne({ email, isDeleted: false }).select('+password');

    if (!employee) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    // Check password
    const isMatch = await employee.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    // Check account status
    if (employee.status === 'Terminated' || employee.status === 'Inactive') {
      return res.status(403).json({ success: false, message: 'Your account is inactive. Please contact HR.' });
    }

    // Start session tracking
    await startSession(employee);

    // Generate token
    const token = generateToken(employee._id);

    res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      expiresIn: process.env.JWT_EXPIRES_IN || '8h',
      data: formatEmployee(employee),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Logout user and end session
 * @route   POST /api/auth/logout
 * @access  Private
 */
const logout = async (req, res, next) => {
  try {
    const employee = await Employee.findById(req.user._id);
    const sessionSummary = await endSession(employee);

    res.status(200).json({
      success: true,
      message: 'Logged out successfully.',
      session: sessionSummary,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get current authenticated user profile
 * @route   GET /api/auth/me
 * @access  Private
 */
const getMe = async (req, res, next) => {
  try {
    const employee = await Employee.findById(req.user._id).populate('manager', 'firstName lastName employeeId designation');

    if (!employee) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    res.status(200).json({
      success: true,
      data: {
        ...formatEmployee(employee),
        phone: employee.phone,
        joinDate: employee.joinDate,
        employmentType: employee.employmentType,
        manager: employee.manager,
        leaveBalance: employee.leaveBalance,
        currentSession: employee.currentSession,
        address: employee.address,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update current user profile (non-sensitive fields)
 * @route   PUT /api/auth/me
 * @access  Private
 */
const updateProfile = async (req, res, next) => {
  try {
    const { firstName, lastName, phone, address } = req.body;

    const employee = await Employee.findByIdAndUpdate(
      req.user._id,
      { firstName, lastName, phone, address },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully.',
      data: formatEmployee(employee),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Change password
 * @route   PUT /api/auth/change-password
 * @access  Private
 */
const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Current and new password are required.' });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ success: false, message: 'New password must be at least 8 characters.' });
    }

    const employee = await Employee.findById(req.user._id).select('+password');
    const isMatch = await employee.comparePassword(currentPassword);

    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Current password is incorrect.' });
    }

    employee.password = newPassword;
    await employee.save();

    res.status(200).json({ success: true, message: 'Password changed successfully.' });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Upload/update avatar
 * @route   POST /api/auth/avatar
 * @access  Private
 */
const uploadAvatar = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded.' });
    }

    const avatarUrl = `/uploads/avatars/${req.file.filename}`;
    const employee = await Employee.findByIdAndUpdate(
      req.user._id,
      { avatar: avatarUrl },
      { new: true }
    );

    res.status(200).json({
      success: true,
      message: 'Avatar updated successfully.',
      avatarUrl: employee.avatar,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { register, login, logout, getMe, updateProfile, changePassword, uploadAvatar };

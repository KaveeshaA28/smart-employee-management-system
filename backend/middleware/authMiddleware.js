/**
 * Auth Middleware - JWT Verification
 * ============================================================
 * Protects routes by verifying JWT tokens from the Authorization header.
 * Attaches the authenticated employee to req.user.
 */

const jwt = require('jsonwebtoken');
const Employee = require('../models/Employee');

/**
 * Middleware: Verify JWT Token
 * Expects: Authorization: Bearer <token>
 */
const protect = async (req, res, next) => {
  try {
    let token;

    // Extract token from Authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No authentication token provided.',
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Fetch employee from DB (exclude password)
    const employee = await Employee.findById(decoded.id).select('-password');

    if (!employee) {
      return res.status(401).json({
        success: false,
        message: 'Token is valid but user no longer exists.',
      });
    }

    // Check if account is active
    if (employee.status === 'Terminated' || employee.isDeleted) {
      return res.status(403).json({
        success: false,
        message: 'Your account has been deactivated. Please contact HR.',
      });
    }

    // Attach to request
    req.user = employee;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Session expired. Please log in again.',
        code: 'TOKEN_EXPIRED',
      });
    }
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid authentication token.',
      });
    }
    next(error);
  }
};

module.exports = { protect };

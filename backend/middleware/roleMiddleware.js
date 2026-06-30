/**
 * Role Middleware - Role-Based Access Control (RBAC)
 * ============================================================
 * Restricts routes to specific roles.
 * Roles hierarchy: Admin > HR > Manager > Employee
 *
 * Usage: authorize('Admin', 'HR')
 */

/**
 * Middleware factory: Authorize specific roles
 * @param {...string} roles - Allowed roles
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required before role check.',
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Role '${req.user.role}' is not authorized for this action. Required: [${roles.join(', ')}]`,
      });
    }

    next();
  };
};

/**
 * Middleware: Allow employee to access only their own data or admins to access any
 * Checks if req.params.employeeId matches req.user._id (unless Admin/HR)
 */
const selfOrAdmin = (...allowedRoles) => {
  const admins = allowedRoles.length > 0 ? allowedRoles : ['Admin', 'HR', 'Manager'];

  return (req, res, next) => {
    const targetId = req.params.employeeId || req.params.id;
    const currentUserId = req.user._id.toString();
    const currentRole = req.user.role;

    // Allow if admin/HR/manager role
    if (admins.includes(currentRole)) return next();

    // Allow if accessing own data
    if (targetId && targetId === currentUserId) return next();

    return res.status(403).json({
      success: false,
      message: 'You can only access your own data.',
    });
  };
};

module.exports = { authorize, selfOrAdmin };

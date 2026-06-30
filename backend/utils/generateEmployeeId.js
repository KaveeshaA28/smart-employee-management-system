/**
 * Generate Employee ID Utility
 * ============================================================
 * Generates unique sequential employee IDs in the format:
 * EMP-YYYY-XXXX  (e.g., EMP-2024-0001)
 *
 * Finds the last created employee and increments the sequence.
 */

const generateEmployeeId = async () => {
  const Employee = require('../models/Employee');

  const currentYear = new Date().getFullYear();
  const prefix = `EMP-${currentYear}-`;

  // Find the latest employee with this year's prefix
  const lastEmployee = await Employee.findOne(
    { employeeId: { $regex: `^${prefix}` } },
    { employeeId: 1 },
    { sort: { employeeId: -1 } }
  );

  let sequenceNumber = 1;

  if (lastEmployee && lastEmployee.employeeId) {
    // Extract the numeric part after the prefix
    const parts = lastEmployee.employeeId.split('-');
    const lastNum = parseInt(parts[parts.length - 1], 10);
    if (!isNaN(lastNum)) {
      sequenceNumber = lastNum + 1;
    }
  }

  // Zero-pad to 4 digits: 0001, 0002, ...
  const paddedNum = String(sequenceNumber).padStart(4, '0');
  return `${prefix}${paddedNum}`;
};

module.exports = { generateEmployeeId };

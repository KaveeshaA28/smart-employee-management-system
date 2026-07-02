/**
 * Session Tracker Utility
 * ============================================================
 * Tracks employee login/logout times and calculates working hours.
 */

const crypto = require('crypto');

/**
 * Start a new session for an employee on login.
 * @param {Object} employee - Mongoose Employee document
 */
const startSession = async (employee) => {
  employee.currentSession = {
    sessionId: crypto.randomUUID(),
    startTime: new Date(),
    isActive: true,
  };
  employee.lastLogin = new Date();
  await employee.save({ validateBeforeSave: false });

  return employee.currentSession;
};

/**
 * End the current session for an employee on logout.
 * @param {Object} employee - Mongoose Employee document
 * @returns {Object} - Session summary with working hours
 */
const endSession = async (employee) => {
  const session = employee.currentSession;

  if (!session || !session.isActive) {
    return { message: 'No active session found', workingHours: 0 };
  }

  const endTime = new Date();
  const startTime = new Date(session.startTime);
  const diffMs = endTime - startTime;
  const workingHours = parseFloat((diffMs / (1000 * 60 * 60)).toFixed(2));

  employee.currentSession = {
    sessionId: session.sessionId,
    startTime: session.startTime,
    isActive: false,
  };

  await employee.save({ validateBeforeSave: false });

  return {
    sessionId: session.sessionId,
    startTime: session.startTime,
    endTime,
    workingHours,
  };
};

/**
 * Calculate working hours between two timestamps.
 * @param {Date} startTime
 * @param {Date} endTime
 * @returns {number}
 */
const calculateWorkingHours = (startTime, endTime) => {
  if (!startTime || !endTime) return 0;
  const diffMs = new Date(endTime) - new Date(startTime);
  return parseFloat((diffMs / (1000 * 60 * 60)).toFixed(2));
};

module.exports = { startSession, endSession, calculateWorkingHours };
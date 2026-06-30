/**
 * Session Tracker Utility
 * ============================================================
 * Tracks employee login/logout times and calculates working hours.
 * Called on login and logout to update session data.
 */

const { v4: uuidv4 } = require('crypto').randomUUID ? { v4: () => require('crypto').randomUUID() } : { v4: () => `${Date.now()}-${Math.random()}` };

/**
 * Start a new session for an employee on login.
 * Updates employee.currentSession fields.
 * @param {Object} employee - Mongoose Employee document
 */
const startSession = async (employee) => {
  employee.currentSession = {
    sessionId: require('crypto').randomUUID ? require('crypto').randomUUID() : `${Date.now()}`,
    startTime: new Date(),
    isActive: true,
  };
  employee.lastLogin = new Date();
  await employee.save({ validateBeforeSave: false });

  return employee.currentSession;
};

/**
 * End the current session for an employee on logout.
 * Calculates working hours.
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

  // Mark session as inactive
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
 * @returns {number} - Hours worked (rounded to 2 decimal places)
 */
const calculateWorkingHours = (startTime, endTime) => {
  if (!startTime || !endTime) return 0;
  const diffMs = new Date(endTime) - new Date(startTime);
  return parseFloat((diffMs / (1000 * 60 * 60)).toFixed(2));
};

module.exports = { startSession, endSession, calculateWorkingHours };

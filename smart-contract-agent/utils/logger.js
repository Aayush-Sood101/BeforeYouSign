/**
 * Logger Utility Module
 * Provides consistent logging across the application with timestamps and log levels
 */

/**
 * Format a log message with timestamp and level
 * @param {string} level - Log level (INFO, ERROR, WARN, DEBUG)
 * @param {string} message - Log message
 * @param {Object} data - Optional data object
 * @returns {string} Formatted log string
 */
function formatLog(level, message, data = null) {
  const timestamp = new Date().toISOString();
  let logString = `[${timestamp}] [${level}] ${message}`;
  
  if (data) {
    logString += `\n${JSON.stringify(data, null, 2)}`;
  }
  
  return logString;
}

/**
 * Log informational messages
 * @param {string} message - Log message
 * @param {Object} data - Optional data object
 */
function info(message, data = null) {
  console.log(formatLog('INFO', message, data));
}

/**
 * Log error messages
 * @param {string} message - Error message
 * @param {Object} data - Optional error data or error object
 */
function error(message, data = null) {
  console.error(formatLog('ERROR', message, data));
}

/**
 * Log warning messages
 * @param {string} message - Warning message
 * @param {Object} data - Optional data object
 */
function warn(message, data = null) {
  console.warn(formatLog('WARN', message, data));
}

/**
 * Log debug messages (only in development environment)
 * @param {string} message - Debug message
 * @param {Object} data - Optional data object
 */
function debug(message, data = null) {
  if (process.env.NODE_ENV === 'development') {
    console.log(formatLog('DEBUG', message, data));
  }
}

module.exports = {
  info,
  error,
  warn,
  debug
};

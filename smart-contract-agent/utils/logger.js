/**
 * Logger Utility Module
 * Provides consistent logging across the application with timestamps and log levels
 */

const fs = require('fs');
const path = require('path');

// Ensure logs directory exists
const LOGS_DIR = path.join(__dirname, '..', 'logs');
if (!fs.existsSync(LOGS_DIR)) {
  fs.mkdirSync(LOGS_DIR, { recursive: true });
}

// Log file paths
const PROMPT_LOG_FILE = path.join(LOGS_DIR, 'gemini-prompts.log');
const RESPONSE_LOG_FILE = path.join(LOGS_DIR, 'gemini-responses.log');

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

/**
 * Log Gemini prompt to a file
 * Appends the prompt to logs/gemini-prompts.log
 * @param {string} prompt - The prompt sent to Gemini
 * @param {Object} metadata - Optional metadata (repo, timestamp, etc.)
 */
function logGeminiPrompt(prompt, metadata = {}) {
  const timestamp = new Date().toISOString();
  
  let logEntry = '\n' + '='.repeat(100) + '\n';
  logEntry += `GEMINI PROMPT - ${timestamp}\n`;
  logEntry += '='.repeat(100) + '\n';
  
  if (metadata.repository) {
    logEntry += `Repository: ${metadata.repository}\n`;
  }
  if (metadata.pdfFile) {
    logEntry += `PDF File: ${metadata.pdfFile}\n`;
  }
  if (metadata.analysisMode) {
    logEntry += `Analysis Mode: ${metadata.analysisMode}\n`;
  }
  if (metadata.promptLength) {
    logEntry += `Prompt Length: ${metadata.promptLength} characters\n`;
  }
  
  logEntry += '-'.repeat(100) + '\n';
  logEntry += prompt + '\n';
  logEntry += '='.repeat(100) + '\n\n';
  
  try {
    fs.appendFileSync(PROMPT_LOG_FILE, logEntry, 'utf8');
    console.log(formatLog('INFO', `Gemini PROMPT logged to ${PROMPT_LOG_FILE}`));
  } catch (err) {
    console.error(formatLog('ERROR', `Failed to write Gemini prompt to log file: ${err.message}`));
  }
}

/**
 * Log Gemini response to a file
 * Appends the response to logs/gemini-responses.log
 * @param {string} response - The raw Gemini response text
 * @param {Object} metadata - Optional metadata (repo, timestamp, etc.)
 */
function logGeminiResponse(response, metadata = {}) {
  const timestamp = new Date().toISOString();
  
  let logEntry = '\n' + '='.repeat(100) + '\n';
  logEntry += `GEMINI RESPONSE - ${timestamp}\n`;
  logEntry += '='.repeat(100) + '\n';
  
  if (metadata.repository) {
    logEntry += `Repository: ${metadata.repository}\n`;
  }
  if (metadata.pdfFile) {
    logEntry += `PDF File: ${metadata.pdfFile}\n`;
  }
  if (metadata.analysisMode) {
    logEntry += `Analysis Mode: ${metadata.analysisMode}\n`;
  }
  if (metadata.responseLength) {
    logEntry += `Response Length: ${metadata.responseLength} characters\n`;
  }
  if (metadata.duration) {
    logEntry += `Duration: ${metadata.duration}\n`;
  }
  
  logEntry += '-'.repeat(100) + '\n';
  logEntry += response + '\n';
  logEntry += '='.repeat(100) + '\n\n';
  
  try {
    fs.appendFileSync(RESPONSE_LOG_FILE, logEntry, 'utf8');
    console.log(formatLog('INFO', `Gemini RESPONSE logged to ${RESPONSE_LOG_FILE}`));
  } catch (err) {
    console.error(formatLog('ERROR', `Failed to write Gemini response to log file: ${err.message}`));
  }
}

module.exports = {
  info,
  error,
  warn,
  debug,
  logGeminiPrompt,
  logGeminiResponse
};

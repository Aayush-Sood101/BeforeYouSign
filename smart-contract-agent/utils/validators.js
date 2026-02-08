/**
 * Validators Utility Module
 * Provides input validation functions for the application
 */

/**
 * Validate GitHub repository URL and extract owner and repo name
 * @param {string} url - GitHub repository URL
 * @returns {Object} Validation result with owner and repo if valid
 */
function validateGithubUrl(url) {
  if (!url || typeof url !== 'string') {
    return {
      valid: false,
      error: 'GitHub URL is required and must be a string'
    };
  }

  // Remove trailing slash if present
  url = url.trim().replace(/\/$/, '');

  // GitHub URL pattern: https://github.com/{owner}/{repo}
  const githubPattern = /^https?:\/\/github\.com\/([a-zA-Z0-9_-]+)\/([a-zA-Z0-9_.-]+)$/;
  const match = url.match(githubPattern);

  if (!match) {
    return {
      valid: false,
      error: 'Invalid GitHub URL format. Expected: https://github.com/{owner}/{repo}'
    };
  }

  return {
    valid: true,
    owner: match[1],
    repo: match[2]
  };
}

/**
 * Validate uploaded PDF file
 * @param {Object} file - Multer file object
 * @returns {Object} Validation result
 */
function validatePdfFile(file) {
  if (!file) {
    return {
      valid: false,
      error: 'PDF file is required'
    };
  }

  // Check MIME type
  const validMimeTypes = ['application/pdf'];
  if (!validMimeTypes.includes(file.mimetype)) {
    return {
      valid: false,
      error: 'Invalid file type. Only PDF files are allowed'
    };
  }

  // Check file size (compare against MAX_FILE_SIZE from environment)
  const maxSize = parseInt(process.env.MAX_FILE_SIZE) || 10485760; // Default 10MB
  if (file.size > maxSize) {
    return {
      valid: false,
      error: `File too large. Maximum size is ${(maxSize / 1024 / 1024).toFixed(2)}MB`
    };
  }

  return {
    valid: true
  };
}

/**
 * Validate that a string is not empty
 * @param {string} value - Value to validate
 * @param {string} fieldName - Name of the field for error message
 * @returns {Object} Validation result
 */
function validateNotEmpty(value, fieldName = 'Field') {
  if (!value || typeof value !== 'string' || value.trim().length === 0) {
    return {
      valid: false,
      error: `${fieldName} cannot be empty`
    };
  }

  return {
    valid: true
  };
}

module.exports = {
  validateGithubUrl,
  validatePdfFile,
  validateNotEmpty
};

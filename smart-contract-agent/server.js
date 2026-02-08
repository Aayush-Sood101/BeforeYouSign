/**
 * Smart Contract Security Analyzer - Main Server
 * AI-powered backend API that analyzes smart contract code and PDFs for vulnerabilities
 */

// Load environment variables first
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Import utilities
const log = require('./utils/logger');
const { validateGithubUrl, validatePdfFile } = require('./utils/validators');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;
const startTime = Date.now();

// =============================================================================
// MULTER CONFIGURATION - File Upload Handler
// =============================================================================

// Ensure uploads directory exists
const uploadDir = process.env.UPLOAD_DIR || './uploads';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Generate unique filename: timestamp-random-originalname
    const uniquePrefix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniquePrefix + '-' + file.originalname);
  }
});

// File filter - only accept PDFs
const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    cb(new Error('Only PDF files are allowed'), false);
  }
};

// Create multer upload instance
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10485760 // Default 10MB
  }
});

// =============================================================================
// MIDDLEWARE CONFIGURATION
// =============================================================================

// CORS - Allow cross-origin requests
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? process.env.ALLOWED_ORIGINS?.split(',') 
    : '*',
  credentials: true
}));

// Body parsers
app.use(express.json({ limit: '50mb' })); // Parse JSON bodies
app.use(express.urlencoded({ extended: true, limit: '50mb' })); // Parse URL-encoded bodies

// Request logging middleware
app.use((req, res, next) => {
  log.info(`${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get('user-agent')
  });
  next();
});

// =============================================================================
// API ENDPOINTS
// =============================================================================

/**
 * Root Endpoint - API Information
 * GET /
 */
app.get('/', (req, res) => {
  res.json({
    service: 'Smart Contract Security Analyzer',
    version: '1.0.0',
    description: 'AI-powered API for analyzing smart contract vulnerabilities',
    endpoints: {
      health: 'GET /health',
      fullAnalysis: 'POST /api/analyze',
      quickAnalysis: 'POST /api/analyze/quick'
    },
    documentation: 'https://github.com/your-repo/docs',
    status: 'online'
  });
});

/**
 * Health Check Endpoint
 * GET /health
 */
app.get('/health', (req, res) => {
  const uptime = Math.floor((Date.now() - startTime) / 1000);
  
  res.json({
    status: 'OK',
    message: 'Smart Contract Analyzer API is running',
    timestamp: new Date().toISOString(),
    uptime: `${uptime} seconds`,
    environment: process.env.NODE_ENV || 'development'
  });
});

/**
 * Full Analysis Endpoint - PDF + GitHub
 * POST /api/analyze
 * Accepts: multipart/form-data with 'pdf' file and 'githubRepo' text field
 */
app.post('/api/analyze', upload.single('pdf'), async (req, res) => {
  try {
    log.info('Full analysis request received');

    // Validate PDF file
    const pdfValidation = validatePdfFile(req.file);
    if (!pdfValidation.valid) {
      return res.status(400).json({
        success: false,
        error: pdfValidation.error
      });
    }

    // Validate GitHub URL
    const githubUrl = req.body.githubRepo;
    const urlValidation = validateGithubUrl(githubUrl);
    if (!urlValidation.valid) {
      // Clean up uploaded file if validation fails
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(400).json({
        success: false,
        error: urlValidation.error
      });
    }

    log.info('Request validated successfully', {
      filename: req.file.originalname,
      size: req.file.size,
      owner: urlValidation.owner,
      repo: urlValidation.repo
    });

    // TODO: Phase 2-5 - Implement actual analysis logic
    // For now, return placeholder response
    res.json({
      success: true,
      message: 'Analysis endpoint is ready! Full implementation coming in Phases 2-5',
      receivedData: {
        pdfFile: {
          originalName: req.file.originalname,
          size: req.file.size,
          path: req.file.path
        },
        githubRepo: {
          url: githubUrl,
          owner: urlValidation.owner,
          repo: urlValidation.repo
        }
      },
      nextSteps: [
        'Phase 2: PDF parsing and content extraction',
        'Phase 3: GitHub repository code fetching',
        'Phase 4: AI-powered vulnerability analysis',
        'Phase 5: Cross-validation and risk scoring'
      ]
    });

    // Clean up uploaded file (remove this in later phases when we need to process it)
    setTimeout(() => {
      if (fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
        log.debug('Temporary file cleaned up', { path: req.file.path });
      }
    }, 5000);

  } catch (error) {
    log.error('Error in full analysis endpoint', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error during analysis'
    });
  }
});

/**
 * Quick Analysis Endpoint - GitHub Only
 * POST /api/analyze/quick
 * Accepts: JSON body with 'githubRepo' field
 */
app.post('/api/analyze/quick', async (req, res) => {
  try {
    log.info('Quick analysis request received');

    // Validate GitHub URL
    const githubUrl = req.body.githubRepo;
    const urlValidation = validateGithubUrl(githubUrl);
    
    if (!urlValidation.valid) {
      return res.status(400).json({
        success: false,
        error: urlValidation.error
      });
    }

    log.info('GitHub URL validated', {
      owner: urlValidation.owner,
      repo: urlValidation.repo
    });

    // TODO: Phase 3-5 - Implement GitHub fetching and analysis
    res.json({
      success: true,
      message: 'Quick analysis endpoint is ready! Implementation coming in Phases 3-5',
      receivedData: {
        githubRepo: {
          url: githubUrl,
          owner: urlValidation.owner,
          repo: urlValidation.repo
        }
      },
      nextSteps: [
        'Phase 3: GitHub repository code fetching',
        'Phase 4: AI-powered vulnerability analysis',
        'Phase 5: Risk scoring'
      ]
    });

  } catch (error) {
    log.error('Error in quick analysis endpoint', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error during analysis'
    });
  }
});

// =============================================================================
// ERROR HANDLING
// =============================================================================

/**
 * 404 Handler - Route Not Found
 */
app.use((req, res) => {
  log.warn('Route not found', { path: req.path, method: req.method });
  res.status(404).json({
    success: false,
    error: 'Route not found',
    availableEndpoints: {
      health: 'GET /health',
      root: 'GET /',
      fullAnalysis: 'POST /api/analyze',
      quickAnalysis: 'POST /api/analyze/quick'
    }
  });
});

/**
 * Global Error Handler
 */
app.use((err, req, res, next) => {
  // Handle Multer-specific errors
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      const maxSizeMB = (parseInt(process.env.MAX_FILE_SIZE) / 1024 / 1024).toFixed(2);
      return res.status(400).json({
        success: false,
        error: `File too large. Maximum size is ${maxSizeMB}MB`
      });
    }
    return res.status(400).json({
      success: false,
      error: `File upload error: ${err.message}`
    });
  }

  // Handle file type errors
  if (err.message === 'Only PDF files are allowed') {
    return res.status(400).json({
      success: false,
      error: err.message
    });
  }

  // Log the error
  log.error('Unhandled error', {
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });

  // Generic error response
  res.status(500).json({
    success: false,
    error: process.env.NODE_ENV === 'production' 
      ? 'Something went wrong' 
      : err.message
  });
});

// =============================================================================
// SERVER STARTUP
// =============================================================================

app.listen(PORT, () => {
  log.info('═══════════════════════════════════════════════════════════');
  log.info('🚀 Smart Contract Security Analyzer API Server Started');
  log.info('═══════════════════════════════════════════════════════════');
  log.info(`📡 Server running on port ${PORT}`);
  log.info(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  log.info(`📁 Upload directory: ${uploadDir}`);
  log.info(`📏 Max file size: ${(parseInt(process.env.MAX_FILE_SIZE) / 1024 / 1024).toFixed(2)}MB`);
  log.info('');
  log.info('Available endpoints:');
  log.info(`  GET  http://localhost:${PORT}/`);
  log.info(`  GET  http://localhost:${PORT}/health`);
  log.info(`  POST http://localhost:${PORT}/api/analyze`);
  log.info(`  POST http://localhost:${PORT}/api/analyze/quick`);
  log.info('═══════════════════════════════════════════════════════════');
});

module.exports = app;

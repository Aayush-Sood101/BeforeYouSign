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

// Import services
const { analyzePdf } = require('./services/pdfParser');
const { fetchGithubCode } = require('./services/githubFetcher');

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
  let filePath = null;
  
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

    filePath = req.file.path;

    log.info('Request validated successfully', {
      filename: req.file.originalname,
      size: req.file.size,
      owner: urlValidation.owner,
      repo: urlValidation.repo
    });

    // PHASE 2: Extract and structure PDF content
    log.info('=== PHASE 2: PDF Extraction ===');
    const pdfData = await analyzePdf(filePath);

    // Generate summary
    const { generateSummary } = require('./services/pdfParser');
    const summary = generateSummary(pdfData);
    
    log.info('Phase 2 complete', {
      pages: pdfData.metadata.pages,
      textLength: pdfData.metadata.textLength
    });

    // PHASE 3: Fetch GitHub code
    log.info('=== PHASE 3: GitHub Code Extraction ===');
    const githubData = await fetchGithubCode(githubUrl);
    
    log.info('Phase 3 complete', {
      repository: githubData.metadata.repository,
      files: githubData.metadata.totalFiles,
      lines: githubData.metadata.totalLines
    });

    // Response with both PDF and GitHub data (ready for Gemini in Phase 4)
    res.json({
      success: true,
      analysis: {
        pdf: {
          metadata: pdfData.metadata,
          sections: Object.keys(pdfData.sections).filter(k => pdfData.sections[k].length > 0),
          status: pdfData.status,
          summary: summary
        },
        github: {
          metadata: githubData.metadata,
          status: githubData.status,
          fileCount: githubData.metadata.totalFiles,
          lineCount: githubData.metadata.totalLines,
          categories: githubData.metadata.categories,
          codeSize: `${(githubData.metadata.totalSize / 1024).toFixed(2)} KB`
        },
        ai: {
          status: 'pending',
          message: 'Gemini AI analysis coming in Phase 4'
        },
        readyFor: 'gemini_analysis',
        note: 'Both PDF text and GitHub code extracted successfully. Ready for AI analysis in Phase 4.',
        timestamp: new Date().toISOString()
      }
    });

    // Clean up uploaded file after successful processing
    setTimeout(() => {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        log.debug('Temporary file cleaned up', { path: filePath });
      }
    }, 2000);

  } catch (error) {
    log.error('Error in full analysis endpoint', { 
      error: error.message,
      stack: error.stack 
    });

    // Clean up file on error
    if (filePath && fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    res.status(500).json({
      success: false,
      error: error.message || 'Internal server error during analysis',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
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

    // PHASE 3: Fetch GitHub code
    log.info('=== PHASE 3: GitHub Code Extraction ===');
    const githubData = await fetchGithubCode(githubUrl);
    
    log.info('Phase 3 complete', {
      repository: githubData.metadata.repository,
      files: githubData.metadata.totalFiles,
      lines: githubData.metadata.totalLines
    });

    // Response with GitHub data (ready for Gemini in Phase 4)
    res.json({
      success: true,
      analysis: {
        github: {
          metadata: githubData.metadata,
          status: githubData.status,
          fileCount: githubData.metadata.totalFiles,
          lineCount: githubData.metadata.totalLines,
          categories: githubData.metadata.categories,
          codeSize: `${(githubData.metadata.totalSize / 1024).toFixed(2)} KB`
        },
        ai: {
          status: 'pending',
          message: 'Gemini AI analysis coming in Phase 4'
        },
        readyFor: 'gemini_analysis',
        note: 'GitHub code extracted successfully. Ready for AI analysis in Phase 4.',
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    log.error('Error in quick analysis endpoint', { 
      error: error.message,
      stack: error.stack 
    });
    res.status(500).json({
      success: false,
      error: error.message || 'Internal server error during analysis',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
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

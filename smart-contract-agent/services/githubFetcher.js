/**
 * GitHub Repository Code Fetcher - Phase 3
 * 
 * Extracts Solidity smart contract code from GitHub repositories
 * Handles nested folder structures, rate limiting, and multiple branch names
 * 
 * Architecture: EXTRACTION ONLY - No analysis here
 * This service extracts code → Gemini AI analyzes in Phase 4
 */

const axios = require('axios');
const log = require('../utils/logger');

// =============================================================================
// CONFIGURATION
// =============================================================================

const GITHUB_API_BASE = 'https://api.github.com';
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const BATCH_SIZE = 10;              // Download 10 files at a time
const DELAY_MS = 200;               // 200ms delay between batches
const MAX_FILE_SIZE = 1000000;      // 1MB max file size (1,000,000 bytes)
const REQUEST_TIMEOUT = 30000;      // 30 second timeout

// =============================================================================
// GITHUB API HELPERS
// =============================================================================

/**
 * Get GitHub API headers with authentication
 * @returns {Object} HTTP headers for GitHub API requests
 */
function getGithubHeaders() {
  const headers = {
    'Accept': 'application/vnd.github.v3+json',
    'User-Agent': 'Smart-Contract-Analyzer/1.0'
  };
  
  if (GITHUB_TOKEN) {
    headers['Authorization'] = `Bearer ${GITHUB_TOKEN}`;
  } else {
    log.warn('GITHUB_TOKEN not set - Rate limit: 60 req/hr (vs 5,000 with token)');
  }
  
  return headers;
}

// =============================================================================
// URL PARSING
// =============================================================================

/**
 * Parse GitHub repository URL to extract owner and repo name
 * Supports multiple formats:
 * - https://github.com/owner/repo
 * - http://github.com/owner/repo
 * - github.com/owner/repo
 * - owner/repo (short format)
 * 
 * @param {string} repoUrl - GitHub repository URL
 * @returns {Object} { owner, repo }
 * @throws {Error} If URL format is invalid
 */
function parseGithubUrl(repoUrl) {
  if (!repoUrl || typeof repoUrl !== 'string') {
    throw new Error('Repository URL is required');
  }
  
  // Clean up URL: remove trailing slashes, .git extension, and whitespace
  let url = repoUrl.trim().replace(/\.git$/, '').replace(/\/$/, '');
  
  // Regex patterns for different URL formats
  const patterns = [
    /github\.com\/([^\/]+)\/([^\/]+)/,  // Full URL: https://github.com/owner/repo
    /^([^\/]+)\/([^\/]+)$/               // Short format: owner/repo
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      const owner = match[1];
      const repo = match[2];
      
      // Validate that owner and repo contain only valid characters
      if (owner && repo && /^[a-zA-Z0-9_.-]+$/.test(owner) && /^[a-zA-Z0-9_.-]+$/.test(repo)) {
        return { owner, repo };
      }
    }
  }
  
  throw new Error(`Invalid GitHub repository URL format: ${repoUrl}`);
}

// =============================================================================
// REPOSITORY TREE FETCHING
// =============================================================================

/**
 * Fetch repository tree structure from GitHub
 * Uses recursive=1 to get ALL files including nested folders in one API call
 * 
 * @param {string} owner - Repository owner
 * @param {string} repo - Repository name
 * @param {string} branch - Branch name (default: 'main')
 * @returns {Promise<Array>} Array of file/folder objects
 * @throws {Error} If repository not found or API error
 */
async function fetchRepoTree(owner, repo, branch = 'main') {
  const url = `${GITHUB_API_BASE}/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`;
  
  try {
    log.info(`Fetching repository tree: ${owner}/${repo}@${branch}`);
    
    const response = await axios.get(url, {
      headers: getGithubHeaders(),
      timeout: REQUEST_TIMEOUT
    });
    
    const tree = response.data.tree;
    log.info(`Fetched ${tree.length} items from repository tree`);
    
    return tree;
    
  } catch (error) {
    // Handle specific HTTP errors
    if (error.response?.status === 404) {
      throw new Error(`Repository ${owner}/${repo} not found or branch '${branch}' does not exist`);
    } else if (error.response?.status === 403) {
      const resetTime = error.response.headers['x-ratelimit-reset'];
      if (resetTime) {
        const resetDate = new Date(resetTime * 1000);
        throw new Error(`GitHub API rate limit exceeded. Resets at ${resetDate.toLocaleString()}`);
      }
      throw new Error('GitHub API authentication failed. Check GITHUB_TOKEN in .env file');
    } else if (error.code === 'ECONNABORTED') {
      throw new Error('GitHub API request timeout. Please try again');
    }
    
    throw new Error(`Failed to fetch repository tree: ${error.message}`);
  }
}

/**
 * Fetch repository tree with automatic branch fallback
 * Tries multiple branch names in order: main → master → develop
 * 
 * @param {string} owner - Repository owner
 * @param {string} repo - Repository name
 * @returns {Promise<Array>} Array of file/folder objects
 * @throws {Error} If repository not found on any branch
 */
async function fetchRepoTreeWithFallback(owner, repo) {
  const branches = ['main', 'master', 'develop'];
  
  for (const branch of branches) {
    try {
      const tree = await fetchRepoTree(owner, repo, branch);
      log.info(`Successfully fetched from branch: ${branch}`);
      return tree;
    } catch (error) {
      // If it's a 404 and not the last branch, try next branch
      if (error.message.includes('not found') && branch !== branches[branches.length - 1]) {
        log.warn(`Branch '${branch}' not found, trying next branch...`);
        continue;
      }
      // If it's any other error or the last branch, throw it
      throw error;
    }
  }
  
  throw new Error(`Repository ${owner}/${repo} not found or no standard branches (${branches.join('/')}) exist`);
}

// =============================================================================
// FILE FILTERING
// =============================================================================

/**
 * Filter Solidity files from repository tree
 * 
 * Includes: .sol files from contracts/, interfaces/, libraries/
 * Excludes: test files, mocks, examples, scripts
 * 
 * @param {Array} tree - Repository tree array from GitHub API
 * @returns {Array} Filtered .sol files
 */
function filterSolidityFiles(tree) {
  const filtered = tree.filter(item => {
    // Only include files (blobs), not directories (trees)
    if (item.type !== 'blob') return false;
    
    // Only include .sol files
    if (!item.path.endsWith('.sol')) return false;
    
    const lowerPath = item.path.toLowerCase();
    
    // Skip test files (various patterns)
    if (lowerPath.includes('/test/') || 
        lowerPath.includes('/tests/') ||
        lowerPath.startsWith('test/') ||
        lowerPath.startsWith('tests/') ||
        lowerPath.includes('.test.sol') ||
        lowerPath.includes('.t.sol')) {
      return false;
    }
    
    // Skip mock/example files
    if (lowerPath.includes('/mocks/') || 
        lowerPath.includes('/mock/') ||
        lowerPath.includes('/examples/') ||
        lowerPath.includes('/example/') ||
        (lowerPath.includes('mock') && lowerPath.endsWith('.sol'))) {
      return false;
    }
    
    // Skip script files
    if (lowerPath.includes('/scripts/') || 
        lowerPath.includes('/script/') ||
        lowerPath.startsWith('scripts/') ||
        lowerPath.startsWith('script/')) {
      return false;
    }
    
    return true;
  });
  
  log.info(`Filtered to ${filtered.length} Solidity files (from ${tree.length} total items)`);
  return filtered;
}

/**
 * Categorize Solidity files by their folder location
 * 
 * Categories: contracts, interfaces, libraries, other
 * Handles nested folder structures
 * 
 * @param {Array} files - Filtered Solidity files
 * @returns {Object} Categorized files { contracts: [], interfaces: [], libraries: [], other: [] }
 */
function categorizeSolidityFiles(files) {
  const categories = {
    contracts: [],
    interfaces: [],
    libraries: [],
    other: []
  };
  
  files.forEach(file => {
    const lowerPath = file.path.toLowerCase();
    
    // Check path segments to handle nested folders
    if (lowerPath.includes('/contracts/') || lowerPath.startsWith('contracts/')) {
      categories.contracts.push(file);
    } else if (lowerPath.includes('/interfaces/') || 
               lowerPath.startsWith('interfaces/') ||
               lowerPath.includes('/interface/') ||
               lowerPath.startsWith('interface/')) {
      categories.interfaces.push(file);
    } else if (lowerPath.includes('/libraries/') || 
               lowerPath.includes('/lib/') ||
               lowerPath.startsWith('lib/') ||
               lowerPath.startsWith('libraries/')) {
      categories.libraries.push(file);
    } else {
      categories.other.push(file);
    }
  });
  
  log.info('Files categorized', {
    contracts: categories.contracts.length,
    interfaces: categories.interfaces.length,
    libraries: categories.libraries.length,
    other: categories.other.length
  });
  
  return categories;
}

/**
 * Filter files by size before downloading
 * Skips files larger than maxSizeBytes to avoid memory issues
 * 
 * @param {Array} files - Solidity files array
 * @param {number} maxSizeBytes - Maximum file size (default: 1MB)
 * @returns {Object} { toDownload: [], skipped: [] }
 */
function filterBySize(files, maxSizeBytes = MAX_FILE_SIZE) {
  const toDownload = [];
  const skipped = [];
  
  files.forEach(file => {
    if (file.size > maxSizeBytes) {
      log.warn(`Skipping large file: ${file.path} (${(file.size / 1024).toFixed(2)} KB)`);
      skipped.push(file);
    } else {
      toDownload.push(file);
    }
  });
  
  if (skipped.length > 0) {
    log.info(`Will download ${toDownload.length} files, skipped ${skipped.length} large files`);
  }
  
  return { toDownload, skipped };
}

// =============================================================================
// FILE DOWNLOADING
// =============================================================================

/**
 * Download single file content from GitHub
 * GitHub returns content as base64-encoded string, we decode it to UTF-8
 * 
 * @param {string} owner - Repository owner
 * @param {string} repo - Repository name
 * @param {string} filePath - File path in repository
 * @returns {Promise<Object>} File data { path, content, size, sha, lines }
 */
async function downloadFileContent(owner, repo, filePath) {
  const url = `${GITHUB_API_BASE}/repos/${owner}/${repo}/contents/${filePath}`;
  
  try {
    const response = await axios.get(url, {
      headers: getGithubHeaders(),
      timeout: REQUEST_TIMEOUT
    });
    
    // GitHub returns content as base64-encoded string - decode it
    const content = Buffer.from(response.data.content, 'base64').toString('utf-8');
    const lines = content.split('\n').length;
    
    return {
      path: filePath,
      content: content,
      size: response.data.size,
      sha: response.data.sha,
      lines: lines
    };
    
  } catch (error) {
    log.error(`Failed to download ${filePath}: ${error.message}`);
    return {
      path: filePath,
      error: error.message,
      content: null
    };
  }
}

/**
 * Download all files with rate limiting to avoid GitHub API limits
 * Downloads in batches with delays between batches
 * 
 * @param {string} owner - Repository owner
 * @param {string} repo - Repository name
 * @param {Array} files - Array of file objects to download
 * @returns {Promise<Array>} Array of downloaded file contents
 */
async function downloadAllFiles(owner, repo, files) {
  const downloaded = [];
  const totalBatches = Math.ceil(files.length / BATCH_SIZE);
  
  log.info(`Downloading ${files.length} files in ${totalBatches} batches of ${BATCH_SIZE}...`);
  
  for (let i = 0; i < files.length; i += BATCH_SIZE) {
    const batch = files.slice(i, i + BATCH_SIZE);
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    
    log.info(`Batch ${batchNum}/${totalBatches}: Downloading ${batch.length} files...`);
    
    // Download batch in parallel
    const promises = batch.map(file => 
      downloadFileContent(owner, repo, file.path)
        .catch(err => ({
          path: file.path,
          error: err.message,
          content: null
        }))
    );
    
    const results = await Promise.all(promises);
    downloaded.push(...results);
    
    // Delay between batches to avoid rate limits
    if (i + BATCH_SIZE < files.length) {
      await new Promise(resolve => setTimeout(resolve, DELAY_MS));
    }
  }
  
  // Filter out files that failed to download
  const successful = downloaded.filter(f => f.content !== null);
  const failed = downloaded.filter(f => f.content === null);
  
  if (failed.length > 0) {
    log.warn(`Downloaded ${successful.length} files successfully, ${failed.length} failed`);
  } else {
    log.info(`Downloaded all ${successful.length} files successfully`);
  }
  
  return downloaded;
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Determine file category based on path
 * Used for structuring output
 * 
 * @param {string} path - File path
 * @param {Object} categorized - Categorized files object
 * @returns {string} Category name: 'contract', 'interface', 'library', or 'other'
 */
function getFileCategory(path, categorized) {
  if (categorized.contracts.find(f => f.path === path)) return 'contract';
  if (categorized.interfaces.find(f => f.path === path)) return 'interface';
  if (categorized.libraries.find(f => f.path === path)) return 'library';
  return 'other';
}

// =============================================================================
// MAIN ORCHESTRATOR
// =============================================================================

/**
 * Main function to fetch all Solidity code from GitHub repository
 * This orchestrates all the steps to extract code from a GitHub repo
 * 
 * Process:
 * 1. Parse repository URL
 * 2. Fetch repository tree (with branch fallback)
 * 3. Filter Solidity files (skip tests/mocks/scripts)
 * 4. Categorize files (contracts/interfaces/libraries)
 * 5. Filter by size (skip large files)
 * 6. Download all files (with rate limiting)
 * 7. Calculate statistics
 * 8. Combine code into single string for Gemini
 * 9. Structure final output
 * 
 * @param {string} repoUrl - GitHub repository URL
 * @returns {Promise<Object>} Structured code data ready for Gemini AI analysis
 * @throws {Error} If any step fails
 */
async function fetchGithubCode(repoUrl) {
  const startTime = Date.now();
  
  try {
    log.info('=== Starting GitHub Code Extraction (Phase 3) ===');
    log.info('Repository URL:', { repoUrl });
    
    // Step 1: Parse URL
    const { owner, repo } = parseGithubUrl(repoUrl);
    log.info('Parsed repository', { owner, repo });
    
    // Step 2: Fetch repository tree with branch fallback
    const tree = await fetchRepoTreeWithFallback(owner, repo);
    log.info(`Fetched repository tree: ${tree.length} items`);
    
    // Step 3: Filter Solidity files
    const solidityFiles = filterSolidityFiles(tree);
    
    if (solidityFiles.length === 0) {
      throw new Error('No Solidity (.sol) files found in repository. This may not be a smart contract project.');
    }
    
    log.info(`Found ${solidityFiles.length} Solidity files`);
    
    // Step 4: Categorize files
    const categorized = categorizeSolidityFiles(solidityFiles);
    
    // Step 5: Filter by size
    const { toDownload, skipped } = filterBySize(solidityFiles);
    
    if (toDownload.length === 0) {
      throw new Error('All Solidity files are too large to download');
    }
    
    // Step 6: Download all files with rate limiting
    const downloaded = await downloadAllFiles(owner, repo, toDownload);
    
    // Step 7: Calculate statistics
    const successful = downloaded.filter(f => f.content !== null);
    
    if (successful.length === 0) {
      throw new Error('Failed to download any files from repository');
    }
    
    const totalLines = successful.reduce((sum, f) => sum + (f.lines || 0), 0);
    const totalSize = successful.reduce((sum, f) => sum + (f.size || 0), 0);
    
    // Step 8: Combine all code into single string for Gemini AI
    const combinedCode = successful.map(file => 
      `// ==========================================\n` +
      `// File: ${file.path}\n` +
      `// Lines: ${file.lines}\n` +
      `// Size: ${(file.size / 1024).toFixed(2)} KB\n` +
      `// ==========================================\n\n` +
      file.content +
      `\n\n`
    ).join('');
    
    // Step 9: Structure final output for Gemini
    const result = {
      metadata: {
        repository: `${owner}/${repo}`,
        owner: owner,
        repo: repo,
        fetchedAt: new Date().toISOString(),
        totalFiles: successful.length,
        totalLines: totalLines,
        totalSize: totalSize,
        categories: {
          contracts: categorized.contracts.length,
          interfaces: categorized.interfaces.length,
          libraries: categorized.libraries.length,
          other: categorized.other.length
        },
        skippedFiles: skipped.length,
        failedFiles: downloaded.filter(f => f.content === null).length
      },
      
      // Individual files with metadata
      files: successful.map(f => ({
        path: f.path,
        category: getFileCategory(f.path, categorized),
        content: f.content,
        size: f.size,
        lines: f.lines,
        sha: f.sha
      })),
      
      // Combined code for Gemini (easier to process in single prompt)
      combinedCode: combinedCode,
      
      status: 'ready_for_gemini_analysis'
    };
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    
    log.info('=== GitHub Code Extraction Complete ===');
    log.info('Results', {
      repository: result.metadata.repository,
      files: result.metadata.totalFiles,
      lines: result.metadata.totalLines,
      size: `${(result.metadata.totalSize / 1024).toFixed(2)} KB`,
      duration: `${duration}s`
    });
    
    return result;
    
  } catch (error) {
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    log.error('=== GitHub Code Extraction Failed ===');
    log.error('Error details', { 
      error: error.message, 
      duration: `${duration}s` 
    });
    throw error;
  }
}

// =============================================================================
// EXPORTS
// =============================================================================

module.exports = {
  fetchGithubCode,
  parseGithubUrl,
  fetchRepoTree,
  fetchRepoTreeWithFallback,
  filterSolidityFiles,
  categorizeSolidityFiles,
  downloadFileContent,
  downloadAllFiles,
  filterBySize,
  getFileCategory
};

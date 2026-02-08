# PHASE 3: GITHUB REPOSITORY CODE EXTRACTION
**Duration:** 3-4 hours  
**Difficulty:** Medium ⭐⭐⭐☆☆  
**Goal:** Extract Solidity smart contract code from GitHub repositories with nested folder structures

---

## 🎯 WHAT YOU'RE BUILDING

A service that:
- Connects to GitHub API using authentication token
- Fetches repository structure recursively (handles nested folders)
- Identifies and downloads all `.sol` (Solidity) files from multiple folders
- Organizes code by type (contracts, interfaces, libraries)
- Prepares structured code data for Gemini AI analysis

**Real-world analogy:** Like a research assistant who navigates a GitHub repo, finds all smart contract files buried in nested folders, downloads them, and organizes them neatly for review.

---

## 📋 TYPICAL GITHUB REPOSITORY STRUCTURE

```
project-name/
│
├── contracts/                 ← MAIN FOLDER - Core smart contract logic
│   ├── Token.sol             ← ERC20 token contract
│   ├── Vault.sol             ← Vault/staking contract
│   ├── Lending.sol           ← Lending protocol logic
│   └── Proxy.sol             ← Proxy pattern contracts
│
├── interfaces/               ← Interface definitions
│   └── IERC20.sol           ← Standard interfaces
│
├── libraries/               ← Reusable code libraries
│   └── SafeMath.sol        ← Math libraries
│
├── scripts/                 ← Deployment scripts (IGNORE)
│   └── deploy.js
│
├── test/                    ← Test files (IGNORE)
│   └── token.test.js
│
├── docs/                    ← Documentation (IGNORE)
│   └── whitepaper.pdf
│
├── hardhat.config.js        ← Configuration files
├── package.json
├── README.md
└── .env
```

**What we need:**
- ✅ All `.sol` files from `/contracts` folder (and subfolders)
- ✅ All `.sol` files from `/interfaces` folder
- ✅ All `.sol` files from `/libraries` folder
- ❌ Skip `/test`, `/scripts`, `/docs` folders
- ❌ Skip config files (`.js`, `.json`, `.md`)

**Key Challenge:** Repos can have nested structures like:
```
contracts/
├── core/
│   ├── Token.sol
│   └── Vault.sol
├── governance/
│   └── Governor.sol
└── utils/
    └── Helper.sol
```

---

## 📝 PHASE OBJECTIVES

### 1. GitHub API Authentication (15 min)

**Why authentication is needed:**
- GitHub API rate limits: 60 requests/hour (unauthenticated)
- With token: 5,000 requests/hour (authenticated)
- Private repos require authentication
- Better reliability and access

**How to set up:**

1. **Get GitHub Personal Access Token:**
   - Go to: https://github.com/settings/tokens
   - Settings → Developer Settings → Personal Access Tokens → Generate new token (classic)
   - Required scope: `repo` (Full control of private repositories)
   - Copy token immediately (shown once only)

2. **Store in `.env` file:**
   ```bash
   GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   ```

3. **Load in your service:**
   ```javascript
   const githubToken = process.env.GITHUB_TOKEN;
   
   const headers = {
     'Authorization': `Bearer ${githubToken}`,
     'Accept': 'application/vnd.github.v3+json',
     'User-Agent': 'Smart-Contract-Analyzer/1.0'
   };
   ```

---

### 2. Parse GitHub Repository URL (15 min)

**Input format examples:**
- `https://github.com/OpenZeppelin/openzeppelin-contracts`
- `https://github.com/Uniswap/v3-core`
- `github.com/compound-finance/compound-protocol`
- `OpenZeppelin/openzeppelin-contracts` (short format)

**What to extract:**
- **Owner:** `OpenZeppelin`, `Uniswap`, `compound-finance`
- **Repo:** `openzeppelin-contracts`, `v3-core`, `compound-protocol`

**Implementation:**

```javascript
/**
 * Parse GitHub repository URL to extract owner and repo name
 * @param {string} repoUrl - GitHub repository URL
 * @returns {Object} { owner, repo }
 */
function parseGithubUrl(repoUrl) {
  // Remove trailing slashes, .git, and whitespace
  let url = repoUrl.trim().replace(/\.git$/, '').replace(/\/$/, '');
  
  // Handle different formats:
  // 1. https://github.com/owner/repo
  // 2. http://github.com/owner/repo
  // 3. github.com/owner/repo
  // 4. owner/repo
  
  const patterns = [
    /github\.com\/([^\/]+)\/([^\/]+)/,  // Full URL
    /^([^\/]+)\/([^\/]+)$/               // Short format
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      return {
        owner: match[1],
        repo: match[2]
      };
    }
  }
  
  throw new Error('Invalid GitHub repository URL format');
}

// Test examples
console.log(parseGithubUrl('https://github.com/OpenZeppelin/openzeppelin-contracts'));
// { owner: 'OpenZeppelin', repo: 'openzeppelin-contracts' }

console.log(parseGithubUrl('Uniswap/v3-core'));
// { owner: 'Uniswap', repo: 'v3-core' }
```

---

### 3. Fetch Repository Tree Structure (30 min)

**GitHub API Endpoint:**
```
GET /repos/{owner}/{repo}/git/trees/{branch}?recursive=1
```

**Parameters:**
- `owner`: Repository owner (e.g., "OpenZeppelin")
- `repo`: Repository name (e.g., "openzeppelin-contracts")
- `branch`: Branch name (default: "main" or "master")
- `recursive=1`: Get all files recursively (includes nested folders)

**Example Request:**
```javascript
const axios = require('axios');

/**
 * Fetch repository tree structure
 * @param {string} owner - Repository owner
 * @param {string} repo - Repository name
 * @param {string} branch - Branch name (default: 'main')
 * @returns {Promise<Array>} Array of file/folder objects
 */
async function fetchRepoTree(owner, repo, branch = 'main') {
  const url = `https://api.github.com/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`;
  
  try {
    const response = await axios.get(url, {
      headers: {
        'Authorization': `Bearer ${process.env.GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'Smart-Contract-Analyzer/1.0'
      }
    });
    
    return response.data.tree;  // Array of file objects
    
  } catch (error) {
    if (error.response?.status === 404) {
      throw new Error(`Repository ${owner}/${repo} not found or branch '${branch}' does not exist`);
    } else if (error.response?.status === 403) {
      throw new Error('GitHub API rate limit exceeded or authentication failed');
    }
    throw error;
  }
}
```

**Response structure:**
```json
{
  "tree": [
    {
      "path": "contracts/Token.sol",
      "type": "blob",
      "size": 4523,
      "sha": "abc123..."
    },
    {
      "path": "contracts/core/Vault.sol",
      "type": "blob",
      "size": 7891,
      "sha": "def456..."
    },
    {
      "path": "interfaces/IERC20.sol",
      "type": "blob",
      "size": 892,
      "sha": "ghi789..."
    }
  ]
}
```

**Handle branch fallback:**
```javascript
/**
 * Fetch repo tree with automatic branch fallback
 */
async function fetchRepoTreeWithFallback(owner, repo) {
  // Try 'main' first
  try {
    return await fetchRepoTree(owner, repo, 'main');
  } catch (error) {
    // Fallback to 'master'
    return await fetchRepoTree(owner, repo, 'master');
  }
}
```

---

### 4. Filter Solidity Files from Nested Folders (20 min)

**What to filter:**

```javascript
/**
 * Filter Solidity files from repository tree
 * Handles nested folder structures
 * @param {Array} tree - Repository tree array
 * @returns {Array} Filtered .sol files
 */
function filterSolidityFiles(tree) {
  return tree.filter(item => {
    // Only get files (blobs), not directories
    if (item.type !== 'blob') return false;
    
    // Only .sol files
    if (!item.path.endsWith('.sol')) return false;
    
    const lowerPath = item.path.toLowerCase();
    
    // Skip test files
    if (lowerPath.includes('/test/') || 
        lowerPath.includes('/tests/') ||
        lowerPath.startsWith('test/') ||
        lowerPath.includes('.test.sol')) {
      return false;
    }
    
    // Skip example/mock files
    if (lowerPath.includes('/mocks/') || 
        lowerPath.includes('/examples/') ||
        lowerPath.includes('/mock/')) {
      return false;
    }
    
    // Skip scripts
    if (lowerPath.includes('/scripts/') || lowerPath.includes('/script/')) {
      return false;
    }
    
    return true;
  });
}

// Example usage
const allFiles = await fetchRepoTree('OpenZeppelin', 'openzeppelin-contracts');
const solidityFiles = filterSolidityFiles(allFiles);

console.log(`Found ${solidityFiles.length} Solidity files`);
// Found 127 Solidity files
```

**Categorize by folder:**

```javascript
/**
 * Categorize Solidity files by their folder location
 * @param {Array} files - Filtered Solidity files
 * @returns {Object} Categorized files
 */
function categorizeSolidityFiles(files) {
  const categories = {
    contracts: [],
    interfaces: [],
    libraries: [],
    other: []
  };
  
  files.forEach(file => {
    const path = file.path.toLowerCase();
    
    // Check path segments to handle nested folders
    if (path.includes('/contracts/') || path.startsWith('contracts/')) {
      categories.contracts.push(file);
    } else if (path.includes('/interfaces/') || path.startsWith('interfaces/')) {
      categories.interfaces.push(file);
    } else if (path.includes('/libraries/') || 
               path.includes('/lib/') ||
               path.startsWith('lib/')) {
      categories.libraries.push(file);
    } else {
      categories.other.push(file);
    }
  });
  
  return categories;
}

// Example result
const categorized = categorizeSolidityFiles(solidityFiles);
/*
{
  contracts: [
    { path: 'contracts/Token.sol', ... },
    { path: 'contracts/core/Vault.sol', ... },
    { path: 'contracts/governance/Governor.sol', ... }
  ],
  interfaces: [
    { path: 'interfaces/IERC20.sol', ... }
  ],
  libraries: [
    { path: 'libraries/SafeMath.sol', ... }
  ],
  other: []
}
*/
```

---

### 5. Download File Contents (45 min)

**GitHub API Endpoint:**
```
GET /repos/{owner}/{repo}/contents/{path}
```

**Implementation:**

```javascript
/**
 * Download single file content from GitHub
 * @param {string} owner - Repository owner
 * @param {string} repo - Repository name
 * @param {string} filePath - File path in repository
 * @returns {Promise<Object>} File data with decoded content
 */
async function downloadFileContent(owner, repo, filePath) {
  const url = `https://api.github.com/repos/${owner}/${repo}/contents/${filePath}`;
  
  try {
    const response = await axios.get(url, {
      headers: {
        'Authorization': `Bearer ${process.env.GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'Smart-Contract-Analyzer/1.0'
      }
    });
    
    // GitHub returns content as base64-encoded string
    const content = Buffer.from(response.data.content, 'base64').toString('utf-8');
    
    return {
      path: filePath,
      content: content,
      size: response.data.size,
      sha: response.data.sha,
      lines: content.split('\n').length
    };
    
  } catch (error) {
    console.error(`Failed to download ${filePath}:`, error.message);
    return {
      path: filePath,
      error: error.message,
      content: null
    };
  }
}
```

**Batch download with rate limiting:**

```javascript
/**
 * Download all files with rate limiting to avoid GitHub API limits
 * @param {string} owner - Repository owner
 * @param {string} repo - Repository name
 * @param {Array} files - Array of file objects to download
 * @returns {Promise<Array>} Array of downloaded file contents
 */
async function downloadAllFiles(owner, repo, files) {
  const downloaded = [];
  const BATCH_SIZE = 10;  // Download 10 files at a time
  const DELAY_MS = 200;   // 200ms delay between batches
  
  console.log(`Downloading ${files.length} files in batches of ${BATCH_SIZE}...`);
  
  for (let i = 0; i < files.length; i += BATCH_SIZE) {
    const batch = files.slice(i, i + BATCH_SIZE);
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(files.length / BATCH_SIZE);
    
    console.log(`Batch ${batchNum}/${totalBatches}: Downloading ${batch.length} files...`);
    
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
  
  console.log(`Downloaded ${successful.length} files successfully, ${failed.length} failed`);
  
  return downloaded;
}
```

**Skip large files:**

```javascript
/**
 * Filter files by size before downloading
 */
function filterBySize(files, maxSizeBytes = 1000000) {
  const toDownload = [];
  const skipped = [];
  
  files.forEach(file => {
    if (file.size > maxSizeBytes) {
      console.log(`Skipping large file: ${file.path} (${(file.size / 1024).toFixed(2)} KB)`);
      skipped.push(file);
    } else {
      toDownload.push(file);
    }
  });
  
  return { toDownload, skipped };
}
```

---

### 6. Structure Output for Gemini (30 min)

**Final data structure:**

```javascript
/**
 * Main function to fetch all code from GitHub repo
 * @param {string} repoUrl - GitHub repository URL
 * @returns {Promise<Object>} Structured code data for Gemini
 */
async function fetchGithubCode(repoUrl) {
  const log = require('../utils/logger');
  
  try {
    log.info('Starting GitHub code extraction', { repoUrl });
    
    // Step 1: Parse URL
    const { owner, repo } = parseGithubUrl(repoUrl);
    log.info('Parsed repository', { owner, repo });
    
    // Step 2: Fetch repository tree
    const tree = await fetchRepoTreeWithFallback(owner, repo);
    log.info(`Fetched repository tree: ${tree.length} items`);
    
    // Step 3: Filter Solidity files
    const solidityFiles = filterSolidityFiles(tree);
    log.info(`Found ${solidityFiles.length} Solidity files`);
    
    if (solidityFiles.length === 0) {
      throw new Error('No Solidity files found in repository');
    }
    
    // Step 4: Categorize files
    const categorized = categorizeSolidityFiles(solidityFiles);
    log.info('Files categorized', {
      contracts: categorized.contracts.length,
      interfaces: categorized.interfaces.length,
      libraries: categorized.libraries.length
    });
    
    // Step 5: Filter by size
    const { toDownload, skipped } = filterBySize(solidityFiles);
    log.info(`Will download ${toDownload.length} files, skipped ${skipped.length} large files`);
    
    // Step 6: Download all files
    const downloaded = await downloadAllFiles(owner, repo, toDownload);
    
    // Step 7: Calculate statistics
    const successful = downloaded.filter(f => f.content !== null);
    const totalLines = successful.reduce((sum, f) => sum + (f.lines || 0), 0);
    const totalSize = successful.reduce((sum, f) => sum + (f.size || 0), 0);
    
    // Step 8: Combine all code into single string for Gemini
    const combinedCode = successful.map(file => 
      `// ==========================================\n` +
      `// File: ${file.path}\n` +
      `// Lines: ${file.lines}\n` +
      `// ==========================================\n\n` +
      file.content +
      `\n\n`
    ).join('');
    
    // Step 9: Structure final output
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
        }
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
      
      // Combined code for Gemini (easier to process)
      combinedCode: combinedCode,
      
      status: 'ready_for_gemini_analysis'
    };
    
    log.info('GitHub code extraction complete', {
      files: result.metadata.totalFiles,
      lines: result.metadata.totalLines,
      size: `${(result.metadata.totalSize / 1024).toFixed(2)} KB`
    });
    
    return result;
    
  } catch (error) {
    log.error('GitHub code extraction failed', { error: error.message });
    throw error;
  }
}

/**
 * Helper: Determine file category
 */
function getFileCategory(path, categorized) {
  if (categorized.contracts.find(f => f.path === path)) return 'contract';
  if (categorized.interfaces.find(f => f.path === path)) return 'interface';
  if (categorized.libraries.find(f => f.path === path)) return 'library';
  return 'other';
}
```

---

### 7. Error Handling & Edge Cases (30 min)

**Common issues and solutions:**

```javascript
// 1. Repository not found (404)
if (error.response?.status === 404) {
  throw new Error(`Repository ${owner}/${repo} not found or is private. Check URL and authentication.`);
}

// 2. No Solidity files found
if (solidityFiles.length === 0) {
  throw new Error('No Solidity (.sol) files found in repository. This may not be a smart contract project.');
}

// 3. Rate limit exceeded (403)
if (error.response?.status === 403) {
  const resetTime = error.response.headers['x-ratelimit-reset'];
  const resetDate = new Date(resetTime * 1000);
  throw new Error(`GitHub API rate limit exceeded. Resets at ${resetDate.toLocaleString()}`);
}

// 4. Branch doesn't exist
async function fetchRepoTreeWithFallback(owner, repo) {
  const branches = ['main', 'master', 'develop'];
  
  for (const branch of branches) {
    try {
      return await fetchRepoTree(owner, repo, branch);
    } catch (error) {
      if (error.response?.status === 404) {
        continue;  // Try next branch
      }
      throw error;  // Other error, don't retry
    }
  }
  
  throw new Error(`Repository ${owner}/${repo} not found or no standard branches (main/master/develop) exist`);
}

// 5. Invalid GitHub token
if (error.message.includes('Bad credentials')) {
  throw new Error('Invalid GitHub token. Please check GITHUB_TOKEN in .env file');
}

// 6. Network timeout
const axiosConfig = {
  headers: { ... },
  timeout: 30000,  // 30 second timeout
};
```

---

### 8. Integration with Server (20 min)

**Update `/api/analyze` endpoint:**

```javascript
const { analyzePdf } = require('./services/pdfParser');
const { fetchGithubCode } = require('./services/githubFetcher');

app.post('/api/analyze', upload.single('pdf'), async (req, res) => {
  try {
    const pdfPath = req.file.path;
    const githubUrl = req.body.githubRepo;
    
    log.info('Full analysis request received', { pdfPath, githubUrl });
    
    // Phase 2: Extract PDF text
    log.info('Phase 2: Extracting PDF text...');
    const pdfData = await analyzePdf(pdfPath);
    
    // Phase 3: Fetch GitHub code
    log.info('Phase 3: Fetching GitHub code...');
    const githubData = await fetchGithubCode(githubUrl);
    
    // Phase 4: Send both to Gemini (coming next)
    log.info('Phase 4: Ready for Gemini analysis');
    
    res.json({
      success: true,
      analysis: {
        pdf: {
          pages: pdfData.metadata.pages,
          sections: pdfData.metadata.sectionsFound,
          textLength: pdfData.metadata.textLength,
          status: pdfData.status
        },
        github: {
          repository: githubData.metadata.repository,
          files: githubData.metadata.totalFiles,
          lines: githubData.metadata.totalLines,
          categories: githubData.metadata.categories,
          status: githubData.status
        },
        readyFor: 'gemini_analysis'
      }
    });
    
    // Clean up uploaded file
    setTimeout(() => {
      if (fs.existsSync(pdfPath)) {
        fs.unlinkSync(pdfPath);
      }
    }, 2000);
    
  } catch (error) {
    log.error('Analysis failed', { error: error.message });
    
    // Clean up on error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});
```

---

## 🧪 TESTING PHASE 3

### Test 1: Public Repository with Nested Folders

**Test with OpenZeppelin (complex structure):**
```javascript
const { fetchGithubCode } = require('./services/githubFetcher');

async function test1() {
  console.log('TEST 1: OpenZeppelin (nested folders)');
  
  const result = await fetchGithubCode('https://github.com/OpenZeppelin/openzeppelin-contracts');
  
  console.log('Results:');
  console.log(`- Total files: ${result.metadata.totalFiles}`);
  console.log(`- Total lines: ${result.metadata.totalLines}`);
  console.log(`- Categories:`, result.metadata.categories);
  console.log(`- Combined code length: ${result.combinedCode.length} chars`);
  
  // Verify nested folders were found
  const nestedFiles = result.files.filter(f => 
    f.path.includes('/') && f.path.split('/').length > 2
  );
  console.log(`- Files in nested folders: ${nestedFiles.length}`);
  
  // Expected:
  // - 100+ .sol files found
  // - Categories: contracts, interfaces, libraries
  // - Files from nested paths like contracts/token/ERC20/ERC20.sol
  // - No test files included
}
```

### Test 2: Repository with Simple Structure

**Test with smaller repo:**
```javascript
async function test2() {
  console.log('TEST 2: Simple structure repository');
  
  const result = await fetchGithubCode('Uniswap/v2-core');
  
  console.log('Results:');
  console.log(`- Total files: ${result.metadata.totalFiles}`);
  console.log(`- Files:`, result.files.map(f => f.path));
  
  // Expected:
  // - 5-10 .sol files
  // - Simple paths like contracts/UniswapV2Pair.sol
  // - All files successfully downloaded
}
```

### Test 3: Error Cases

**Test error handling:**
```javascript
async function test3() {
  console.log('TEST 3: Error cases');
  
  // Test 1: Invalid repository
  try {
    await fetchGithubCode('https://github.com/InvalidOwner/invalid-repo-12345');
    console.log('❌ Should have thrown error');
  } catch (error) {
    console.log('✅ Correctly caught: Repository not found');
  }
  
  // Test 2: No Solidity files
  try {
    await fetchGithubCode('https://github.com/microsoft/vscode');
    console.log('❌ Should have thrown error');
  } catch (error) {
    console.log('✅ Correctly caught: No Solidity files found');
  }
  
  // Test 3: Invalid URL format
  try {
    await fetchGithubCode('not-a-valid-url');
    console.log('❌ Should have thrown error');
  } catch (error) {
    console.log('✅ Correctly caught: Invalid URL format');
  }
}
```

### Test 4: Branch Fallback

**Test automatic branch detection:**
```javascript
async function test4() {
  console.log('TEST 4: Branch fallback');
  
  // Some repos use 'master' instead of 'main'
  const result = await fetchGithubCode('compound-finance/compound-protocol');
  
  console.log(`✅ Successfully fetched from fallback branch`);
  console.log(`- Files: ${result.metadata.totalFiles}`);
}
```

### Test 5: Rate Limiting

**Test batch download:**
```javascript
async function test5() {
  console.log('TEST 5: Rate limiting (large repo)');
  
  const startTime = Date.now();
  const result = await fetchGithubCode('OpenZeppelin/openzeppelin-contracts');
  const endTime = Date.now();
  
  const duration = (endTime - startTime) / 1000;
  console.log(`Downloaded ${result.metadata.totalFiles} files in ${duration.toFixed(2)}s`);
  console.log(`Average: ${(duration / result.metadata.totalFiles).toFixed(2)}s per file`);
  
  // Expected: ~0.2-0.3s per file with batching
}
```

### Test 6: API Integration Test

**Test full endpoint:**
```bash
# Create test PDF
echo "Test whitepaper" > test.txt
# (Convert to PDF using any tool)

# Test API
curl -X POST http://localhost:3000/api/analyze \
  -F "pdf=@test-whitepaper.pdf" \
  -F "githubRepo=https://github.com/OpenZeppelin/openzeppelin-contracts"
```

**Expected Response:**
```json
{
  "success": true,
  "analysis": {
    "pdf": {
      "pages": 25,
      "sections": ["overview", "tokenomics"],
      "textLength": 50000,
      "status": "ready_for_gemini_analysis"
    },
    "github": {
      "repository": "OpenZeppelin/openzeppelin-contracts",
      "files": 127,
      "lines": 45000,
      "categories": {
        "contracts": 85,
        "interfaces": 30,
        "libraries": 12
      },
      "status": "ready_for_gemini_analysis"
    },
    "readyFor": "gemini_analysis"
  }
}
```

---

## ✅ COMPLETION CHECKLIST

**Core Functions:**
- [ ] `parseGithubUrl()` - Handles multiple URL formats
- [ ] `fetchRepoTree()` - Gets full repository structure recursively
- [ ] `fetchRepoTreeWithFallback()` - Tries main/master/develop branches
- [ ] `filterSolidityFiles()` - Filters .sol files, skips tests/mocks
- [ ] `categorizeSolidityFiles()` - Organizes by contracts/interfaces/libraries
- [ ] `downloadFileContent()` - Downloads and decodes single file
- [ ] `downloadAllFiles()` - Batch download with rate limiting
- [ ] `fetchGithubCode()` - Main orchestrator function

**Error Handling:**
- [ ] 404 errors (repository not found)
- [ ] 403 errors (rate limit or auth failure)
- [ ] No Solidity files found
- [ ] Invalid URL format
- [ ] Branch doesn't exist (with fallback)
- [ ] Network timeouts
- [ ] Large files skipped

**Integration:**
- [ ] `services/githubFetcher.js` created
- [ ] Integrated into `/api/analyze` endpoint
- [ ] Environment variable configured (GITHUB_TOKEN)
- [ ] Logging throughout process
- [ ] Proper response structure

**Testing:**
- [ ] Tested with OpenZeppelin (nested folders)
- [ ] Tested with simple structure repo
- [ ] Tested error cases (404, no files)
- [ ] Tested branch fallback
- [ ] Tested rate limiting
- [ ] Tested API endpoint integration

---

## 📊 EXPECTED OUTPUT STRUCTURE

```javascript
{
  metadata: {
    repository: "OpenZeppelin/openzeppelin-contracts",
    owner: "OpenZeppelin",
    repo: "openzeppelin-contracts",
    fetchedAt: "2026-02-08T10:30:00Z",
    totalFiles: 127,
    totalLines: 45230,
    totalSize: 1250000,
    categories: {
      contracts: 85,
      interfaces: 30,
      libraries: 12,
      other: 0
    }
  },
  
  files: [
    {
      path: "contracts/token/ERC20/ERC20.sol",
      category: "contract",
      content: "// SPDX-License-Identifier: MIT\npragma solidity ^0.8.0;\n...",
      size: 8523,
      lines: 287,
      sha: "abc123..."
    },
    {
      path: "contracts/core/Vault.sol",
      category: "contract",
      content: "pragma solidity ^0.8.0;\n...",
      size: 12450,
      lines: 456
    }
  ],
  
  combinedCode: "// ==========================================\n// File: contracts/Token.sol\n// ==========================================\n\n...\n\n// ==========================================\n// File: contracts/Vault.sol\n// ==========================================\n\n...",
  
  status: "ready_for_gemini_analysis"
}
```

---

## 🔗 IMPORTANT RESOURCES

- **GitHub REST API Docs:** https://docs.github.com/en/rest
- **Git Trees API:** https://docs.github.com/en/rest/git/trees
- **Contents API:** https://docs.github.com/en/rest/repos/contents
- **Rate Limiting:** https://docs.github.com/en/rest/overview/resources-in-the-rest-api#rate-limiting
- **Authentication:** https://docs.github.com/en/rest/overview/authenticating-to-the-rest-api

---

## 💡 KEY IMPLEMENTATION TIPS

1. **Always use recursive tree fetch** - Don't iterate through folders manually
2. **Implement rate limiting** - Batch requests and add delays
3. **Handle branch variations** - Try main/master/develop automatically
4. **Filter test files aggressively** - They pollute the analysis
5. **Decode base64 content** - GitHub returns content base64-encoded
6. **Skip large files** - Files >1MB are usually not contracts
7. **Log everything** - Helps debugging when repos have unusual structures
8. **Test with real repos** - Edge cases are common

---

**Next Phase:** Phase 4 - Send PDF text + GitHub code to Gemini AI for analysis

**Estimated Time:** 3-4 hours  
**Difficulty:** ⭐⭐⭐☆☆
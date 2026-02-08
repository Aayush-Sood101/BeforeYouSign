# PHASE 1: PROJECT SETUP & FOUNDATION
**Duration:** 2-3 hours  
**Difficulty:** Easy ⭐⭐☆☆☆  
**Goal:** Establish development environment with working Express API server

---

## 🎯 WHAT YOU'RE BUILDING

A basic Node.js API server that can:
- Accept HTTP requests
- Handle file uploads (PDF files)
- Accept text parameters (GitHub URLs)
- Return JSON responses
- Handle errors gracefully

Think of this as building the "skeleton" - the structure that will hold everything else.

---

## 📋 PHASE OBJECTIVES

### 1. Project Initialization (15 min)
**What to do:**
- Create a new directory for your project
- Initialize it as a Node.js project using npm
- Create the basic folder structure

**Folder structure needed:**
```
project-root/
├── services/       ← Will hold business logic (PDF parser, GitHub fetcher, AI analyzer)
├── utils/          ← Will hold helper functions (validators, loggers)
├── uploads/        ← Temporary storage for uploaded PDF files
├── tests/          ← Test files for each service
├── server.js       ← Main application entry point
├── .env            ← Environment variables (API keys, configuration)
├── .gitignore      ← Files to exclude from git
└── package.json    ← Project dependencies and scripts
```

**Why this structure:**
- **services/**: Keeps complex logic separate and testable
- **utils/**: Reusable helper functions used across services
- **uploads/**: File uploads need temporary storage before processing
- **tests/**: Separate testing code from production code
- **.env**: Never hardcode sensitive data like API keys

---

### 2. Dependency Installation (10 min)

**What to install and why:**

| Package | Purpose | When You'll Use It |
|---------|---------|-------------------|
| **express** | Web server framework | Every API endpoint you create |
| **cors** | Allow requests from browsers | When frontend calls your API |
| **dotenv** | Load environment variables | Accessing API keys, configuration |
| **multer** | Handle file uploads | When user uploads PDF |
| **axios** | Make HTTP requests | Calling GitHub API, external services |
| **pdf-parse** | Extract text from PDFs | Reading whitepaper content |
| **@google/generative-ai** | Gemini AI SDK | AI-powered code analysis |
| **nodemon** (dev only) | Auto-restart server on changes | Development convenience |

**Important concept - Dependencies vs DevDependencies:**
- **Dependencies**: Needed in production (express, axios, etc.)
- **DevDependencies**: Only needed during development (nodemon, testing tools)

---

### 3. Environment Configuration (5 min)

**Create .env file with these variables:**

**Server settings:**
- `PORT`: Which port your server runs on (e.g., 3000)
- `NODE_ENV`: development or production

**API Keys (you'll add these in later phases):**
- `GEMINI_API_KEY`: For Gemini AI (Phase 4)
- `GITHUB_TOKEN`: For GitHub API (Phase 3) - optional but increases rate limits

**Upload settings:**
- `MAX_FILE_SIZE`: Maximum PDF size in bytes (e.g., 10485760 = 10MB)
- `UPLOAD_DIR`: Where to temporarily store uploaded files

**Analysis settings:**
- `MAX_CONTRACT_SIZE`: Maximum lines of code to analyze
- `ANALYSIS_TIMEOUT`: How long to wait for analysis (milliseconds)

**Security note:** The .env file should NEVER be committed to git. Add it to .gitignore immediately.

---

### 4. Create .gitignore (5 min)

**What to exclude from version control:**

**Critical (security):**
- `.env` - Contains API keys
- `node_modules/` - Too large, can be reinstalled
- `uploads/*` - User uploaded files (temporary)

**Good practice:**
- Log files
- IDE-specific files (.vscode, .idea)
- Operating system files (.DS_Store, Thumbs.db)
- Test coverage reports
- Cache directories

**Why:** Prevents accidentally exposing secrets, keeps repository clean, avoids platform-specific conflicts.

---

### 5. Build Express Server (30 min)

**What the server needs to do:**

**A. Basic Setup:**
- Import all required packages
- Load environment variables from .env
- Create Express application instance
- Set the port number

**B. Middleware Configuration:**
Middleware = functions that process requests before they reach your endpoints

Configure in this order:
1. **CORS middleware** - Allows cross-origin requests
   - In production, specify allowed domains
   - In development, can allow all origins

2. **JSON parser** - Converts incoming JSON to JavaScript objects
   - Enables `req.body` to contain parsed JSON

3. **URL-encoded parser** - Handles form submissions
   - Enables `req.body` for form data

**C. File Upload Handler (Multer):**
Configure multer to:
- Save files to the `uploads/` directory
- Generate unique filenames (timestamp + random number + original name)
- Only accept PDF files (check MIME type)
- Enforce file size limits
- Return error if wrong file type uploaded

**Filename generation example:**
- Original: `whitepaper.pdf`
- Saved as: `1707389456789-847392847-whitepaper.pdf`
- Why: Prevents filename conflicts when multiple users upload same filename

**D. API Endpoints to Create:**

**Endpoint 1: Health Check**
- **Method:** GET
- **Path:** `/health`
- **Purpose:** Check if server is running
- **Returns:** 
  - Status: "OK"
  - Timestamp
  - Server uptime
  - Environment (dev/production)
- **Why needed:** Load balancers, monitoring tools need this

**Endpoint 2: Root Info**
- **Method:** GET
- **Path:** `/`
- **Purpose:** API documentation landing page
- **Returns:**
  - Service name and version
  - List of available endpoints
  - Link to documentation
- **Why needed:** Developers can see what endpoints exist

**Endpoint 3: Full Analysis (Placeholder)**
- **Method:** POST
- **Path:** `/api/analyze`
- **Accepts:**
  - Form field `pdf` (file)
  - Form field `githubRepo` (text)
- **Returns (for now):** 
  - Message: "Coming in Phase 2"
  - Echo back received parameters
- **Why placeholder:** You'll implement actual logic in Phases 2-5

**Endpoint 4: Quick Analysis (Placeholder)**
- **Method:** POST
- **Path:** `/api/analyze/quick`
- **Accepts:**
  - JSON body with `githubRepo` field
- **Returns (for now):**
  - Message: "Coming in Phase 2"
  - Echo back received parameter
- **Why needed:** Some users might not have whitepaper, only GitHub

**E. Error Handling:**

Two types of error handlers needed:

**1. 404 Handler (Route Not Found):**
- Catches requests to non-existent endpoints
- Returns: 404 status with helpful message

**2. Global Error Handler:**
- Catches all other errors
- Handles Multer-specific errors (file too large, wrong type)
- In development: Shows detailed error messages
- In production: Shows generic "Something went wrong"
- Always logs error details to console

**Why separate handlers:** Different error types need different responses.

---

### 6. Create Utility Files (20 min)

**Utility 1: Logger (utils/logger.js)**

**What it needs:**
Create a logging module with 4 functions:
- `log.info()` - General information
- `log.error()` - Errors and exceptions
- `log.warn()` - Warnings (non-critical issues)
- `log.debug()` - Detailed info (only in development)

**Each log should include:**
- Timestamp in ISO format
- Log level [INFO], [ERROR], [WARN], [DEBUG]
- Message
- Optional data object

**Why not just console.log:**
- Consistent format across application
- Can easily switch to file logging later
- Can disable debug logs in production
- Easier to search and filter logs

**Utility 2: Validators (utils/validators.js)**

**What it needs:**

**Function 1: Validate GitHub URL**
- Input: String URL
- Check: Matches pattern `https://github.com/{owner}/{repo}`
- Extract: Owner name and repository name
- Return: 
  - If valid: `{ valid: true, owner: "...", repo: "..." }`
  - If invalid: `{ valid: false, error: "reason" }`

**Why validate:**
- Prevent crashes from malformed URLs
- Extract needed information (owner, repo)
- Give user helpful error messages

**Function 2: Validate PDF File**
- Input: Multer file object
- Check:
  - File exists
  - MIME type is `application/pdf`
  - Size is within limit
- Return:
  - If valid: `{ valid: true }`
  - If invalid: `{ valid: false, error: "reason" }`

**Why separate validation:**
- Reusable across multiple endpoints
- Centralized validation logic
- Easier to update rules

---

## 🧪 TESTING PHASE 1

### Test 1: Server Starts
**How to test:**
- Start server with `npm run dev`
- Should see startup message
- Should not see any errors
- Process should keep running (not exit)

**What success looks like:**
- Server running message displayed
- Port number shown
- Environment shown
- List of endpoints displayed
- No error stack traces

### Test 2: Health Check
**How to test:**
- Use cURL, Postman, or browser
- Send GET request to `http://localhost:3000/health`

**Expected result:**
- Status code: 200
- JSON response with status "OK"
- Contains timestamp
- Contains uptime number

**What this proves:** Server is accepting and processing requests.

### Test 3: Root Endpoint
**How to test:**
- Send GET request to `http://localhost:3000/`

**Expected result:**
- Status code: 200
- JSON with service info
- List of available endpoints

**What this proves:** Routing is working correctly.

### Test 4: File Upload
**How to test:**
- Use Postman (easier than cURL for files)
- Create POST request to `/api/analyze`
- Body type: form-data
- Add field `pdf` (type: File), select a PDF
- Add field `githubRepo` (type: Text), enter any GitHub URL

**Expected result:**
- Status code: 200 or 501 (not implemented)
- JSON response echoing your inputs
- File successfully uploaded to uploads/ folder

**What this proves:** 
- Multer is configured correctly
- File validation is working
- Request parsing is working

### Test 5: Error Cases

**Test A: Missing PDF**
- POST to `/api/analyze` without PDF file
- Should return 400 error with message "PDF file is required"

**Test B: Wrong File Type**
- Try uploading .txt or .jpg file
- Should return 400 error with message "Only PDF files allowed"

**Test C: File Too Large**
- Try uploading PDF larger than limit
- Should return 400 error with "File too large" message

**Test D: Non-existent Route**
- GET request to `/api/nonexistent`
- Should return 404 error

**What this proves:** Error handling is working as designed.

---

## ✅ COMPLETION CHECKLIST

Mark these off as you complete them:

**Setup:**
- [ ] Project directory created
- [ ] npm initialized (package.json exists)
- [ ] All dependencies installed successfully
- [ ] Folder structure created (services, utils, uploads, tests)
- [ ] .env file created and configured
- [ ] .gitignore created with all necessary exclusions

**Code:**
- [ ] server.js created
- [ ] Express app initialized
- [ ] All middleware configured (CORS, JSON, URL-encoded)
- [ ] Multer configured for file uploads
- [ ] 4 API endpoints created (health, root, analyze, quick-analyze)
- [ ] Error handling implemented (404 and global)
- [ ] utils/logger.js created with 4 log functions
- [ ] utils/validators.js created with 2 validation functions

**Testing:**
- [ ] Server starts without errors
- [ ] Health check endpoint returns 200
- [ ] Root endpoint shows API info
- [ ] File upload works with valid PDF
- [ ] Missing file returns proper error
- [ ] Wrong file type rejected
- [ ] Large file rejected
- [ ] 404 handler catches bad routes

---

## 📊 WHAT YOU'LL HAVE AFTER PHASE 1

**Working Features:**
✅ Professional API server structure
✅ File upload capability
✅ Input validation
✅ Error handling
✅ Logging system
✅ Environment configuration
✅ 4 API endpoints (placeholders ready for logic)

**Not Yet Working:**
❌ PDF content extraction (Phase 2)
❌ GitHub code fetching (Phase 3)
❌ AI analysis (Phase 4)
❌ Risk scoring (Phase 5)
❌ Cross-validation (Phase 5)

---

## 🎓 KEY CONCEPTS LEARNED

### 1. Middleware Pattern
Functions that execute in sequence before your endpoint logic:
```
Request → CORS → JSON Parser → Your Endpoint → Response
```

### 2. Environment Variables
Never hardcode configuration. Use .env for:
- Different values in dev vs production
- Keeping secrets out of code
- Easy configuration changes

### 3. Error-First Callbacks
Node.js pattern: Always handle errors before success case.

### 4. Separation of Concerns
- server.js = routing and middleware
- services/ = business logic
- utils/ = reusable helpers

### 5. REST API Conventions
- GET = retrieve data (health check)
- POST = send data (file upload)
- Return appropriate status codes (200, 400, 404, 500)

---

## 🚀 NEXT PHASE PREVIEW

**Phase 2: PDF Parser**
You'll implement the logic to:
- Read uploaded PDF files
- Extract text content
- Parse into sections (tokenomics, team, etc.)
- Detect red flags
- Calculate trust score

The placeholder `/api/analyze` endpoint will start returning real analysis data.

---

## 💡 COMMON ISSUES & SOLUTIONS

**Issue:** "Port already in use"
**Solution:** Change PORT in .env or kill process using that port

**Issue:** npm install fails
**Solution:** Delete node_modules and package-lock.json, try again

**Issue:** Multer not accepting files
**Solution:** Check MIME type validation, ensure correct form field name

**Issue:** .env values not loading
**Solution:** Ensure dotenv.config() called before accessing process.env

**Issue:** CORS errors in browser
**Solution:** Check CORS middleware is configured before routes

---

**Estimated Time:** 2-3 hours  
**Difficulty:** ⭐⭐☆☆☆  
**You Should Know:** Basic JavaScript, npm basics, REST API concepts  
**Next Phase:** Phase 2 - PDF Parser Implementation
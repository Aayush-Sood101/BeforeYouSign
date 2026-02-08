# Smart Contract Security Analyzer

AI-powered backend API that analyzes smart contract code from GitHub and cross-validates against whitepaper PDFs to detect vulnerabilities, scams, and rug pull patterns before users lose funds.

## 🎯 Project Overview

This is an intelligent backend service that:
- Extracts and parses PDF whitepaper content
- Fetches smart contract code from GitHub repositories  
- Performs deep security analysis using AI
- Identifies vulnerabilities, backdoors, and malicious patterns
- Cross-validates claims vs. actual code implementation
- Returns structured risk assessment reports

## 🔧 Tech Stack

- **Backend:** Node.js + Express
- **AI:** Google Gemini 2.5 Flash
- **Libraries:** pdf-parse, axios, multer, cors, dotenv

## 📋 Current Status: Phase 1 Complete ✅

### What's Working
✅ Express API server with 4 endpoints  
✅ File upload handling (PDF files)  
✅ Input validation (GitHub URLs, PDF files)  
✅ Error handling and logging system  
✅ Environment configuration  
✅ Professional folder structure  

### What's Coming Next
❌ PDF content extraction (Phase 2)  
❌ GitHub code fetching (Phase 3)  
❌ AI vulnerability analysis (Phase 4)  
❌ Cross-validation & risk scoring (Phase 5)  

## 🚀 Getting Started

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn

### Installation

1. Clone the repository
```bash
git clone <your-repo-url>
cd smart-contract-agent
```

2. Install dependencies
```bash
npm install
```

3. Configure environment variables
```bash
# .env file is already created with defaults
# Update API keys when needed in later phases:
# - GEMINI_API_KEY
# - GITHUB_TOKEN (optional)
```

4. Start the development server
```bash
npm run dev
```

The server will start on `http://localhost:3000`

## 📡 API Endpoints

### 1. Health Check
Check if the server is running
```bash
GET /health
```

**Response:**
```json
{
  "status": "OK",
  "message": "Smart Contract Analyzer API is running",
  "timestamp": "2026-02-08T06:28:31.667Z",
  "uptime": "108 seconds",
  "environment": "development"
}
```

### 2. Root Information
Get API information and available endpoints
```bash
GET /
```

### 3. Full Analysis (Coming Soon)
Analyze smart contract with PDF whitepaper
```bash
POST /api/analyze
Content-Type: multipart/form-data

Fields:
- pdf: [PDF file]
- githubRepo: https://github.com/owner/repo
```

### 4. Quick Analysis (Coming Soon)
Analyze smart contract without PDF
```bash
POST /api/analyze/quick
Content-Type: application/json

Body:
{
  "githubRepo": "https://github.com/owner/repo"
}
```

## 🧪 Testing

### Test with cURL

**Health Check:**
```bash
curl http://localhost:3000/health
```

**Quick Analysis:**
```bash
curl -X POST http://localhost:3000/api/analyze/quick \
  -H "Content-Type: application/json" \
  -d '{"githubRepo": "https://github.com/ethereum/solidity"}'
```

**Full Analysis (with file):**
```bash
curl -X POST http://localhost:3000/api/analyze \
  -F "pdf=@/path/to/whitepaper.pdf" \
  -F "githubRepo=https://github.com/owner/repo"
```

### Test with Postman
1. Import the collection (coming soon)
2. Set base URL to `http://localhost:3000`
3. Test each endpoint

## 📁 Project Structure

```
smart-contract-agent/
├── server.js              # Main Express application
├── .env                   # Environment variables (not in git)
├── .gitignore            # Git exclusions
├── package.json          # Dependencies and scripts
│
├── services/             # Business logic (Phase 2-5)
│   └── (coming soon)
│
├── utils/                # Helper functions
│   ├── logger.js         # Logging utility
│   └── validators.js     # Input validation
│
├── uploads/              # Temporary PDF storage
│   └── .gitkeep
│
├── tests/                # Test files (Phase 6)
│   └── (coming soon)
│
└── Phases/               # Implementation guides
    ├── Phase-1:Project Setup and Foundation.md ✅
    ├── Phase-2:PDF Parser Implementation.md
    ├── Phase-3:GITHUB Repository Fetcher.md
    ├── Phase-4:GEMINI AI.md
    ├── Phase-5:Cross Validation.md
    ├── Phase-6:Testing.md
    └── Phase-7:Deployment.md
```

## 🔐 Environment Variables

```bash
# Server Configuration
PORT=3000
NODE_ENV=development

# API Keys (to be added in later phases)
GEMINI_API_KEY=your_gemini_api_key_here
GITHUB_TOKEN=your_github_token_optional

# Upload Configuration
MAX_FILE_SIZE=10485760  # 10MB in bytes
UPLOAD_DIR=./uploads

# Analysis Configuration
MAX_CONTRACT_SIZE=50000
ANALYSIS_TIMEOUT=120000  # 2 minutes
```

## 📊 What It Will Detect (Phases 4-5)

✓ Reentrancy attacks  
✓ Access control flaws  
✓ Unlimited minting  
✓ Hidden backdoors  
✓ Rug pull indicators  
✓ Centralization risks  
✓ Claim mismatches (PDF ≠ Code)  
✓ Integer overflow/underflow  
✓ Unchecked external calls  
✓ Gas limit issues  

## 🎓 Development Phases

- [x] **Phase 1:** Project Setup & Foundation (COMPLETE)
- [ ] **Phase 2:** PDF Parser Implementation
- [ ] **Phase 3:** GitHub Repository Fetcher  
- [ ] **Phase 4:** Gemini AI Integration
- [ ] **Phase 5:** Cross-Validation & Risk Scoring
- [ ] **Phase 6:** Testing
- [ ] **Phase 7:** Deployment

## 📝 Scripts

```bash
npm start      # Start production server
npm run dev    # Start development server with auto-reload
npm test       # Run tests (coming in Phase 6)
```

## 🛡️ Security Features

- File type validation (PDF only)
- File size limits
- URL validation for GitHub links
- Error handling and sanitization
- Environment variable protection

## 🤝 Contributing

This is a learning project. Contributions welcome!

## 📄 License

ISC

## 📞 Support

For questions or issues, please refer to the phase documentation in the `/Phases` directory.

---

**Last Updated:** Phase 1 Complete - February 8, 2026  
**Next Step:** Implement Phase 2 - PDF Parser

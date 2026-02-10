# 🛡️ BeforeYouSign - Comprehensive Blockchain Security Platform

<div align="center">

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![Status](https://img.shields.io/badge/status-Production%20Ready-brightgreen.svg)

**AI-Powered Blockchain Security Analysis Platform**

*Protect your digital assets before signing any transaction*

[Features](#-features) • [Architecture](#-architecture) • [Quick Start](#-quick-start) • [API Reference](#-api-reference) • [Demo](#-demo-walkthrough)

</div>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [System Architecture](#-system-architecture)
- [Project Structure](#-project-structure)
- [Components](#-components)
  - [Smart Contract Agent](#1-smart-contract-agent-backend)
  - [Frontend Application](#2-frontend-application)
  - [Wallet Risk Engine](#3-wallet-risk-engine-walletwork)
  - [Sample Contracts](#4-sample-malicious-contracts-for-testing)
- [Installation & Setup](#-installation--setup)
- [API Reference](#-api-reference)
- [Usage Examples](#-usage-examples)
- [Security Analysis Features](#-security-analysis-features)
- [Technology Stack](#-technology-stack)
- [Environment Variables](#-environment-variables)
- [Testing](#-testing)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🎯 Overview

**BeforeYouSign** is an enterprise-grade blockchain security platform that provides comprehensive risk analysis before users interact with smart contracts or sign transactions. The platform combines AI-powered contract analysis with real-time wallet risk assessment to protect users from:

- 🔴 **Scam Tokens & Rug Pulls** - Detect hidden fees, unlimited minting, and token seizure capabilities
- 🔴 **Phishing Wallet Interactions** - Identify known malicious addresses and scam clusters
- 🔴 **Malicious Contract Calls** - Analyze approval requests, swap functions, and fund transfers
- 🔴 **Whitepaper Discrepancies** - Cross-validate PDF claims against actual smart contract code

### The Problem We Solve

Every year, billions of dollars are lost to cryptocurrency scams, rug pulls, and malicious smart contracts. Users often sign transactions without understanding the risks because:

1. Smart contract code is complex and difficult to audit manually
2. Whitepapers can contain misleading or false claims
3. Wallet interactions with unknown contracts are inherently risky
4. Traditional security tools are reactive, not preventive

**BeforeYouSign** is your pre-transaction firewall — analyzing risks **BEFORE** you sign, not after you've lost your funds.

---

## ✨ Features

### 🔬 Smart Contract Analysis
| Feature | Description |
|---------|-------------|
| **PDF Whitepaper Parsing** | Extract and structure whitepaper content for AI analysis |
| **GitHub Code Fetching** | Automatically fetch and parse Solidity code from repositories |
| **AI Vulnerability Detection** | Use Gemini 2.5 Flash to identify 17+ vulnerability patterns |
| **Cross-Validation** | Compare PDF claims vs actual code implementation |
| **Risk Scoring** | Generate actionable trust scores (0-10 scale) |
| **Detailed Reports** | Exportable PDF security reports |

### 🔍 Wallet Risk Assessment
| Feature | Description |
|---------|-------------|
| **5-Signal Risk Engine** | Deterministic multi-signal analysis |
| **Scam Database Lookup** | Check against known phishing/drainer addresses |
| **Graph Analysis** | Compute hop distance to known scammers |
| **Transaction Simulation** | Predict drain probability before signing |
| **Real-time Classification** | SAFE / CAUTION / DANGEROUS verdicts |

### 🎨 User Experience
| Feature | Description |
|---------|-------------|
| **Modern UI/UX** | Dark-themed, responsive Next.js interface |
| **Clerk Authentication** | Secure user authentication and session management |
| **Browser Extension** | (Planned) MetaMask transaction interception |
| **Color-Coded Verdicts** | Traffic-light system for risk visualization |

---

## 🏗 System Architecture

```
┌────────────────────────────────────────────────────────────────────────────────┐
│                              BEFOREYOUSIGN PLATFORM                            │
├────────────────────────────────────────────────────────────────────────────────┤
│                                                                                │
│  ┌──────────────────┐    ┌──────────────────┐    ┌──────────────────┐        │
│  │   FRONTEND       │    │  SMART CONTRACT  │    │   WALLET RISK    │        │
│  │   (Next.js)      │◄──►│     AGENT        │    │    ENGINE        │        │
│  │   Port: 4000     │    │   (Express.js)   │◄──►│   (FastAPI)      │        │
│  │                  │    │   Port: 3000     │    │   Port: 8000     │        │
│  └────────┬─────────┘    └────────┬─────────┘    └────────┬─────────┘        │
│           │                       │                       │                   │
│           │                       ▼                       ▼                   │
│           │              ┌─────────────────┐     ┌─────────────────┐         │
│           │              │  Gemini 2.5     │     │  Alchemy RPC    │         │
│           │              │  Flash AI       │     │  + Etherscan    │         │
│           │              └─────────────────┘     └─────────────────┘         │
│           │                                                                   │
│           ▼                                                                   │
│  ┌─────────────────────────────────────────────────────────────────────┐     │
│  │                         USER INTERFACE                               │     │
│  │  ┌─────────────────────┐    ┌─────────────────────┐                │     │
│  │  │ Contract Analysis   │    │ Wallet Analysis     │                │     │
│  │  │ - PDF Upload        │    │ - Address Input     │                │     │
│  │  │ - GitHub URL        │    │ - Transaction Type  │                │     │
│  │  │ - Security Report   │    │ - Risk Verdict      │                │     │
│  │  └─────────────────────┘    └─────────────────────┘                │     │
│  └─────────────────────────────────────────────────────────────────────┘     │
│                                                                                │
└────────────────────────────────────────────────────────────────────────────────┘
```

### Data Flow

```
USER INPUT                    PROCESSING                         OUTPUT
──────────                    ──────────                         ──────

┌─────────────┐              ┌──────────────┐                 ┌─────────────┐
│ PDF File    │──────┐       │ Phase 2:     │                 │ Risk Score  │
│ (Whitepaper)│      │       │ PDF Parsing  │──────┐          │ (0-10)      │
└─────────────┘      │       └──────────────┘      │          └─────────────┘
                     ▼                             ▼                  ▲
              ┌──────────────┐              ┌──────────────┐         │
              │ Smart        │              │ Phase 4:     │─────────┘
              │ Contract     │──────────────│ Gemini AI    │
              │ Agent API    │              │ Analysis     │─────────┐
              └──────────────┘              └──────────────┘         │
                     ▲                             ▲          ┌──────▼──────┐
┌─────────────┐      │       ┌──────────────┐      │          │Vulnerabilities│
│ GitHub URL  │──────┘       │ Phase 3:     │──────┘          │& Red Flags   │
│ (Contracts) │              │ Code Fetch   │                 └─────────────┘
└─────────────┘              └──────────────┘


┌─────────────┐              ┌──────────────┐                 ┌─────────────┐
│ Wallet Addr │──────┐       │ Phase 1:     │                 │ SAFE        │
└─────────────┘      │       │ Scam Intel   │──────┐          │ CAUTION     │
                     ▼       └──────────────┘      │          │ DANGEROUS   │
              ┌──────────────┐                     ▼          └─────────────┘
              │ Wallet Risk  │              ┌──────────────┐         ▲
              │ Engine API   │──────────────│ Phase 2:     │         │
              └──────────────┘              │ On-Chain     │─────────┘
                     ▲       ┌──────────────│ Intelligence │
┌─────────────┐      │       │              └──────────────┘
│ Contract    │──────┘       │ Phase 3:            │
│ Address     │              │ Graph Analysis──────┤
└─────────────┘              │                     ▼
                             │ Phase 4:     ┌──────────────┐
┌─────────────┐              │ Simulation   │ Risk Score   │
│ Tx Type     │──────────────│──────────────│ (0-100)      │
│ (approve/   │              │              └──────────────┘
│  swap/send) │              └──────────────┘
└─────────────┘
```

---

## 📁 Project Structure

```
BeforeYouSign/
│
├── README.md                     # This file (project documentation)
│
├── frontend/                     # Next.js Frontend Application
│   ├── app/
│   │   ├── page.tsx             # Root redirect to /home
│   │   ├── layout.tsx           # Global layout with Clerk auth
│   │   ├── globals.css          # Global styles
│   │   ├── analyze/
│   │   │   └── page.tsx         # Main analysis page (tabs)
│   │   ├── components/
│   │   │   ├── ContractAnalysis.tsx  # Smart contract analysis component
│   │   │   ├── WalletAnalysis.tsx    # Wallet risk analysis component
│   │   │   ├── Header.jsx            # Navigation header
│   │   │   ├── Footer.jsx            # Page footer
│   │   │   ├── Hero.jsx              # Landing hero section
│   │   │   ├── Features.jsx          # Feature showcase
│   │   │   └── Faqs.jsx              # FAQ section
│   │   ├── home/
│   │   │   └── page.tsx         # Home page
│   │   ├── login/               # Authentication pages
│   │   ├── signup/
│   │   └── contact/
│   ├── lib/
│   │   └── utils.ts             # Utility functions
│   ├── middleware.ts            # Clerk authentication middleware
│   ├── package.json
│   └── next.config.ts
│
├── smart-contract-agent/         # Express.js Smart Contract Analysis Backend
│   ├── server.js                # Main Express server (4 endpoints)
│   ├── services/
│   │   ├── pdfParser.js         # Phase 2: PDF extraction & structuring
│   │   ├── githubFetcher.js     # Phase 3: GitHub code fetching
│   │   └── geminiAnalyzer.js    # Phase 4: AI vulnerability analysis
│   ├── utils/
│   │   ├── logger.js            # Logging utility with file output
│   │   └── validators.js        # Input validation (GitHub URLs, PDFs)
│   ├── tests/
│   │   ├── pdfParser-simplified.test.js
│   │   └── geminiAnalyzer.test.js
│   ├── logs/                    # Gemini prompt/response logs
│   ├── uploads/                 # Temporary PDF storage
│   ├── Phases/                  # Implementation guides
│   ├── PhaseCompletionDocumentation/
│   ├── package.json
│   └── README.md
│
├── Walletwork/                   # Wallet Risk Analysis System
│   ├── backend/                 # FastAPI Python Backend
│   │   ├── main.py              # FastAPI server & endpoints
│   │   ├── risk_engine.py       # 5-signal deterministic scoring
│   │   ├── blockchain.py        # Alchemy RPC client
│   │   ├── etherscan.py         # Etherscan API client
│   │   ├── graph_engine.py      # Graph analysis & scam detection
│   │   ├── simulation.py        # Transaction impact simulator
│   │   ├── models.py            # Pydantic request/response models
│   │   ├── scam_db.json         # Scam intelligence database
│   │   ├── requirements.txt
│   │   └── test_*.py            # Test files
│   ├── frontend/                # Standalone wallet check UI (Vite)
│   ├── extension/               # Chrome extension (planned)
│   └── README.md
│
└── contract-code/                # Sample Smart Contracts for Testing
    ├── contracts/
    │   ├── Token.sol            # ERC20 with 4 intentional vulnerabilities
    │   ├── Vault.sol            # Collateral vault with 5 vulnerabilities
    │   ├── Lending.sol          # Lending contract with 8 vulnerabilities
    │   └── Proxy.sol            # Upgradeable proxy with 4 vulnerabilities
    ├── interfaces/
    │   └── IERC20.sol
    ├── libraries/
    │   └── SafeMath.sol
    ├── docs/
    │   ├── whitepaper.md        # Sample whitepaper
    │   └── VULNERABILITY-REFERENCE.md  # All 22 vulnerabilities documented
    ├── scripts/
    │   └── deploy.js
    ├── test/
    │   └── token.test.js
    ├── hardhat.config.js
    └── package.json
```

---

## 🔧 Components

### 1. Smart Contract Agent (Backend)

**Location:** `smart-contract-agent/`  
**Technology:** Node.js, Express.js, Google Gemini AI  
**Port:** 3000

The Smart Contract Agent is the AI-powered backbone of the platform, implementing a multi-phase analysis pipeline:

#### Architecture Phases

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        SMART CONTRACT ANALYSIS PIPELINE                      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  PHASE 2: PDF Parser                PHASE 3: GitHub Fetcher                 │
│  ──────────────────                 ──────────────────────                  │
│  • Extract text from PDF            • Parse GitHub URL                      │
│  • Detect sections (8 types)        • Fetch repository tree                 │
│  • Clean artifacts                  • Filter .sol files                     │
│  • Structure for AI                 • Download with rate limiting           │
│                                     • Categorize (contracts/interfaces)     │
│                 │                              │                            │
│                 └──────────────┬───────────────┘                            │
│                                ▼                                            │
│                      PHASE 4: Gemini AI Analyzer                            │
│                      ───────────────────────────                            │
│                      • 17+ vulnerability patterns                           │
│                      • Cross-validation (PDF vs Code)                       │
│                      • Code quality analysis                                │
│                      • Tokenomics verification                              │
│                      • Risk score calculation (0-10)                        │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

#### Detected Vulnerability Patterns

The AI is trained to detect these specific malicious patterns:

| # | Pattern | Severity | Description |
|---|---------|----------|-------------|
| 1 | **Dual Constants** | CRITICAL | Hidden vs documented fees (public 3% → private 10%) |
| 2 | **Hidden Fee Collection** | CRITICAL | Balance transfers without Transfer events |
| 3 | **Missing Grace Period** | HIGH | Seizure functions without time validation |
| 4 | **Arbitrary Reason String** | HIGH | Liquidation with unvalidated reason parameter |
| 5 | **Unlimited Minting** | CRITICAL | Rebase functions that increase totalSupply |
| 6 | **Account Freezing** | HIGH | Owner can freeze any account's tokens |
| 7 | **Token Seizure** | CRITICAL | Seize tokens without default validation |
| 8 | **Approval Gatekeeper** | HIGH | Withdrawal requires external approval |
| 9 | **Emergency Drain** | CRITICAL | emergencyWithdraw without safeguards |
| 10 | **Fee Manipulation** | HIGH | Change fees on active loans |
| 11 | **Lender-Controlled Flags** | MEDIUM | Arbitrary market disruption flags |
| 12 | **Cross-Default Cascade** | HIGH | Single default triggers all loans |
| 13 | **Instant Proxy Upgrade** | CRITICAL | upgradeTo without timelock |
| 14 | **Hidden Backdoor Admin** | CRITICAL | Non-standard storage slots for admin |
| 15 | **Fake Multi-Sig** | CRITICAL | 1-of-N instead of claimed M-of-N |
| 16 | **Storage Collision** | CRITICAL | Malicious implementations overwrite storage |
| 17 | **Selfdestruct** | CRITICAL | Contract can be destroyed, stealing funds |

#### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | API information and version |
| GET | `/health` | Health check with uptime |
| POST | `/api/analyze` | Full analysis (PDF + GitHub) |
| POST | `/api/analyze/quick` | Quick analysis (GitHub only) |

#### Key Files

- **`server.js`** - Express server with multer file upload, CORS, error handling
- **`services/pdfParser.js`** - PDF text extraction with pdf-parse library
- **`services/githubFetcher.js`** - GitHub API integration with branch fallback
- **`services/geminiAnalyzer.js`** - Gemini AI prompt engineering and response parsing
- **`utils/logger.js`** - Structured logging with file output for debugging
- **`utils/validators.js`** - Input validation for URLs and files

---

### 2. Frontend Application

**Location:** `frontend/`  
**Technology:** Next.js 16, React 19, TypeScript, Tailwind CSS  
**Port:** 4000

The frontend provides a modern, responsive interface for blockchain security analysis.

#### Features

- **Dark Theme UI** - Sleek black/zinc color scheme with gradient accents
- **Clerk Authentication** - Secure sign-in/sign-up with OAuth support
- **Tabbed Interface** - Switch between Contract and Wallet analysis
- **Real-time Status** - Loading states, error handling, success feedback
- **PDF Reports** - Generate downloadable security audit reports
- **Responsive Design** - Works on desktop, tablet, and mobile

#### Key Components

| Component | File | Description |
|-----------|------|-------------|
| **ContractAnalysis** | `app/components/ContractAnalysis.tsx` | PDF upload, GitHub URL input, AI analysis results |
| **WalletAnalysis** | `app/components/WalletAnalysis.tsx` | Wallet/contract input, transaction type, risk verdict |
| **Header** | `app/components/Header.jsx` | Navigation with Clerk UserButton |
| **Hero** | `app/components/Hero.jsx` | Landing page hero section |
| **Features** | `app/components/Features.jsx` | Feature showcase with animations |

#### Authentication

The app uses Clerk for authentication with protected routes:

```typescript
// middleware.ts
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isProtectedRoute = createRouteMatcher(["/analyze(.*)"]);

export default clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) {
    await auth.protect();
  }
});
```

#### Pages

| Route | Description |
|-------|-------------|
| `/` | Redirects to `/home` |
| `/home` | Landing page with Hero, Features, FAQs |
| `/analyze` | Protected - Contract & Wallet analysis |
| `/login` | Clerk sign-in |
| `/signup` | Clerk sign-up |
| `/contact` | Contact form |

---

### 3. Wallet Risk Engine (Walletwork)

**Location:** `Walletwork/backend/`  
**Technology:** Python, FastAPI, NetworkX  
**Port:** 8000

The Wallet Risk Engine provides real-time transaction risk assessment using a 5-phase analysis pipeline.

#### Analysis Phases

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          WALLET RISK ANALYSIS PIPELINE                       │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  PHASE 1: Static & Scam Intelligence                                        │
│  ───────────────────────────────────                                         │
│  • Check against scam database (scam_db.json)                               │
│  • Validate address format (0x + 40 hex chars)                              │
│  • Detect burn addresses                                                     │
│  • Return scam category, source, confidence                                  │
│                                                                              │
│  PHASE 2: On-Chain Intelligence                                              │
│  ─────────────────────────────────                                           │
│  • Alchemy RPC: Get transaction count                                        │
│  • Alchemy RPC: Check if contract (bytecode)                                │
│  • Etherscan API: Contract verification status                              │
│  • Detect new wallets (0 tx) and unverified contracts                       │
│                                                                              │
│  PHASE 3: Graph Risk Analysis                                                │
│  ──────────────────────────────                                              │
│  • Build transaction graph from recent transfers                            │
│  • Compute shortest path to known scam addresses                            │
│  • Hop distance: 0 = direct scam, 1 = 1 hop, etc.                          │
│  • Identify cluster membership                                              │
│                                                                              │
│  PHASE 4: Transaction Impact Simulation                                      │
│  ──────────────────────────────────────                                      │
│  • Simulate risk based on tx_type (approve/swap/send)                       │
│  • Calculate drain probability (0.0 - 1.0)                                  │
│  • Estimate attack window (blocks)                                          │
│                                                                              │
│  PHASE 5: Final Risk Calculation                                             │
│  ─────────────────────────────────                                           │
│  • Combine all signals into risk score (0-100)                              │
│  • Classify as SAFE / CAUTION / DANGEROUS                                   │
│  • Generate human-readable reasons                                          │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

#### Risk Scoring

| Signal | Points | Trigger |
|--------|--------|---------|
| Fresh Wallet | +20 | 0 transactions |
| Low Activity | +5 | < 3 transactions |
| Unverified Contract | +20 | Source not on Etherscan |
| Scam Database Match | +45-54 | Based on category & confidence |
| Graph Connection | +10-50 | Hop distance to scammer |
| Transaction Type | +5-25 | approve > swap > send |

#### Risk Classification

| Level | Score Range | Color | Action |
|-------|-------------|-------|--------|
| **SAFE** | 0-29 | 🟢 Green | Transaction appears secure |
| **CAUTION** | 30-69 | 🟡 Amber | Review before signing |
| **DANGEROUS** | 70-100 | 🔴 Red | Do not proceed |

#### Key Files

| File | Description |
|------|-------------|
| `main.py` | FastAPI server with `/analyze` and `/health` endpoints |
| `risk_engine.py` | Deterministic 5-signal risk calculation |
| `blockchain.py` | Alchemy RPC client for on-chain data |
| `etherscan.py` | Etherscan API for contract verification |
| `graph_engine.py` | NetworkX graph analysis, scam database loading |
| `simulation.py` | Transaction impact and drain probability simulation |
| `models.py` | Pydantic models for request/response validation |
| `scam_db.json` | Structured scam intelligence database |

#### Scam Intelligence Categories

The system recognizes these scam categories:

| Category | Description | Risk Multiplier |
|----------|-------------|-----------------|
| `approval_drainer` | Drains ERC20 approvals | 1.2x |
| `phishing` | Social engineering scams | 1.15x |
| `drainer_operator` | Controls drainer contracts | 1.2x |
| `malicious_router` | Redirects swap funds | 1.1x |
| `honeypot` | Blocks sell transactions | 1.15x |
| `rug_pull` | Liquidity removal scam | 1.1x |
| `scam_operator` | Multi-scam coordination | 1.1x |
| `fake_airdrop` | False airdrop campaigns | 1.05x |

---

### 4. Sample Malicious Contracts (For Testing)

**Location:** `contract-code/`  
**Technology:** Solidity ^0.8.19, Hardhat

This directory contains intentionally vulnerable smart contracts for testing the AI analysis capabilities.

⚠️ **WARNING: These contracts contain 22 intentional vulnerabilities. DO NOT deploy to any network.**

#### Vulnerability Summary

| Contract | Vulnerabilities | Types |
|----------|-----------------|-------|
| `Token.sol` | 4 | Hidden fees, unlimited minting, account freezing, token seizure |
| `Vault.sol` | 5 | Missing grace period, approval gatekeeper, emergency drain, fee manipulation |
| `Lending.sol` | 8 | Arbitrary liquidation, cross-default, fake multi-sig, rate manipulation |
| `Proxy.sol` | 5 | Instant upgrade, backdoor admin, storage collision, selfdestruct |

#### Key Discrepancies (PDF vs Code)

| Claim in Whitepaper | Reality in Code |
|---------------------|-----------------|
| "Platform Fee: 0.3%" | Actual: 1.3% (hidden 1% fee) |
| "Fixed supply: 1,000,000" | Owner can mint unlimited via `rebase()` |
| "24-hour grace period" | No grace period validation in `seizeCollateralForMarginCall()` |
| "5-of-9 multi-signature" | Actually 1-of-9 (`ACTUAL_REQUIRED_SIGNATURES = 1`) |
| "48-hour upgrade timelock" | Instant upgrade (`upgradeTo` has no delay) |

---

## 🚀 Installation & Setup

### Prerequisites

- **Node.js** >= 16.0.0
- **Python** >= 3.9
- **npm** or **yarn**
- **pip** or **pipenv**

### Environment Variables

Create `.env` files in each component directory:

#### Frontend (`frontend/.env`)
```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxxx
CLERK_SECRET_KEY=sk_test_xxxx
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/login
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/signup
```

#### Smart Contract Agent (`smart-contract-agent/.env`)
```env
PORT=3000
NODE_ENV=development
GEMINI_API_KEY=your_gemini_api_key
GITHUB_TOKEN=your_github_token  # Optional, increases rate limit
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=10485760  # 10MB
```

#### Wallet Risk Engine (`Walletwork/backend/.env`)
```env
ALCHEMY_API_KEY=https://eth-mainnet.g.alchemy.com/v2/your_key
ETHERSCAN_API_KEY=your_etherscan_api_key
```

### Quick Start

#### 1. Clone the Repository
```bash
git clone https://github.com/your-org/BeforeYouSign.git
cd BeforeYouSign
```

#### 2. Start Wallet Risk Engine (Python Backend)
```bash
cd Walletwork/backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
# API running at http://localhost:8000
```

#### 3. Start Smart Contract Agent (Node.js Backend)
```bash
cd smart-contract-agent
npm install
npm run dev
# API running at http://localhost:3000
```

#### 4. Start Frontend (Next.js)
```bash
cd frontend
npm install
npm run dev
# App running at http://localhost:4000
```

#### 5. Verify Installation
```bash
# Check Wallet Risk Engine
curl http://localhost:8000/health

# Check Smart Contract Agent
curl http://localhost:3000/health

# Open Frontend
open http://localhost:4000
```

---

## 📡 API Reference

### Smart Contract Agent API

#### Full Analysis (PDF + GitHub)

`POST /api/analyze`

**Content-Type:** `multipart/form-data`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `pdf` | File | Yes | PDF whitepaper file |
| `githubRepo` | String | Yes | GitHub repository URL |

**Example Request:**
```bash
curl -X POST http://localhost:3000/api/analyze \
  -F "pdf=@whitepaper.pdf" \
  -F "githubRepo=https://github.com/example/contracts"
```

**Example Response:**
```json
{
  "success": true,
  "analysis": {
    "metadata": {
      "analyzedAt": "2026-02-10T10:30:00.000Z",
      "pdfFile": "whitepaper.pdf",
      "pdfPages": 15,
      "githubRepo": "example/contracts",
      "totalCodeFiles": 4,
      "totalCodeLines": 1200,
      "aiModel": "gemini-2.5-flash",
      "analysisMode": "full"
    },
    "aiAnalysis": {
      "discrepancies": [
        {
          "type": "hidden_fee",
          "severity": "CRITICAL",
          "pdfClaim": "Platform Fee: 0.3%",
          "codeReality": "Actual fee 1.3% (hidden 1% undisclosed)",
          "impact": "Users pay 4x more fees than documented"
        }
      ],
      "vulnerabilities": [
        {
          "type": "unlimited_minting",
          "severity": "CRITICAL",
          "location": "Token.sol:rebase()",
          "description": "Owner can mint unlimited tokens"
        }
      ],
      "riskScore": {
        "overall": 1.5,
        "classification": "HIGH-RISK"
      },
      "summary": "Multiple critical vulnerabilities detected..."
    }
  }
}
```

#### Quick Analysis (GitHub Only)

`POST /api/analyze/quick`

**Content-Type:** `application/json`

```json
{
  "githubRepo": "https://github.com/example/contracts"
}
```

---

### Wallet Risk Engine API

#### Analyze Transaction

`POST /analyze`

**Content-Type:** `application/json`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `wallet` | String | Yes | Sender wallet address |
| `contract` | String | Yes | Target contract address |
| `tx_type` | String | Yes | One of: `approve`, `swap`, `send`, `transfer` |

**Example Request:**
```bash
curl -X POST http://localhost:8000/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "wallet": "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
    "contract": "0x1111111254fb6c44bac0bed2854e76f90643097d",
    "tx_type": "approve"
  }'
```

**Example Response:**
```json
{
  "risk": "DANGEROUS",
  "risk_score": 87,
  "score": 87,
  "reasons": [
    "⚠️ CRITICAL: Address flagged as 'Approval Drainer' in scam intelligence database (Source: chainabuse)",
    "Contract source code is NOT verified on Etherscan"
  ],
  "signals": {
    "wallet_address_valid": true,
    "contract_address_valid": true,
    "wallet_is_burn_address": false,
    "contract_is_burn_address": false,
    "is_new_wallet": false,
    "wallet_tx_count": 142,
    "is_unverified_contract": true,
    "contract_is_smart_contract": true,
    "scam_match": true,
    "scam_category": "approval_drainer",
    "scam_source": "chainabuse",
    "scam_confidence": 0.95,
    "graph_hop_distance": 0,
    "drain_probability": 0.85
  },
  "timestamp": "2026-02-10T10:30:00.000Z"
}
```

---

## 💡 Usage Examples

### Example 1: Analyzing a Suspicious Token Contract

1. Navigate to http://localhost:4000/analyze
2. Select "Contract Analysis" tab
3. Upload the whitepaper PDF
4. Enter GitHub repository URL
5. Click "Analyze Contract"
6. Review the AI-generated security report

### Example 2: Checking Wallet Transaction Risk

1. Navigate to http://localhost:4000/analyze
2. Select "Wallet Analysis" tab
3. Enter your wallet address
4. Enter the contract you're about to interact with
5. Select transaction type (e.g., "approve")
6. Click "Analyze Transaction"
7. Review the risk verdict (SAFE/CAUTION/DANGEROUS)

### Example 3: API Integration

```javascript
// Check wallet risk before transaction
const response = await fetch('http://localhost:8000/analyze', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    wallet: userWallet,
    contract: targetContract,
    tx_type: 'approve'
  })
});

const result = await response.json();

if (result.risk === 'DANGEROUS') {
  alert('⚠️ This transaction is HIGH RISK! Do not proceed.');
  return;
}

if (result.risk === 'CAUTION') {
  const proceed = confirm('This transaction has risk factors. Continue?');
  if (!proceed) return;
}

// Proceed with transaction...
```

---

## 🔐 Security Analysis Features

### AI Detection Capabilities

| Category | Patterns Detected |
|----------|-------------------|
| **Token Manipulation** | Unlimited minting, hidden fees, account freezing, seizure |
| **Access Control** | Backdoor admin, fake multi-sig, missing modifiers |
| **Reentrancy** | External calls before state updates |
| **Upgrade Risks** | Instant upgrades, storage collisions, selfdestruct |
| **Economic Attacks** | Fee manipulation, cross-default cascade, liquidity drain |

### Cross-Validation Checks

The AI specifically compares these items between PDF and code:

1. **Fee structures** - Documented vs actual percentages
2. **Token supply** - Fixed vs mintable
3. **Grace periods** - Claimed vs enforced
4. **Multi-sig requirements** - Stated vs implemented
5. **Timelock delays** - Promised vs actual
6. **Collateral handling** - Automatic vs manual approval

---

## 🛠 Technology Stack

### Backend (Smart Contract Agent)
| Technology | Version | Purpose |
|------------|---------|---------|
| Node.js | 18+ | Runtime |
| Express | 5.x | Web framework |
| Multer | 2.x | File uploads |
| pdf-parse | 1.1.1 | PDF extraction |
| axios | 1.x | HTTP client |
| @google/generative-ai | 0.24+ | Gemini AI SDK |

### Backend (Wallet Risk Engine)
| Technology | Version | Purpose |
|------------|---------|---------|
| Python | 3.9+ | Runtime |
| FastAPI | Latest | Web framework |
| Pydantic | v2 | Data validation |
| NetworkX | Latest | Graph analysis |
| httpx | Latest | Async HTTP client |

### Frontend
| Technology | Version | Purpose |
|------------|---------|---------|
| Next.js | 16.x | React framework |
| React | 19.x | UI library |
| TypeScript | 5.x | Type safety |
| Tailwind CSS | 4.x | Styling |
| Framer Motion | 12.x | Animations |
| Clerk | 6.x | Authentication |
| Lucide React | Latest | Icons |
| jsPDF | 4.x | PDF generation |

---

## 🌍 Environment Variables

### Complete Environment Setup

```bash
# ============================================
# frontend/.env
# ============================================
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxxxx
CLERK_SECRET_KEY=sk_test_xxxxx
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/login
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/signup
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/analyze
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/analyze

# ============================================
# smart-contract-agent/.env
# ============================================
PORT=3000
NODE_ENV=development
GEMINI_API_KEY=AIzaSy...           # Google AI Studio API Key
GITHUB_TOKEN=ghp_...                # Optional: GitHub Personal Access Token
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=10485760              # 10MB in bytes
LOG_LEVEL=info

# ============================================
# Walletwork/backend/.env
# ============================================
ALCHEMY_API_KEY=https://eth-mainnet.g.alchemy.com/v2/your_key
ETHERSCAN_API_KEY=your_etherscan_api_key
```

### Obtaining API Keys

| Service | URL | Purpose |
|---------|-----|---------|
| **Google AI Studio** | https://aistudio.google.com/apikey | Gemini AI analysis |
| **GitHub** | https://github.com/settings/tokens | Increase API rate limits |
| **Alchemy** | https://dashboard.alchemy.com | Ethereum RPC access |
| **Etherscan** | https://etherscan.io/apis | Contract verification |
| **Clerk** | https://dashboard.clerk.com | User authentication |

---

## 🧪 Testing

### Smart Contract Agent Tests
```bash
cd smart-contract-agent
npm run test:all        # Run all tests
npm run test:pdf        # PDF parser tests only
npm run test            # Gemini analyzer tests
```

### Wallet Risk Engine Tests
```bash
cd Walletwork/backend
pytest test_api.py      # API endpoint tests
pytest test_integration.py  # Integration tests
python debug_risk.py    # Manual risk debugging
```

### Frontend
```bash
cd frontend
npm run lint            # ESLint
npm run build           # Production build check
```

---

## 🗺 Roadmap

### Phase 1 ✅ Complete
- [x] Project setup and architecture
- [x] Express server with file upload
- [x] Input validation

### Phase 2 ✅ Complete
- [x] PDF text extraction
- [x] Section detection
- [x] Text cleaning and structuring

### Phase 3 ✅ Complete
- [x] GitHub API integration
- [x] Solidity file filtering
- [x] Rate-limited downloading

### Phase 4 ✅ Complete
- [x] Gemini AI integration
- [x] Prompt engineering for 17+ patterns
- [x] Response parsing and error handling

### Phase 5 🚧 In Progress
- [ ] Risk scoring aggregation
- [ ] Comprehensive report generation
- [ ] Confidence metrics

### Future Enhancements
- [ ] Chrome extension for MetaMask interception
- [ ] Real-time transaction monitoring
- [ ] Multi-chain support (BSC, Polygon, Arbitrum)
- [ ] Historical wallet reputation scoring
- [ ] Community-reported scam submissions
- [ ] API rate limiting and authentication
- [ ] Webhook notifications

---

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Style

- **JavaScript/TypeScript:** Follow ESLint configuration
- **Python:** Follow PEP 8, use Black formatter
- **Commits:** Use conventional commits (`feat:`, `fix:`, `docs:`, etc.)

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **Google** for the Gemini AI API
- **Alchemy** for Ethereum RPC services
- **Etherscan** for contract verification API
- **Clerk** for authentication services
- **OpenZeppelin** for Solidity security patterns
- **The Web3 Security Community** for continuous threat intelligence

---

## 📞 Support

- **Documentation:** This README and component-specific READMEs
- **Issues:** GitHub Issues for bug reports and feature requests
- **Email:** support@beforeyousign.io

---

<div align="center">

**Built with ❤️ for a safer Web3**

*Protect your assets. Verify everything. BeforeYouSign.*

</div>

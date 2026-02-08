/**
 * Gemini AI Analyzer Service - Phase 4
 * 
 * Integrates with Google Gemini 2.0 Flash to analyze:
 * - PDF whitepaper text (from Phase 2)
 * - Solidity smart contract code (from Phase 3)
 * 
 * Detects:
 * - Discrepancies between PDF claims and code reality
 * - Security vulnerabilities (reentrancy, overflow, access control)
 * - Code quality issues (centralization, missing validations)
 * - Tokenomics verification
 * 
 * Architecture: ALL ANALYSIS HAPPENS HERE
 * PDF Parser extracts → GitHub Fetcher extracts → Gemini analyzes
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');
const log = require('../utils/logger');

// =============================================================================
// CONFIGURATION
// =============================================================================

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const MODEL_NAME = 'gemini-2.5-flash';  // Use latest flash model

// Generation configuration for consistent, focused outputs
const GENERATION_CONFIG = {
  temperature: 0.3,        // Lower = more focused/deterministic analysis
  topK: 40,
  topP: 0.95,
  maxOutputTokens: 8192,   // Allow detailed responses
};

// Maximum code size to send (to stay under token limits)
const MAX_CODE_LENGTH = 500000;  // ~500KB of code
const MAX_PDF_LENGTH = 100000;   // ~100KB of PDF text

// =============================================================================
// GEMINI CLIENT INITIALIZATION
// =============================================================================

let genAI = null;
let model = null;

/**
 * Initialize Gemini AI client
 * @throws {Error} If API key is not configured
 */
function initializeGemini() {
  if (!GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY not found in environment variables. Please add it to .env file.');
  }
  
  if (!genAI) {
    genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    model = genAI.getGenerativeModel({ model: MODEL_NAME });
    log.info('Gemini AI client initialized', { model: MODEL_NAME });
  }
  
  return model;
}

// =============================================================================
// PROMPT ENGINEERING
// =============================================================================

/**
 * Build the analysis prompt for Gemini
 * This is the most critical function - prompt quality determines analysis quality
 * 
 * @param {Object} pdfData - Extracted PDF data from Phase 2
 * @param {Object} githubData - Extracted GitHub code from Phase 3
 * @returns {string} Formatted prompt for Gemini
 */
function buildAnalysisPrompt(pdfData, githubData) {
  // Truncate if necessary to stay under token limits
  const fullText = pdfData.fullText?.substring(0, MAX_PDF_LENGTH) || '';
  const combinedCode = githubData.combinedCode?.substring(0, MAX_CODE_LENGTH) || '';
  
  // Build section summary
  const sectionSummary = Object.entries(pdfData.sections || {})
    .filter(([key, value]) => value && value.length > 0)
    .map(([key, value]) => `${key.toUpperCase()}: ${value.substring(0, 2000)}...`)
    .join('\n\n');

  const prompt = `
You are an AGGRESSIVE smart contract security auditor specializing in detecting scams, rugs, and malicious code. Your job is to PROTECT INVESTORS by finding ALL issues, no matter how small.

IMPORTANT: Assume the project could be malicious. Look for ANY signs of deception.

=== YOUR MISSION ===
1. CAREFULLY read the whitepaper (PDF) and note ALL claims about tokenomics, fees, vesting, etc.
2. THOROUGHLY analyze every function in the smart contract code
3. AGGRESSIVELY cross-validate: Find ANY mismatch between PDF promises and code reality
4. IDENTIFY ALL security vulnerabilities - even minor ones
5. FLAG ALL centralization and rug-pull risks
6. BE SUSPICIOUS - if something looks wrong, report it

=== WHITEPAPER TEXT (FROM PDF) ===
File: ${pdfData.metadata?.fileName || 'whitepaper.pdf'}
Pages: ${pdfData.metadata?.pages || 'unknown'}

${fullText}

=== KEY WHITEPAPER SECTIONS ===
${sectionSummary || 'No specific sections detected'}

=== SMART CONTRACT CODE ===
Repository: ${githubData.metadata?.repository || 'unknown'}
Total Files: ${githubData.metadata?.totalFiles || 0}
Total Lines: ${githubData.metadata?.totalLines || 0}

${combinedCode}

=== MALICIOUS CODE PATTERNS TO DETECT ===

**HONEYPOT DETECTION:**
- Can only owner sell tokens?
- Hidden transfer restrictions
- Blacklist functions that can lock user funds
- Whitelist-only selling
- Max transaction amounts that prevent selling
- Hidden fee increases

**RUG PULL INDICATORS:**
- Owner can withdraw all liquidity
- Owner can mint unlimited tokens
- Owner can change fee to 100%
- No renounced ownership
- Proxy contracts that can change logic
- Hidden backdoor functions
- Self-destruct capabilities

**HIDDEN MALICIOUS FUNCTIONS:**
- Functions with misleading names
- Assembly code blocks (check for suspicious operations)
- External calls to unknown contracts
- Obscured logic using complex math
- Time-delayed traps

**TOKENOMICS LIES:**
- PDF says 5% fee but code has 10%
- PDF claims "locked liquidity" but no lock exists
- PDF says "renounced ownership" but owner functions exist
- PDF claims "audited" but no evidence
- Vesting claims without vesting code
- Burn claims without burn mechanism

=== ANALYSIS INSTRUCTIONS ===

**1. CROSS-VALIDATION (PDF vs CODE) - MOST CRITICAL**

You MUST compare these specific items:

A. TOKEN ALLOCATION:
   - What does PDF claim about allocation percentages?
   - What do the code constants/variables show?
   - Report ANY discrepancy, even 1%

B. TRANSACTION FEES/TAXES:
   - What fee % does PDF claim?
   - What is the actual fee in code?
   - Can owner change fees? To what maximum?

C. TOTAL SUPPLY:
   - PDF stated supply vs code totalSupply
   - Can more tokens be minted?

D. VESTING/LOCKING:
   - Does PDF claim team tokens are locked?
   - Is there actual vesting contract logic?
   - What are the unlock conditions?

E. BURN MECHANISMS:
   - Does PDF claim deflationary/burn?
   - Is there actually a burn function?
   - Is it automatic or manual?

F. OWNERSHIP:
   - Does PDF claim ownership is renounced?
   - Is there still an owner in code?
   - What can the owner do?

G. AUDIT CLAIMS:
   - Does PDF mention audits?
   - Is there evidence in code/comments?

**2. SECURITY VULNERABILITIES - BE THOROUGH**

Check EVERY function for:
- Reentrancy (external calls before state changes)
- Integer overflow/underflow
- Access control missing or weak
- Front-running opportunities
- Denial of service vectors
- Unchecked return values
- Timestamp manipulation
- Delegatecall to untrusted addresses

**3. CENTRALIZATION & RUG RISKS - CRITICAL**

Flag if owner can:
- Pause trading
- Blacklist addresses
- Change fees arbitrarily  
- Mint new tokens
- Withdraw contract funds
- Upgrade contract logic
- Any other privileged action

**4. CODE QUALITY ISSUES**

- Missing input validation
- No event emissions
- Gas inefficiencies
- Poor coding practices

=== OUTPUT FORMAT - RETURN ONLY VALID JSON ===

You MUST return ONLY a JSON object. No text before or after. No markdown code blocks.

{
  "discrepancies": [
    {
      "type": "allocation_mismatch | tax_mismatch | supply_mismatch | vesting_missing | burn_missing | audit_false | ownership_lie",
      "severity": "CRITICAL | HIGH | MEDIUM | LOW",
      "pdfClaim": "Exact quote from whitepaper",
      "codeReality": "What the code actually shows",
      "description": "Clear explanation",
      "impact": "How this affects investors",
      "codeLocation": "File:Line or function name"
    }
  ],
  
  "vulnerabilities": [
    {
      "type": "reentrancy | overflow | access_control | dos | frontrunning | unchecked_call | honeypot | rugpull | backdoor",
      "severity": "CRITICAL | HIGH | MEDIUM | LOW",
      "location": "Contract.sol:functionName()",
      "description": "Explanation of the vulnerability",
      "exploit": "How an attacker could exploit this",
      "codeSnippet": "Relevant code if available",
      "recommendation": "How to fix"
    }
  ],
  
  "codeQualityIssues": [
    {
      "type": "centralization | missing_validation | missing_events | gas_inefficiency | poor_practice",
      "severity": "HIGH | MEDIUM | LOW",
      "description": "Issue description",
      "location": "Location in code",
      "recommendation": "Fix suggestion"
    }
  ],
  
  "tokenomicsVerification": {
    "totalSupply": {
      "pdfClaim": "Value or 'not specified'",
      "codeReality": "Actual value from code",
      "match": true
    },
    "teamAllocation": {
      "pdfClaim": "Value or 'not specified'",
      "codeReality": "Actual value from code",
      "match": true
    },
    "transactionTax": {
      "pdfClaim": "Value or 'not specified'",
      "codeReality": "Actual value from code",
      "match": true
    },
    "vestingImplemented": false,
    "vestingDetails": "Details or 'NOT FOUND'",
    "burnMechanismImplemented": false,
    "burnDetails": "Details or 'NOT FOUND'",
    "unlimitedMinting": true,
    "mintingDetails": "Can owner mint?",
    "ownershipRenounced": false,
    "ownerCapabilities": ["List what owner can do"],
    "maxWalletLimit": false,
    "antiBotProtection": false,
    "honeypotRisk": false,
    "rugpullRisk": false
  },
  
  "riskScore": {
    "overall": 5.0,
    "breakdown": {
      "pdfCodeAlignment": 5.0,
      "securityScore": 5.0,
      "codeQualityScore": 5.0,
      "tokenomicsScore": 5.0
    },
    "classification": "SUSPICIOUS",
    "confidence": "HIGH"
  },
  
  "summary": "2-3 sentence summary focusing on the MOST CRITICAL issues found.",
  
  "redFlags": [
    "List ALL major concerns - be comprehensive"
  ],
  
  "positiveAspects": [
    "Only list if genuinely positive"
  ]
}

=== SCORING RULES ===

Start at 10.0 (perfect) and SUBTRACT:
- CRITICAL issue: -3.0 each
- HIGH issue: -1.5 each  
- MEDIUM issue: -0.5 each
- LOW issue: -0.25 each
- PDF/code mismatch: -2.0 each
- Missing vesting when claimed: -1.5
- Unlimited minting: -1.0
- Owner not renounced: -0.5
- Honeypot indicators: -3.0
- Rugpull indicators: -3.0

Classification:
- SAFE: 7.0 - 10.0
- SUSPICIOUS: 4.0 - 6.9
- HIGH-RISK: 0.0 - 3.9

=== FINAL REMINDER ===
- Return ONLY valid JSON, nothing else
- NO markdown code blocks
- NO text before or after the JSON
- Be AGGRESSIVE in finding issues
- ASSUME the project could be malicious
- Report EVERY issue you find`;

  return prompt;
}

/**
 * Build a simplified prompt for quick analysis (GitHub only, no PDF)
 * 
 * @param {Object} githubData - Extracted GitHub code from Phase 3
 * @returns {string} Formatted prompt for Gemini
 */
function buildQuickAnalysisPrompt(githubData) {
  const combinedCode = githubData.combinedCode?.substring(0, MAX_CODE_LENGTH) || '';

  const prompt = `
You are an expert smart contract security auditor. Analyze the following Solidity smart contract code for security vulnerabilities and code quality issues.

=== SMART CONTRACT CODE ===
Repository: ${githubData.metadata?.repository || 'unknown'}
Total Files: ${githubData.metadata?.totalFiles || 0}
Total Lines: ${githubData.metadata?.totalLines || 0}

${combinedCode}

=== ANALYSIS FOCUS ===

1. **Security Vulnerabilities**: reentrancy, overflow, access control, DOS, frontrunning
2. **Code Quality**: centralization risks, missing validations, gas optimization
3. **Tokenomics**: minting capabilities, supply limits, fee structures

=== OUTPUT FORMAT (STRICT JSON ONLY) ===

{
  "vulnerabilities": [
    {
      "type": "string",
      "severity": "CRITICAL | HIGH | MEDIUM | LOW",
      "location": "Contract.sol:function()",
      "description": "string",
      "recommendation": "string"
    }
  ],
  "codeQualityIssues": [
    {
      "type": "string",
      "severity": "HIGH | MEDIUM | LOW",
      "description": "string",
      "location": "string",
      "recommendation": "string"
    }
  ],
  "tokenomicsAnalysis": {
    "totalSupply": "string",
    "hasMintFunction": true | false,
    "hasBurnFunction": true | false,
    "transactionFees": "string",
    "ownerPrivileges": ["list of owner capabilities"]
  },
  "riskScore": {
    "overall": 0.0,
    "classification": "SAFE | SUSPICIOUS | HIGH-RISK"
  },
  "summary": "string",
  "redFlags": ["string"],
  "positiveAspects": ["string"]
}

Return ONLY valid JSON, no other text.
`;

  return prompt;
}

// =============================================================================
// GEMINI API COMMUNICATION
// =============================================================================

/**
 * Send analysis request to Gemini and get response
 * 
 * @param {string} prompt - The analysis prompt
 * @returns {Promise<string>} Raw text response from Gemini
 * @throws {Error} If API call fails
 */
async function sendToGemini(prompt, metadata = {}) {
  const geminiModel = initializeGemini();
  
  try {
    log.info('Sending analysis request to Gemini AI', {
      model: MODEL_NAME,
      promptLength: prompt.length,
      estimatedTokens: Math.ceil(prompt.length / 4)
    });
    
    // Log the prompt to file
    log.logGeminiPrompt(prompt, {
      ...metadata,
      promptLength: prompt.length
    });
    
    const startTime = Date.now();
    
    const result = await geminiModel.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: GENERATION_CONFIG
    });
    
    const response = result.response;
    const text = response.text();
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    
    log.info('Gemini AI response received', {
      responseLength: text.length,
      duration: `${duration}s`
    });
    
    // Log the full Gemini response to file (not terminal)
    log.logGeminiResponse(text, {
      analysisMode: 'gemini-api',
      responseLength: text.length,
      duration: `${duration}s`
    });
    
    return text;
    
  } catch (error) {
    // Log the FULL error details for debugging
    log.error('Gemini API call failed - FULL ERROR DETAILS:', { 
      message: error.message,
      name: error.name,
      code: error.code,
      status: error.status,
      statusText: error.statusText,
      details: error.errorDetails || error.details,
      stack: error.stack?.substring(0, 500)
    });
    
    // Also log to file for full debugging
    log.logGeminiResponse(`ERROR: ${JSON.stringify({
      message: error.message,
      name: error.name,
      code: error.code,
      status: error.status,
      details: error.errorDetails || error.details,
      fullError: String(error)
    }, null, 2)}`, { analysisMode: 'ERROR' });
    
    const errorMsg = error.message?.toLowerCase() || '';
    const errorStr = String(error).toLowerCase();
    
    // Handle specific error types
    if (errorMsg.includes('429') || errorMsg.includes('quota') || errorStr.includes('resource_exhausted')) {
      throw new Error(`Gemini API rate limit exceeded. Please try again in 1 minute. (Raw: ${error.message})`);
    }
    
    if (errorMsg.includes('401') || errorMsg.includes('api key') || errorStr.includes('permission_denied') || errorMsg.includes('api_key_invalid')) {
      throw new Error(`Invalid Gemini API key. Please check GEMINI_API_KEY in .env file. (Raw: ${error.message})`);
    }
    
    if (errorMsg.includes('timeout') || errorStr.includes('deadline_exceeded')) {
      throw new Error(`Gemini analysis timed out. The code may be too large to analyze. (Raw: ${error.message})`);
    }
    
    if (errorMsg.includes('safety')) {
      throw new Error(`Gemini blocked the request due to safety filters. Please review the content. (Raw: ${error.message})`);
    }
    
    throw new Error(`Gemini AI analysis failed: ${error.message}`);
  }
}

// =============================================================================
// RESPONSE PARSING
// =============================================================================

/**
 * Parse Gemini's text response into a structured JSON object
 * Handles various response formats and edge cases
 * 
 * @param {string} responseText - Raw text from Gemini
 * @returns {Object} Parsed analysis object
 */
function parseGeminiResponse(responseText) {
  // Handle empty or null response
  if (!responseText || responseText.length === 0) {
    log.error('Empty response received from Gemini');
    return {
      parseError: true,
      error: 'Empty response received from Gemini',
      rawResponse: '',
      discrepancies: [],
      vulnerabilities: [],
      codeQualityIssues: [],
      tokenomicsVerification: {},
      riskScore: { overall: 0, classification: 'UNKNOWN', confidence: 'NONE' },
      summary: 'No response received from AI.',
      redFlags: ['Empty AI response - retry recommended'],
      positiveAspects: []
    };
  }

  try {
    let cleaned = responseText.trim();
    
    log.info('Attempting to parse Gemini response', {
      originalLength: responseText.length,
      first100Chars: responseText.substring(0, 100),
      last100Chars: responseText.substring(Math.max(0, responseText.length - 100))
    });
    
    // Step 1: Remove all types of markdown code blocks
    // Pattern 1: ```json\n...\n```
    // Pattern 2: ```\n...\n```
    // Pattern 3: Nested or multiple code blocks
    cleaned = cleaned.replace(/```json\s*/gi, '');
    cleaned = cleaned.replace(/```\s*/g, '');
    
    // Step 2: Remove any text before the first { and after the last }
    const firstBrace = cleaned.indexOf('{');
    const lastBrace = cleaned.lastIndexOf('}');
    
    if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
      log.error('No valid JSON structure found in response', {
        firstBrace,
        lastBrace,
        cleanedPreview: cleaned.substring(0, 500)
      });
      throw new Error('No JSON object found in response');
    }
    
    cleaned = cleaned.substring(firstBrace, lastBrace + 1);
    
    // Step 3: Fix common JSON issues that Gemini might introduce
    // Remove trailing commas before } or ]
    cleaned = cleaned.replace(/,\s*([\]}])/g, '$1');
    
    // Remove any comments (// or /* */)
    cleaned = cleaned.replace(/\/\/[^\n]*/g, '');
    cleaned = cleaned.replace(/\/\*[\s\S]*?\*\//g, '');
    
    log.info('Cleaned response for parsing', {
      cleanedLength: cleaned.length,
      first100Chars: cleaned.substring(0, 100),
      last50Chars: cleaned.substring(Math.max(0, cleaned.length - 50))
    });
    
    // Parse JSON
    const parsed = JSON.parse(cleaned);
    
    // Validate required fields exist
    const requiredFields = ['riskScore', 'summary'];
    for (const field of requiredFields) {
      if (!(field in parsed)) {
        log.warn(`Missing required field in Gemini response: ${field}`);
      }
    }
    
    // Ensure arrays exist
    parsed.discrepancies = parsed.discrepancies || [];
    parsed.vulnerabilities = parsed.vulnerabilities || [];
    parsed.codeQualityIssues = parsed.codeQualityIssues || [];
    parsed.redFlags = parsed.redFlags || [];
    parsed.positiveAspects = parsed.positiveAspects || [];
    
    // Ensure riskScore has required structure
    if (!parsed.riskScore) {
      parsed.riskScore = {
        overall: 5.0,
        classification: 'SUSPICIOUS',
        confidence: 'LOW'
      };
    }
    
    log.info('Gemini response parsed successfully', {
      discrepancies: parsed.discrepancies.length,
      vulnerabilities: parsed.vulnerabilities.length,
      codeQualityIssues: parsed.codeQualityIssues.length,
      riskScore: parsed.riskScore.overall
    });
    
    return parsed;
    
  } catch (error) {
    log.error('Failed to parse Gemini response as JSON', { 
      error: error.message,
      errorPosition: error.message.match(/position (\d+)/)?.[1] || 'unknown',
      responsePreview: responseText.substring(0, 1000),
      responseLast500: responseText.substring(responseText.length - 500)
    });
    
    // Return a fallback structure with the raw response
    return {
      parseError: true,
      error: `Failed to parse AI response: ${error.message}`,
      rawResponse: responseText,
      discrepancies: [],
      vulnerabilities: [],
      codeQualityIssues: [],
      tokenomicsVerification: {},
      riskScore: {
        overall: 0,
        classification: 'UNKNOWN',
        confidence: 'NONE'
      },
      summary: 'Analysis completed but response parsing failed. Please review raw response.',
      redFlags: ['Response parsing failed - manual review recommended'],
      positiveAspects: []
    };
  }
}

// =============================================================================
// RECOMMENDATION GENERATION
// =============================================================================

/**
 * Generate human-readable recommendation based on analysis
 * 
 * @param {Object} analysis - Parsed Gemini analysis
 * @returns {string} Recommendation text
 */
function generateRecommendation(analysis) {
  const score = analysis.riskScore?.overall ?? 5;
  const criticalVulns = analysis.vulnerabilities?.filter(v => v.severity === 'CRITICAL').length || 0;
  const highVulns = analysis.vulnerabilities?.filter(v => v.severity === 'HIGH').length || 0;
  const highDiscrepancies = analysis.discrepancies?.filter(d => d.severity === 'HIGH' || d.severity === 'CRITICAL').length || 0;
  
  // Critical vulnerabilities = immediate red flag
  if (criticalVulns > 0) {
    return `DO NOT INVEST - ${criticalVulns} critical security vulnerabilit${criticalVulns === 1 ? 'y' : 'ies'} found. High risk of funds loss through contract exploitation.`;
  }
  
  // Multiple high-severity discrepancies = likely scam
  if (highDiscrepancies >= 2) {
    return `DO NOT INVEST - ${highDiscrepancies} major discrepancies found between whitepaper claims and actual code. This project appears to be misrepresenting its tokenomics or features.`;
  }
  
  // Multiple high vulnerabilities
  if (highVulns >= 3) {
    return `HIGH RISK - ${highVulns} high-severity security issues found. The smart contract has significant vulnerabilities that could lead to loss of funds.`;
  }
  
  // Score-based recommendations
  if (score >= 8) {
    return 'SAFE TO INVEST - Code quality is good with minimal issues. Standard investment precautions apply. Consider the project fundamentals beyond just the code.';
  }
  
  if (score >= 6) {
    return 'PROCEED WITH CAUTION - Some issues found but not critical. Invest only amounts you can afford to lose. Monitor the project closely.';
  }
  
  if (score >= 4) {
    return 'HIGH CAUTION - Multiple issues identified. Only invest very small amounts if you understand the risks. This project has concerning elements.';
  }
  
  return 'HIGH RISK - Major issues found including security vulnerabilities or significant discrepancies. Not recommended for investment.';
}

/**
 * Generate a human-readable report from the analysis
 * 
 * @param {Object} analysis - Complete analysis object
 * @returns {string} Formatted report text
 */
function generateReport(analysis) {
  const { aiAnalysis, finalVerdict } = analysis;
  
  let report = '\n';
  report += '╔══════════════════════════════════════════════════════════════════════╗\n';
  report += '║           SMART CONTRACT SECURITY ANALYSIS REPORT                    ║\n';
  report += '╚══════════════════════════════════════════════════════════════════════╝\n\n';
  
  // Risk Assessment Header
  report += '┌─────────────────────────────────────────────────────────────────────┐\n';
  report += '│  RISK ASSESSMENT                                                     │\n';
  report += '├─────────────────────────────────────────────────────────────────────┤\n';
  report += `│  Trust Score:     ${finalVerdict.trustScore}/10                                          │\n`;
  report += `│  Classification:  ${finalVerdict.classification.padEnd(20)}                       │\n`;
  report += '└─────────────────────────────────────────────────────────────────────┘\n\n';
  
  // Critical Vulnerabilities
  const criticalVulns = aiAnalysis.vulnerabilities?.filter(v => v.severity === 'CRITICAL') || [];
  if (criticalVulns.length > 0) {
    report += '⛔ CRITICAL VULNERABILITIES\n';
    report += '─'.repeat(50) + '\n';
    criticalVulns.forEach((vuln, i) => {
      report += `\n${i + 1}. ${vuln.type.toUpperCase()}\n`;
      report += `   Location: ${vuln.location || 'Not specified'}\n`;
      report += `   Description: ${vuln.description}\n`;
      if (vuln.exploit) {
        report += `   Exploit: ${vuln.exploit}\n`;
      }
    });
    report += '\n';
  }
  
  // High Vulnerabilities
  const highVulns = aiAnalysis.vulnerabilities?.filter(v => v.severity === 'HIGH') || [];
  if (highVulns.length > 0) {
    report += '🔴 HIGH SEVERITY VULNERABILITIES\n';
    report += '─'.repeat(50) + '\n';
    highVulns.forEach((vuln, i) => {
      report += `\n${i + 1}. ${vuln.type.toUpperCase()}\n`;
      report += `   Location: ${vuln.location || 'Not specified'}\n`;
      report += `   Description: ${vuln.description}\n`;
    });
    report += '\n';
  }
  
  // Discrepancies
  if (aiAnalysis.discrepancies?.length > 0) {
    report += '⚠️  PDF-CODE DISCREPANCIES\n';
    report += '─'.repeat(50) + '\n';
    aiAnalysis.discrepancies.forEach((disc, i) => {
      report += `\n${i + 1}. ${disc.type?.toUpperCase() || 'DISCREPANCY'} [${disc.severity}]\n`;
      report += `   PDF Claim:    ${disc.pdfClaim}\n`;
      report += `   Code Reality: ${disc.codeReality}\n`;
      report += `   Impact:       ${disc.impact || disc.description}\n`;
    });
    report += '\n';
  }
  
  // Code Quality Issues
  const significantIssues = aiAnalysis.codeQualityIssues?.filter(i => i.severity === 'HIGH' || i.severity === 'MEDIUM') || [];
  if (significantIssues.length > 0) {
    report += '📋 CODE QUALITY ISSUES\n';
    report += '─'.repeat(50) + '\n';
    significantIssues.forEach((issue, i) => {
      report += `\n${i + 1}. ${issue.type?.toUpperCase() || 'ISSUE'} [${issue.severity}]\n`;
      report += `   ${issue.description}\n`;
      if (issue.location) {
        report += `   Location: ${issue.location}\n`;
      }
    });
    report += '\n';
  }
  
  // Red Flags
  if (aiAnalysis.redFlags?.length > 0) {
    report += '🚩 RED FLAGS\n';
    report += '─'.repeat(50) + '\n';
    aiAnalysis.redFlags.forEach((flag, i) => {
      report += `   • ${flag}\n`;
    });
    report += '\n';
  }
  
  // Positive Aspects
  if (aiAnalysis.positiveAspects?.length > 0) {
    report += '✅ POSITIVE ASPECTS\n';
    report += '─'.repeat(50) + '\n';
    aiAnalysis.positiveAspects.forEach((aspect, i) => {
      report += `   • ${aspect}\n`;
    });
    report += '\n';
  }
  
  // Summary
  report += '📝 SUMMARY\n';
  report += '─'.repeat(50) + '\n';
  report += `${aiAnalysis.summary}\n\n`;
  
  // Recommendation
  report += '┌─────────────────────────────────────────────────────────────────────┐\n';
  report += '│  RECOMMENDATION                                                      │\n';
  report += '├─────────────────────────────────────────────────────────────────────┤\n';
  const recommendationLines = finalVerdict.recommendation.match(/.{1,65}/g) || [finalVerdict.recommendation];
  recommendationLines.forEach(line => {
    report += `│  ${line.padEnd(67)}│\n`;
  });
  report += '└─────────────────────────────────────────────────────────────────────┘\n';
  
  return report;
}

// =============================================================================
// MAIN ANALYSIS FUNCTIONS
// =============================================================================

/**
 * Perform full analysis with both PDF and GitHub data
 * This is the main orchestrator for Phase 4
 * 
 * @param {Object} pdfData - Extracted PDF data from Phase 2
 * @param {Object} githubData - Extracted GitHub code from Phase 3
 * @returns {Promise<Object>} Complete analysis result
 */
async function analyzeWithGemini(pdfData, githubData) {
  const startTime = Date.now();
  
  try {
    log.info('=== Starting Gemini AI Analysis (Phase 4) ===');
    log.info('Input data', {
      pdfPages: pdfData.metadata?.pages || 0,
      pdfTextLength: pdfData.fullText?.length || 0,
      codeFiles: githubData.metadata?.totalFiles || 0,
      codeLines: githubData.metadata?.totalLines || 0
    });
    
    // Step 1: Build the analysis prompt
    const prompt = buildAnalysisPrompt(pdfData, githubData);
    log.info('Analysis prompt built', { promptLength: prompt.length });
    
    // Step 2: Send to Gemini
    const responseText = await sendToGemini(prompt, {
      repository: githubData.metadata?.repository,
      pdfFile: pdfData.metadata?.fileName,
      analysisMode: 'full'
    });
    
    // Log raw response length for debugging
    log.info('Raw response received for parsing', {
      responseLength: responseText?.length || 0,
      isEmpty: !responseText || responseText.length === 0
    });
    
    // Step 3: Parse the response
    const geminiAnalysis = parseGeminiResponse(responseText);
    
    // If parsing failed, log additional info
    if (geminiAnalysis.parseError) {
      log.error('PARSE ERROR - Raw response preview:', {
        first500: responseText?.substring(0, 500),
        last500: responseText?.substring(Math.max(0, responseText.length - 500))
      });
    }
    
    // Step 4: Structure the final output
    const result = {
      metadata: {
        analyzedAt: new Date().toISOString(),
        pdfFile: pdfData.metadata?.fileName || 'unknown',
        pdfPages: pdfData.metadata?.pages || 0,
        githubRepo: githubData.metadata?.repository || 'unknown',
        totalCodeFiles: githubData.metadata?.totalFiles || 0,
        totalCodeLines: githubData.metadata?.totalLines || 0,
        aiModel: MODEL_NAME,
        analysisMode: 'full',
        duration: `${((Date.now() - startTime) / 1000).toFixed(2)}s`
      },
      
      pdfExtraction: {
        pages: pdfData.metadata?.pages || 0,
        sectionsFound: pdfData.metadata?.sectionsFound || [],
        textLength: pdfData.metadata?.textLength || 0
      },
      
      codeExtraction: {
        repository: githubData.metadata?.repository || 'unknown',
        filesAnalyzed: githubData.metadata?.totalFiles || 0,
        totalLines: githubData.metadata?.totalLines || 0,
        categories: githubData.metadata?.categories || {}
      },
      
      aiAnalysis: {
        discrepancies: geminiAnalysis.discrepancies || [],
        vulnerabilities: geminiAnalysis.vulnerabilities || [],
        codeQualityIssues: geminiAnalysis.codeQualityIssues || [],
        tokenomicsVerification: geminiAnalysis.tokenomicsVerification || {},
        riskScore: geminiAnalysis.riskScore || { overall: 0, classification: 'UNKNOWN' },
        summary: geminiAnalysis.summary || 'Analysis completed.',
        redFlags: geminiAnalysis.redFlags || [],
        positiveAspects: geminiAnalysis.positiveAspects || [],
        // Include raw response if parsing failed for debugging
        rawResponse: geminiAnalysis.parseError ? responseText : undefined,
        parseError: geminiAnalysis.parseError || false
      },
      
      finalVerdict: {
        trustScore: geminiAnalysis.riskScore?.overall ?? 0,
        classification: geminiAnalysis.riskScore?.classification || 'UNKNOWN',
        confidence: geminiAnalysis.riskScore?.confidence || 'MEDIUM',
        recommendation: generateRecommendation(geminiAnalysis)
      }
    };
    
    // Generate report
    result.report = generateReport(result);
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    
    log.info('=== Gemini AI Analysis Complete ===');
    log.info('Analysis results', {
      trustScore: result.finalVerdict.trustScore,
      classification: result.finalVerdict.classification,
      discrepancies: result.aiAnalysis.discrepancies.length,
      vulnerabilities: result.aiAnalysis.vulnerabilities.length,
      duration: `${duration}s`
    });
    
    return result;
    
  } catch (error) {
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    log.error('=== Gemini AI Analysis Failed ===');
    log.error('Error details', { error: error.message, duration: `${duration}s` });
    throw error;
  }
}

/**
 * Perform quick analysis with GitHub data only (no PDF)
 * 
 * @param {Object} githubData - Extracted GitHub code from Phase 3
 * @returns {Promise<Object>} Analysis result focused on code security
 */
async function analyzeQuick(githubData) {
  const startTime = Date.now();
  
  try {
    log.info('=== Starting Quick Gemini Analysis (Code Only) ===');
    log.info('Input data', {
      codeFiles: githubData.metadata?.totalFiles || 0,
      codeLines: githubData.metadata?.totalLines || 0
    });
    
    // Build quick analysis prompt
    const prompt = buildQuickAnalysisPrompt(githubData);
    
    // Send to Gemini
    const responseText = await sendToGemini(prompt);
    
    // Parse response
    const geminiAnalysis = parseGeminiResponse(responseText);
    
    // Structure output
    const result = {
      metadata: {
        analyzedAt: new Date().toISOString(),
        githubRepo: githubData.metadata?.repository || 'unknown',
        totalCodeFiles: githubData.metadata?.totalFiles || 0,
        totalCodeLines: githubData.metadata?.totalLines || 0,
        aiModel: MODEL_NAME,
        analysisMode: 'quick',
        duration: `${((Date.now() - startTime) / 1000).toFixed(2)}s`
      },
      
      codeExtraction: {
        repository: githubData.metadata?.repository || 'unknown',
        filesAnalyzed: githubData.metadata?.totalFiles || 0,
        totalLines: githubData.metadata?.totalLines || 0,
        categories: githubData.metadata?.categories || {}
      },
      
      aiAnalysis: {
        vulnerabilities: geminiAnalysis.vulnerabilities || [],
        codeQualityIssues: geminiAnalysis.codeQualityIssues || [],
        tokenomicsAnalysis: geminiAnalysis.tokenomicsAnalysis || {},
        riskScore: geminiAnalysis.riskScore || { overall: 0, classification: 'UNKNOWN' },
        summary: geminiAnalysis.summary || 'Analysis completed.',
        redFlags: geminiAnalysis.redFlags || [],
        positiveAspects: geminiAnalysis.positiveAspects || []
      },
      
      finalVerdict: {
        trustScore: geminiAnalysis.riskScore?.overall ?? 0,
        classification: geminiAnalysis.riskScore?.classification || 'UNKNOWN',
        recommendation: generateRecommendation(geminiAnalysis)
      }
    };
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    log.info('=== Quick Analysis Complete ===', { duration: `${duration}s` });
    
    return result;
    
  } catch (error) {
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    log.error('Quick analysis failed', { error: error.message, duration: `${duration}s` });
    throw error;
  }
}

// =============================================================================
// EXPORTS
// =============================================================================

module.exports = {
  // Main analysis functions
  analyzeWithGemini,
  analyzeQuick,
  
  // Utility functions (for testing)
  buildAnalysisPrompt,
  buildQuickAnalysisPrompt,
  parseGeminiResponse,
  generateRecommendation,
  generateReport,
  
  // Configuration (for testing)
  initializeGemini
};

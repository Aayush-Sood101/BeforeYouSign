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
  maxOutputTokens: 65536,  // Maximum tokens for full detailed response
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
You are an EXPERT smart contract security auditor specializing in detecting SCAMS, RUGS, and MALICIOUS CODE. Your mission is to PROTECT INVESTORS by finding ALL vulnerabilities and deceptions.

CRITICAL ASSUMPTION: This project is LIKELY MALICIOUS. Search aggressively for hidden exploits.

=== WHITEPAPER/AGREEMENT TEXT (FROM PDF) ===
File: ${pdfData.metadata?.fileName || 'document.pdf'}
Pages: ${pdfData.metadata?.pages || 'unknown'}

${fullText}

=== KEY DOCUMENT SECTIONS ===
${sectionSummary || 'No specific sections detected'}

=== SMART CONTRACT CODE ===
Repository: ${githubData.metadata?.repository || 'unknown'}
Total Files: ${githubData.metadata?.totalFiles || 0}
Total Lines: ${githubData.metadata?.totalLines || 0}

${combinedCode}

=== CRITICAL VULNERABILITY PATTERNS TO DETECT ===

You MUST check for these SPECIFIC malicious patterns:

**PATTERN 1: DUAL CONSTANTS (Hidden vs Documented Fees)**
Look for TWO constants for the same thing - one public (documented), one private (actual):
\`\`\`
uint256 public constant DOCUMENTED_FEE = 300;  // 3% shown
uint256 private constant ACTUAL_FEE = 1000;    // 10% used
\`\`\`
Check: PLATFORM_FEE, HIDDEN_FEE, LATE_FEE_RATE, EARLY_TERMINATION, ORIGINATION_FEE, MAINTENANCE_FEE
Report if ANY private fee constant exists that differs from documented values.

**PATTERN 2: HIDDEN FEE COLLECTION WITHOUT EVENTS**
Look for balance transfers that don't emit Transfer events:
\`\`\`
_balances[hiddenFeeCollector] = _balances[hiddenFeeCollector].add(hiddenFee);
// No Transfer event = invisible theft
\`\`\`
Report ALL balance changes without corresponding Transfer events.

**PATTERN 3: MISSING GRACE PERIOD VALIDATION**
Look for seizure/liquidation functions WITHOUT time checks:
\`\`\`
function seizeCollateral() {
    // MISSING: require(block.timestamp >= deadline + gracePeriod)
    // Allows instant seizure without waiting
}
\`\`\`
Check: seizeCollateralForMarginCall, liquidateLoan, seizeTokens

**PATTERN 4: ARBITRARY REASON STRING (No Default Validation)**
Look for seizure functions that accept "reason" strings without validating actual default conditions:
\`\`\`
function liquidateLoan(uint256 loanId, string memory reason) {
    // "reason" is not validated against actual default events
    // Allows: liquidateLoan(123, "I feel like it")
}
\`\`\`
Check: seizeCollateral, liquidateLoan, seizeTokens - must validate Section VII/VIII default events

**PATTERN 5: UNLIMITED MINTING (Rebase/Supply Manipulation)**
Look for functions that can increase totalSupply:
\`\`\`
function rebase(uint256 supplyDelta) external onlyOwner {
    _totalSupply = _totalSupply.add(supplyDelta);
    _balances[owner] = _balances[owner].add(supplyDelta);
}
\`\`\`
Report if owner can mint unlimited tokens despite "fixed supply" claims.

**PATTERN 6: ACCOUNT FREEZING CAPABILITY**
Look for:
\`\`\`
mapping(address => bool) public frozenAccounts;
function freezeAccount(address account) external onlyOwner { ... }
\`\`\`
Report if owner can freeze any account's tokens.

**PATTERN 7: TOKEN SEIZURE WITHOUT VALID DEFAULT**
Look for:
\`\`\`
function seizeTokens(address from, uint256 amount) external onlyLender {
    // No check for actual default conditions
    _balances[from] = _balances[from].sub(amount);
}
\`\`\`
Report if tokens can be seized without validating default criteria.

**PATTERN 8: APPROVAL GATEKEEPER FOR WITHDRAWALS**
Look for withdrawal functions requiring external approval:
\`\`\`
require(deposit.approvedForReturn, "Vault: not approved");
function approveCollateralReturn(uint256 id, bool approved) external onlyLender { ... }
\`\`\`
Report if automatic collateral return is blocked by gatekeeper.

**PATTERN 9: EMERGENCY FUNCTIONS WITHOUT SAFEGUARDS**
Look for:
\`\`\`
function emergencyWithdraw(address recipient) external onlyOwner {
    // NO timelock, NO multi-sig, NO active loan checks
    token.transfer(recipient, token.balanceOf(address(this)));
}
\`\`\`
Report ALL emergency functions that can drain funds without safeguards.

**PATTERN 10: FEE RATE MANIPULATION MID-CONTRACT**
Look for:
\`\`\`
function adjustBorrowFeeRate(uint256 loanId, uint256 newRate) external onlyLender {
    // Can change 5% to 50% during active loan
    loan.borrowFeeRate = newRate;
}
\`\`\`
Report if fees can be changed unilaterally on active loans.

**PATTERN 11: LENDER-CONTROLLED FLAGS (Market Disruption)**
Look for:
\`\`\`
function setMarketDisruption(uint256 loanId, bool active) external onlyLender {
    // No validation of actual market conditions
    marketDisruptionActive[loanId] = active;
}
\`\`\`
Report if lender can manipulate conditions arbitrarily.

**PATTERN 12: CROSS-DEFAULT CASCADE**
Look for:
\`\`\`
function _triggerCrossDefault(address borrower, uint256 triggerLoanId) {
    // Defaults ALL borrower's loans based on single (possibly false) trigger
    for (uint i = 0; i < borrowerLoans[borrower].length; i++) {
        loans[loanIds[i]].status = LoanStatus.DEFAULTED;
    }
}
\`\`\`
Report if false default can cascade to all loans.

**PATTERN 13: PROXY UPGRADE WITHOUT TIMELOCK**
Look for:
\`\`\`
function upgradeTo(address newImplementation) external onlyAdmin {
    // MISSING: timelock delay (should be 48+ hours)
    _setImplementation(newImplementation);
}
\`\`\`
Report instant proxy upgrades without timelock.

**PATTERN 14: HIDDEN BACKDOOR ADMIN**
Look for non-standard storage slots:
\`\`\`
bytes32 private constant BACKDOOR_ADMIN_SLOT = 0x1234...;
function _getBackdoorAdmin() internal view returns (address) { ... }
\`\`\`
Report ANY hidden admin storage slots.

**PATTERN 15: FAKE MULTI-SIG (1-of-N instead of M-of-N)**
Look for:
\`\`\`
uint256 public constant CLAIMED_REQUIRED_SIGNATURES = 5;  // Shown
uint256 private constant ACTUAL_REQUIRED_SIGNATURES = 1;  // Used
\`\`\`
Check if multi-sig actually requires claimed number of signatures.

**PATTERN 16: STORAGE COLLISION IN UPGRADES**
Look for MaliciousImplementation contracts with incompatible storage:
\`\`\`
contract MaliciousImplementation {
    address public attacker;  // Overwrites original storage slot 0
}
\`\`\`

**PATTERN 17: SELFDESTRUCT CAPABILITY**
Look for:
\`\`\`
function destroy(address payable recipient) external {
    selfdestruct(recipient);  // Destroys contract, steals all ETH
}
\`\`\`

=== CROSS-VALIDATION: PDF vs CODE ===

You MUST compare these specific items from the PDF agreement against the code:

1. **FEES**: 
   - PDF claimed platform/transaction fee %?
   - Actual fee in code? Look for HIDDEN_FEE, private fee constants
   - Are there UNDISCLOSED fees?

2. **LATE FEES**:
   - PDF claimed late fee rate?
   - Actual LATE_FEE_RATE in code?
   - Is ACTUAL_LATE_FEE_RATE different from DOCUMENTED_LATE_FEE_RATE?

3. **EARLY TERMINATION FEES**:
   - PDF claimed early termination penalty?
   - Actual penalty in code?
   - Is ACTUAL_EARLY_TERMINATION different from DOCUMENTED?

4. **GRACE PERIODS**:
   - PDF claimed grace period for margin calls?
   - Is grace period enforced in seizeCollateralForMarginCall()?

5. **COLLATERAL RETURN**:
   - PDF claims automatic return after repayment?
   - Is there an approval gatekeeper blocking automatic return?

6. **DEFAULT CONDITIONS**:
   - PDF lists specific default events (Section VII/VIII)?
   - Are they actually validated in liquidation functions?
   - Or can any "reason" string trigger default?

7. **MULTI-SIG**:
   - PDF claims 5-of-9 multi-sig?
   - Is it actually 1-of-9?

8. **UPGRADE TIMELOCK**:
   - Any claims about upgrade delays?
   - Is upgradeTo() instant or timelocked?

=== OUTPUT FORMAT ===

Return ONLY a valid JSON object. NO markdown. NO text before or after.

{
  "discrepancies": [
    {
      "type": "hidden_fee | fee_mismatch | grace_period_missing | approval_gatekeeper | default_validation_missing | multisig_fake | timelock_missing | supply_manipulation",
      "severity": "CRITICAL | HIGH | MEDIUM | LOW",
      "pdfClaim": "What the document claims",
      "codeReality": "What the code actually does",
      "description": "Clear explanation of the deception",
      "impact": "Financial impact on users",
      "codeLocation": "Contract.sol:functionName() or line number"
    }
  ],
  
  "vulnerabilities": [
    {
      "type": "hidden_fee | unlimited_minting | account_freezing | token_seizure | emergency_drain | fee_manipulation | cross_default | backdoor_admin | instant_upgrade | selfdestruct | storage_collision | fake_multisig",
      "severity": "CRITICAL | HIGH | MEDIUM | LOW",
      "location": "Contract.sol:functionName()",
      "description": "How the vulnerability works",
      "exploit": "Specific attack scenario",
      "codeSnippet": "The malicious code",
      "financialImpact": "Estimated $ loss"
    }
  ],
  
  "codeQualityIssues": [
    {
      "type": "centralization | missing_validation | missing_events | reentrancy | access_control",
      "severity": "HIGH | MEDIUM | LOW",
      "description": "Issue description",
      "location": "Location in code"
    }
  ],
  
  "tokenomicsVerification": {
    "documentedFee": "Fee % claimed in PDF",
    "actualFee": "Fee % in code (include hidden)",
    "feeMismatch": true,
    "documentedLateFee": "Late fee % in PDF",
    "actualLateFee": "Late fee % in code",
    "lateFeeMismatch": true,
    "gracePeriodClaimed": "Grace period in PDF",
    "gracePeriodEnforced": false,
    "unlimitedMinting": true,
    "canFreezeAccounts": true,
    "canSeizeWithoutDefault": true,
    "hasBackdoorAdmin": true,
    "hasInstantUpgrade": true,
    "fakeMultisig": true
  },
  
  "riskScore": {
    "overall": 0.0,
    "classification": "HIGH-RISK",
    "confidence": "HIGH"
  },
  
  "summary": "2-3 sentences summarizing the MOST CRITICAL vulnerabilities found.",
  
  "redFlags": [
    "List EVERY major issue found"
  ],
  
  "positiveAspects": []
}

=== SCORING ===

Start at 10.0 and SUBTRACT:
- Hidden fee: -3.0
- Missing grace period: -2.0
- Unlimited minting: -3.0
- Token seizure without default: -3.0
- Emergency drain capability: -3.0
- Fee manipulation: -2.0
- Cross-default cascade: -2.0
- Backdoor admin: -3.0
- Instant upgrade: -2.0
- Fake multi-sig: -2.0
- Account freezing: -1.5
- Each other HIGH issue: -1.5
- Each MEDIUM issue: -0.5

Classification:
- SAFE: 7.0 - 10.0
- SUSPICIOUS: 4.0 - 6.9
- HIGH-RISK: 0.0 - 3.9

=== CRITICAL REMINDERS ===

1. Return ONLY valid JSON - NO markdown code blocks
2. Check for DUAL CONSTANTS pattern (public documented vs private actual)
3. Check for MISSING EVENTS on balance transfers
4. Check for MISSING VALIDATION on seizure/liquidation
5. Check for ARBITRARY REASON STRINGS
6. Report EVERY vulnerability you find
7. Be AGGRESSIVE - assume malicious intent`;

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
      ...metadata,
      analysisMode: metadata.analysisMode || 'gemini-api',
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
 * Attempt to repair truncated JSON by closing unclosed structures
 * @param {string} json - Potentially truncated JSON string
 * @param {boolean} aggressive - If true, truncate to last complete object/array
 * @returns {string} Repaired JSON string
 */
function repairTruncatedJSON(json, aggressive = false) {
  let repaired = json.trim();
  
  if (aggressive) {
    // Find the last complete structure by looking for complete key-value pairs
    // Remove incomplete trailing content after last complete value
    
    // Find last complete string value (ends with ")
    const lastCompleteString = repaired.lastIndexOf('",');
    const lastCompleteNumber = repaired.search(/\d,\s*"[^"]+"\s*:\s*$/);
    const lastCompleteBoolean = repaired.lastIndexOf('true,');
    const lastCompleteBooleanF = repaired.lastIndexOf('false,');
    const lastCompleteNull = repaired.lastIndexOf('null,');
    const lastCompleteArray = repaired.lastIndexOf('],');
    const lastCompleteObject = repaired.lastIndexOf('},');
    
    // Find the most recent complete item
    const positions = [
      lastCompleteString,
      lastCompleteNumber,
      lastCompleteBoolean,
      lastCompleteBooleanF,
      lastCompleteNull,
      lastCompleteArray,
      lastCompleteObject
    ].filter(p => p > 0);
    
    if (positions.length > 0) {
      const cutPoint = Math.max(...positions);
      // Cut at the comma after the complete value
      const commaPos = repaired.indexOf(',', cutPoint);
      if (commaPos > 0) {
        repaired = repaired.substring(0, commaPos);
      }
    }
  }
  
  // Remove any trailing incomplete key or value
  // Pattern: "key": " (incomplete string value)
  repaired = repaired.replace(/,?\s*"[^"]*":\s*"[^"]*$/, '');
  // Pattern: "key": (no value)
  repaired = repaired.replace(/,?\s*"[^"]*":\s*$/, '');
  // Pattern: just a comma or partial
  repaired = repaired.replace(/,\s*$/, '');
  
  // Count unclosed brackets
  let openBraces = 0;
  let openBrackets = 0;
  let inString = false;
  let escapeNext = false;
  
  for (let i = 0; i < repaired.length; i++) {
    const char = repaired[i];
    
    if (escapeNext) {
      escapeNext = false;
      continue;
    }
    
    if (char === '\\') {
      escapeNext = true;
      continue;
    }
    
    if (char === '"') {
      inString = !inString;
      continue;
    }
    
    if (!inString) {
      if (char === '{') openBraces++;
      else if (char === '}') openBraces--;
      else if (char === '[') openBrackets++;
      else if (char === ']') openBrackets--;
    }
  }
  
  // Close unclosed strings first (if we're in a string)
  if (inString) {
    repaired += '"';
  }
  
  // Close unclosed arrays
  while (openBrackets > 0) {
    repaired += ']';
    openBrackets--;
  }
  
  // Close unclosed objects
  while (openBraces > 0) {
    repaired += '}';
    openBraces--;
  }
  
  log.info('JSON repair attempted', {
    originalLength: json.length,
    repairedLength: repaired.length,
    addedBraces: repaired.length - json.length,
    aggressive
  });
  
  return repaired;
}

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
    
    // Step 4: Try to repair truncated JSON
    let jsonToparse = cleaned;
    let isTruncated = false;
    
    // Check if JSON is truncated (doesn't end with })
    if (!cleaned.trim().endsWith('}')) {
      log.warn('JSON appears to be truncated, attempting repair...');
      isTruncated = true;
      jsonToparse = repairTruncatedJSON(cleaned);
    }
    
    // Parse JSON
    let parsed;
    try {
      parsed = JSON.parse(jsonToparse);
    } catch (parseError) {
      // If first attempt fails, try more aggressive repair
      log.warn('Initial parse failed, trying aggressive repair...');
      jsonToparse = repairTruncatedJSON(cleaned, true);
      parsed = JSON.parse(jsonToparse);
    }
    
    // Mark if response was truncated
    if (isTruncated) {
      parsed._wasTruncated = true;
      if (!parsed.redFlags) parsed.redFlags = [];
      parsed.redFlags.push('AI response was truncated - some details may be missing');
    }
    
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

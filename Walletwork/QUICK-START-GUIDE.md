# WalletWork Quick Start & Testing Guide

## 🚀 Quick Start (5 Minutes)

### Step 1: Start Backend
```powershell
cd "c:\Abhijit Data\BeforeYouSign-Abhi\Walletwork\backend"
uvicorn main:app --reload --port 8000
```

**Expected Output**:
```
INFO:     Uvicorn running on http://127.0.0.1:8000
INFO:     Application startup complete.
```

**Test it**: Open http://localhost:8000/health in browser  
**Should see**: `{"status":"healthy","timestamp":"..."}`

---

### Step 2: Start Frontend
```powershell
cd "c:\Abhijit Data\BeforeYouSign-Abhi\Walletwork\frontend"
npm run dev
```

**Expected Output**:
```
  VITE v5.x.x  ready in X ms
  ➜  Local:   http://localhost:5173/
```

**Test it**: Open http://localhost:5173 in browser  
**Should see**: Dark futuristic UI with "Transaction Scanner" card

---

### Step 3: Load Chrome Extension
1. Open Chrome browser
2. Go to `chrome://extensions/`
3. Enable **"Developer mode"** (top right toggle)
4. Click **"Load unpacked"**
5. Navigate to: `c:\Abhijit Data\BeforeYouSign-Abhi\Walletwork\extension`
6. Click "Select Folder"

**Verify**: You should see "WalletWork Firewall" extension card with version 1.0

---

## ✅ Validation Tests

### Test 1: Backend API Health Check
```powershell
curl http://localhost:8000/health
```
**Expected**: `{"status":"healthy","timestamp":"2024-..."}`

---

### Test 2: Risk Engine - SAFE Transaction
```powershell
curl -X POST http://localhost:8000/analyze -H "Content-Type: application/json" -d "{\"wallet\":\"0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb\",\"contract\":\"0xdAC17F958D2ee523a2206206994597C13D831ec7\",\"tx_type\":\"transfer\"}"
```

**Expected Response Structure**:
```json
{
  "risk": "SAFE",
  "risk_score": 15,
  "reasons": [
    "✅ This wallet has transacted before",
    "✅ Contract is verified on Etherscan"
  ],
  "signals": { ... }
}
```

**Validation**:
- ✅ `risk` field is one of: SAFE, CAUTION, DANGEROUS
- ✅ `risk_score` is between 0-100
- ✅ `reasons` is an array of strings
- ✅ No SUSPICIOUS or HIGH_RISK values

---

### Test 3: Risk Engine - DANGEROUS Transaction (ERC20 Approve)
```powershell
curl -X POST http://localhost:8000/analyze -H "Content-Type: application/json" -d "{\"wallet\":\"0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb\",\"contract\":\"0xdAC17F958D2ee523a2206206994597C13D831ec7\",\"tx_type\":\"approve\"}"
```

**Expected**:
- `risk`: "CAUTION" or "DANGEROUS"
- `risk_score`: >= 30
- `reasons` includes: "⚠️ ERC20 approve detected - unlimited token access risk"

---

### Test 4: Frontend Risk Color Mapping
1. Go to http://localhost:5173
2. Enter wallet: `0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb`
3. Enter contract: `0xdAC17F958D2ee523a2206206994597C13D831ec7`
4. Select transaction type: **Transfer**
5. Click **"Scan Transaction"**

**Expected UI**:
- Risk badge appears with color:
  - GREEN (#10b981) for SAFE
  - AMBER (#f59e0b) for CAUTION
  - RED (#ef4444) for DANGEROUS
- Reasons list shows bullet points matching risk color
- No broken colors or missing styles

---

### Test 5: Extension Integration (Manual)
**Prerequisite**: Have MetaMask installed and connected to Ethereum Mainnet

1. Visit any DApp (e.g., Uniswap, OpenSea)
2. Connect MetaMask
3. Try to send a transaction (e.g., ETH transfer)
4. **WalletWork should intercept** before MetaMask signing

**Expected Behavior**:
- Modal overlay appears with risk verdict
- **SAFE** → Green modal, auto-proceeds (no modal shown)
- **CAUTION** → Amber modal with "I Understand the Risk" button
- **DANGEROUS** → Red modal, NO proceed button, only REJECT

**Validation**:
- ✅ Modal shows correct risk level (SAFE/CAUTION/DANGEROUS, NOT LOW/HIGH_RISK)
- ✅ Colors match semantic meaning (GREEN/AMBER/RED)
- ✅ Reasons are human-readable
- ✅ "REJECT TRANSACTION" button always present

---

### Test 6: Run Automated Integration Tests
```powershell
cd "c:\Abhijit Data\BeforeYouSign-Abhi\Walletwork\backend"
python test_integration.py
```

**Expected Output**:
```
########################################################
# WalletWork Integration Test Suite
# Testing SAFE/CAUTION/DANGEROUS Risk Classification
########################################################

============================================================
TESTING MODULE IMPORTS
============================================================
✅ risk_engine.RiskEngine imported
✅ models.AnalyzeRequest imported
✅ models.RiskSignals imported
...

============================================================
TESTING HEALTH CHECK
============================================================
✅ Health check passed: {'status': 'healthy', ...}

============================================================
TESTING BACKEND API - Risk Level Validation
============================================================

[Test 1] SAFE Transaction - Fresh EOA to ETH Address
------------------------------------------------------------
✅ Status: 200
Risk Level: SAFE
Risk Score: 25/100
Expected: SAFE
✅ Test 1 PASSED

...

########################################################
# Test Suite Complete
########################################################
```

---

## 🔍 Troubleshooting

### Backend won't start
**Error**: `ModuleNotFoundError: No module named 'fastapi'`  
**Fix**: Install dependencies
```powershell
cd backend
pip install -r requirements.txt
```

---

### Frontend won't start
**Error**: `Module not found` or `npm ERR!`  
**Fix**: Install dependencies
```powershell
cd frontend
npm install
```

---

### Extension not intercepting
**Possible Causes**:
1. Extension not loaded in Chrome
2. MetaMask not connected
3. Not on a real DApp (needs `window.ethereum`)

**Fix**:
- Check `chrome://extensions/` - WalletWork should show "Enabled"
- Open browser console (F12) → should see: `"Walletwork Firewall: Interceptor active."`
- Try transaction on Uniswap or similar DApp

---

### API returns old risk levels (SUSPICIOUS/HIGH_RISK)
**Cause**: Backend cache or old code  
**Fix**:
1. Stop backend (Ctrl+C)
2. Clear `__pycache__`: 
   ```powershell
   cd backend
   Remove-Item -Recurse -Force __pycache__
   ```
3. Restart: `uvicorn main:app --reload --port 8000`

---

### Extension modal shows wrong colors
**Cause**: Browser cached old CSS  
**Fix**:
1. Go to `chrome://extensions/`
2. Click **"Remove"** on WalletWork
3. Click **"Load unpacked"** again
4. Select extension folder
5. Hard refresh DApp page (Ctrl+Shift+R)

---

## 📋 Pre-Demo Checklist

Before presenting to judges:

### Backend
- [ ] Backend starts without errors
- [ ] `/health` endpoint returns 200
- [ ] Test API call returns SAFE/CAUTION/DANGEROUS (not SUSPICIOUS/HIGH_RISK)
- [ ] Reasons are human-readable (no technical jargon)
- [ ] Score ranges: 0-29=SAFE, 30-69=CAUTION, 70-100=DANGEROUS

### Frontend
- [ ] UI loads at http://localhost:5173
- [ ] Dark theme with glassmorphism visible
- [ ] Risk colors correct: GREEN=SAFE, AMBER=CAUTION, RED=DANGEROUS
- [ ] Bullet points match risk level color
- [ ] No console errors in browser dev tools

### Extension
- [ ] Extension loaded in `chrome://extensions/`
- [ ] "Interceptor active" message in console
- [ ] Modal appears when transaction attempted
- [ ] Modal colors match risk level (GREEN/AMBER/RED)
- [ ] DANGEROUS transactions hide "Proceed" button
- [ ] Rejection works (transaction cancelled)

### Integration
- [ ] Run `test_integration.py` - all tests pass
- [ ] Manual test: Send real transaction - modal appears
- [ ] Manual test: Safe transaction → green modal (or auto-proceed)
- [ ] Manual test: Approve → DANGEROUS red modal

---

## 🎯 Demo Script for Judges

**1. Problem Statement** (30 seconds)
- "Web3 users lose billions to scams annually"
- "Current tools are reactive - they detect scams AFTER victims sign"
- "We built a PROACTIVE firewall that analyzes transactions BEFORE signing"

**2. Live Demo** (2 minutes)
- **Show Backend**: Open http://localhost:8000/health
  - "This is our FastAPI backend running on port 8000"
  
- **Show Frontend**: Open http://localhost:5173
  - "Here's our analysis UI - let's scan a transaction"
  - Enter Vitalik's address: `0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb`
  - Enter USDT contract: `0xdAC17F958D2ee523a2206206994597C13D831ec7`
  - Select "Approve"
  - Click "Scan Transaction"
  - **Point out**:
    - Risk score calculation
    - Color-coded verdict (likely CAUTION or DANGEROUS for approve)
    - Human-readable reasons (no tech jargon)
    
- **Show Extension**: Open Uniswap or test DApp
  - "Now the real magic - our Chrome extension intercepts MetaMask"
  - Try to send a transaction
  - **WalletWork modal appears**:
    - "Before the user can sign, we analyze the transaction"
    - "GREEN for safe, AMBER for caution, RED for dangerous"
    - "User cannot proceed with DANGEROUS transactions"

**3. Technical Depth** (1 minute)
- "Our risk engine uses 5 deterministic signals:"
  - "1. Wallet freshness - is this a new sybil address?"
  - "2. Contract verification - is the code audited?"
  - "3. Graph intelligence - connected to known scammers?"
  - "4. Transaction type - approve is inherently risky"
  - "5. Static heuristics - suspicious address patterns"
  
- "No machine learning - 100% explainable"
- "Real-time blockchain data from Alchemy and Etherscan"

**4. Impact** (30 seconds)
- "This prevents users from signing malicious transactions"
- "Works seamlessly with existing Web3 tools (MetaMask)"
- "Production-ready with comprehensive error handling"

**Total Demo Time**: ~4 minutes

---

## 🛡️ Security Features to Highlight

1. **Fail-Closed Design**: If backend is unreachable → DANGEROUS verdict
2. **No Auto-Proceed for Risk**: CAUTION/DANGEROUS require user acknowledgment
3. **ERC20 Approve Detection**: Warns about unlimited token access
4. **Graph Proximity**: Detects connections to known scam clusters
5. **Deterministic Scoring**: Every decision is explainable (no black-box AI)

---

## 📊 Metrics to Track (Post-Demo)

If judges ask about effectiveness:
- **False Positive Rate**: Test with 100 known safe transactions → % flagged
- **False Negative Rate**: Test with known scam addresses → % missed
- **Latency**: Average response time (should be <2 seconds)
- **User Adoption**: How many transactions blocked vs proceeded

---

## 🎓 Judge Q&A Preparation

**Q: "What if a user ignores the DANGEROUS warning?"**  
A: "For DANGEROUS transactions, we hide the 'Proceed' button entirely - fail-closed approach. Only CAUTION allows proceed with explicit acknowledgment."

**Q: "How do you keep the scam database updated?"**  
A: "Currently using local scam_db.json for demo. Production would integrate live threat feeds like Forta or Chainalysis API."

**Q: "What makes this better than MetaMask's built-in warnings?"**  
A: "MetaMask only warns about known malicious contracts. We analyze 5 signals including wallet freshness, graph proximity, and transaction simulation. Plus, we provide explainable reasons."

**Q: "Can this be bypassed?"**  
A: "User could disable the extension. But the goal is protection, not enforcement. Think of it like antivirus - it warns, user decides."

**Q: "How accurate is the graph intelligence?"**  
A: "We calculate shortest path to known scam addresses using NetworkX. Hop distance determines risk weight: 0 hops=scam, 1 hop=connected, 2+ hops=distant."

**Q: "Does this work for all chains?"**  
A: "Currently Ethereum mainnet via Alchemy. Architecture is modular - can add Polygon, Arbitrum, etc. by swapping RPC endpoints."

---

## ✅ Final Validation Before Demo

Run this command sequence right before presenting:

```powershell
# Terminal 1: Start Backend
cd "c:\Abhijit Data\BeforeYouSign-Abhi\Walletwork\backend"
uvicorn main:app --reload --port 8000

# Terminal 2: Start Frontend
cd "c:\Abhijit Data\BeforeYouSign-Abhi\Walletwork\frontend"
npm run dev

# Terminal 3: Test Everything
cd "c:\Abhijit Data\BeforeYouSign-Abhi\Walletwork\backend"
python test_integration.py
```

**If all 3 succeed**: ✅ You're ready to present!

**If any fail**: See Troubleshooting section above

---

## 📸 Screenshots to Prepare

Before demo, take screenshots of:
1. Backend `/health` endpoint returning 200
2. Frontend UI with SAFE transaction (green)
3. Frontend UI with DANGEROUS transaction (red)
4. Extension modal with color-coded verdict
5. Browser console showing "Interceptor active" message

Keep these ready in case live demo fails (Murphy's Law!)

---

**Good luck with your presentation! 🚀**

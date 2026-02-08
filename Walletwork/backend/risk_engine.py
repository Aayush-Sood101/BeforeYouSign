from datetime import datetime
from typing import List, Dict, Any

# Risk levels matching specification: SAFE, CAUTION, DANGEROUS
RISK_LEVELS = {
    "SAFE": (0, 29),
    "CAUTION": (30, 69),
    "DANGEROUS": (70, 100),
}

def calculate_risk(wallet: str, contract: str, tx_type: str, 
                   onchain_data: Dict[str, Any] = None,
                   graph_signals: Dict[str, Any] = None,
                   forecast_signals: Dict[str, Any] = None) -> dict:
    """
    Deterministic risk engine that combines multiple signals into a final verdict.
    
    Returns a risk assessment with:
    - risk_level: SAFE | CAUTION | DANGEROUS
    - risk_score: 0-100
    - reasons: Human-readable explanations
    - signals: Technical details for debugging
    """
    score = 0
    reasons = []
    
    if onchain_data is None: onchain_data = {}
    if graph_signals is None: graph_signals = {}
    if forecast_signals is None: forecast_signals = {}

    # ==========================================
    # SIGNAL 1: Fresh Wallet Detection
    # ==========================================
    tx_count = onchain_data.get("tx_count", -1)
    if tx_count == 0:
        score += 30
        reasons.append("This is a brand new wallet with zero transaction history")
    elif tx_count > 0 and tx_count < 3:
        score += 15
        reasons.append("Very low activity wallet (fewer than 3 transactions)")

    # ==========================================
    # SIGNAL 2: Contract Verification
    # ==========================================
    is_contract = onchain_data.get("is_contract", False)
    is_verified = onchain_data.get("contract_verified", None)
    
    if is_contract:
        if is_verified is False:
            score += 35
            reasons.append("Contract source code is NOT verified on Etherscan")
        elif is_verified is True:
            reasons.append("Contract is verified on Etherscan")
        # If is_verified is None, verification check failed - don't penalize heavily
    else:
        reasons.append("Interacting with a regular wallet (not a contract)")

    # ==========================================
    # SIGNAL 3: Graph Intelligence
    # ==========================================
    hop_distance = graph_signals.get("wallet_scam_distance", -1)
    
    if hop_distance == 0:
        # Direct match in scam database
        score += 50
        reasons.append("⚠️ CRITICAL: This address is flagged in our scam database")
    elif hop_distance == 1:
        score += 35
        reasons.append("High Risk: This wallet has directly interacted with known scammers")
    elif hop_distance == 2:
        score += 20
        reasons.append("Caution: Connected to suspicious wallets (2 hops from known scammers)")
    elif hop_distance == 3:
        score += 10
        reasons.append("Distant connection to suspicious activity detected (3 hops)")

    # ==========================================
    # SIGNAL 4: Transaction Type Risk
    # ==========================================
    if tx_type == "approve":
        score += 25
        reasons.append("ERC20 Approve detected - this grants spending permission")
        
        # Check drain simulation
        drain_prob = forecast_signals.get("drain_probability", 0.0)
        if drain_prob >= 0.8:
            score += 25
            reasons.append(f"High drain risk detected ({int(drain_prob*100)}% probability)")
        elif drain_prob >= 0.5:
            score += 15
            reasons.append(f"Moderate drain risk ({int(drain_prob*100)}% probability)")
            
    elif tx_type == "swap":
        score += 10
        reasons.append("Token swap operation - ensure you trust the DEX contract")
    elif tx_type == "send":
        score += 5
        reasons.append("Standard transfer - lowest risk transaction type")

    # ==========================================
    # SIGNAL 5: Static Heuristics (Pattern Detection)
    # ==========================================
    contract_lower = contract.lower()
    wallet_lower = wallet.lower()
    
    # Suspicious patterns in addresses
    if any(pattern in contract_lower for pattern in ["dead", "bad", "scam", "fake", "phish"]):
        score += 25
        reasons.append("Suspicious keywords detected in contract address")
    
    if wallet_lower.startswith("0x000000"):
        score += 15
        reasons.append("Unusual wallet address pattern (null-like prefix)")

    # ==========================================
    # FINAL SCORE CALCULATION
    # ==========================================
    score = min(score, 100)  # Cap at 100

    # Determine risk label based on score ranges
    label = "SAFE"
    for risk_label, (low, high) in RISK_LEVELS.items():
        if low <= score <= high:
            label = risk_label
            break

    # If no reasons were added (clean wallet, all checks pass)
    if not reasons:
        reasons.append("All security checks passed")
        reasons.append("No red flags detected")

    return {
        "risk": label,
        "risk_score": score,  # Changed from 'score' to match spec
        "score": score,  # Keep both for backward compatibility
        "reasons": reasons,
        "timestamp": datetime.utcnow().isoformat(),
        "signals": {
            "is_new_wallet": tx_count == 0,
            "is_unverified_contract": is_contract and is_verified is False,
            "graph_hop_distance": hop_distance if hop_distance >= 0 else None,
            "drain_probability": forecast_signals.get("drain_probability", 0.0),
            "contract_age_days": onchain_data.get("contract_age_days", None)
        },
        # Keep detailed signals for debugging
        "onchain_signals": onchain_data,
        "graph_signals": graph_signals,
        "forecast_signals": forecast_signals
    }

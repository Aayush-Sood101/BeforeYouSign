from datetime import datetime
from typing import List, Dict, Any

RISK_LEVELS = {
    "SAFE": (0, 30),
    "SUSPICIOUS": (31, 70),
    "HIGH_RISK": (71, 100),
}

def calculate_risk(wallet: str, contract: str, tx_type: str, 
                   onchain_data: Dict[str, Any] = None,
                   graph_signals: Dict[str, Any] = None,
                   forecast_signals: Dict[str, Any] = None) -> dict:
    score = 0
    reasons = []
    
    if onchain_data is None: onchain_data = {}
    if graph_signals is None: graph_signals = {}
    if forecast_signals is None: forecast_signals = {}

    # --- Phase 1 & 2 Logic ---
    
    # Transaction Type Rules
    if tx_type == "approve":
        score += 40
        reasons.append("High-risk transaction type: approve")
    elif tx_type == "swap":
        score += 25
        reasons.append("Medium-risk transaction type: swap")
    elif tx_type == "send":
        score += 5
        reasons.append("Standard transaction type: send")

    # Static Heuristics
    contract_lower = contract.lower()
    if "dead" in contract_lower or "bad" in contract_lower:
        score += 30
        reasons.append("Suspicious keywords found in contract address")

    if wallet.lower().startswith("0x000"):
        score += 20
        reasons.append("Wallet pattern matches known bot/suspicious prefix")

    # On-chain Rules
    tx_count = onchain_data.get("tx_count", -1)
    if tx_count == 0:
        score += 25
        reasons.append("Wallet has 0 transactions (Fresh Wallet)")
    elif tx_count > 0 and tx_count < 5:
        score += 15
        reasons.append("Wallet has very few transactions (<5)")

    is_contract = onchain_data.get("is_contract", False)
    is_verified = onchain_data.get("contract_verified", None)
    if is_contract:
         score += 10
         reasons.append("Interaction with a smart contract")
         if is_verified is False:
            score += 30
            reasons.append("Contract source code not verified on Etherscan")
         elif is_verified is None:
            # If we can't verify (e.g. no API key), don't penalize heavily, maybe just a warning?
            # For now, 0 penalty, just let the user know data is missing if we wanted.
            pass


    # --- Phase 3: Graph Intelligence ---
    dist = graph_signals.get("wallet_scam_distance", -1)
    if dist != -1:
        if dist <= 1:
            score += 40
            reasons.append("Critical: Direct connection to known scammer (1 Hop)")
        elif dist == 2:
            score += 25
            reasons.append("High Risk: 2 Hops from known scammer")
        elif dist == 3:
            score += 10
            reasons.append("Warning: 3 Hops from known scammer")

    # --- Phase 3: Fraud Forecast ---
    drain_prob = forecast_signals.get("drain_probability", 0.0)
    if drain_prob >= 0.8:
        score += 30
        reasons.append(f"AI Forecast: High Probability of Drain ({int(drain_prob*100)}%)")
    elif drain_prob >= 0.5:
         score += 15
         reasons.append(f"AI Forecast: Moderate Probability of Risk ({int(drain_prob*100)}%)")

    # Cap score at 100
    score = min(score, 100)

    # Determine Risk Label
    label = "SAFE"
    for risk_label, (low, high) in RISK_LEVELS.items():
        if low <= score <= high:
            label = risk_label
            break

    return {
        "risk": label,
        "score": score,
        "reasons": reasons,
        "timestamp": datetime.utcnow().isoformat(),
        "onchain_signals": onchain_data,
        "graph_signals": graph_signals,
        "forecast_signals": forecast_signals
    }

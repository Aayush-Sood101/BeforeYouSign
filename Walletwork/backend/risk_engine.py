from datetime import datetime
from typing import List, Dict, Any

# Risk levels matching specification: SAFE, CAUTION, DANGEROUS
RISK_LEVELS = {
    "SAFE": (0, 29),
    "CAUTION": (30, 69),
    "DANGEROUS": (70, 100),
}

# Known burn addresses - addresses used to permanently destroy tokens
BURN_ADDRESSES = {
    "0x0000000000000000000000000000000000000000",  # Zero address
    "0x000000000000000000000000000000000000dead",  # Dead address variant
    "0xdeaddeaddeaddeaddeaddeaddeaddeaddeaddead",  # Common burn address
    "0xdead000000000000000042069420694206942069",  # Meme burn address
    "0x000000000000000000000000000000000000dEaD",  # Another variant
}

def is_valid_eth_address(address: str) -> bool:
    """Validate Ethereum address format"""
    if not address:
        return False
    if not address.startswith("0x"):
        return False
    if len(address) != 42:
        return False
    # Check if it's valid hex
    try:
        int(address[2:], 16)
        return True
    except ValueError:
        return False

def is_burn_address(address: str) -> bool:
    """Check if address is a known burn address"""
    if not address:
        return False
    return address.lower() in BURN_ADDRESSES

def calculate_risk(wallet: str, contract: str, tx_type: str, 
                   onchain_data: Dict[str, Any] = None,
                   graph_signals: Dict[str, Any] = None,
                   forecast_signals: Dict[str, Any] = None,
                   scam_intel: Dict[str, Any] = None) -> dict:
    """
    Deterministic risk engine that combines multiple signals into a final verdict.
    
    NEW: Integrated structured scam intelligence with category-based risk scoring.
    
    Returns a risk assessment with:
    - risk_level: SAFE | CAUTION | DANGEROUS
    - risk_score: 0-100
    - reasons: Human-readable explanations
    - signals: Technical details including scam intelligence
    """
    score = 0
    reasons = []
    
    if onchain_data is None: onchain_data = {}
    if graph_signals is None: graph_signals = {}
    if forecast_signals is None: forecast_signals = {}
    if scam_intel is None: scam_intel = {}
    
    # ==========================================
    # PHASE 0: Address Format Validation
    # ==========================================
    wallet_valid = is_valid_eth_address(wallet)
    contract_valid = is_valid_eth_address(contract)
    wallet_is_burn = is_burn_address(wallet)
    contract_is_burn = is_burn_address(contract)
    
    if not wallet_valid:
        score += 100  # Invalid address = max risk
        reasons.append("⚠️ CRITICAL: Invalid wallet address format")
    
    if not contract_valid:
        score += 100  # Invalid address = max risk
        reasons.append("⚠️ CRITICAL: Invalid contract address format")
    
    # Check for burn addresses
    if wallet_is_burn:
        score += 100
        reasons.append("⚠️ CRITICAL: Wallet address is a known burn address (funds will be permanently lost)")
    
    if contract_is_burn:
        score += 100
        reasons.append("⚠️ CRITICAL: Contract address is a known burn address (funds will be permanently lost)")
    
    # If addresses are invalid or burn addresses, skip further analysis
    if not wallet_valid or not contract_valid or wallet_is_burn or contract_is_burn:
        return {
            "risk": "DANGEROUS",
            "risk_score": 100,
            "score": 100,
            "reasons": reasons,
            "timestamp": datetime.utcnow().isoformat(),
            "signals": {
                "wallet_address_valid": wallet_valid,
                "contract_address_valid": contract_valid,
                "wallet_is_burn_address": wallet_is_burn,
                "contract_is_burn_address": contract_is_burn,
                "is_new_wallet": False,
                "is_unverified_contract": False,
                "contract_age_days": None,
                "scam_match": False,
                "scam_category": None,
                "scam_source": None,
                "scam_confidence": None,
                "cluster_id": None,
                "graph_hop_distance": None,
                "graph_explanation": None,
                "drain_probability": 0.0
            },
            "onchain_signals": {},
            "graph_signals": {},
            "forecast_signals": {},
            "scam_intel": {}
        }
    
    # ==========================================
    # PHASE 1: Scam Intelligence (Static Validation)
    # ==========================================
    scam_match = scam_intel.get("scam_match", False)
    scam_category = scam_intel.get("scam_category")
    scam_source = scam_intel.get("scam_source")
    scam_confidence = scam_intel.get("scam_confidence", 0.0)
    cluster_id = scam_intel.get("cluster_id")
    
    if scam_match:
        # Base penalty for scam database match
        base_penalty = 45
        
        # Category-specific amplification
        category_multipliers = {
            "approval_drainer": 1.2,
            "phishing": 1.15,
            "drainer_operator": 1.2,
            "malicious_router": 1.1,
            "honeypot": 1.15,
            "rug_pull": 1.1,
            "scam_operator": 1.1,
            "fake_airdrop": 1.05
        }
        
        multiplier = category_multipliers.get(scam_category, 1.0)
        confidence_factor = scam_confidence if scam_confidence else 1.0
        
        penalty = int(base_penalty * multiplier * confidence_factor)
        score += penalty
        
        # Human-readable reason
        category_display = scam_category.replace("_", " ").title() if scam_category else "Unknown"
        source_display = f" (Source: {scam_source})" if scam_source else ""
        cluster_display = f" [Cluster: {cluster_id}]" if cluster_id else ""
        
        reasons.append(
            f"⚠️ CRITICAL: Address flagged as '{category_display}' in scam intelligence database{source_display}{cluster_display}"
        )
        
        if scam_confidence and scam_confidence >= 0.9:
            reasons.append(f"High confidence scam indicator ({int(scam_confidence*100)}% confidence)")
    else:
        # No scam intelligence match
        pass

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
    # PHASE 3: Graph Intelligence
    # ==========================================
    hop_distance = graph_signals.get("wallet_scam_distance", -1)
    graph_explanation = graph_signals.get("graph_explanation")
    nearest_scam_category = graph_signals.get("nearest_scam_category")
    
    # Only penalize graph connections if NOT already a direct scam match
    if not scam_match:
        if hop_distance == 0:
            # This shouldn't happen if scam_intel is working, but handle it
            score += 50
            reasons.append("⚠️ CRITICAL: Address detected in scam database via graph analysis")
        elif hop_distance == 1:
            penalty = 35
            # Amplify based on scam category proximity
            if nearest_scam_category in ["approval_drainer", "drainer_operator"]:
                penalty += 10
            score += penalty
            
            category_note = f" ({nearest_scam_category.replace('_', ' ')})" if nearest_scam_category else ""
            reasons.append(f"High Risk: Direct interaction with known scam addresses{category_note}")
        elif hop_distance == 2:
            score += 20
            reasons.append("Caution: 2 hops from known scam activity (indirect exposure)")
        elif hop_distance == 3:
            score += 10
            reasons.append("Distant connection to scam network detected (3 hops)")

    # ==========================================
    # PHASE 4: Transaction Type & Simulation Risk
    # ==========================================
    drain_prob = forecast_signals.get("drain_probability", 0.0)
    
    if tx_type == "approve":
        base_penalty = 25
        
        # Amplify if contract is approval_drainer category
        if scam_category == "approval_drainer":
            base_penalty += 20
            reasons.append("⚠️ CRITICAL: Contract flagged as approval drainer - will steal tokens after approval")
        else:
            reasons.append("ERC20 Approve detected - grants spending permission to contract")
        
        score += base_penalty
        
        # Drain probability
        if drain_prob >= 0.8:
            score += 25
            reasons.append(f"Extremely high drain risk ({int(drain_prob*100)}% probability)")
        elif drain_prob >= 0.5:
            score += 15
            reasons.append(f"Elevated drain risk ({int(drain_prob*100)}% probability)")
            
    elif tx_type == "swap":
        base_penalty = 10
        
        # Amplify if contract is malicious_router or honeypot
        if scam_category in ["malicious_router", "honeypot"]:
            base_penalty += 25
            reasons.append("⚠️ CRITICAL: Contract identified as malicious swap router or honeypot")
        else:
            reasons.append("Token swap operation - verify you trust the DEX contract")
        
        score += base_penalty
        
    elif tx_type == "send" or tx_type == "transfer":
        score += 5
        reasons.append("Direct transfer - lowest risk transaction type")

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
        "risk_score": score,
        "score": score,  # Backward compatibility
        "reasons": reasons,
        "timestamp": datetime.utcnow().isoformat(),
        "signals": {
            # Address validation
            "wallet_address_valid": wallet_valid,
            "contract_address_valid": contract_valid,
            "wallet_is_burn_address": wallet_is_burn,
            "contract_is_burn_address": contract_is_burn,
            
            # On-chain signals
            "is_new_wallet": tx_count == 0,
            "is_unverified_contract": is_contract and is_verified is False,
            "contract_age_days": onchain_data.get("contract_age_days", None),
            
            # Scam intelligence signals
            "scam_match": scam_match,
            "scam_category": scam_category,
            "scam_source": scam_source,
            "scam_confidence": scam_confidence,
            "cluster_id": cluster_id,
            
            # Graph signals
            "graph_hop_distance": hop_distance if hop_distance >= 0 else None,
            "graph_explanation": graph_explanation,
            
            # Simulation signals
            "drain_probability": drain_prob
        },
        # Keep detailed signals for debugging
        "onchain_signals": onchain_data,
        "graph_signals": graph_signals,
        "forecast_signals": forecast_signals,
        "scam_intel": scam_intel
    }

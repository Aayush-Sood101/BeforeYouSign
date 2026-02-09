from pydantic import BaseModel, validator, Field
from typing import List, Literal, Optional, Dict, Any

class AnalyzeRequest(BaseModel):
    """
    Request model for transaction risk analysis.
    Accepts any string for addresses - validation happens internally.
    """
    wallet: str = Field(..., description="The wallet address initiating the transaction")
    contract: str = Field(..., description="The target contract or recipient address")
    tx_type: Literal["approve", "swap", "transfer", "send"] = Field(..., description="Transaction type")
    tx_data: Optional[str] = Field(None, description="Optional transaction calldata")

    @validator("wallet", "contract")
    def normalize_address(cls, v):
        # Accept any string, just normalize to lowercase if it looks like an address
        if v and v.startswith("0x"):
            return v.lower()
        return v  # Return as-is for validation to catch later

class RiskSignals(BaseModel):
    """
    Detailed risk signals for transparency and debugging.
    Includes scam intelligence metadata for explainability.
    """
    # Address validation signals
    wallet_address_valid: bool = Field(..., description="True if wallet address format is valid")
    contract_address_valid: bool = Field(..., description="True if contract address format is valid")
    wallet_is_burn_address: bool = Field(..., description="True if wallet is a known burn address")
    contract_is_burn_address: bool = Field(..., description="True if contract is a known burn address")
    
    # On-chain signals (None = not checked due to validation failure)
    is_new_wallet: Optional[bool] = Field(..., description="True if wallet has 0 transactions, None if not checked")
    wallet_tx_count: Optional[int] = Field(None, description="Wallet transaction count from Alchemy")
    is_unverified_contract: Optional[bool] = Field(..., description="True if contract source not verified, None if not checked")
    contract_is_smart_contract: Optional[bool] = Field(None, description="True if address is a smart contract (from Alchemy bytecode check)")
    contract_type: Optional[str] = Field(None, description="Contract type: SMART_CONTRACT or EOA (Externally Owned Account)")
    contract_age_days: Optional[int] = Field(None, description="Contract age in days, if applicable")
    
    # Scam intelligence signals (PHASE 1: Static Validation)
    scam_match: bool = Field(..., description="True if address found in scam intelligence database")
    scam_category: Optional[str] = Field(None, description="Scam category: phishing, approval_drainer, honeypot, etc.")
    scam_source: Optional[str] = Field(None, description="Intelligence source: etherscan, chainabuse, community_reports, etc.")
    scam_confidence: Optional[float] = Field(None, description="Confidence score (0.0 to 1.0)")
    cluster_id: Optional[str] = Field(None, description="Cluster ID if address belongs to known scam cluster")
    
    # Graph signals (PHASE 3: Graph Risk Analysis)
    graph_hop_distance: Optional[int] = Field(None, description="Hops to nearest known scammer (0=direct match)")
    graph_explanation: Optional[str] = Field(None, description="Plain English explanation of hop distance")
    
    # Simulation signals (PHASE 4: Transaction Simulation)
    drain_probability: float = Field(..., description="Probability of funds drain (0.0 to 1.0)")

class AnalyzeResponse(BaseModel):
    """
    Response model matching the specification exactly.
    
    Output format:
    {
      "risk_level": "SAFE" | "CAUTION" | "DANGEROUS",
      "risk_score": 0-100,
      "reasons": ["reason 1", "reason 2", ...],
      "signals": { ... }
    }
    """
    risk: str = Field(..., description="Risk level: SAFE, CAUTION, or DANGEROUS")
    risk_score: int = Field(..., ge=0, le=100, description="Numerical risk score from 0 to 100")
    score: int = Field(..., ge=0, le=100, description="Alias for risk_score (backward compatibility)")  
    reasons: List[str] = Field(..., description="Human-readable explanations for the risk assessment")
    signals: RiskSignals = Field(..., description="Detailed technical signals")
    
    # Additional debug info (optional, can be hidden in production)
    onchain_signals: Optional[Dict[str, Any]] = None
    graph_signals: Optional[Dict[str, Any]] = None
    forecast_signals: Optional[Dict[str, Any]] = None
    scam_intel: Optional[Dict[str, Any]] = None
    timestamp: str = Field(..., description="ISO timestamp of analysis")

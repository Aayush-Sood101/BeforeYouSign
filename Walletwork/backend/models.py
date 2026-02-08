from pydantic import BaseModel, validator, Field
from typing import List, Literal, Optional, Dict, Any

class AnalyzeRequest(BaseModel):
    """
    Request model for transaction risk analysis.
    Matches the API specification exactly.
    """
    wallet: str = Field(..., description="The wallet address initiating the transaction")
    contract: str = Field(..., description="The target contract or recipient address")
    tx_type: Literal["approve", "swap", "transfer"] = Field(..., description="Transaction type")
    tx_data: Optional[str] = Field(None, description="Optional transaction calldata")

    @validator("wallet", "contract")
    def validate_address(cls, v):
        if not v.startswith("0x"):
            raise ValueError("Address must start with 0x")
        if len(v) != 42:
            raise ValueError("Address must be 42 characters long (0x + 40 hex chars)")
        return v.lower()  # Normalize to lowercase

class RiskSignals(BaseModel):
    """
    Detailed risk signals for transparency and debugging.
    """
    is_new_wallet: bool = Field(..., description="True if wallet has 0 transactions")
    is_unverified_contract: bool = Field(..., description="True if contract source not verified")
    graph_hop_distance: Optional[int] = Field(None, description="Hops to nearest known scammer (0=direct match)")
    drain_probability: float = Field(..., description="Probability of funds drain (0.0 to 1.0)")
    contract_age_days: Optional[int] = Field(None, description="Contract age in days, if applicable")

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
    timestamp: str = Field(..., description="ISO timestamp of analysis")

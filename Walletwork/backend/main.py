import asyncio
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from models import AnalyzeRequest, AnalyzeResponse
from risk_engine import calculate_risk
from blockchain import BlockchainClient
from etherscan import EtherscanClient
from graph_engine import GraphEngine
from simulation import FraudSimulator

app = FastAPI(
    title="Walletwork - Pre-Transaction Firewall",
    description="Web3 security API that analyzes transaction risk before signing",
    version="1.0.0"
)

# --------------------------------------
# CORS (frontend + extension support)
# --------------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # restrict in prod
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --------------------------------------
# Service Clients
# --------------------------------------
blockchain_client = BlockchainClient()
etherscan_client = EtherscanClient()
graph_engine = GraphEngine()
fraud_simulator = FraudSimulator()

# --------------------------------------
# Health Check
# --------------------------------------
@app.get("/health")
async def health_check():
    return {
        "status": "ok",
        "service": "Walletwork Pre-Transaction Firewall",
        "version": "1.0.0"
    }

# --------------------------------------
# Main Analysis Endpoint
# --------------------------------------
@app.post("/analyze", response_model=AnalyzeResponse)
async def analyze_transaction(request: AnalyzeRequest):
    """
    Performs a multi-phase transaction risk analysis:

    Phase 1: Static & Scam Intelligence
    Phase 2: On-Chain Intelligence (Alchemy + Etherscan)
    Phase 3: Graph Risk Analysis
    Phase 4: Transaction Impact Simulation
    Phase 5: Final Risk Scoring
    """

    try:
        # ==================================================
        # PHASE 2 — ON-CHAIN INTELLIGENCE
        # ==================================================
        try:
            wallet_task = blockchain_client.get_tx_count(request.wallet)
            code_task = blockchain_client.get_contract_code(request.contract)
            transfers_task = blockchain_client.get_recent_transfers(request.wallet)

            tx_count, contract_code, recent_transfers = await asyncio.gather(
                wallet_task,
                code_task,
                transfers_task,
                return_exceptions=True
            )

            # Normalize failures
            tx_count = None if isinstance(tx_count, Exception) else tx_count
            contract_code = "0x" if isinstance(contract_code, Exception) else contract_code
            recent_transfers = [] if isinstance(recent_transfers, Exception) else recent_transfers

            # Contract detection
            is_contract = bool(contract_code and contract_code != "0x" and len(contract_code) > 2)

            contract_verified = None
            if is_contract:
                try:
                    contract_verified = await etherscan_client.check_contract_verified(request.contract)
                except Exception:
                    contract_verified = None  # unknown, not unverified

            onchain_data = {
                "tx_count": tx_count,
                "is_contract": is_contract,
                "contract_verified": contract_verified,
                "contract_type": "SMART_CONTRACT" if is_contract else "EOA",
                "contract_age_days": None
            }

        except Exception as e:
            print(f"[Phase 2] On-chain data error: {e}")
            onchain_data = {
                "tx_count": None,
                "is_contract": False,
                "contract_verified": None,
                "contract_type": "UNKNOWN",
                "contract_age_days": None
            }
            recent_transfers = []

        # ==================================================
        # PHASE 1 — STATIC & SCAM INTELLIGENCE
        # ==================================================
        try:
            wallet_intel = graph_engine.check_scam_intelligence(request.wallet)
            contract_intel = graph_engine.check_scam_intelligence(request.contract)

            # Contract intelligence is more critical
            scam_intel = contract_intel if contract_intel.get("scam_match") else wallet_intel

        except Exception as e:
            print(f"[Phase 1] Scam intelligence error: {e}")
            scam_intel = {
                "scam_match": False,
                "scam_category": None,
                "scam_source": None,
                "scam_confidence": None,
                "cluster_id": None
            }

        # ==================================================
        # PHASE 3 — GRAPH RISK ANALYSIS
        # ==================================================
        try:
            graph_signals = graph_engine.analyze_wallet_connections(
                request.wallet,
                recent_transfers
            )
        except Exception as e:
            print(f"[Phase 3] Graph analysis error: {e}")
            graph_signals = {
                "wallet_scam_distance": None,
                "connected_to_scam_cluster": False,
                "graph_explanation": "Graph analysis unavailable"
            }

        # ==================================================
        # PHASE 4 — TRANSACTION IMPACT SIMULATION
        # ==================================================
        try:
            is_direct_scam = scam_intel.get("scam_match", False)
            is_graph_exposed = graph_signals.get("connected_to_scam_cluster", False)

            is_unverified_contract = (
                onchain_data["is_contract"] is True and
                onchain_data["contract_verified"] is False
            )
            
            # Check if contract verification is unknown (None = couldn't verify)
            is_verification_unknown = (
                onchain_data["is_contract"] is True and
                onchain_data["contract_verified"] is None
            )

            contract_risk_score = 0

            if is_direct_scam:
                contract_risk_score = 80
                if scam_intel.get("scam_category") in ["approval_drainer", "drainer_operator"]:
                    contract_risk_score = 95

                confidence = scam_intel.get("scam_confidence")
                if confidence:
                    contract_risk_score = int(contract_risk_score * confidence)

            elif is_unverified_contract:
                # Unverified is a yellow flag, not red flag
                # Many legitimate contracts are unverified
                contract_risk_score = 35
                
            elif is_verification_unknown:
                # Couldn't check verification - slight caution
                contract_risk_score = 15

            if is_graph_exposed and not is_direct_scam:
                contract_risk_score += 30

            forecast_signals = fraud_simulator.simulate_risk(
                request.tx_type,
                contract_risk_score,
                is_direct_scam or is_graph_exposed
            )

        except Exception as e:
            print(f"[Phase 4] Simulation error: {e}")
            forecast_signals = {"drain_probability": 0.0}

        # ==================================================
        # PHASE 5 — FINAL RISK CALCULATION
        # ==================================================
        result = calculate_risk(
            wallet=request.wallet,
            contract=request.contract,
            tx_type=request.tx_type,
            onchain_data=onchain_data,
            graph_signals=graph_signals,
            forecast_signals=forecast_signals,
            scam_intel=scam_intel
        )

        return result

    except HTTPException:
        raise
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=500,
            detail=f"Analysis failed: {str(e)}"
        )

# --------------------------------------
# Local Dev Runner
# --------------------------------------
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, log_level="info")

import asyncio
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from models import AnalyzeRequest, AnalyzeResponse, RiskSignals
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

# Enable CORS for browser extension and frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, restrict to specific domains
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize service clients
try:
    blockchain_client = BlockchainClient()
    etherscan_client = EtherscanClient()
    graph_engine = GraphEngine()
    fraud_simulator = FraudSimulator()
except Exception as e:
    print(f"Warning: Failed to initialize some clients: {e}")
    print("Continuing with degraded functionality...")

@app.get("/health")
async def health_check():
    """Health check endpoint for monitoring"""
    return {
        "status": "ok",
        "service": "Walletwork Pre-Transaction Firewall",
        "version": "1.0.0"
    }

@app.post("/analyze", response_model=AnalyzeResponse)
async def analyze_transaction(request: AnalyzeRequest):
    """
    Analyze transaction risk before signing.
    
    This endpoint combines multiple data sources:
    - Alchemy: On-chain data (tx count, contract code, transfers)
    - Etherscan: Contract verification status
    - Graph Engine: Proximity to known scammers
    - Simulation: Drain probability heuristics
    
    Returns a deterministic risk assessment with human-readable explanations.
    """
    try:
        # ==========================================
        # PHASE 1: Fetch On-Chain Data
        # ==========================================
        onchain_data = {}
        
        try:
            # Fetch data concurrently for performance
            wallet_task = blockchain_client.get_tx_count(request.wallet)
            contract_code_task = blockchain_client.get_contract_code(request.contract)
            transfers_task = blockchain_client.get_recent_transfers(request.wallet)

            tx_count, contract_code, recent_transfers = await asyncio.gather(
                wallet_task, 
                contract_code_task, 
                transfers_task,
                return_exceptions=True
            )
            
            # Handle potential errors in individual fetches
            if isinstance(tx_count, Exception):
                print(f"Error fetching tx count: {tx_count}")
                tx_count = -1
            if isinstance(contract_code, Exception):
                print(f"Error fetching contract code: {contract_code}")
                contract_code = "0x"
            if isinstance(recent_transfers, Exception):
                print(f"Error fetching transfers: {recent_transfers}")
                recent_transfers = []
            
            is_contract = contract_code != "0x"
            contract_verified = None
            
            # Only check verification for actual contracts
            if is_contract:
                try:
                    contract_verified = await etherscan_client.check_contract_verified(request.contract)
                except Exception as e:
                    print(f"Error checking contract verification: {e}")
                    contract_verified = None  # Unknown status

            onchain_data = {
                "tx_count": tx_count if not isinstance(tx_count, Exception) else -1,
                "is_contract": is_contract,
                "contract_verified": contract_verified,
                "contract_type": "SMART_CONTRACT" if is_contract else "EOA",
                "contract_age_days": None  # Could be calculated from Etherscan contract creation date
            }
            
        except Exception as e:
            print(f"Error in on-chain data fetching: {e}")
            # Graceful degradation: continue with limited data
            onchain_data = {
                "tx_count": -1,
                "is_contract": False,
                "contract_verified": None,
                "contract_type": "UNKNOWN",
                "contract_age_days": None
            }

        # ==========================================
        # PHASE 2: Graph Analysis
        # ==========================================
        graph_signals = {}
        try:
            graph_signals = graph_engine.analyze_wallet_connections(
                request.wallet, 
                recent_transfers if 'recent_transfers' in locals() else []
            )
        except Exception as e:
            print(f"Error in graph analysis: {e}")
            graph_signals = {"wallet_scam_distance": -1, "connected_to_scam_cluster": False}

        # ==========================================
        # PHASE 3: Fraud Simulation
        # ==========================================
        forecast_signals = {}
        try:
            # Determine intermediate risk factors for simulation
            is_scam_linked = graph_signals.get("connected_to_scam_cluster", False)
            is_unverified = onchain_data.get("is_contract", False) and not onchain_data.get("contract_verified", False)
            
            # Base contract risk score for simulation input
            contract_risk_score = 0
            if is_unverified:
                contract_risk_score = 60
            if is_scam_linked:
                contract_risk_score += 30
                
            forecast_signals = fraud_simulator.simulate_risk(
                request.tx_type, 
                contract_risk_score, 
                is_scam_linked
            )
        except Exception as e:
            print(f"Error in simulation: {e}")
            forecast_signals = {"drain_probability": 0.0}

        # ==========================================
        # PHASE 4: Final Risk Calculation
        # ==========================================
        result = calculate_risk(
            request.wallet, 
            request.contract, 
            request.tx_type, 
            onchain_data,
            graph_signals,
            forecast_signals
        )
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Unexpected error analyzing transaction: {e}")
        import traceback
        traceback.print_exc()
        
        # Return a safe default response instead of crashing
        raise HTTPException(
            status_code=500, 
            detail=f"Analysis failed: {str(e)}. Please try again or contact support."
        )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, log_level="info")

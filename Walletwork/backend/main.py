import asyncio
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from models import AnalyzeRequest, AnalyzeResponse
from risk_engine import calculate_risk
from blockchain import BlockchainClient
from etherscan import EtherscanClient
from graph_engine import GraphEngine
from simulation import FraudSimulator

app = FastAPI(title="Web3 Transaction Risk Detector")

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for now
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize clients
blockchain_client = BlockchainClient()
etherscan_client = EtherscanClient()
graph_engine = GraphEngine()
fraud_simulator = FraudSimulator()

@app.get("/health")
async def health_check():
    return {"status": "ok"}

@app.post("/analyze", response_model=AnalyzeResponse)
async def analyze_transaction(request: AnalyzeRequest):
    try:
        # Fetch on-chain data concurrently
        wallet_task = blockchain_client.get_tx_count(request.wallet)
        contract_code_task = blockchain_client.get_contract_code(request.contract)
        transfers_task = blockchain_client.get_recent_transfers(request.wallet)

        tx_count, contract_code, recent_transfers = await asyncio.gather(wallet_task, contract_code_task, transfers_task)
        
        is_contract = contract_code != "0x"
        contract_verified = None
        
        if is_contract:
            contract_verified = await etherscan_client.check_contract_verified(request.contract)

        onchain_data = {
            "tx_count": tx_count,
            "is_contract": is_contract,
            "contract_verified": contract_verified,
            "contract_type": "SMART_CONTRACT" if is_contract else "EOA"
        }

        # --- Phase 3: Graph Analysis ---
        graph_signals = graph_engine.analyze_wallet_connections(request.wallet, recent_transfers)

        # --- Phase 3: Fraud Simulation ---
        # Heuristic: If graph says connected to scam, or unverified contract, increase risk
        is_scam_linked = graph_signals.get("connected_to_scam_cluster", False)
        # Calculate intermediate score for simulation input (simplified)
        contract_risk_score = 0
        if is_contract and not contract_verified:
            contract_risk_score = 60
        
        forecast_signals = fraud_simulator.simulate_risk(request.tx_type, contract_risk_score, is_scam_linked)

        # Final Calculation
        result = calculate_risk(
            request.wallet, 
            request.contract, 
            request.tx_type, 
            onchain_data,
            graph_signals,
            forecast_signals
        )
        return result
    except Exception as e:
        print(f"Error analyzing transaction: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

import httpx
import asyncio
import json

BASE_URL = "http://localhost:8000"

async def test_endpoint(name, payload):
    print(f"\n--- Testing: {name} ---")
    print(f"Payload: {json.dumps(payload, indent=2)}")
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(f"{BASE_URL}/analyze", json=payload)
            if response.status_code == 200:
                data = response.json()
                print("Response:")
                print(json.dumps(data, indent=2))
                
                # key checks
                signals = data.get("onchain_signals", {})
                graph = data.get("graph_signals", {})
                forecast = data.get("forecast_signals", {})
                risk = data.get("risk")
                score = data.get("score")
                
                print(f"Risk: {risk} (Score: {score})")
                print(f"Signals: {signals}")
                print(f"Graph: {graph}")
                print(f"Forecast: {forecast}")
            else:
                print(f"Error: {response.status_code}")
                print(response.text)
    except Exception as e:
        print(f"Error: {e}")

async def main():
    # 1. Fresh Wallet (Phase 2 check)
    await test_endpoint("Fresh Wallet (0 tx)", {
        "wallet": "0x1111111111111111111111111111111111111111", 
        "contract": "0xdAC17F958D2ee523a2206206994597C13D831ec7",
        "tx_type": "approve"
    })

    # 2. Scam Linked Wallet (Phase 3 Check)
    # Using a wallet from scam_db.json
    await test_endpoint("Known Scam Wallet (0 Hop)", {
        "wallet": "0xDEADDEADDEADDEADDEADDEADDEADDEADDEADDEAD",
        "contract": "0xdAC17F958D2ee523a2206206994597C13D831ec7",
        "tx_type": "send"
    })

    # 3. Simulation High Risk (Approve + Scam)
    await test_endpoint("Simulation High Risk", {
        "wallet": "0xDEADDEADDEADDEADDEADDEADDEADDEADDEADDEAD", 
        "contract": "0xdAC17F958D2ee523a2206206994597C13D831ec7",
        "tx_type": "approve" 
    })

if __name__ == "__main__":
    asyncio.run(main())

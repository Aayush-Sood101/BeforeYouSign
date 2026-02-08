import httpx
import asyncio
import json

async def check_live():
    url = "http://localhost:8000/analyze"
    payload = {
        "wallet": "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045", # Vitalik
        "contract": "0xdAC17F958D2ee523a2206206994597C13D831ec7", # USDT
        "tx_type": "send"
    }
    
    print(f"Testing Live Backend: {url}")
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.post(url, json=payload, timeout=10.0)
            print(f"Status: {resp.status_code}")
            data = resp.json()
            print(json.dumps(data, indent=2))
    except Exception as e:
        print(f"Failed: {e}")

if __name__ == "__main__":
    asyncio.run(check_live())

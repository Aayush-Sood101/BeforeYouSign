import os
import httpx
from dotenv import load_dotenv

load_dotenv()

class EtherscanClient:
    def __init__(self):
        self.api_key = os.getenv("ETHERSCAN_API_KEY")
        self.base_url = "https://api.etherscan.io/api"
        
    async def check_contract_verified(self, contract: str) -> bool:
        if not self.api_key or "YourEtherscanApiKeyHere" in self.api_key:
            print("Warning: ETHERSCAN_API_KEY not set. details unavailable.")
            return None

        params = {
            "module": "contract",
            "action": "getabi",
            "address": contract,
            "apikey": self.api_key
        }
        
        async with httpx.AsyncClient() as client:
            try:
                response = await client.get(self.base_url, params=params)
                response.raise_for_status()
                data = response.json()
                
                # Check for API Key error
                if data.get("message") == "NOTOK" and "Invalid API Key" in data.get("result", ""):
                     print("Warning: Etherscan Invalid API Key")
                     return None

                if data["status"] == "1":
                    return True
                return False
            except Exception as e:
                print(f"Etherscan check failed: {e}")
                return None

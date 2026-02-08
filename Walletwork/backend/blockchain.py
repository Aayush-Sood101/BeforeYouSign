import os
import httpx
from dotenv import load_dotenv

load_dotenv()

class BlockchainClient:
    def __init__(self):
        self.alchemy_url = os.getenv("ALCHEMY_API_KEY")
        if not self.alchemy_url:
            raise ValueError("ALCHEMY_API_KEY not found in environment variables")
        
    async def _rpc_call(self, method: str, params: list):
        async with httpx.AsyncClient() as client:
            response = await client.post(
                self.alchemy_url,
                json={"jsonrpc": "2.0", "id": 1, "method": method, "params": params}
            )
            response.raise_for_status()
            data = response.json()
            if "error" in data:
                 raise Exception(f"RPC Error: {data['error']}")
            return data["result"]

    async def get_tx_count(self, wallet: str) -> int:
        result = await self._rpc_call("eth_getTransactionCount", [wallet, "latest"])
        return int(result, 16)

    async def get_contract_code(self, contract: str) -> str:
        code = await self._rpc_call("eth_getCode", [contract, "latest"])
        return code

    async def get_recent_transfers(self, wallet: str) -> list:
        # alchemy_getAssetTransfers is an Alchemy specific method
        params = {
            "fromBlock": "0x0",
            "toBlock": "latest",
            "fromAddress": wallet,
            "category": ["external", "erc20", "erc721"],
            "maxCount": "0x5" # Hex 5
        }
        try:
             result = await self._rpc_call("alchemy_getAssetTransfers", [params])
             return result.get("transfers", [])
        except Exception:
             # Fallback or just return empty if not supported/fails
             return []

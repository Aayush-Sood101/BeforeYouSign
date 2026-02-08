import pytest
from unittest.mock import AsyncMock, patch
from fastapi.testclient import TestClient
from main import app
from risk_engine import calculate_risk

client = TestClient(app)

# Test Risk Engine Logic (Pure Logic)
def test_risk_logic_fresh_wallet():
    onchain_data = {
        "tx_count": 0,
        "is_contract": False,
        "contract_verified": None,
        "contract_type": "EOA"
    }
    # approve (+40) + zero tx (+25) = 65
    risk = calculate_risk("0xWallet", "0xContract", "approve", onchain_data)
    assert risk["score"] == 65
    assert risk["risk"] == "SUSPICIOUS"

def test_risk_logic_unverified_contract():
    onchain_data = {
        "tx_count": 10,
        "is_contract": True,
        "contract_verified": False,
        "contract_type": "SMART_CONTRACT"
    }
    # send (+15) + is_contract (+20) + unverified (+30) = 65
    risk = calculate_risk("0xWallet", "0xContract", "send", onchain_data)
    assert risk["score"] == 65
    assert "Contract source code not verified on Etherscan" in risk["reasons"]

# Test Integration with API (Mocking External Calls)
@patch("main.blockchain_client.get_tx_count", new_callable=AsyncMock)
@patch("main.blockchain_client.get_contract_code", new_callable=AsyncMock)
@patch("main.etherscan_client.check_contract_verified", new_callable=AsyncMock)
def test_analyze_endpoint_integration(mock_check_verified, mock_get_code, mock_get_tx_count):
    # Setup mocks
    mock_get_tx_count.return_value = 5
    mock_get_code.return_value = "0x6080..." # Contract
    mock_check_verified.return_value = True # Verified
    
    payload = {
        "wallet": "0x1234567890123456789012345678901234567890",
        "contract": "0x0987654321098765432109876543210987654321",
        "tx_type": "swap"
    }
    
    response = client.post("/analyze", json=payload)
    assert response.status_code == 200
    data = response.json()
    
    # Check if mocks were called
    mock_get_tx_count.assert_called_once()
    mock_get_code.assert_called_once()
    mock_check_verified.assert_called_once()
    
    # Check response structure
    assert "onchain_signals" in data
    assert data["onchain_signals"]["tx_count"] == 5
    assert data["onchain_signals"]["is_contract"] is True
    assert data["onchain_signals"]["contract_verified"] is True

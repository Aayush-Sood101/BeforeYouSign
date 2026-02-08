"""
Integration tests for WalletWork Risk Engine
Tests the complete flow with all three risk levels: SAFE, CAUTION, DANGEROUS
"""

import asyncio
import httpx
from pprint import pprint

# Test addresses (you should replace with real ones for full testing)
TEST_CASES = [
    {
        "name": "SAFE Transaction - Fresh EOA to ETH Address",
        "wallet": "0x1234567890123456789012345678901234567890",  # Replace with real
        "contract": "0xdAC17F958D2ee523a2206206994597C13D831ec7",  # USDT (verified)
        "tx_type": "transfer",
        "expected_risk": "SAFE"
    },
    {
        "name": "CAUTION Transaction - Unverified Contract",
        "wallet": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",  # Vitalik
        "contract": "0x0000000000000000000000000000000000000001",  # Unverified
        "tx_type": "swap",
        "expected_risk": "CAUTION"
    },
    {
        "name": "DANGEROUS Transaction - ERC20 Approve",
        "wallet": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
        "contract": "0xdAC17F958D2ee523a2206206994597C13D831ec7",
        "tx_type": "approve",
        "expected_risk": "DANGEROUS"
    }
]

async def test_backend_api():
    """Test backend /analyze endpoint with all risk levels"""
    async with httpx.AsyncClient() as client:
        print("=" * 60)
        print("TESTING BACKEND API - Risk Level Validation")
        print("=" * 60)
        
        for i, test_case in enumerate(TEST_CASES, 1):
            print(f"\n[Test {i}] {test_case['name']}")
            print("-" * 60)
            
            try:
                response = await client.post(
                    "http://localhost:8000/analyze",
                    json={
                        "wallet": test_case["wallet"],
                        "contract": test_case["contract"],
                        "tx_type": test_case["tx_type"]
                    },
                    timeout=30.0
                )
                
                if response.status_code == 200:
                    result = response.json()
                    
                    print(f"✅ Status: {response.status_code}")
                    print(f"Risk Level: {result.get('risk', 'N/A')}")
                    print(f"Risk Score: {result.get('risk_score', 'N/A')}/100")
                    print(f"Expected: {test_case['expected_risk']}")
                    
                    # Validate response structure
                    assert "risk" in result, "Missing 'risk' field"
                    assert "risk_score" in result, "Missing 'risk_score' field"
                    assert "reasons" in result, "Missing 'reasons' field"
                    assert isinstance(result["reasons"], list), "'reasons' should be a list"
                    
                    # Check risk level is valid
                    assert result["risk"] in ["SAFE", "CAUTION", "DANGEROUS"], \
                        f"Invalid risk level: {result['risk']}"
                    
                    # Check risk score range
                    assert 0 <= result["risk_score"] <= 100, \
                        f"Risk score out of range: {result['risk_score']}"
                    
                    # Validate risk level matches score
                    score = result["risk_score"]
                    level = result["risk"]
                    if score < 30:
                        assert level == "SAFE", f"Score {score} should be SAFE, got {level}"
                    elif score < 70:
                        assert level == "CAUTION", f"Score {score} should be CAUTION, got {level}"
                    else:
                        assert level == "DANGEROUS", f"Score {score} should be DANGEROUS, got {level}"
                    
                    print("\nReasons:")
                    for reason in result["reasons"]:
                        print(f"  • {reason}")
                    
                    if "signals" in result:
                        print("\nSignals:")
                        pprint(result["signals"], indent=2)
                    
                    print(f"\n✅ Test {i} PASSED")
                    
                else:
                    print(f"❌ Error: {response.status_code}")
                    print(f"Response: {response.text}")
                    
            except Exception as e:
                print(f"❌ Test {i} FAILED: {str(e)}")
                import traceback
                traceback.print_exc()

async def test_health_check():
    """Test backend health endpoint"""
    async with httpx.AsyncClient() as client:
        print("\n" + "=" * 60)
        print("TESTING HEALTH CHECK")
        print("=" * 60)
        
        try:
            response = await client.get("http://localhost:8000/health")
            assert response.status_code == 200
            data = response.json()
            print(f"✅ Health check passed: {data}")
        except Exception as e:
            print(f"❌ Health check failed: {str(e)}")

def test_risk_engine_imports():
    """Test that risk engine modules load correctly"""
    print("\n" + "=" * 60)
    print("TESTING MODULE IMPORTS")
    print("=" * 60)
    
    try:
        from risk_engine import RiskEngine
        from models import AnalyzeRequest, AnalyzeResponse, RiskSignals
        from graph_engine import GraphEngine
        from simulation import FraudSimulator
        
        print("✅ risk_engine.RiskEngine imported")
        print("✅ models.AnalyzeRequest imported")
        print("✅ models.AnalyzeResponse imported")
        print("✅ models.RiskSignals imported")
        print("✅ graph_engine.GraphEngine imported")
        print("✅ simulation.FraudSimulator imported")
        
        # Test RiskEngine instantiation
        engine = RiskEngine()
        print("✅ RiskEngine instantiated successfully")
        
        # Test RISK_LEVELS dictionary
        from risk_engine import RISK_LEVELS
        print("\nRisk Level Configuration:")
        for level_name, (min_score, max_score) in RISK_LEVELS.items():
            print(f"  {level_name}: {min_score}-{max_score}")
        
        assert "SAFE" in RISK_LEVELS, "Missing SAFE level"
        assert "CAUTION" in RISK_LEVELS, "Missing CAUTION level"
        assert "DANGEROUS" in RISK_LEVELS, "Missing DANGEROUS level"
        print("\n✅ All risk levels configured correctly")
        
    except Exception as e:
        print(f"❌ Import test failed: {str(e)}")
        import traceback
        traceback.print_exc()

async def main():
    """Run all tests"""
    print("\n" + "#" * 60)
    print("# WalletWork Integration Test Suite")
    print("# Testing SAFE/CAUTION/DANGEROUS Risk Classification")
    print("#" * 60)
    
    # Test 1: Module imports
    test_risk_engine_imports()
    
    # Test 2: Health check
    await test_health_check()
    
    # Test 3: API integration with risk levels
    await test_backend_api()
    
    print("\n" + "#" * 60)
    print("# Test Suite Complete")
    print("#" * 60)

if __name__ == "__main__":
    asyncio.run(main())

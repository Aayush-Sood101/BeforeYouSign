from risk_engine import calculate_risk

def debug_scenario(name, wallet, contract, tx_type, onchain_data, graph_signals, forecast_signals):
    print(f"\n--- {name} ---")
    result = calculate_risk(wallet, contract, tx_type, onchain_data, graph_signals, forecast_signals)
    print(f"Score: {result['score']}")
    print(f"Risk: {result['risk']}")
    print("Reasons:")
    for r in result['reasons']:
        print(f" - {r}")

# Scenario 1: Safe (Vitalik -> USDT)
# Assuming Etherscan check passes (verified=True)
debug_scenario(
    "Safe Scenario (Ideal)",
    wallet="0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045",
    contract="0xdAC17F958D2ee523a2206206994597C13D831ec7",
    tx_type="send",
    onchain_data={"tx_count": 1000, "is_contract": True, "contract_verified": True},
    graph_signals={"wallet_scam_distance": -1},
    forecast_signals={"drain_probability": 0.05}
)

# Scenario 2: Safe (But Etherscan fails/Unverified)
debug_scenario(
    "Safe Scenario (Unverified Contract)",
    wallet="0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045",
    contract="0xdAC17F958D2ee523a2206206994597C13D831ec7",
    tx_type="send",
    onchain_data={"tx_count": 1000, "is_contract": True, "contract_verified": False},
    graph_signals={"wallet_scam_distance": -1},
    forecast_signals={"drain_probability": 0.05}
)

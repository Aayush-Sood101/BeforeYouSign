class FraudSimulator:
    def simulate_risk(self, tx_type: str, contract_risk_score: int, is_scam_linked: bool) -> dict:
        """
        Simulates potential future risk based on transaction type and current risk factors.
        Uses deterministic logic to estimate drain probability and attack window.
        
        Args:
            tx_type: One of 'approve', 'swap', 'send', or 'transfer'
            contract_risk_score: Current risk score (0-100)
            is_scam_linked: Whether wallet/contract is linked to known scams
            
        Returns:
            dict with drain_probability (0.0-1.0) and attack_window_blocks
        """
        drain_probability = 0.0
        attack_window = 0  # blocks

        if tx_type == "approve":
            # ERC20 approve risk is based on CONTRACT reputation, not inherent risk
            # A verified, non-scam contract should have LOW drain probability
            
            if is_scam_linked:
                # Direct scam link = very high risk
                drain_probability = 0.85
                attack_window = 10  # Immediate danger
            elif contract_risk_score >= 70:
                # High risk contract (unverified + other flags)
                drain_probability = 0.70
                attack_window = 50
            elif contract_risk_score >= 50:
                # Medium risk (unverified contract)
                drain_probability = 0.45
                attack_window = 100
            elif contract_risk_score >= 30:
                # Low-medium risk
                drain_probability = 0.25
                attack_window = 500
            else:
                # Safe contract - verified, no scam links
                drain_probability = 0.05
                attack_window = 1000  # Standard approval window

        elif tx_type == "swap":
            # Simulate honeypot check
            if is_scam_linked:
                drain_probability = 0.90
                attack_window = 1
            elif contract_risk_score > 60:
                drain_probability = 0.60
                attack_window = 5
            elif contract_risk_score > 30:
                drain_probability = 0.20
                attack_window = 50
            else:
                drain_probability = 0.03  # Low baseline for verified DEXs

        elif tx_type == "transfer" or tx_type == "send":
            # Simple ETH/token transfer
            if is_scam_linked:
                drain_probability = 0.95
                attack_window = 1
            elif contract_risk_score > 50:
                drain_probability = 0.30
                attack_window = 10
            else:
                drain_probability = 0.01
                attack_window = 0

        return {
            "drain_probability": drain_probability,
            "attack_window_blocks": attack_window
        }

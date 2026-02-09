"use client";

import React, { useState } from "react";

// ============================================
// API Response Interface - matches backend exactly
// ============================================
interface RiskSignals {
  wallet_address_valid: boolean;
  contract_address_valid: boolean;
  wallet_is_burn_address: boolean;
  contract_is_burn_address: boolean;
  is_new_wallet: boolean | null;
  wallet_tx_count: number | null;
  is_unverified_contract: boolean | null;
  contract_is_smart_contract: boolean | null;
  contract_type: string | null;
  contract_age_days: number | null;
  scam_match: boolean;
  scam_category: string | null;
  scam_source: string | null;
  scam_confidence: number | null;
  cluster_id: string | null;
  graph_hop_distance: number | null;
  graph_explanation: string | null;
  drain_probability: number;
}

interface ForecastSignals {
  drain_probability: number;
  attack_window_blocks: number;
}

interface AnalyzeResponse {
  risk: "SAFE" | "CAUTION" | "SUSPICIOUS" | "DANGEROUS";
  risk_score: number;
  score: number;
  reasons: string[];
  signals: RiskSignals;
  forecast_signals: ForecastSignals;
  timestamp: string;
}

type TxType = "send" | "approve" | "swap";

// ============================================
// HELPER COMPONENTS - Black & White Theme
// ============================================

const PhaseCard = ({ 
  phaseNumber, 
  title, 
  description, 
  status, 
  expanded, 
  onToggle, 
  children 
}: { 
  phaseNumber: number; 
  title: string; 
  description: string; 
  status: "PASS" | "WARNING" | "FAIL" | "N/A"; 
  expanded: boolean; 
  onToggle: () => void; 
  children: React.ReactNode;
}) => {
  const statusStyles = {
    PASS: 'bg-zinc-800 text-zinc-300 border-zinc-600',
    WARNING: 'bg-zinc-700 text-white border-zinc-500',
    FAIL: 'bg-white text-black border-white',
    'N/A': 'bg-zinc-900 text-zinc-500 border-zinc-700'
  };

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full px-5 py-4 flex items-center justify-between hover:bg-zinc-800/50 transition-colors"
      >
        <div className="flex items-center gap-4">
          <div className="w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center">
            <span className="text-sm font-bold text-white">{phaseNumber}</span>
          </div>
          <div className="text-left">
            <h3 className="text-sm font-bold text-white">{title}</h3>
            <p className="text-xs text-zinc-500">{description}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className={`px-3 py-1 rounded text-xs font-bold uppercase tracking-wider border ${statusStyles[status]}`}>
            {status}
          </span>
          <svg
            className={`w-4 h-4 text-zinc-400 transition-transform ${expanded ? 'rotate-180' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>
      {expanded && (
        <div className="px-5 pb-5 pt-2 border-t border-zinc-800">
          {children}
        </div>
      )}
    </div>
  );
};

const CheckItem = ({ 
  label, 
  status, 
  explanation 
}: { 
  label: string; 
  status: "PASS" | "FAIL"; 
  explanation: string;
}) => (
  <div className="flex items-start gap-3 p-3 bg-black rounded border border-zinc-800">
    <div className={`mt-0.5 w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${
      status === 'PASS' ? 'bg-zinc-800 text-zinc-400' : 'bg-white text-black'
    }`}>
      {status === 'PASS' ? (
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      ) : (
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      )}
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-sm font-semibold text-white">{label}</p>
      <p className="text-xs text-zinc-500 mt-1 leading-relaxed">{explanation}</p>
    </div>
  </div>
);

const SignalBadge = ({ 
  label, 
  severity 
}: { 
  label: string; 
  severity: "high" | "medium" | "low";
}) => {
  const styles = {
    high: 'bg-white text-black border-white',
    medium: 'bg-zinc-700 text-white border-zinc-600',
    low: 'bg-zinc-800 text-zinc-400 border-zinc-700'
  };
  return (
    <span className={`px-3 py-1 rounded text-xs font-semibold border ${styles[severity]}`}>
      {label}
    </span>
  );
};

const DetailBox = ({ 
  label, 
  value, 
  explanation, 
  icon 
}: { 
  label: string; 
  value: string; 
  explanation: string; 
  icon: React.ReactNode;
}) => (
  <div className="bg-black rounded-lg p-4 border border-zinc-800">
    <div className="flex items-start justify-between mb-2">
      <div className="flex items-center gap-2">
        <span className="text-zinc-500">{icon}</span>
        <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">{label}</span>
      </div>
      <span className="text-sm font-mono text-white">{value}</span>
    </div>
    <p className="text-xs text-zinc-500 leading-relaxed">{explanation}</p>
  </div>
);

// ============================================
// MAIN COMPONENT
// ============================================

export default function WalletAnalysis() {
  const [wallet, setWallet] = useState("");
  const [contract, setContract] = useState("");
  const [txType, setTxType] = useState<TxType>("approve");
  const [result, setResult] = useState<AnalyzeResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedPhases, setExpandedPhases] = useState({
    phase1: true,
    phase2: true,
    phase3: true,
    phase4: true
  });

  const togglePhase = (phase: keyof typeof expandedPhases) => {
    setExpandedPhases(prev => ({ ...prev, [phase]: !prev[phase] }));
  };

  // API Call - exactly like Walletwork App.jsx
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!wallet || !contract) {
      setError("Please provide both wallet and contract addresses");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch("http://localhost:8000/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wallet, contract, tx_type: txType }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log("API Response:", data); // Debug log
      setResult(data);
    } catch (err) {
      console.error("Analysis failed:", err);
      setError(err instanceof Error ? err.message : "Failed to connect to backend");
    } finally {
      setLoading(false);
    }
  };

  // Phase status calculations - exactly like Walletwork App.jsx
  const getPhase1Status = (): "PASS" | "WARNING" | "FAIL" => {
    if (!result) return "PASS";
    if (result.signals?.scam_match) return "FAIL";
    if (!result.signals?.wallet_address_valid || !result.signals?.contract_address_valid) return "FAIL";
    return "PASS";
  };

  const getPhase2Status = (): "PASS" | "WARNING" | "FAIL" | "N/A" => {
    if (!result) return "PASS";
    if (result.signals?.is_new_wallet === null || result.signals?.is_unverified_contract === null) return "N/A";
    if (result.signals?.is_new_wallet || (result.signals?.contract_is_smart_contract && result.signals?.is_unverified_contract)) return "WARNING";
    return "PASS";
  };

  const getPhase3Status = (): "PASS" | "WARNING" | "FAIL" => {
    if (!result) return "PASS";
    if (result.signals?.graph_hop_distance === 0) return "FAIL";
    if (result.signals?.graph_hop_distance === 1) return "WARNING";
    return "PASS";
  };

  const getPhase4Status = (): "PASS" | "WARNING" | "FAIL" => {
    if (!result) return "PASS";
    const drainProb = result.signals?.drain_probability ?? 0;
    if (drainProb > 0.7) return "FAIL";
    if (drainProb > 0.3) return "WARNING";
    return "PASS";
  };

  return (
    <div className="bg-black text-white min-h-screen">
      {/* Header */}
      <div className="text-center py-8 border-b border-zinc-800">
        <h1 className="text-2xl font-bold text-white mb-2">Walletwork — Transaction Security Analysis</h1>
        <p className="text-zinc-500 text-sm">Pre-transaction risk assessment powered by on-chain intelligence</p>
      </div>

      {/* Input Form */}
      <div className="p-6 border-b border-zinc-800">
        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-zinc-500 mb-2 uppercase tracking-wider font-semibold">Wallet Address</label>
              <input
                type="text"
                value={wallet}
                onChange={(e) => setWallet(e.target.value)}
                placeholder="0x..."
                className="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-lg text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-600 font-mono text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-zinc-500 mb-2 uppercase tracking-wider font-semibold">Contract Address</label>
              <input
                type="text"
                value={contract}
                onChange={(e) => setContract(e.target.value)}
                placeholder="0x..."
                className="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-lg text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-600 font-mono text-sm"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-xs text-zinc-500 mb-2 uppercase tracking-wider font-semibold">Transaction Type</label>
            <div className="flex gap-2">
              {(["approve", "swap", "send"] as TxType[]).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setTxType(type)}
                  className={`px-6 py-2 rounded-lg text-sm font-semibold transition-all border ${
                    txType === type
                      ? "bg-white text-black border-white"
                      : "bg-zinc-900 text-zinc-400 border-zinc-800 hover:border-zinc-600"
                  }`}
                >
                  {type.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !wallet || !contract}
            className="w-full py-3 bg-white text-black font-bold rounded-lg hover:bg-zinc-200 disabled:bg-zinc-800 disabled:text-zinc-600 transition-all"
          >
            {loading ? "Analyzing..." : "ANALYZE RISK"}
          </button>
        </form>
      </div>

      {/* Error Display */}
      {error && (
        <div className="max-w-4xl mx-auto p-4 m-6 bg-zinc-900 border border-white rounded-lg">
          <p className="text-white font-semibold">Error: {error}</p>
        </div>
      )}

      {/* Results */}
      {result && (
        <div className="max-w-4xl mx-auto p-6 space-y-4">
          
          {/* ═══════════════════════════════════════════════════════════════════ */}
          {/* FINAL VERDICT - Sticky Header */}
          {/* ═══════════════════════════════════════════════════════════════════ */}
          <div className={`bg-zinc-900 border-2 rounded-lg p-5 ${
            result.risk === 'SAFE' ? 'border-zinc-700' :
            result.risk === 'CAUTION' || result.risk === 'SUSPICIOUS' ? 'border-zinc-600' :
            'border-white'
          }`}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-xs text-zinc-500 uppercase tracking-wider font-semibold mb-2">Final Verdict</p>
                <div className={`inline-flex items-center px-4 py-2 rounded border-2 ${
                  result.risk === 'SAFE' ? 'bg-zinc-800 border-zinc-700 text-zinc-300' :
                  result.risk === 'CAUTION' || result.risk === 'SUSPICIOUS' ? 'bg-zinc-700 border-zinc-600 text-white' :
                  'bg-white border-white text-black'
                }`}>
                  <span className="text-xl font-bold tracking-tight">{result.risk}</span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-zinc-500 uppercase tracking-wider font-semibold mb-1">Risk Score</p>
                <p className="text-4xl font-black text-white tabular-nums">{result.score || result.risk_score || 0}</p>
                <p className="text-xs text-zinc-500">/100</p>
              </div>
            </div>
            <div className="h-2 bg-black rounded-full overflow-hidden border border-zinc-800">
              <div
                className={`h-full rounded-full transition-all duration-1000 ${
                  result.risk === 'SAFE' ? 'bg-zinc-600' :
                  result.risk === 'CAUTION' || result.risk === 'SUSPICIOUS' ? 'bg-zinc-400' :
                  'bg-white'
                }`}
                style={{ width: `${result.score || result.risk_score || 0}%` }}
              />
            </div>
          </div>

          {/* ═══════════════════════════════════════════════════════════════════ */}
          {/* PHASE 1 — STATIC VALIDATION */}
          {/* ═══════════════════════════════════════════════════════════════════ */}
          <PhaseCard
            phaseNumber={1}
            title="Static Validation"
            description="Address format and scam intelligence verification"
            status={getPhase1Status()}
            expanded={expandedPhases.phase1}
            onToggle={() => togglePhase('phase1')}
          >
            <div className="space-y-3">
              <CheckItem
                label="Wallet Address Format"
                status={result.signals?.wallet_address_valid ? "PASS" : "FAIL"}
                explanation={
                  result.signals?.wallet_address_valid
                    ? "Valid Ethereum address format (0x... 42 characters)"
                    : `Invalid format: ${!wallet.startsWith('0x') ? 'Missing 0x prefix' : wallet.length !== 42 ? `Length is ${wallet.length}, expected 42` : 'Contains invalid characters'}`
                }
              />

              <CheckItem
                label="Contract Address Format"
                status={result.signals?.contract_address_valid ? "PASS" : "FAIL"}
                explanation={
                  result.signals?.contract_address_valid
                    ? "Valid Ethereum address format (0x... 42 characters)"
                    : `Invalid format: ${!contract.startsWith('0x') ? 'Missing 0x prefix' : contract.length !== 42 ? `Length is ${contract.length}, expected 42` : 'Contains invalid characters'}`
                }
              />

              <CheckItem
                label="Burn Address Check"
                status={result.signals?.wallet_is_burn_address || result.signals?.contract_is_burn_address ? "FAIL" : "PASS"}
                explanation={
                  result.signals?.wallet_is_burn_address
                    ? "WARNING: Wallet is a burn address - funds will be permanently lost"
                    : result.signals?.contract_is_burn_address
                    ? "WARNING: Contract is a burn address - funds will be permanently lost"
                    : "Not a zero address or known burn address"
                }
              />

              {result.signals?.scam_match ? (
                <>
                  <CheckItem
                    label="Scam Intelligence Database"
                    status="FAIL"
                    explanation={`Address flagged: ${result.signals.scam_category?.replace('_', ' ').toUpperCase() || 'KNOWN SCAM'}`}
                  />
                  
                  {/* Scam Alert Box */}
                  <div className="bg-white text-black rounded-lg p-4 mt-2">
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">⚠️</span>
                      <div className="flex-1">
                        <p className="text-sm font-bold mb-2">SCAM INTELLIGENCE ALERT</p>
                        <div className="space-y-1 text-sm">
                          {result.signals.scam_category && (
                            <div><span className="font-semibold">Category:</span> {result.signals.scam_category.replace('_', ' ').toUpperCase()}</div>
                          )}
                          {result.signals.scam_source && (
                            <div><span className="font-semibold">Source:</span> {result.signals.scam_source}</div>
                          )}
                          {result.signals.scam_confidence && (
                            <div><span className="font-semibold">Confidence:</span> {Math.round(result.signals.scam_confidence * 100)}%</div>
                          )}
                          {result.signals.cluster_id && (
                            <div><span className="font-semibold">Cluster:</span> <span className="font-mono">{result.signals.cluster_id}</span></div>
                          )}
                        </div>
                        <p className="text-xs mt-2 opacity-80">
                          This address has been identified in our scam intelligence database. Do NOT interact with this address.
                        </p>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <CheckItem
                  label="Scam Intelligence Database"
                  status="PASS"
                  explanation="Address not found in known scam intelligence databases"
                />
              )}
            </div>
          </PhaseCard>

          {/* ═══════════════════════════════════════════════════════════════════ */}
          {/* PHASE 2 — ON-CHAIN INTELLIGENCE */}
          {/* ═══════════════════════════════════════════════════════════════════ */}
          <PhaseCard
            phaseNumber={2}
            title="On-Chain Intelligence"
            description="Blockchain history and contract verification"
            status={getPhase2Status()}
            expanded={expandedPhases.phase2}
            onToggle={() => togglePhase('phase2')}
          >
            {(result.signals?.is_new_wallet === null || result.signals?.is_unverified_contract === null) ? (
              <div className="bg-zinc-800 border border-zinc-700 rounded-lg p-4">
                <p className="text-sm text-zinc-400">
                  ⚠️ On-chain verification skipped due to invalid or burn address detected in Phase 1.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Signal Badges */}
                <div className="flex flex-wrap gap-2">
                  {result.signals?.is_new_wallet && (
                    <SignalBadge label="Fresh Wallet" severity="high" />
                  )}
                  {result.signals?.contract_is_smart_contract && result.signals?.is_unverified_contract && (
                    <SignalBadge label="Unverified Contract" severity="high" />
                  )}
                  {result.signals?.contract_age_days !== null && result.signals.contract_age_days < 30 && (
                    <SignalBadge label="New Contract" severity="medium" />
                  )}
                  {result.signals?.wallet_tx_count !== null && result.signals.wallet_tx_count > 5 && (
                    <SignalBadge label="Established Wallet" severity="low" />
                  )}
                </div>

                {/* Wallet Transaction History */}
                <DetailBox
                  label="Wallet Transaction History"
                  value={result.signals?.wallet_tx_count !== null ? `${result.signals.wallet_tx_count} txns` : "Unknown"}
                  icon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>}
                  explanation={
                    result.signals?.wallet_tx_count === 0
                      ? "🔍 Alchemy API: No prior transactions. ⚠️ Risk: Fresh wallets are often used by scammers to avoid traceability."
                      : result.signals?.wallet_tx_count !== null && result.signals.wallet_tx_count <= 5
                      ? `🔍 Alchemy API: ${result.signals.wallet_tx_count} transactions. ℹ️ Light activity - minimal transaction history.`
                      : result.signals?.wallet_tx_count !== null
                      ? `🔍 Alchemy API: ${result.signals.wallet_tx_count} transactions. ✓ Established wallet with significant history.`
                      : "Transaction data unavailable."
                  }
                />

                {/* Contract Verification */}
                <DetailBox
                  label="Contract Verification"
                  value={
                    result.signals?.contract_is_smart_contract === false
                      ? "EOA"
                      : result.signals?.is_unverified_contract
                      ? "Not Verified"
                      : "Verified"
                  }
                  icon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>}
                  explanation={
                    result.signals?.contract_is_smart_contract === false
                      ? "🔍 Alchemy API: This is an EOA (regular wallet), not a smart contract. Verification N/A."
                      : result.signals?.is_unverified_contract
                      ? "🔍 Etherscan API: Contract NOT verified. ⚠️ Risk: Source code hidden - cannot audit for malicious logic."
                      : "🔍 Etherscan API: Contract verified. ✓ Source code publicly auditable."
                  }
                />

                {/* Contract Age */}
                {result.signals?.contract_age_days !== null && (
                  <DetailBox
                    label="Contract Age"
                    value={`${result.signals.contract_age_days} days`}
                    icon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                    explanation={
                      result.signals.contract_age_days < 7
                        ? `🔍 Etherscan: Deployed ${result.signals.contract_age_days} days ago. ⚠️ Risk: Very new contract - extreme caution advised.`
                        : result.signals.contract_age_days < 30
                        ? `🔍 Etherscan: Deployed ${result.signals.contract_age_days} days ago. ⚠️ Recently deployed - exercise caution.`
                        : `🔍 Etherscan: Deployed ${result.signals.contract_age_days} days ago. ✓ Established contract with sufficient age.`
                    }
                  />
                )}
              </div>
            )}
          </PhaseCard>

          {/* ═══════════════════════════════════════════════════════════════════ */}
          {/* PHASE 3 — GRAPH RISK ANALYSIS */}
          {/* ═══════════════════════════════════════════════════════════════════ */}
          <PhaseCard
            phaseNumber={3}
            title="Graph Risk Analysis"
            description="Connection proximity to known scam addresses"
            status={getPhase3Status()}
            expanded={expandedPhases.phase3}
            onToggle={() => togglePhase('phase3')}
          >
            <div className="space-y-4">
              {/* Hop Distance Visual */}
              <div className="bg-black border border-zinc-800 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-semibold text-zinc-300">Hop Distance to Scam Cluster</span>
                  <span className={`text-lg font-bold ${
                    result.signals?.graph_hop_distance === 0 ? 'text-white' :
                    result.signals?.graph_hop_distance === 1 ? 'text-zinc-300' :
                    'text-zinc-500'
                  }`}>
                    {result.signals?.graph_hop_distance !== null && result.signals?.graph_hop_distance >= 0
                      ? `${result.signals.graph_hop_distance} Hop${result.signals.graph_hop_distance !== 1 ? 's' : ''}`
                      : 'No Connection'}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  {[0, 1, 2, 3].map(hop => (
                    <div
                      key={hop}
                      className={`flex-1 h-2 rounded ${
                        result.signals?.graph_hop_distance !== null && hop <= result.signals.graph_hop_distance
                          ? hop === 0 ? 'bg-white' : hop === 1 ? 'bg-zinc-400' : 'bg-zinc-600'
                          : 'bg-zinc-800'
                      }`}
                    />
                  ))}
                </div>
                <div className="flex justify-between text-xs text-zinc-600 mt-2">
                  <span>Direct</span>
                  <span>Distant</span>
                </div>
              </div>

              {/* Explanation */}
              <div className="bg-zinc-900 border border-zinc-800 rounded p-4">
                <p className="text-sm text-zinc-300 leading-relaxed">
                  {result.signals?.graph_explanation || (
                    result.signals?.graph_hop_distance === 0
                      ? "⚠️ CRITICAL: This address is directly flagged as a scam or has directly transacted with known scam addresses. Do not interact."
                      : result.signals?.graph_hop_distance === 1
                      ? "⚠️ HIGH RISK: One transaction away from a known scam cluster. Has directly interacted with flagged addresses."
                      : result.signals?.graph_hop_distance === 2
                      ? "⚠️ MODERATE: Two degrees of separation from scam addresses. Indirect exposure detected."
                      : "✓ LOW RISK: No direct or close connection to known scam addresses detected."
                  )}
                </p>
              </div>

              {/* Cluster Warning */}
              {result.signals?.cluster_id && (
                <div className="bg-zinc-800 border border-zinc-600 rounded-lg p-4">
                  <p className="text-sm font-semibold text-white mb-1">Cluster Association Detected</p>
                  <p className="text-xs text-zinc-400">
                    This address belongs to cluster: <span className="font-mono text-white">{result.signals.cluster_id}</span>.
                    Addresses in this cluster have been observed coordinating malicious activities.
                  </p>
                </div>
              )}
            </div>
          </PhaseCard>

          {/* ═══════════════════════════════════════════════════════════════════ */}
          {/* PHASE 4 — TRANSACTION IMPACT SIMULATION */}
          {/* ═══════════════════════════════════════════════════════════════════ */}
          <PhaseCard
            phaseNumber={4}
            title="Transaction Impact Simulation"
            description="Predicted outcome and drain probability"
            status={getPhase4Status()}
            expanded={expandedPhases.phase4}
            onToggle={() => togglePhase('phase4')}
          >
            <div className="space-y-4">
              {/* Transaction Type Badge */}
              <div className="flex items-center gap-3">
                <span className="text-sm text-zinc-400">Transaction Type:</span>
                <span className={`px-3 py-1 rounded text-sm font-semibold border ${
                  txType === 'approve' ? 'bg-white text-black border-white' :
                  txType === 'swap' ? 'bg-zinc-700 text-white border-zinc-600' :
                  'bg-zinc-800 text-zinc-400 border-zinc-700'
                }`}>
                  {txType.toUpperCase()}
                </span>
              </div>

              {/* Drain Probability */}
              <div className="bg-black border border-zinc-800 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-semibold text-zinc-300">Estimated Drain Probability</span>
                  <span className={`text-3xl font-bold tabular-nums ${
                    (result.signals?.drain_probability || 0) > 0.7 ? 'text-white' :
                    (result.signals?.drain_probability || 0) > 0.3 ? 'text-zinc-300' :
                    'text-zinc-500'
                  }`}>
                    {Math.round((result.signals?.drain_probability || 0) * 100)}%
                  </span>
                </div>
                <div className="h-2 bg-zinc-900 rounded-full overflow-hidden border border-zinc-800">
                  <div
                    className={`h-full rounded-full transition-all duration-1000 ${
                      (result.signals?.drain_probability || 0) > 0.7 ? 'bg-white' :
                      (result.signals?.drain_probability || 0) > 0.3 ? 'bg-zinc-400' :
                      'bg-zinc-600'
                    }`}
                    style={{ width: `${Math.round((result.signals?.drain_probability || 0) * 100)}%` }}
                  />
                </div>
              </div>

              {/* Worst-Case Outcome */}
              <div className="bg-zinc-900 border border-zinc-800 rounded p-4">
                <p className="text-xs text-zinc-500 uppercase tracking-wider font-semibold mb-2">Worst-Case Outcome</p>
                <p className="text-sm text-zinc-300 leading-relaxed">
                  {txType === 'approve' && (
                    <>⚠️ <strong>Token Approval Risk:</strong> This grants the contract permission to spend your tokens. If malicious, it can drain your entire balance at any time.</>
                  )}
                  {txType === 'swap' && (
                    <>⚠️ <strong>Swap Execution Risk:</strong> The contract could execute unfavorable rates, charge hidden fees, or fail to deliver tokens.</>
                  )}
                  {txType === 'send' && (
                    <>ℹ️ <strong>Direct Transfer Risk:</strong> Funds transfer directly to the recipient. If controlled by a scammer, funds are unrecoverable.</>
                  )}
                </p>
              </div>

              {/* Attack Window */}
              {txType === 'approve' && result.forecast_signals?.attack_window_blocks && (
                <div className="bg-black border border-zinc-800 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-zinc-400">Vulnerability Window</span>
                    <span className="text-sm font-mono text-white">{result.forecast_signals.attack_window_blocks} blocks</span>
                  </div>
                  <p className="text-xs text-zinc-600 mt-1">Time window during which the approved contract can execute a drain.</p>
                </div>
              )}
            </div>
          </PhaseCard>

          {/* ═══════════════════════════════════════════════════════════════════ */}
          {/* SECURITY RECOMMENDATION */}
          {/* ═══════════════════════════════════════════════════════════════════ */}
          <div className={`border-2 rounded-lg p-5 ${
            result.risk === 'SAFE' ? 'bg-zinc-900 border-zinc-700' :
            result.risk === 'CAUTION' || result.risk === 'SUSPICIOUS' ? 'bg-zinc-800 border-zinc-600' :
            'bg-white text-black border-white'
          }`}>
            <div className="flex items-start gap-4">
              <div className={`mt-0.5 w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                result.risk === 'SAFE' ? 'bg-zinc-800 text-zinc-400' :
                result.risk === 'CAUTION' || result.risk === 'SUSPICIOUS' ? 'bg-zinc-700 text-white' :
                'bg-black text-white'
              }`}>
                {result.risk === 'SAFE' ? (
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : result.risk === 'CAUTION' || result.risk === 'SUSPICIOUS' ? (
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                ) : (
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                )}
              </div>
              <div className="flex-1">
                <h4 className={`text-lg font-bold mb-2 ${result.risk === 'DANGEROUS' ? 'text-black' : 'text-white'}`}>
                  Security Recommendation
                </h4>
                <p className={`text-sm leading-relaxed ${result.risk === 'DANGEROUS' ? 'text-black' : 'text-zinc-300'}`}>
                  {result.risk === 'SAFE' && (
                    <>This transaction appears <strong>safe to proceed</strong>. All security checks passed with no high-risk indicators.</>
                  )}
                  {(result.risk === 'CAUTION' || result.risk === 'SUSPICIOUS') && (
                    <>This transaction has <strong>moderate risk factors</strong>. Proceed with caution. Consider a test transaction first.</>
                  )}
                  {result.risk === 'DANGEROUS' && (
                    <><strong>Do NOT sign this transaction.</strong> Critical risk factors detected. High probability of fund loss. This exhibits patterns consistent with known scams.</>
                  )}
                </p>
              </div>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}

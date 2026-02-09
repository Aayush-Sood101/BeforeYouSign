"use client";

import React, { useState } from "react";

// Complete API Response Types based on models.py and risk_engine.py
interface RiskSignals {
  // Address validation signals
  wallet_address_valid: boolean;
  contract_address_valid: boolean;
  wallet_is_burn_address: boolean;
  contract_is_burn_address: boolean;
  
  // On-chain signals
  is_new_wallet: boolean | null;
  wallet_tx_count: number | null;
  is_unverified_contract: boolean | null;
  contract_is_smart_contract: boolean | null;
  contract_type: string | null;
  contract_age_days: number | null;
  
  // Scam intelligence signals
  scam_match: boolean;
  scam_category: string | null;
  scam_source: string | null;
  scam_confidence: number | null;
  cluster_id: string | null;
  
  // Graph signals
  graph_hop_distance: number | null;
  graph_explanation: string | null;
  
  // Simulation signals
  drain_probability: number;
}

interface OnchainSignals {
  tx_count: number | null;
  is_contract: boolean;
  contract_verified: boolean | null;
  contract_type: string;
  contract_age_days: number | null;
}

interface GraphSignals {
  wallet_scam_distance: number | null;
  connected_to_scam_cluster: boolean;
  graph_explanation: string | null;
}

interface ForecastSignals {
  drain_probability: number;
}

interface ScamIntel {
  scam_match: boolean;
  scam_category: string | null;
  scam_source: string | null;
  scam_confidence: number | null;
  cluster_id: string | null;
}

interface WalletAnalysisResult {
  risk: "SAFE" | "CAUTION" | "DANGEROUS";
  risk_score: number;
  score: number;
  reasons: string[];
  signals: RiskSignals;
  onchain_signals: OnchainSignals | null;
  graph_signals: GraphSignals | null;
  forecast_signals: ForecastSignals | null;
  scam_intel?: ScamIntel | null;
  timestamp: string;
}

type TxType = "send" | "transfer" | "approve" | "swap";

export default function WalletAnalysis() {
  const [wallet, setWallet] = useState("");
  const [contract, setContract] = useState("");
  const [txType, setTxType] = useState<TxType>("send");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<WalletAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const txTypes: TxType[] = ["send", "transfer", "approve", "swap"];

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
      const response = await fetch("http://127.0.0.1:8000/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          wallet,
          contract,
          tx_type: txType,
        }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`);
      }

      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const getRiskStyles = (risk: string) => {
    switch (risk.toUpperCase()) {
      case "DANGEROUS":
        return {
          bg: "bg-white",
          border: "border-white",
          text: "text-black",
          icon: "border-black bg-black text-white",
          glow: "shadow-[0_0_60px_rgba(255,255,255,0.3)]"
        };
      case "CAUTION":
        return {
          bg: "bg-zinc-800",
          border: "border-zinc-400",
          text: "text-white",
          icon: "border-zinc-400 bg-zinc-700 text-zinc-200",
          glow: "shadow-[0_0_40px_rgba(255,255,255,0.1)]"
        };
      case "SAFE":
        return {
          bg: "bg-zinc-900",
          border: "border-zinc-600",
          text: "text-zinc-300",
          icon: "border-zinc-600 bg-zinc-800 text-zinc-400",
          glow: ""
        };
      default:
        return {
          bg: "bg-zinc-900",
          border: "border-zinc-700",
          text: "text-zinc-400",
          icon: "border-zinc-700 bg-zinc-800 text-zinc-500",
          glow: ""
        };
    }
  };

  const getRiskIcon = (risk: string) => {
    switch (risk.toUpperCase()) {
      case "DANGEROUS":
        return (
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        );
      case "CAUTION":
        return (
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case "SAFE":
        return (
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
        );
      default:
        return (
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
    }
  };

  const SignalBadge = ({ value, positive }: { value: boolean | null; positive?: boolean }) => {
    if (value === null) return <span className="text-zinc-600 text-xs font-mono">N/A</span>;
    const isPositive = positive !== undefined ? (positive ? value : !value) : value;
    return (
      <span className={`px-2 py-0.5 text-xs font-medium rounded ${
        isPositive ? "bg-zinc-800 text-zinc-300 border border-zinc-600" : "bg-white text-black"
      }`}>
        {value ? "Yes" : "No"}
      </span>
    );
  };

  const ProgressBar = ({ value, inverted = false }: { value: number; inverted?: boolean }) => {
    const percentage = Math.min(Math.max(value * 100, 0), 100);
    const isDanger = inverted ? percentage > 50 : percentage < 50;
    return (
      <div className="w-full bg-zinc-800 rounded-full h-2 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            isDanger ? "bg-white" : "bg-zinc-500"
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    );
  };

  return (
    <div className="bg-black rounded-2xl p-8 border border-zinc-800">
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-white mb-2">
          Transaction Risk Analysis
        </h2>
        <p className="text-zinc-500">
          Multi-phase security analysis powered by on-chain intelligence, scam databases, and graph analysis.
        </p>
      </div>

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-2 uppercase tracking-wider">
              Wallet Address
            </label>
            <input
              type="text"
              value={wallet}
              onChange={(e) => setWallet(e.target.value)}
              placeholder="0x..."
              className="w-full px-4 py-4 bg-zinc-900 border border-zinc-800 rounded-xl text-white placeholder-zinc-600 focus:outline-none focus:border-white transition-colors font-mono text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-2 uppercase tracking-wider">
              Contract Address
            </label>
            <input
              type="text"
              value={contract}
              onChange={(e) => setContract(e.target.value)}
              placeholder="0x..."
              className="w-full px-4 py-4 bg-zinc-900 border border-zinc-800 rounded-xl text-white placeholder-zinc-600 focus:outline-none focus:border-white transition-colors font-mono text-sm"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-400 mb-3 uppercase tracking-wider">
            Transaction Type
          </label>
          <div className="flex flex-wrap gap-3">
            {txTypes.map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setTxType(type)}
                className={`px-5 py-2.5 rounded-lg font-medium transition-all border ${
                  txType === type
                    ? "bg-white text-black border-white"
                    : "bg-transparent text-zinc-400 border-zinc-700 hover:border-zinc-500 hover:text-zinc-300"
                }`}
              >
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-4 px-6 bg-white hover:bg-zinc-200 disabled:bg-zinc-800 disabled:text-zinc-600 disabled:cursor-not-allowed text-black font-semibold rounded-xl transition-all text-lg"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-3">
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Analyzing Transaction...
            </span>
          ) : (
            "Analyze Transaction"
          )}
        </button>
      </form>

      {/* Error Display */}
      {error && (
        <div className="mt-8 p-5 bg-zinc-900 border border-zinc-700 rounded-xl">
          <div className="flex items-center gap-3 text-white">
            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* Results Display */}
      {result && (
        <div className="mt-10 space-y-8">
          {/* Risk Score Header */}
          {(() => {
            const styles = getRiskStyles(result.risk);
            return (
              <div className={`p-8 rounded-2xl border-2 ${styles.bg} ${styles.border} ${styles.glow} transition-all`}>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="flex items-center gap-5">
                    <div className={`w-16 h-16 rounded-full border-2 flex items-center justify-center ${styles.icon}`}>
                      {getRiskIcon(result.risk)}
                    </div>
                    <div>
                      <p className={`text-sm uppercase tracking-wider ${styles.text} opacity-60`}>Risk Assessment</p>
                      <p className={`text-4xl font-bold ${styles.text}`}>{result.risk}</p>
                    </div>
                  </div>
                  
                  {/* Risk Score Gauge */}
                  <div className="flex flex-col items-center">
                    <div className="relative w-32 h-16 overflow-hidden">
                      <div className="absolute inset-0">
                        <svg viewBox="0 0 100 50" className="w-full h-full">
                          <path
                            d="M 5 50 A 45 45 0 0 1 95 50"
                            fill="none"
                            stroke={result.risk === "DANGEROUS" ? "#000" : "#3f3f46"}
                            strokeWidth="8"
                            strokeLinecap="round"
                          />
                          <path
                            d="M 5 50 A 45 45 0 0 1 95 50"
                            fill="none"
                            stroke={result.risk === "DANGEROUS" ? "#fff" : result.risk === "CAUTION" ? "#a1a1aa" : "#52525b"}
                            strokeWidth="8"
                            strokeLinecap="round"
                            strokeDasharray={`${(result.risk_score / 100) * 141.37} 141.37`}
                          />
                        </svg>
                      </div>
                    </div>
                    <p className={`text-3xl font-bold ${styles.text} -mt-2`}>{result.risk_score}</p>
                    <p className={`text-xs ${styles.text} opacity-60 uppercase tracking-wider`}>Risk Score</p>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Analysis Reasons */}
          {result.reasons.length > 0 && (
            <div className="p-6 bg-zinc-900 border border-zinc-800 rounded-xl">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                Analysis Summary
              </h3>
              <ul className="space-y-3">
                {result.reasons.map((reason, idx) => (
                  <li key={idx} className="flex items-start gap-3 text-zinc-300">
                    <span className={`mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                      reason.includes("CRITICAL") ? "bg-white" : "bg-zinc-600"
                    }`} />
                    <span className={reason.includes("CRITICAL") ? "text-white font-medium" : ""}>
                      {reason}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Detailed Signals Grid */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Address Validation */}
            <div className="p-6 bg-zinc-900 border border-zinc-800 rounded-xl">
              <h3 className="text-sm font-semibold text-zinc-500 mb-4 uppercase tracking-wider flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Address Validation
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-zinc-400">Wallet Valid</span>
                  <SignalBadge value={result.signals.wallet_address_valid} positive={true} />
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-zinc-400">Contract Valid</span>
                  <SignalBadge value={result.signals.contract_address_valid} positive={true} />
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-zinc-400">Wallet is Burn Address</span>
                  <SignalBadge value={result.signals.wallet_is_burn_address} positive={false} />
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-zinc-400">Contract is Burn Address</span>
                  <SignalBadge value={result.signals.contract_is_burn_address} positive={false} />
                </div>
              </div>
            </div>

            {/* On-Chain Intelligence */}
            <div className="p-6 bg-zinc-900 border border-zinc-800 rounded-xl">
              <h3 className="text-sm font-semibold text-zinc-500 mb-4 uppercase tracking-wider flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                </svg>
                On-Chain Intelligence
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-zinc-400">TX Count</span>
                  <span className="text-white font-mono">
                    {result.signals.wallet_tx_count !== null ? result.signals.wallet_tx_count.toLocaleString() : "N/A"}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-zinc-400">New Wallet</span>
                  <SignalBadge value={result.signals.is_new_wallet} positive={false} />
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-zinc-400">Is Smart Contract</span>
                  <SignalBadge value={result.signals.contract_is_smart_contract} />
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-zinc-400">Contract Type</span>
                  <span className="text-zinc-300 text-sm font-mono">
                    {result.signals.contract_type || "N/A"}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-zinc-400">Unverified Contract</span>
                  <SignalBadge value={result.signals.is_unverified_contract} positive={false} />
                </div>
                {result.signals.contract_age_days !== null && (
                  <div className="flex justify-between items-center">
                    <span className="text-zinc-400">Contract Age</span>
                    <span className="text-zinc-300 text-sm">{result.signals.contract_age_days} days</span>
                  </div>
                )}
              </div>
            </div>

            {/* Scam Intelligence */}
            <div className="p-6 bg-zinc-900 border border-zinc-800 rounded-xl">
              <h3 className="text-sm font-semibold text-zinc-500 mb-4 uppercase tracking-wider flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                Scam Intelligence
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-zinc-400">Scam Match</span>
                  <span className={`px-3 py-1 text-xs font-semibold rounded ${
                    result.signals.scam_match 
                      ? "bg-white text-black" 
                      : "bg-zinc-800 text-zinc-400 border border-zinc-700"
                  }`}>
                    {result.signals.scam_match ? "DETECTED" : "Clear"}
                  </span>
                </div>
                {result.signals.scam_match && (
                  <>
                    {result.signals.scam_category && (
                      <div className="flex justify-between items-center">
                        <span className="text-zinc-400">Category</span>
                        <span className="text-white text-sm font-medium capitalize">
                          {result.signals.scam_category.replace(/_/g, " ")}
                        </span>
                      </div>
                    )}
                    {result.signals.scam_source && (
                      <div className="flex justify-between items-center">
                        <span className="text-zinc-400">Source</span>
                        <span className="text-zinc-300 text-sm">{result.signals.scam_source}</span>
                      </div>
                    )}
                    {result.signals.scam_confidence !== null && (
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-zinc-400">Confidence</span>
                          <span className="text-white font-mono">
                            {(result.signals.scam_confidence * 100).toFixed(0)}%
                          </span>
                        </div>
                        <ProgressBar value={result.signals.scam_confidence} inverted={true} />
                      </div>
                    )}
                    {result.signals.cluster_id && (
                      <div className="flex justify-between items-center">
                        <span className="text-zinc-400">Cluster ID</span>
                        <span className="text-zinc-300 text-xs font-mono truncate max-w-[150px]">
                          {result.signals.cluster_id}
                        </span>
                      </div>
                    )}
                  </>
                )}
                {!result.signals.scam_match && (
                  <p className="text-zinc-600 text-sm">No matches found in scam intelligence database.</p>
                )}
              </div>
            </div>

            {/* Graph Analysis */}
            <div className="p-6 bg-zinc-900 border border-zinc-800 rounded-xl">
              <h3 className="text-sm font-semibold text-zinc-500 mb-4 uppercase tracking-wider flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
                Graph Risk Analysis
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-zinc-400">Scam Distance (Hops)</span>
                  <span className={`px-3 py-1 text-sm font-mono rounded ${
                    result.signals.graph_hop_distance === null
                      ? "bg-zinc-800 text-zinc-500"
                      : result.signals.graph_hop_distance <= 1
                        ? "bg-white text-black font-semibold"
                        : result.signals.graph_hop_distance <= 3
                          ? "bg-zinc-700 text-zinc-200"
                          : "bg-zinc-800 text-zinc-400"
                  }`}>
                    {result.signals.graph_hop_distance !== null ? result.signals.graph_hop_distance : "N/A"}
                  </span>
                </div>
                {result.signals.graph_explanation && (
                  <div className="pt-2 border-t border-zinc-800">
                    <p className="text-zinc-400 text-sm">{result.signals.graph_explanation}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Drain Probability - Full Width */}
          <div className="p-6 bg-zinc-900 border border-zinc-800 rounded-xl">
            <h3 className="text-sm font-semibold text-zinc-500 mb-4 uppercase tracking-wider flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Transaction Impact Simulation
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-zinc-400 mb-1">Drain Probability</p>
                  <p className="text-zinc-600 text-xs">Likelihood of fund drain based on simulation</p>
                </div>
                <span className={`text-3xl font-bold font-mono ${
                  result.signals.drain_probability > 0.5 ? "text-white" : "text-zinc-500"
                }`}>
                  {(result.signals.drain_probability * 100).toFixed(1)}%
                </span>
              </div>
              <div className="w-full bg-zinc-800 rounded-full h-3 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${
                    result.signals.drain_probability > 0.7 
                      ? "bg-white" 
                      : result.signals.drain_probability > 0.4 
                        ? "bg-zinc-400" 
                        : "bg-zinc-600"
                  }`}
                  style={{ width: `${result.signals.drain_probability * 100}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-zinc-600">
                <span>Low Risk</span>
                <span>High Risk</span>
              </div>
            </div>
          </div>

          {/* Raw Signals Accordion (Collapsible) */}
          <details className="group">
            <summary className="cursor-pointer p-4 bg-zinc-900 border border-zinc-800 rounded-xl flex items-center justify-between hover:bg-zinc-800/50 transition-colors">
              <span className="text-zinc-400 text-sm font-medium">View Raw API Response</span>
              <svg className="w-5 h-5 text-zinc-600 transform group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </summary>
            <div className="mt-2 p-4 bg-zinc-950 border border-zinc-800 rounded-xl overflow-x-auto">
              <pre className="text-xs text-zinc-400 font-mono whitespace-pre-wrap">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          </details>

          {/* Timestamp */}
          <div className="text-center text-zinc-600 text-sm pt-4 border-t border-zinc-800">
            Analysis completed at {new Date(result.timestamp).toLocaleString()} UTC
          </div>
        </div>
      )}
    </div>
  );
}

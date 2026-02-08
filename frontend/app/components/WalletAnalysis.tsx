"use client";

import React, { useState } from "react";

interface OnchainSignals {
  tx_count: number;
  is_contract: boolean;
  contract_verified: boolean;
  contract_type: string;
}

interface GraphSignals {
  wallet_scam_distance: number;
  connected_to_scam_cluster: boolean;
}

interface ForecastSignals {
  drain_probability: number;
  attack_window_blocks: number;
}

interface WalletAnalysisResult {
  risk: string;
  reasons: string[];
  onchain_signals: OnchainSignals;
  graph_signals: GraphSignals;
  forecast_signals: ForecastSignals;
  timestamp: string;
}

type TxType = "send" | "receive" | "approve" | "swap" | "mint";

export default function WalletAnalysis() {
  const [wallet, setWallet] = useState("");
  const [contract, setContract] = useState("");
  const [txType, setTxType] = useState<TxType>("send");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<WalletAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const txTypes: TxType[] = ["send", "receive", "approve", "swap", "mint"];

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

  const getRiskColor = (risk: string) => {
    switch (risk.toUpperCase()) {
      case "HIGH-RISK":
        return "bg-red-600 text-white border-red-500";
      case "SUSPICIOUS":
        return "bg-orange-500 text-white border-orange-400";
      case "SAFE":
        return "bg-green-600 text-white border-green-500";
      default:
        return "bg-gray-600 text-white border-gray-500";
    }
  };

  const getRiskIcon = (risk: string) => {
    switch (risk.toUpperCase()) {
      case "HIGH-RISK":
        return "🚨";
      case "SUSPICIOUS":
        return "⚠️";
      case "SAFE":
        return "✅";
      default:
        return "❓";
    }
  };

  return (
    <div className="bg-zinc-900 rounded-xl p-6 border border-zinc-800">
      <h2 className="text-2xl font-bold text-white mb-4">
        Wallet & Transaction Analysis
      </h2>
      <p className="text-zinc-400 mb-6">
        Analyze wallet activity, token metadata, and transaction patterns to predict risk levels.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-2">
            Wallet Address
          </label>
          <input
            type="text"
            value={wallet}
            onChange={(e) => setWallet(e.target.value)}
            placeholder="0x..."
            className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent font-mono text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-2">
            Contract Address
          </label>
          <input
            type="text"
            value={contract}
            onChange={(e) => setContract(e.target.value)}
            placeholder="0x..."
            className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent font-mono text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-2">
            Transaction Type
          </label>
          <div className="flex flex-wrap gap-2">
            {txTypes.map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setTxType(type)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  txType === type
                    ? "bg-violet-600 text-white"
                    : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
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
          className="w-full py-3 px-6 bg-violet-600 hover:bg-violet-500 disabled:bg-zinc-700 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Analyzing...
            </span>
          ) : (
            "Analyze Transaction"
          )}
        </button>
      </form>

      {error && (
        <div className="mt-6 p-4 bg-red-900/50 border border-red-700 rounded-lg text-red-300">
          {error}
        </div>
      )}

      {result && (
        <div className="mt-8 space-y-6">
          {/* Risk Level */}
          <div className={`p-6 rounded-lg border-2 ${getRiskColor(result.risk)}`}>
            <div className="flex items-center gap-4">
              <span className="text-4xl">{getRiskIcon(result.risk)}</span>
              <div>
                <p className="text-sm opacity-80">Risk Level</p>
                <p className="text-3xl font-bold">{result.risk}</p>
              </div>
            </div>
          </div>

          {/* Reasons */}
          {result.reasons.length > 0 && (
            <div className="p-4 bg-zinc-800 rounded-lg">
              <h3 className="text-lg font-semibold text-white mb-3">Analysis Reasons</h3>
              <ul className="space-y-2">
                {result.reasons.map((reason, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-zinc-300">
                    <span className="text-violet-400 mt-1">•</span>
                    {reason}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Signals Grid */}
          <div className="grid md:grid-cols-3 gap-4">
            {/* On-chain Signals */}
            <div className="p-4 bg-zinc-800 rounded-lg">
              <h3 className="text-sm font-semibold text-zinc-400 mb-3 uppercase tracking-wide">
                On-chain Signals
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-zinc-400">TX Count</span>
                  <span className="text-white font-mono">{result.onchain_signals.tx_count.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-zinc-400">Is Contract</span>
                  <span className={result.onchain_signals.is_contract ? "text-blue-400" : "text-zinc-500"}>
                    {result.onchain_signals.is_contract ? "Yes" : "No"}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-zinc-400">Verified</span>
                  <span className={result.onchain_signals.contract_verified ? "text-green-400" : "text-red-400"}>
                    {result.onchain_signals.contract_verified ? "Yes" : "No"}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-zinc-400">Type</span>
                  <span className="text-white text-sm">{result.onchain_signals.contract_type}</span>
                </div>
              </div>
            </div>

            {/* Graph Signals */}
            <div className="p-4 bg-zinc-800 rounded-lg">
              <h3 className="text-sm font-semibold text-zinc-400 mb-3 uppercase tracking-wide">
                Graph Signals
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-zinc-400">Scam Distance</span>
                  <span className={`font-mono ${result.graph_signals.wallet_scam_distance === -1 ? "text-green-400" : "text-orange-400"}`}>
                    {result.graph_signals.wallet_scam_distance === -1 ? "N/A" : result.graph_signals.wallet_scam_distance}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-zinc-400">Scam Cluster</span>
                  <span className={result.graph_signals.connected_to_scam_cluster ? "text-red-400" : "text-green-400"}>
                    {result.graph_signals.connected_to_scam_cluster ? "Connected" : "Not Connected"}
                  </span>
                </div>
              </div>
            </div>

            {/* Forecast Signals */}
            <div className="p-4 bg-zinc-800 rounded-lg">
              <h3 className="text-sm font-semibold text-zinc-400 mb-3 uppercase tracking-wide">
                Forecast Signals
              </h3>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-zinc-400">Drain Probability</span>
                    <span className={`font-mono ${result.forecast_signals.drain_probability > 0.5 ? "text-red-400" : "text-green-400"}`}>
                      {(result.forecast_signals.drain_probability * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full bg-zinc-700 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${result.forecast_signals.drain_probability > 0.5 ? "bg-red-500" : "bg-green-500"}`}
                      style={{ width: `${result.forecast_signals.drain_probability * 100}%` }}
                    />
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-zinc-400">Attack Window</span>
                  <span className="text-white font-mono">{result.forecast_signals.attack_window_blocks} blocks</span>
                </div>
              </div>
            </div>
          </div>

          {/* Timestamp */}
          <div className="text-center text-zinc-500 text-sm">
            Analysis performed at: {new Date(result.timestamp).toLocaleString()}
          </div>
        </div>
      )}
    </div>
  );
}

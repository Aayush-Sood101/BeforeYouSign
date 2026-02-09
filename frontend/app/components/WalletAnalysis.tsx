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
// HELPER COMPONENTS - Enhanced Visual Theme
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
    PASS: 'bg-gradient-to-r from-emerald-500/20 to-emerald-600/20 text-emerald-400 border-emerald-500/50 shadow-emerald-500/20 shadow-sm',
    WARNING: 'bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-400 border-amber-500/50 shadow-amber-500/20 shadow-sm',
    FAIL: 'bg-gradient-to-r from-red-500/20 to-rose-600/20 text-red-400 border-red-500/50 shadow-red-500/20 shadow-sm',
    'N/A': 'bg-zinc-800/50 text-zinc-500 border-zinc-600/50'
  };

  const phaseColors = {
    PASS: 'from-emerald-500 to-emerald-600',
    WARNING: 'from-amber-500 to-orange-500',
    FAIL: 'from-red-500 to-rose-600',
    'N/A': 'from-zinc-600 to-zinc-700'
  };

  const borderColors = {
    PASS: 'border-emerald-500/30 hover:border-emerald-500/50',
    WARNING: 'border-amber-500/30 hover:border-amber-500/50',
    FAIL: 'border-red-500/30 hover:border-red-500/50',
    'N/A': 'border-zinc-700 hover:border-zinc-600'
  };

  return (
    <div className={`bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-800/50 border rounded-xl overflow-hidden backdrop-blur-sm transition-all duration-300 ${borderColors[status]}`}>
      <button
        onClick={onToggle}
        className="w-full px-6 py-5 flex items-center justify-between hover:bg-white/[0.02] transition-all duration-200"
      >
        <div className="flex items-center gap-4">
          <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${phaseColors[status]} flex items-center justify-center shadow-lg`}>
            <span className="text-sm font-bold text-white drop-shadow-sm">{phaseNumber}</span>
          </div>
          <div className="text-left">
            <h3 className="text-base font-bold text-white">{title}</h3>
            <p className="text-sm text-zinc-400">{description}</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span className={`px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider border backdrop-blur-sm ${statusStyles[status]}`}>
            {status}
          </span>
          <div className={`w-8 h-8 rounded-lg bg-zinc-800/50 flex items-center justify-center transition-transform duration-300 ${expanded ? 'rotate-180' : ''}`}>
            <svg
              className="w-4 h-4 text-zinc-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </button>
      <div className={`overflow-hidden transition-all duration-300 ease-in-out ${expanded ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'}`}>
        <div className="px-6 pb-6 pt-2 border-t border-zinc-800/50">
          {children}
        </div>
      </div>
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
  <div className={`flex items-start gap-4 p-4 rounded-xl border transition-all duration-200 ${
    status === 'PASS' 
      ? 'bg-gradient-to-r from-emerald-500/5 to-emerald-600/5 border-emerald-500/20 hover:border-emerald-500/40' 
      : 'bg-gradient-to-r from-red-500/5 to-rose-600/5 border-red-500/20 hover:border-red-500/40'
  }`}>
    <div className={`mt-0.5 w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 shadow-lg ${
      status === 'PASS' 
        ? 'bg-gradient-to-br from-emerald-500 to-emerald-600 text-white' 
        : 'bg-gradient-to-br from-red-500 to-rose-600 text-white'
    }`}>
      {status === 'PASS' ? (
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      ) : (
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      )}
    </div>
    <div className="flex-1 min-w-0">
      <p className={`text-sm font-semibold ${status === 'PASS' ? 'text-emerald-300' : 'text-red-300'}`}>{label}</p>
      <p className="text-sm text-zinc-400 mt-1.5 leading-relaxed">{explanation}</p>
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
    high: 'bg-gradient-to-r from-red-500/20 to-rose-600/20 text-red-400 border-red-500/40 shadow-red-500/10 shadow-sm',
    medium: 'bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-400 border-amber-500/40 shadow-amber-500/10 shadow-sm',
    low: 'bg-gradient-to-r from-emerald-500/20 to-emerald-600/20 text-emerald-400 border-emerald-500/40 shadow-emerald-500/10 shadow-sm'
  };
  return (
    <span className={`px-3 py-1.5 rounded-lg text-xs font-semibold border backdrop-blur-sm ${styles[severity]}`}>
      {label}
    </span>
  );
};

const DetailBox = ({ 
  label, 
  value, 
  explanation, 
  icon,
  status = "neutral"
}: { 
  label: string; 
  value: string; 
  explanation: string; 
  icon: React.ReactNode;
  status?: "good" | "warning" | "bad" | "neutral";
}) => {
  const statusStyles = {
    good: 'border-emerald-500/20 bg-gradient-to-br from-emerald-500/5 to-transparent',
    warning: 'border-amber-500/20 bg-gradient-to-br from-amber-500/5 to-transparent',
    bad: 'border-red-500/20 bg-gradient-to-br from-red-500/5 to-transparent',
    neutral: 'border-zinc-700/50 bg-zinc-800/30'
  };
  const valueColors = {
    good: 'text-emerald-400',
    warning: 'text-amber-400',
    bad: 'text-red-400',
    neutral: 'text-white'
  };
  return (
    <div className={`rounded-xl p-4 border backdrop-blur-sm transition-all duration-200 hover:scale-[1.01] ${statusStyles[status]}`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-zinc-400">{icon}</span>
          <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">{label}</span>
        </div>
        <span className={`text-sm font-mono font-bold ${valueColors[status]}`}>{value}</span>
      </div>
      <p className="text-sm text-zinc-400 leading-relaxed">{explanation}</p>
    </div>
  );
};

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
    <div className="bg-gradient-to-b from-zinc-950 via-black to-zinc-950 text-white min-h-screen">
      {/* Animated Background Decoration */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-red-500/5 rounded-full blur-3xl"></div>
      </div>

      {/* Header */}
      <div className="relative text-center py-12 border-b border-zinc-800/50">
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 via-transparent to-red-500/5"></div>
        <div className="relative">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-zinc-800/50 rounded-full border border-zinc-700/50 mb-4">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
            <span className="text-xs font-medium text-zinc-400">Live Analysis</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent mb-3">
            Transaction Security Analysis
          </h1>
          <p className="text-zinc-400 text-sm max-w-md mx-auto">Pre-transaction risk assessment powered by on-chain intelligence</p>
        </div>
      </div>

      {/* Input Form */}
      <div className="relative p-8 border-b border-zinc-800/50">
        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="group">
              <label className="block text-xs text-zinc-400 mb-3 uppercase tracking-wider font-semibold">
                <span className="inline-flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  Wallet Address
                </span>
              </label>
              <input
                type="text"
                value={wallet}
                onChange={(e) => setWallet(e.target.value)}
                placeholder="0x..."
                className="w-full px-5 py-4 bg-zinc-900/50 border border-zinc-700/50 rounded-xl text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20 font-mono text-sm transition-all duration-200 backdrop-blur-sm"
              />
            </div>
            <div className="group">
              <label className="block text-xs text-zinc-400 mb-3 uppercase tracking-wider font-semibold">
                <span className="inline-flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Contract Address
                </span>
              </label>
              <input
                type="text"
                value={contract}
                onChange={(e) => setContract(e.target.value)}
                placeholder="0x..."
                className="w-full px-5 py-4 bg-zinc-900/50 border border-zinc-700/50 rounded-xl text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20 font-mono text-sm transition-all duration-200 backdrop-blur-sm"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-xs text-zinc-400 mb-3 uppercase tracking-wider font-semibold">Transaction Type</label>
            <div className="flex gap-3 flex-wrap">
              {(["approve", "swap", "send"] as TxType[]).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setTxType(type)}
                  className={`px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-200 border ${
                    txType === type
                      ? "bg-gradient-to-r from-emerald-500 to-emerald-600 text-white border-emerald-500 shadow-lg shadow-emerald-500/25"
                      : "bg-zinc-900/50 text-zinc-400 border-zinc-700/50 hover:border-zinc-600 hover:text-zinc-300"
                  }`}
                >
                  {type === 'approve' && '🔐 '}
                  {type === 'swap' && '🔄 '}
                  {type === 'send' && '📤 '}
                  {type.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !wallet || !contract}
            className="w-full py-4 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-bold rounded-xl hover:from-emerald-600 hover:to-emerald-700 disabled:from-zinc-800 disabled:to-zinc-700 disabled:text-zinc-500 transition-all duration-200 shadow-lg shadow-emerald-500/20 disabled:shadow-none flex items-center justify-center gap-3"
          >
            {loading ? (
              <>
                <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Analyzing Transaction...</span>
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                <span>ANALYZE RISK</span>
              </>
            )}
          </button>
        </form>
      </div>

      {/* Error Display */}
      {error && (
        <div className="max-w-4xl mx-auto p-5 m-6 bg-gradient-to-r from-red-500/10 to-rose-600/10 border border-red-500/30 rounded-xl backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-red-500/20 flex items-center justify-center">
              <svg className="w-5 h-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-red-400 font-semibold">Connection Error</p>
              <p className="text-red-400/70 text-sm">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Results */}
      {result && (
        <div className="max-w-4xl mx-auto p-6 space-y-5">
          
          {/* ═══════════════════════════════════════════════════════════════════ */}
          {/* FINAL VERDICT - Sticky Header */}
          {/* ═══════════════════════════════════════════════════════════════════ */}
          <div className={`relative overflow-hidden bg-gradient-to-br rounded-2xl p-6 border-2 shadow-2xl ${
            result.risk === 'SAFE' 
              ? 'from-emerald-500/10 via-emerald-600/5 to-zinc-900 border-emerald-500/40 shadow-emerald-500/10' 
              : result.risk === 'CAUTION' || result.risk === 'SUSPICIOUS' 
              ? 'from-amber-500/10 via-orange-600/5 to-zinc-900 border-amber-500/40 shadow-amber-500/10' 
              : 'from-red-500/10 via-rose-600/5 to-zinc-900 border-red-500/40 shadow-red-500/10'
          }`}>
            {/* Background Glow Effect */}
            <div className={`absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl opacity-20 ${
              result.risk === 'SAFE' ? 'bg-emerald-500' :
              result.risk === 'CAUTION' || result.risk === 'SUSPICIOUS' ? 'bg-amber-500' :
              'bg-red-500'
            }`}></div>
            
            <div className="relative flex items-center justify-between mb-5">
              <div>
                <p className="text-xs text-zinc-400 uppercase tracking-wider font-semibold mb-3">Final Verdict</p>
                <div className={`inline-flex items-center gap-3 px-5 py-3 rounded-xl border-2 shadow-lg ${
                  result.risk === 'SAFE' 
                    ? 'bg-emerald-500/20 border-emerald-500/50 shadow-emerald-500/20' 
                    : result.risk === 'CAUTION' || result.risk === 'SUSPICIOUS' 
                    ? 'bg-amber-500/20 border-amber-500/50 shadow-amber-500/20' 
                    : 'bg-red-500/20 border-red-500/50 shadow-red-500/20'
                }`}>
                  {result.risk === 'SAFE' && (
                    <svg className="w-6 h-6 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  )}
                  {(result.risk === 'CAUTION' || result.risk === 'SUSPICIOUS') && (
                    <svg className="w-6 h-6 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  )}
                  {result.risk === 'DANGEROUS' && (
                    <svg className="w-6 h-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  )}
                  <span className={`text-2xl font-black tracking-tight ${
                    result.risk === 'SAFE' ? 'text-emerald-400' :
                    result.risk === 'CAUTION' || result.risk === 'SUSPICIOUS' ? 'text-amber-400' :
                    'text-red-400'
                  }`}>{result.risk}</span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-zinc-400 uppercase tracking-wider font-semibold mb-2">Risk Score</p>
                <div className={`text-5xl font-black tabular-nums ${
                  result.risk === 'SAFE' ? 'text-emerald-400' :
                  result.risk === 'CAUTION' || result.risk === 'SUSPICIOUS' ? 'text-amber-400' :
                  'text-red-400'
                }`}>
                  {result.score || result.risk_score || 0}
                </div>
                <p className="text-xs text-zinc-500 mt-1">/100</p>
              </div>
            </div>
            <div className="relative h-3 bg-zinc-800/50 rounded-full overflow-hidden border border-zinc-700/50">
              <div
                className={`h-full rounded-full transition-all duration-1000 ease-out ${
                  result.risk === 'SAFE' ? 'bg-gradient-to-r from-emerald-500 to-emerald-400' :
                  result.risk === 'CAUTION' || result.risk === 'SUSPICIOUS' ? 'bg-gradient-to-r from-amber-500 to-orange-400' :
                  'bg-gradient-to-r from-red-500 to-rose-400'
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
                  <div className="bg-gradient-to-r from-red-500/20 via-rose-500/15 to-red-600/20 border border-red-500/40 rounded-xl p-5 mt-3 backdrop-blur-sm">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center shadow-lg shadow-red-500/30">
                        <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <p className="text-lg font-bold text-red-400 mb-3">SCAM INTELLIGENCE ALERT</p>
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          {result.signals.scam_category && (
                            <div className="bg-black/30 rounded-lg p-3 border border-red-500/20">
                              <span className="text-zinc-400 text-xs uppercase tracking-wider">Category</span>
                              <p className="text-red-300 font-semibold mt-1">{result.signals.scam_category.replace('_', ' ').toUpperCase()}</p>
                            </div>
                          )}
                          {result.signals.scam_source && (
                            <div className="bg-black/30 rounded-lg p-3 border border-red-500/20">
                              <span className="text-zinc-400 text-xs uppercase tracking-wider">Source</span>
                              <p className="text-red-300 font-semibold mt-1">{result.signals.scam_source}</p>
                            </div>
                          )}
                          {result.signals.scam_confidence && (
                            <div className="bg-black/30 rounded-lg p-3 border border-red-500/20">
                              <span className="text-zinc-400 text-xs uppercase tracking-wider">Confidence</span>
                              <p className="text-red-300 font-semibold mt-1">{Math.round(result.signals.scam_confidence * 100)}%</p>
                            </div>
                          )}
                          {result.signals.cluster_id && (
                            <div className="bg-black/30 rounded-lg p-3 border border-red-500/20">
                              <span className="text-zinc-400 text-xs uppercase tracking-wider">Cluster</span>
                              <p className="text-red-300 font-mono font-semibold mt-1 text-xs">{result.signals.cluster_id}</p>
                            </div>
                          )}
                        </div>
                        <p className="text-sm text-red-300/70 mt-4 leading-relaxed">
                          ⚠️ This address has been identified in our scam intelligence database. Do NOT interact with this address.
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
              <div className="bg-zinc-800/30 border border-amber-500/30 rounded-xl p-4 backdrop-blur-sm">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
                    <svg className="w-5 h-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <p className="text-sm text-amber-300/80">
                    On-chain verification skipped due to invalid or burn address detected in Phase 1.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Signal Badges */}
                <div className="flex flex-wrap gap-2">
                  {result.signals?.is_new_wallet && (
                    <SignalBadge label="🆕 Fresh Wallet" severity="high" />
                  )}
                  {result.signals?.contract_is_smart_contract && result.signals?.is_unverified_contract && (
                    <SignalBadge label="❓ Unverified Contract" severity="high" />
                  )}
                  {result.signals?.contract_age_days !== null && result.signals.contract_age_days < 30 && (
                    <SignalBadge label="📅 New Contract" severity="medium" />
                  )}
                  {result.signals?.wallet_tx_count !== null && result.signals.wallet_tx_count > 5 && (
                    <SignalBadge label="✓ Established Wallet" severity="low" />
                  )}
                </div>

                {/* Wallet Transaction History */}
                <DetailBox
                  label="Wallet Transaction History"
                  value={result.signals?.wallet_tx_count !== null ? `${result.signals.wallet_tx_count} txns` : "Unknown"}
                  icon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>}
                  status={
                    result.signals?.wallet_tx_count === 0 ? "bad" :
                    result.signals?.wallet_tx_count !== null && result.signals.wallet_tx_count <= 5 ? "warning" :
                    result.signals?.wallet_tx_count !== null ? "good" : "neutral"
                  }
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
                  status={
                    result.signals?.contract_is_smart_contract === false ? "neutral" :
                    result.signals?.is_unverified_contract ? "bad" : "good"
                  }
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
                    status={
                      result.signals.contract_age_days < 7 ? "bad" :
                      result.signals.contract_age_days < 30 ? "warning" : "good"
                    }
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
              <div className={`rounded-xl p-5 border backdrop-blur-sm ${
                result.signals?.graph_hop_distance === 0 
                  ? 'bg-gradient-to-br from-red-500/10 to-transparent border-red-500/30' 
                  : result.signals?.graph_hop_distance === 1 
                  ? 'bg-gradient-to-br from-amber-500/10 to-transparent border-amber-500/30' 
                  : 'bg-gradient-to-br from-emerald-500/10 to-transparent border-emerald-500/30'
              }`}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      result.signals?.graph_hop_distance === 0 
                        ? 'bg-red-500/20' 
                        : result.signals?.graph_hop_distance === 1 
                        ? 'bg-amber-500/20' 
                        : 'bg-emerald-500/20'
                    }`}>
                      <svg className={`w-5 h-5 ${
                        result.signals?.graph_hop_distance === 0 
                          ? 'text-red-400' 
                          : result.signals?.graph_hop_distance === 1 
                          ? 'text-amber-400' 
                          : 'text-emerald-400'
                      }`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                      </svg>
                    </div>
                    <span className="text-sm font-semibold text-zinc-300">Hop Distance to Scam Cluster</span>
                  </div>
                  <span className={`text-2xl font-bold ${
                    result.signals?.graph_hop_distance === 0 ? 'text-red-400' :
                    result.signals?.graph_hop_distance === 1 ? 'text-amber-400' :
                    'text-emerald-400'
                  }`}>
                    {result.signals?.graph_hop_distance !== null && result.signals?.graph_hop_distance >= 0
                      ? `${result.signals.graph_hop_distance} Hop${result.signals.graph_hop_distance !== 1 ? 's' : ''}`
                      : 'No Connection'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {[0, 1, 2, 3].map(hop => (
                    <div
                      key={hop}
                      className={`flex-1 h-3 rounded-full transition-all duration-500 ${
                        result.signals?.graph_hop_distance !== null && hop <= result.signals.graph_hop_distance
                          ? hop === 0 ? 'bg-gradient-to-r from-red-500 to-red-400 shadow-lg shadow-red-500/30' 
                            : hop === 1 ? 'bg-gradient-to-r from-amber-500 to-orange-400 shadow-lg shadow-amber-500/30' 
                            : 'bg-gradient-to-r from-emerald-500 to-emerald-400 shadow-lg shadow-emerald-500/30'
                          : 'bg-zinc-800/50'
                      }`}
                    />
                  ))}
                </div>
                <div className="flex justify-between text-xs text-zinc-500 mt-2">
                  <span className="text-red-400/70">Direct</span>
                  <span className="text-emerald-400/70">Distant</span>
                </div>
              </div>

              {/* Explanation */}
              <div className={`rounded-xl p-4 border ${
                result.signals?.graph_hop_distance === 0 
                  ? 'bg-red-500/5 border-red-500/20' 
                  : result.signals?.graph_hop_distance === 1 
                  ? 'bg-amber-500/5 border-amber-500/20' 
                  : 'bg-emerald-500/5 border-emerald-500/20'
              }`}>
                <p className={`text-sm leading-relaxed ${
                  result.signals?.graph_hop_distance === 0 
                    ? 'text-red-300' 
                    : result.signals?.graph_hop_distance === 1 
                    ? 'text-amber-300' 
                    : 'text-emerald-300'
                }`}>
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
                <div className="bg-gradient-to-r from-red-500/10 to-rose-600/10 border border-red-500/30 rounded-xl p-4 backdrop-blur-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-red-500/20 flex items-center justify-center">
                      <svg className="w-4 h-4 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-red-300">Cluster Association Detected</p>
                      <p className="text-xs text-zinc-400 mt-1">
                        Address belongs to cluster: <span className="font-mono text-red-400">{result.signals.cluster_id}</span>
                      </p>
                    </div>
                  </div>
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
                <span className={`px-4 py-2 rounded-xl text-sm font-semibold border shadow-lg ${
                  txType === 'approve' 
                    ? 'bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-400 border-amber-500/40 shadow-amber-500/10' 
                    : txType === 'swap' 
                    ? 'bg-gradient-to-r from-blue-500/20 to-cyan-500/20 text-blue-400 border-blue-500/40 shadow-blue-500/10' 
                    : 'bg-gradient-to-r from-emerald-500/20 to-green-500/20 text-emerald-400 border-emerald-500/40 shadow-emerald-500/10'
                }`}>
                  {txType === 'approve' && '🔐 '}
                  {txType === 'swap' && '🔄 '}
                  {txType === 'send' && '📤 '}
                  {txType.toUpperCase()}
                </span>
              </div>

              {/* Drain Probability */}
              <div className={`rounded-xl p-5 border backdrop-blur-sm ${
                (result.signals?.drain_probability || 0) > 0.7 
                  ? 'bg-gradient-to-br from-red-500/10 to-transparent border-red-500/30' 
                  : (result.signals?.drain_probability || 0) > 0.3 
                  ? 'bg-gradient-to-br from-amber-500/10 to-transparent border-amber-500/30' 
                  : 'bg-gradient-to-br from-emerald-500/10 to-transparent border-emerald-500/30'
              }`}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      (result.signals?.drain_probability || 0) > 0.7 
                        ? 'bg-red-500/20' 
                        : (result.signals?.drain_probability || 0) > 0.3 
                        ? 'bg-amber-500/20' 
                        : 'bg-emerald-500/20'
                    }`}>
                      <svg className={`w-5 h-5 ${
                        (result.signals?.drain_probability || 0) > 0.7 
                          ? 'text-red-400' 
                          : (result.signals?.drain_probability || 0) > 0.3 
                          ? 'text-amber-400' 
                          : 'text-emerald-400'
                      }`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </div>
                    <span className="text-sm font-semibold text-zinc-300">Estimated Drain Probability</span>
                  </div>
                  <span className={`text-4xl font-black tabular-nums ${
                    (result.signals?.drain_probability || 0) > 0.7 ? 'text-red-400' :
                    (result.signals?.drain_probability || 0) > 0.3 ? 'text-amber-400' :
                    'text-emerald-400'
                  }`}>
                    {Math.round((result.signals?.drain_probability || 0) * 100)}%
                  </span>
                </div>
                <div className="h-3 bg-zinc-800/50 rounded-full overflow-hidden border border-zinc-700/50">
                  <div
                    className={`h-full rounded-full transition-all duration-1000 ease-out ${
                      (result.signals?.drain_probability || 0) > 0.7 ? 'bg-gradient-to-r from-red-500 to-rose-400' :
                      (result.signals?.drain_probability || 0) > 0.3 ? 'bg-gradient-to-r from-amber-500 to-orange-400' :
                      'bg-gradient-to-r from-emerald-500 to-emerald-400'
                    }`}
                    style={{ width: `${Math.round((result.signals?.drain_probability || 0) * 100)}%` }}
                  />
                </div>
              </div>

              {/* Worst-Case Outcome */}
              <div className={`rounded-xl p-4 border ${
                txType === 'approve' 
                  ? 'bg-amber-500/5 border-amber-500/20' 
                  : txType === 'swap' 
                  ? 'bg-blue-500/5 border-blue-500/20' 
                  : 'bg-emerald-500/5 border-emerald-500/20'
              }`}>
                <p className="text-xs text-zinc-400 uppercase tracking-wider font-semibold mb-3">Worst-Case Outcome</p>
                <p className={`text-sm leading-relaxed ${
                  txType === 'approve' ? 'text-amber-300' :
                  txType === 'swap' ? 'text-blue-300' :
                  'text-emerald-300'
                }`}>
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
                <div className="bg-zinc-800/30 border border-amber-500/30 rounded-xl p-4 backdrop-blur-sm">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-sm text-zinc-400">Vulnerability Window</span>
                    </div>
                    <span className="text-sm font-mono text-amber-400 font-bold">{result.forecast_signals.attack_window_blocks} blocks</span>
                  </div>
                  <p className="text-xs text-zinc-500 mt-2">Time window during which the approved contract can execute a drain.</p>
                </div>
              )}
            </div>
          </PhaseCard>

          {/* ═══════════════════════════════════════════════════════════════════ */}
          {/* SECURITY RECOMMENDATION */}
          {/* ═══════════════════════════════════════════════════════════════════ */}
          <div className={`relative overflow-hidden rounded-2xl p-6 border-2 shadow-2xl ${
            result.risk === 'SAFE' 
              ? 'bg-gradient-to-br from-emerald-500/10 via-emerald-600/5 to-zinc-900 border-emerald-500/40 shadow-emerald-500/10' 
              : result.risk === 'CAUTION' || result.risk === 'SUSPICIOUS' 
              ? 'bg-gradient-to-br from-amber-500/10 via-orange-600/5 to-zinc-900 border-amber-500/40 shadow-amber-500/10' 
              : 'bg-gradient-to-br from-red-500/10 via-rose-600/5 to-zinc-900 border-red-500/40 shadow-red-500/10'
          }`}>
            {/* Background Glow Effect */}
            <div className={`absolute top-0 left-0 w-48 h-48 rounded-full blur-3xl opacity-20 ${
              result.risk === 'SAFE' ? 'bg-emerald-500' :
              result.risk === 'CAUTION' || result.risk === 'SUSPICIOUS' ? 'bg-amber-500' :
              'bg-red-500'
            }`}></div>
            
            <div className="relative flex items-start gap-5">
              <div className={`mt-0.5 w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-xl ${
                result.risk === 'SAFE' 
                  ? 'bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-emerald-500/30' 
                  : result.risk === 'CAUTION' || result.risk === 'SUSPICIOUS' 
                  ? 'bg-gradient-to-br from-amber-500 to-orange-500 shadow-amber-500/30' 
                  : 'bg-gradient-to-br from-red-500 to-rose-600 shadow-red-500/30'
              }`}>
                {result.risk === 'SAFE' ? (
                  <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : result.risk === 'CAUTION' || result.risk === 'SUSPICIOUS' ? (
                  <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                ) : (
                  <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                )}
              </div>
              <div className="flex-1">
                <h4 className={`text-xl font-bold mb-3 ${
                  result.risk === 'SAFE' ? 'text-emerald-400' :
                  result.risk === 'CAUTION' || result.risk === 'SUSPICIOUS' ? 'text-amber-400' :
                  'text-red-400'
                }`}>
                  Security Recommendation
                </h4>
                <p className="text-base leading-relaxed text-zinc-300">
                  {result.risk === 'SAFE' && (
                    <>This transaction appears <strong className="text-emerald-400">safe to proceed</strong>. All security checks passed with no high-risk indicators.</>
                  )}
                  {(result.risk === 'CAUTION' || result.risk === 'SUSPICIOUS') && (
                    <>This transaction has <strong className="text-amber-400">moderate risk factors</strong>. Proceed with caution. Consider a test transaction first.</>
                  )}
                  {result.risk === 'DANGEROUS' && (
                    <><strong className="text-red-400">Do NOT sign this transaction.</strong> Critical risk factors detected. High probability of fund loss. This exhibits patterns consistent with known scams.</>
                  )}
                </p>
                
                {/* Action Buttons */}
                <div className="flex flex-wrap gap-3 mt-5">
                  {result.risk === 'SAFE' && (
                    <button className="px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-semibold rounded-xl shadow-lg shadow-emerald-500/25 hover:from-emerald-600 hover:to-emerald-700 transition-all duration-200 text-sm">
                      ✓ Proceed with Transaction
                    </button>
                  )}
                  {(result.risk === 'CAUTION' || result.risk === 'SUSPICIOUS') && (
                    <>
                      <button className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold rounded-xl shadow-lg shadow-amber-500/25 hover:from-amber-600 hover:to-orange-600 transition-all duration-200 text-sm">
                        ⚠️ Proceed with Caution
                      </button>
                      <button className="px-5 py-2.5 bg-zinc-800 text-zinc-300 font-semibold rounded-xl border border-zinc-700 hover:bg-zinc-700 transition-all duration-200 text-sm">
                        Review Again
                      </button>
                    </>
                  )}
                  {result.risk === 'DANGEROUS' && (
                    <button className="px-5 py-2.5 bg-gradient-to-r from-red-500 to-rose-600 text-white font-semibold rounded-xl shadow-lg shadow-red-500/25 hover:from-red-600 hover:to-rose-700 transition-all duration-200 text-sm">
                      ✕ Reject Transaction
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

        </div>
      )}
      
      {/* Footer */}
      <div className="text-center py-8 border-t border-zinc-800/50 mt-8">
        <p className="text-zinc-600 text-xs">Protected by Walletwork Security Engine</p>
      </div>
    </div>
  );
}

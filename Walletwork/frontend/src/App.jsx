import { useState } from "react";
import { analyzeTx } from "./api";

// ============================================
// HELPER COMPONENTS
// ============================================

const PhaseCard = ({ phaseNumber, title, description, status, expanded, onToggle, children }) => {
  const statusColors = {
    PASS: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40',
    WARNING: 'bg-amber-500/20 text-amber-400 border-amber-500/40',
    FAIL: 'bg-red-500/20 text-red-400 border-red-500/40'
  };

  return (
    <div className="bg-black/30 border border-slate-800/80 rounded-lg overflow-hidden">
      {/* Header - Clickable */}
      <button
        onClick={onToggle}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-slate-900/20 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-full bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center">
            <span className="text-xs font-bold text-indigo-400">{phaseNumber}</span>
          </div>
          <div className="text-left">
            <h3 className="text-sm font-bold text-white">{title}</h3>
            <p className="text-[10px] text-slate-400">{description}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${statusColors[status]}`}>
            {status}
          </span>
          <svg
            className={`w-4 h-4 text-slate-400 transition-transform ${expanded ? 'rotate-180' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {/* Content - Collapsible */}
      {expanded && (
        <div className="px-4 pb-4 pt-1 border-t border-slate-700/40">
          {children}
        </div>
      )}
    </div>
  );
};

const CheckItem = ({ label, status, explanation }) => {
  return (
    <div className="flex items-start gap-2 p-2 bg-black/30 rounded border border-slate-700/30">
      <div className={`mt-0.5 w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 ${
        status === 'PASS' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
      }`}>
        {status === 'PASS' ? (
          <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        ) : (
          <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-slate-200">{label}</p>
        <p className="text-[10px] text-slate-400 mt-0.5 leading-relaxed">{explanation}</p>
      </div>
    </div>
  );
};

const SignalBadge = ({ label, severity, tooltip }) => {
  const severityColors = {
    high: 'bg-red-500/20 text-red-400 border-red-500/50',
    medium: 'bg-amber-500/20 text-amber-400 border-amber-500/50',
    low: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50'
  };

  return (
    <div className="group relative">
      <div className={`px-2.5 py-1 rounded-md border text-[10px] font-semibold ${severityColors[severity]}`}>
        {label}
      </div>
      {/* Tooltip */}
      <div className="absolute z-50 hidden group-hover:block bottom-full left-0 mb-2 w-48 p-2 bg-slate-900 border border-slate-700 rounded-md shadow-xl">
        <p className="text-[10px] text-slate-300 leading-relaxed">{tooltip}</p>
      </div>
    </div>
  );
};

const DetailRow = ({ label, value, explanation }) => {
  return (
    <div className="p-2 bg-black/20 rounded border border-slate-700/20">
      <div className="flex justify-between items-start mb-1">
        <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">{label}</span>
        <span className="text-xs text-slate-200 font-medium">{value}</span>
      </div>
      <p className="text-[10px] text-slate-400 leading-relaxed">{explanation}</p>
    </div>
  );
};

export default function App() {
  const [wallet, setWallet] = useState("");
  const [contract, setContract] = useState("");
  const [txType, setTxType] = useState("approve");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [expandedPhases, setExpandedPhases] = useState({
    phase1: true,
    phase2: true,
    phase3: true,
    phase4: true
  });

  const togglePhase = (phase) => {
    setExpandedPhases(prev => ({ ...prev, [phase]: !prev[phase] }));
  };

  const submit = async () => {
    setLoading(true);
    try {
      const res = await analyzeTx({ wallet, contract, tx_type: txType });
      setResult(res);
    } catch (err) {
      console.error("Analysis failed:", err);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#0a0e1a] text-gray-200 relative overflow-hidden">
      {/* Animated background effects */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-indigo-900/20 via-purple-900/10 to-transparent" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_var(--tw-gradient-stops))] from-pink-900/10 via-purple-900/5 to-transparent" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f08_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f08_1px,transparent_1px)] bg-[size:64px_64px]" />

      {/* Main container */}
      <div className="relative max-w-7xl mx-auto px-6 py-8">
        {/* Compact Header */}
        <header className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <div className="relative">
              <div className="relative w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
            </div>
            <div>
              <h1 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                Walletwork
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-medium">LIVE</span>
              </h1>
              <p className="text-[9px] text-slate-500 uppercase tracking-wider font-medium">Pre-Transaction Firewall</p>
            </div>
          </div>
          
          <div className="max-w-2xl">
            <h2 className="text-xl md:text-2xl font-bold text-white mb-1.5 leading-tight">
              Is this transaction <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">safe to sign?</span>
            </h2>
            <p className="text-slate-400 text-xs leading-relaxed">
              Real-time risk analysis powered by on-chain data and threat intelligence.
            </p>
          </div>
        </header>

        {/* Side-by-side layout */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* LEFT: Input Panel */}
          <div className="space-y-4">
            <div className="backdrop-blur-xl bg-slate-900/60 border border-slate-700/50 rounded-xl p-5 shadow-2xl">
              <div className="mb-5 pb-3 border-b border-slate-800/80">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-6 h-6 rounded-md bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                    <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <h3 className="text-sm font-bold text-white tracking-tight">Transaction Scanner</h3>
                </div>
                <p className="text-[10px] text-slate-400 ml-8">Enter transaction details for analysis</p>
              </div>

              <div className="space-y-4">
                {/* Wallet Input */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5 tracking-wide">WALLET ADDRESS</label>
                  <div className="relative">
                    <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                    </svg>
                    <input
                      value={wallet}
                      onChange={e => setWallet(e.target.value)}
                      className="w-full pl-10 pr-3 py-2.5 bg-black/40 border border-slate-600/50 rounded-lg text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400/30 transition-all font-mono"
                      placeholder="0x..."
                    />
                  </div>
                </div>

                {/* Contract Input */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5 tracking-wide">CONTRACT ADDRESS</label>
                  <div className="relative">
                    <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                    </svg>
                    <input
                      value={contract}
                      onChange={e => setContract(e.target.value)}
                      className="w-full pl-10 pr-3 py-2.5 bg-black/40 border border-slate-600/50 rounded-lg text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400/30 transition-all font-mono"
                      placeholder="0x..."
                    />
                  </div>
                </div>

                {/* Transaction Type */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5 tracking-wide">TRANSACTION TYPE</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'approve', label: 'Approve' },
                      { id: 'swap', label: 'Swap' },
                      { id: 'send', label: 'Send' }
                    ].map(type => (
                      <button
                        key={type.id}
                        onClick={() => setTxType(type.id)}
                        className={`py-2 rounded-lg border transition-all text-xs font-semibold tracking-wide ${
                          txType === type.id
                            ? 'bg-indigo-600/30 border-indigo-500 text-white shadow-md shadow-indigo-500/20'
                            : 'bg-black/20 border-slate-600/40 text-slate-400 hover:border-slate-500 hover:text-slate-300'
                        }`}
                      >
                        {type.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  onClick={submit}
                  disabled={loading || !wallet || !contract}
                  className="relative w-full group mt-5"
                >
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg blur opacity-50 group-hover:opacity-75 transition duration-300" />
                  <div className="relative px-4 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg text-white font-bold text-sm tracking-wide transition-transform group-hover:scale-[1.01] disabled:opacity-50 disabled:cursor-not-allowed">
                    {loading ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Analyzing...
                      </span>
                    ) : (
                      'ANALYZE RISK'
                    )}
                  </div>
                </button>
              </div>
            </div>
          </div>

          {/* RIGHT: Results Panel */}
          <div className="backdrop-blur-xl bg-slate-900/60 border border-slate-700/50 rounded-xl p-6 shadow-2xl min-h-[400px] flex flex-col">
            {!result && !loading && (
              <div className="flex-1 flex flex-col items-center justify-center text-center py-12">
                <div className="relative w-16 h-16 mb-5">
                  <div className="absolute inset-0 bg-indigo-500/10 rounded-full animate-ping" />
                  <div className="relative w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 flex items-center justify-center">
                    <svg className="w-7 h-7 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </div>
                </div>
                <h3 className="text-base font-semibold text-white mb-2">Ready to analyze</h3>
                <p className="text-xs text-slate-400 max-w-xs leading-relaxed">
                  Enter transaction details and click Analyze to receive a comprehensive security assessment.
                </p>
              </div>
            )}

            {loading && (
              <div className="flex-1 flex flex-col items-center justify-center py-12">
                <div className="relative w-12 h-12 mb-4">
                  <div className="absolute inset-0 border-3 border-indigo-500/20 rounded-full" />
                  <div className="absolute inset-0 border-3 border-transparent border-t-indigo-500 rounded-full animate-spin" />
                </div>
                <h3 className="text-sm font-semibold text-white mb-1">Analyzing transaction...</h3>
                <p className="text-slate-400 text-xs">Reading on-chain data and threat signals</p>
              </div>
            )}

            {!loading && result && (
              <div className="flex-1 space-y-4 animate-[fadeIn_0.3s_ease-in] overflow-y-auto max-h-[calc(100vh-200px)] pr-2">
                {/* ============================================ */}
                {/* FINAL VERDICT SUMMARY - Top Position */}
                {/* ============================================ */}
                <div className="bg-black/40 border-2 border-slate-700/60 rounded-lg p-4 sticky top-0 z-10 backdrop-blur-xl">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="text-[9px] text-slate-400 uppercase tracking-wider font-semibold mb-1.5">Final Verdict</p>
                      <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-md border-2 ${
                        result.risk === 'SAFE' ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400' : 
                        result.risk === 'CAUTION' || result.risk === 'SUSPICIOUS' ? 'bg-amber-500/10 border-amber-500/50 text-amber-400' : 
                        'bg-red-500/10 border-red-500/50 text-red-400'
                      }`}>
                        <span className="text-base font-bold tracking-tight">{result.risk}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-[9px] text-slate-400 uppercase tracking-wider font-semibold mb-1">Risk Score</p>
                      <p className="text-3xl font-black text-white tabular-nums">{result.score || result.risk_score || 0}</p>
                      <p className="text-[9px] text-slate-500 font-medium">/100</p>
                    </div>
                  </div>
                  <div className="h-1.5 bg-black/40 rounded-full overflow-hidden border border-slate-700/50">
                    <div
                      className={`h-full rounded-full transition-all duration-1000 ease-out ${
                        result.risk === 'SAFE' ? 'bg-emerald-500' : 
                        result.risk === 'CAUTION' || result.risk === 'SUSPICIOUS' ? 'bg-amber-500' : 
                        'bg-red-500'
                      }`}
                      style={{ width: `${result.score || result.risk_score || 0}%` }}
                    />
                  </div>
                </div>

                {/* ============================================ */}
                {/* PHASE 1: Static Validation */}
                {/* ============================================ */}
                <PhaseCard
                  phaseNumber={1}
                  title="Static Validation"
                  description="Address format and scam intelligence verification"
                  status={
                    result.signals?.scam_match ? "FAIL" : 
                    (!result.signals?.wallet_address_valid || !result.signals?.contract_address_valid) ? "FAIL" : 
                    "PASS"
                  }
                  expanded={expandedPhases.phase1}
                  onToggle={() => togglePhase('phase1')}
                >
                  <div className="space-y-2.5">
                    {/* Wallet Address Format Check */}
                    <CheckItem 
                      label="Wallet Address Format"
                      status={result.signals?.wallet_address_valid ? "PASS" : "FAIL"}
                      explanation={
                        result.signals?.wallet_address_valid 
                          ? "Valid Ethereum address format (0x... 42 characters)"
                          : `Invalid format: ${!wallet.startsWith('0x') ? 'Missing 0x prefix' : wallet.length !== 42 ? `Length is ${wallet.length}, expected 42 characters` : 'Contains invalid characters'}`
                      }
                    />
                    
                    {/* Contract Address Format Check */}
                    <CheckItem 
                      label="Contract Address Format"
                      status={result.signals?.contract_address_valid ? "PASS" : "FAIL"}
                      explanation={
                        result.signals?.contract_address_valid 
                          ? "Valid Ethereum address format (0x... 42 characters)"
                          : `Invalid format: ${!contract.startsWith('0x') ? 'Missing 0x prefix' : contract.length !== 42 ? `Length is ${contract.length}, expected 42 characters` : 'Contains invalid characters'}`
                      }
                    />
                    
                    {/* Scam Intelligence Check */}
                    {result.signals?.scam_match ? (
                      <>
                        <CheckItem 
                          label="Scam Intelligence Database"
                          status="FAIL"
                          explanation={`Address flagged: ${result.signals.scam_category?.replace('_', ' ').toUpperCase() || 'KNOWN SCAM'}`}
                        />
                        
                        {/* Detailed Scam Intelligence Card */}
                        <div className="bg-red-500/10 border-2 border-red-500/40 rounded-lg p-3 mt-2">
                          <div className="flex items-start gap-2 mb-2">
                            <svg className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                            <div className="flex-1">
                              <p className="text-xs font-bold text-red-300 mb-1">SCAM INTELLIGENCE ALERT</p>
                              <div className="space-y-1.5">
                                {result.signals.scam_category && (
                                  <div className="flex items-center gap-2">
                                    <span className="text-[9px] text-red-400 uppercase tracking-wider font-semibold">Category:</span>
                                    <span className="text-xs text-red-200 font-medium">{result.signals.scam_category.replace('_', ' ').toUpperCase()}</span>
                                  </div>
                                )}
                                {result.signals.scam_source && (
                                  <div className="flex items-center gap-2">
                                    <span className="text-[9px] text-red-400 uppercase tracking-wider font-semibold">Source:</span>
                                    <span className="text-xs text-red-200">{result.signals.scam_source}</span>
                                  </div>
                                )}
                                {result.signals.scam_confidence && (
                                  <div className="flex items-center gap-2">
                                    <span className="text-[9px] text-red-400 uppercase tracking-wider font-semibold">Confidence:</span>
                                    <span className="text-xs text-red-200 font-bold">{Math.round(result.signals.scam_confidence * 100)}%</span>
                                  </div>
                                )}
                                {result.signals.cluster_id && (
                                  <div className="flex items-center gap-2">
                                    <span className="text-[9px] text-red-400 uppercase tracking-wider font-semibold">Cluster:</span>
                                    <span className="text-xs text-red-200 font-mono">{result.signals.cluster_id}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                          <p className="text-[10px] text-red-300 leading-relaxed mt-2 pl-7">
                            This address has been identified in our scam intelligence database. Multiple independent sources have flagged this entity for malicious activity. Do NOT interact with this address.
                          </p>
                        </div>
                      </>
                    ) : (
                      <CheckItem 
                        label="Scam Intelligence Database"
                        status="PASS"
                        explanation="Address not found in known scam intelligence databases"
                      />
                    )}
                    
                    {/* Burn Address Check */}
                    <CheckItem 
                      label="Burn Address Check"
                      status={
                        result.signals?.wallet_is_burn_address || result.signals?.contract_is_burn_address 
                          ? "FAIL" 
                          : "PASS"
                      }
                      explanation={
                        result.signals?.wallet_is_burn_address 
                          ? "WARNING: Wallet address is a known burn address - funds will be permanently lost"
                          : result.signals?.contract_is_burn_address 
                          ? "WARNING: Contract address is a known burn address - funds will be permanently lost"
                          : "Not a zero address or known burn address"
                      }
                    />
                  </div>
                </PhaseCard>

                {/* ============================================ */}
                {/* PHASE 2: On-Chain Intelligence */}
                {/* ============================================ */}
                <PhaseCard
                  phaseNumber={2}
                  title="On-Chain Intelligence"
                  description="Blockchain history and contract verification"
                  status={
                    result.signals?.is_new_wallet || result.signals?.is_unverified_contract 
                      ? "WARNING" 
                      : "PASS"
                  }
                  expanded={expandedPhases.phase2}
                  onToggle={() => togglePhase('phase2')}
                >
                  <div className="space-y-3">
                    {/* Signal Badges */}
                    <div className="flex flex-wrap gap-2">
                      {result.signals?.is_new_wallet && (
                        <SignalBadge 
                          label="Fresh Wallet" 
                          severity="high"
                          tooltip="Wallet has 0 previous transactions. High risk of being a scammer-generated address."
                        />
                      )}
                      {result.signals?.is_unverified_contract && (
                        <SignalBadge 
                          label="Unverified Contract" 
                          severity="high"
                          tooltip="Contract source code not published on Etherscan. Cannot audit for malicious logic."
                        />
                      )}
                      {result.signals?.contract_age_days !== null && result.signals?.contract_age_days < 30 && (
                        <SignalBadge 
                          label="New Contract" 
                          severity="medium"
                          tooltip={`Contract deployed ${result.signals.contract_age_days} days ago. Recently deployed contracts require extra caution.`}
                        />
                      )}
                      {!result.signals?.is_new_wallet && !result.signals?.is_unverified_contract && (
                        <SignalBadge 
                          label="Established Address" 
                          severity="low"
                          tooltip="Address has transaction history and appears legitimate"
                        />
                      )}
                    </div>

                    {/* Detailed Explanations */}
                    <div className="space-y-2">
                      <DetailRow 
                        label="Transaction History"
                        value={result.signals?.is_new_wallet ? "0 transactions (Fresh Wallet)" : "Has transaction history"}
                        explanation="Fresh wallets are commonly used by scammers to hide their identity. Every new wallet should be treated with high suspicion."
                      />
                      <DetailRow 
                        label="Contract Verification"
                        value={result.signals?.is_unverified_contract ? "Not Verified" : "Verified on Etherscan"}
                        explanation={
                          result.signals?.is_unverified_contract 
                            ? "Unverified contracts hide their source code. Legitimate projects always verify to build trust."
                            : "Contract source code is publicly auditable on Etherscan."
                        }
                      />
                      {result.signals?.contract_age_days !== null && (
                        <DetailRow 
                          label="Contract Age"
                          value={`${result.signals.contract_age_days} days`}
                          explanation="Newer contracts have less historical data for risk assessment. Established contracts are generally more trustworthy."
                        />
                      )}
                    </div>
                  </div>
                </PhaseCard>

                {/* ============================================ */}
                {/* PHASE 3: Graph Intelligence */}
                {/* ============================================ */}
                <PhaseCard
                  phaseNumber={3}
                  title="Graph Risk Analysis"
                  description="Connection proximity to known scam addresses"
                  status={
                    result.signals?.graph_hop_distance === 0 ? "FAIL" :
                    result.signals?.graph_hop_distance === 1 ? "WARNING" :
                    "PASS"
                  }
                  expanded={expandedPhases.phase3}
                  onToggle={() => togglePhase('phase3')}
                >
                  <div className="space-y-3">
                    {/* Hop Distance Visualization */}
                    <div className="bg-black/40 border border-slate-700/50 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold text-slate-300">Hop Distance to Scam Cluster</span>
                        <span className={`text-sm font-bold ${
                          result.signals?.graph_hop_distance === 0 ? 'text-red-400' :
                          result.signals?.graph_hop_distance === 1 ? 'text-amber-400' :
                          result.signals?.graph_hop_distance === 2 ? 'text-yellow-400' :
                          'text-emerald-400'
                        }`}>
                          {result.signals?.graph_hop_distance >= 0 
                            ? `${result.signals.graph_hop_distance} Hop${result.signals.graph_hop_distance !== 1 ? 's' : ''}` 
                            : 'No Connection'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {[0, 1, 2, 3].map(hop => (
                          <div 
                            key={hop}
                            className={`flex-1 h-2 rounded-full ${
                              result.signals?.graph_hop_distance !== undefined && hop <= result.signals.graph_hop_distance
                                ? hop === 0 ? 'bg-red-500' : hop === 1 ? 'bg-amber-500' : 'bg-yellow-500'
                                : 'bg-slate-700/50'
                            }`}
                          />
                        ))}
                      </div>
                      <div className="flex justify-between text-[9px] text-slate-500 mt-1.5">
                        <span>Direct</span>
                        <span>Distant</span>
                      </div>
                    </div>

                    {/* Explanation */}
                    <div className="bg-slate-900/40 border border-slate-700/30 rounded p-3">
                      <p className="text-xs text-slate-300 leading-relaxed">
                        {result.signals?.graph_explanation || (
                          result.signals?.graph_hop_distance === 0 ? (
                            <><span className="font-semibold text-red-400">Critical:</span> This address is directly flagged as a scam or has directly transacted with known scam addresses. <span className="font-semibold">Do not interact.</span></>
                          ) : result.signals?.graph_hop_distance === 1 ? (
                            <><span className="font-semibold text-amber-400">High Risk:</span> This address is one transaction away from a known scam cluster. It has directly interacted with flagged addresses.</>
                          ) : result.signals?.graph_hop_distance === 2 ? (
                            <><span className="font-semibold text-yellow-400">Moderate Risk:</span> Two degrees of separation from scam addresses. Indirect exposure detected.</>
                          ) : (
                            <><span className="font-semibold text-emerald-400">Low Risk:</span> No direct or close connection to known scam addresses detected in graph analysis.</>
                          )
                        )}
                      </p>
                    </div>
                    
                    {/* Cluster Information (if applicable) */}
                    {result.signals?.cluster_id && (
                      <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-1.5">
                          <svg className="w-4 h-4 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <p className="text-xs font-semibold text-amber-300">Cluster Association Detected</p>
                        </div>
                        <p className="text-[10px] text-amber-200 leading-relaxed">
                          This address belongs to cluster: <span className="font-mono font-bold">{result.signals.cluster_id}</span>. 
                          Addresses in this cluster have been observed coordinating malicious activities.
                        </p>
                      </div>
                    )}
                  </div>
                </PhaseCard>

                {/* ============================================ */}
                {/* PHASE 4: Transaction Simulation */}
                {/* ============================================ */}
                <PhaseCard
                  phaseNumber={4}
                  title="Transaction Impact Simulation"
                  description="Predicted outcome and drain probability"
                  status={
                    result.signals?.drain_probability > 0.7 ? "FAIL" :
                    result.signals?.drain_probability > 0.3 ? "WARNING" :
                    "PASS"
                  }
                  expanded={expandedPhases.phase4}
                  onToggle={() => togglePhase('phase4')}
                >
                  <div className="space-y-3">
                    {/* Transaction Type Badge */}
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-400">Transaction Type:</span>
                      <span className={`px-2.5 py-1 rounded text-xs font-semibold ${
                        txType === 'approve' ? 'bg-red-500/20 text-red-400 border border-red-500/40' :
                        txType === 'swap' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40' :
                        'bg-slate-500/20 text-slate-400 border border-slate-500/40'
                      }`}>
                        {txType.toUpperCase()}
                      </span>
                    </div>

                    {/* Drain Probability */}
                    <div className="bg-black/40 border border-slate-700/50 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold text-slate-300">Estimated Drain Probability</span>
                        <span className={`text-2xl font-bold tabular-nums ${
                          (result.signals?.drain_probability || 0) > 0.7 ? 'text-red-400' :
                          (result.signals?.drain_probability || 0) > 0.3 ? 'text-amber-400' :
                          'text-emerald-400'
                        }`}>
                          {Math.round((result.signals?.drain_probability || 0) * 100)}%
                        </span>
                      </div>
                      <div className="h-2 bg-black/40 rounded-full overflow-hidden border border-slate-700/50">
                        <div
                          className={`h-full rounded-full transition-all duration-1000 ${
                            (result.signals?.drain_probability || 0) > 0.7 ? 'bg-red-500' :
                            (result.signals?.drain_probability || 0) > 0.3 ? 'bg-amber-500' :
                            'bg-emerald-500'
                          }`}
                          style={{ width: `${Math.round((result.signals?.drain_probability || 0) * 100)}%` }}
                        />
                      </div>
                    </div>

                    {/* Worst-Case Scenario */}
                    <div className="bg-slate-900/40 border border-slate-700/30 rounded p-3">
                      <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold mb-2">Worst-Case Outcome</p>
                      <p className="text-xs text-slate-300 leading-relaxed">
                        {txType === 'approve' && (
                          <>
                            <span className="font-semibold text-amber-400">Token Approval Risk:</span> This transaction grants the contract permission to spend your tokens. If the contract is malicious, it can drain your entire token balance at any time in the future, even after this transaction completes successfully.
                          </>
                        )}
                        {txType === 'swap' && (
                          <>
                            <span className="font-semibold text-amber-400">Swap Execution Risk:</span> The contract could execute an unfavorable swap rate, charge hidden fees, or fail to deliver the promised tokens. Your funds would be transferred but you may receive nothing in return.
                          </>
                        )}
                        {txType === 'send' && (
                          <>
                            <span className="font-semibold text-slate-400">Direct Transfer Risk:</span> Funds will be transferred directly to the recipient address. If the address is controlled by a scammer, the funds will be immediately stolen with no possibility of recovery.
                          </>
                        )}
                      </p>
                    </div>

                    {/* Attack Window (if relevant) */}
                    {txType === 'approve' && result.forecast_signals?.attack_window_blocks && (
                      <DetailRow 
                        label="Vulnerability Window"
                        value={`${result.forecast_signals.attack_window_blocks} blocks`}
                        explanation="This is the time window during which the approved contract can execute a drain. Infinite approvals remain vulnerable indefinitely."
                      />
                    )}
                  </div>
                </PhaseCard>

                {/* ============================================ */}
                {/* FINAL RECOMMENDATION */}
                {/* ============================================ */}
                <div className={`bg-black/40 border-2 rounded-lg p-4 ${
                  result.risk === 'SAFE' ? 'border-emerald-500/40' :
                  result.risk === 'CAUTION' || result.risk === 'SUSPICIOUS' ? 'border-amber-500/40' :
                  'border-red-500/40'
                }`}>
                  <div className="flex items-start gap-3">
                    <div className={`mt-0.5 w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                      result.risk === 'SAFE' ? 'bg-emerald-500/20 text-emerald-400' :
                      result.risk === 'CAUTION' || result.risk === 'SUSPICIOUS' ? 'bg-amber-500/20 text-amber-400' :
                      'bg-red-500/20 text-red-400'
                    }`}>
                      {result.risk === 'SAFE' ? (
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : result.risk === 'CAUTION' || result.risk === 'SUSPICIOUS' ? (
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      )}
                    </div>
                    <div className="flex-1">
                      <h4 className="text-sm font-bold text-white mb-1">Security Recommendation</h4>
                      <p className="text-xs text-slate-300 leading-relaxed">
                        {result.risk === 'SAFE' && (
                          <>This transaction appears <span className="font-semibold text-emerald-400">safe to proceed</span>. All security checks passed with no high-risk indicators detected.</>
                        )}
                        {(result.risk === 'CAUTION' || result.risk === 'SUSPICIOUS') && (
                          <>This transaction has <span className="font-semibold text-amber-400">moderate risk factors</span>. Proceed with caution and verify you trust the recipient/contract. Consider using a test transaction with small amounts first.</>
                        )}
                        {result.risk === 'DANGEROUS' && (
                          <><span className="font-semibold text-red-400">Do NOT sign this transaction.</span> Critical risk factors detected. High probability of fund loss. This transaction exhibits patterns consistent with known scams and drainer contracts.</>
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

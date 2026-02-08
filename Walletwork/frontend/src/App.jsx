import { useState } from "react";
import { analyzeTx } from "./api";

export default function App() {
  const [wallet, setWallet] = useState("");
  const [contract, setContract] = useState("");
  const [txType, setTxType] = useState("approve");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

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

  const getRiskColor = (risk) => {
    if (risk === 'SAFE') return 'from-emerald-500 to-green-500';
    if (risk === 'CAUTION') return 'from-amber-500 to-orange-500';
    if (risk === 'DANGEROUS') return 'from-red-500 to-pink-500';
    // Fallback for backward compatibility
    if (risk === 'SUSPICIOUS') return 'from-amber-500 to-orange-500';
    if (risk === 'HIGH_RISK') return 'from-red-500 to-pink-500';
    return 'from-gray-500 to-slate-500';
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
              <div className="flex-1 space-y-5 animate-[fadeIn_0.3s_ease-in]">
                {/* Risk Badge Card */}
                <div className="bg-black/30 border border-slate-800/80 rounded-lg p-5">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <p className="text-[10px] text-slate-500 uppercase tracking-[0.1em] font-semibold mb-2">Risk Assessment</p>
                      <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gradient-to-r ${getRiskColor(result.risk)} bg-opacity-20 border ${
                        result.risk === 'SAFE' ? 'border-emerald-500/40' : 
                        result.risk === 'CAUTION' || result.risk === 'SUSPICIOUS' ? 'border-amber-500/40' : 
                        'border-red-500/40'
                      }`}>
                        <span className="text-lg font-extrabold text-white tracking-tight">{result.risk}</span>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <p className="text-[10px] text-slate-500 uppercase tracking-[0.1em] font-semibold mb-1">Score</p>
                      <p className="text-4xl font-black text-white tabular-nums">{result.score || result.risk_score || 0}</p>
                      <p className="text-[10px] text-slate-500 font-medium">/100</p>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div>
                    <div className="flex justify-between text-[10px] text-slate-500 mb-1.5 font-medium">
                      <span>SAFE</span>
                      <span>DANGER</span>
                    </div>
                    <div className="h-2 bg-black/40 rounded-full overflow-hidden border border-slate-700/50">
                      <div
                        className={`h-full rounded-full bg-gradient-to-r ${getRiskColor(result.risk)} transition-all duration-1000 ease-out`}
                        style={{ width: `${result.score || result.risk_score || 0}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Reasons Card */}
                <div className="bg-black/30 border border-slate-800/80 rounded-lg p-5">
                  <div className="mb-4">
                    <div className="flex items-center gap-2 mb-1">
                      <svg className="w-3.5 h-3.5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <h4 className="text-sm font-bold text-white tracking-tight">Risk Factors</h4>
                    </div>
                    <p className="text-[10px] text-slate-500 ml-6">Key indicators identified in this transaction</p>
                  </div>
                  <ul className="space-y-2">
                    {result.reasons?.map((reason, i) => (
                      <li key={i} className="flex gap-2.5 items-start p-2.5 bg-black/40 rounded-md border border-slate-700/30">
                        <span className={`mt-1 w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                          result.risk === 'SAFE' ? 'bg-emerald-400' : 
                          result.risk === 'CAUTION' || result.risk === 'SUSPICIOUS' ? 'bg-amber-400' : 
                          'bg-red-400'
                        }`} />
                        <span className="text-xs text-slate-300 leading-relaxed">{reason}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

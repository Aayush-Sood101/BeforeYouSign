import { useState } from 'react';
import axios from 'axios';
import { Activity, ShieldCheck, Zap } from 'lucide-react';
import Layout from './components/Layout';
import TransactionForm from './components/TransactionForm';
import RiskCard from './components/RiskCard';
import FraudRadar from './components/FraudRadar';
import FraudForecast from './components/FraudForecast';

function App() {
  const [wallet, setWallet] = useState('');
  const [contract, setContract] = useState('');
  const [txType, setTxType] = useState('approve');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAnalyze = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResult(null);

    const cleanWallet = wallet.trim();
    const cleanContract = contract.trim();

    try {
      const response = await axios.post('http://localhost:8000/analyze', {
        wallet: cleanWallet,
        contract: cleanContract,
        tx_type: txType
      });
      setResult(response.data);
    } catch (err) {
      console.error(err);
      setError('Connection failed. Ensure backend is running properties.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

        {/* Left Column: Form & Intro */}
        <div className="lg:col-span-5 space-y-8">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/50 border border-cyan-500/20 text-cyan-400 text-xs font-mono font-medium mb-4">
              <Zap className="w-3 h-3" />
              <span>LIVE THREAT DETECTION</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 leading-tight">
              Is this transaction <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500">safe to sign?</span>
            </h1>
            <p className="text-gray-400 text-lg leading-relaxed">
              Analyze any Web3 transaction before you approve. detected scams, honeypots, and malicious contracts in milliseconds.
            </p>
          </div>

          <div className="glass-panel p-1 rounded-2xl bg-gradient-to-br from-gray-800/50 to-gray-900/50 border border-white/5 shadow-2xl">
            <div className="bg-gray-900/80 backdrop-blur-xl p-6 rounded-xl">
              <TransactionForm
                wallet={wallet} setWallet={setWallet}
                contract={contract} setContract={setContract}
                txType={txType} setTxType={setTxType}
                onSubmit={handleAnalyze}
                loading={loading}
              />
              {error && (
                <div className="mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm text-center flex items-center justify-center gap-2">
                  <Activity className="w-4 h-4" />
                  {error}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Analysis Results */}
        <div className="lg:col-span-7">
          {!result && !loading && (
            <div className="h-full min-h-[500px] flex flex-col items-center justify-center text-center p-8 border-2 border-dashed border-gray-800 rounded-3xl bg-gray-900/20">
              <div className="w-20 h-20 bg-gray-900 rounded-full flex items-center justify-center mb-6 shadow-inner border border-gray-800">
                <ShieldCheck className="w-10 h-10 text-gray-700" />
              </div>
              <h3 className="text-xl font-semibold text-gray-300 mb-2">Ready to Analyze</h3>
              <p className="text-gray-500 max-w-sm">
                Enter wallet and contract details to generate a comprehensive risk report.
              </p>
            </div>
          )}

          {result && (
            <div className="space-y-6 animate-fade-in-up">
              <RiskCard
                risk={result.risk}
                score={result.score}
                reasons={result.reasons}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FraudRadar
                  distance={result.graph_signals?.wallet_scam_distance ?? -1}
                  connected={result.graph_signals?.connected_to_scam_cluster ?? false}
                />

                <FraudForecast
                  drainProb={result.forecast_signals?.drain_probability ?? 0}
                  windowBlocks={result.forecast_signals?.attack_window_blocks ?? 0}
                />
              </div>
            </div>
          )}
        </div>

      </div>
    </Layout>
  );
}

export default App;

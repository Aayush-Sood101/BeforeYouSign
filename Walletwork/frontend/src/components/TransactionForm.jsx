import React from 'react';
import { Search, Wallet, FileCode, ArrowRightLeft, Send, CheckCircle2 } from 'lucide-react';

const TransactionForm = ({ wallet, setWallet, contract, setContract, txType, setTxType, onSubmit, loading }) => {
    return (
        <form onSubmit={onSubmit} className="space-y-6">
            <div className="space-y-5">
                {/* Wallet Input */}
                <div>
                    <label className="block text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wide">Wallet Address</label>
                    <div className="relative group">
                        <Wallet className="absolute left-3 top-3.5 w-5 h-5 text-gray-500 group-focus-within:text-cyan-400 transition-colors" />
                        <input
                            type="text"
                            placeholder="0x..."
                            value={wallet}
                            onChange={(e) => setWallet(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 rounded-xl bg-gray-900/50 border border-gray-700/50 text-white font-mono text-sm focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 focus:outline-none transition-all placeholder:text-gray-600"
                            required
                        />
                    </div>
                </div>

                {/* Contract Input */}
                <div>
                    <label className="block text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wide">Contract Address</label>
                    <div className="relative group">
                        <FileCode className="absolute left-3 top-3.5 w-5 h-5 text-gray-500 group-focus-within:text-cyan-400 transition-colors" />
                        <input
                            type="text"
                            placeholder="0x..."
                            value={contract}
                            onChange={(e) => setContract(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 rounded-xl bg-gray-900/50 border border-gray-700/50 text-white font-mono text-sm focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 focus:outline-none transition-all placeholder:text-gray-600"
                            required
                        />
                    </div>
                </div>

                {/* Tx Type */}
                <div>
                    <label className="block text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wide">Transaction Type</label>
                    <div className="grid grid-cols-3 gap-3">
                        {[
                            { id: 'approve', icon: CheckCircle2, label: 'Approve' },
                            { id: 'swap', icon: ArrowRightLeft, label: 'Swap' },
                            { id: 'send', icon: Send, label: 'Send' }
                        ].map((type) => {
                            const Icon = type.icon;
                            const isActive = txType === type.id;
                            return (
                                <button
                                    key={type.id}
                                    type="button"
                                    onClick={() => setTxType(type.id)}
                                    className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all duration-200
                    ${isActive
                                            ? 'bg-cyan-500/10 border-cyan-500/50 text-cyan-400 shadow-[0_0_15px_-3px_rgba(6,182,212,0.3)]'
                                            : 'bg-gray-900/30 border-gray-800 text-gray-500 hover:border-gray-600 hover:bg-gray-800'
                                        }`}
                                >
                                    <Icon className={`w-5 h-5 mb-1 ${isActive ? 'text-cyan-400' : 'text-gray-500'}`} />
                                    <span className="text-xs font-medium">{type.label}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            <button
                type="submit"
                disabled={loading}
                className="w-full py-4 rounded-xl font-bold text-sm tracking-widest uppercase bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow-lg shadow-cyan-900/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform active:scale-[0.98]"
            >
                {loading ? (
                    <span className="flex items-center justify-center gap-2">
                        <Search className="w-4 h-4 animate-spin" />
                        Scanning Network...
                    </span>
                ) : (
                    'Analyze Risk'
                )}
            </button>
        </form>
    );
};

export default TransactionForm;

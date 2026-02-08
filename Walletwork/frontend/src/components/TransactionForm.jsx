import React from 'react';

const TransactionForm = ({ wallet, setWallet, contract, setContract, txType, setTxType, onSubmit, loading }) => {
    return (
        <form onSubmit={onSubmit} className="space-y-6">
            <div className="space-y-4">
                {/* Wallet Input */}
                <div>
                    <label htmlFor="wallet" className="block text-sm font-medium text-slate-800 mb-1">
                        Wallet address
                    </label>
                    <p className="text-xs text-slate-500 mb-2">The address that is initiating the transaction.</p>
                    <input
                        id="wallet"
                        type="text"
                        autoComplete="off"
                        placeholder="0x..."
                        value={wallet}
                        onChange={(e) => setWallet(e.target.value)}
                        className="block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        required
                    />
                </div>

                {/* Contract Input */}
                <div>
                    <label htmlFor="contract" className="block text-sm font-medium text-slate-800 mb-1">
                        Contract address
                    </label>
                    <p className="text-xs text-slate-500 mb-2">The contract you are about to interact with.</p>
                    <input
                        id="contract"
                        type="text"
                        autoComplete="off"
                        placeholder="0x..."
                        value={contract}
                        onChange={(e) => setContract(e.target.value)}
                        className="block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        required
                    />
                </div>

                {/* Transaction Type */}
                <fieldset>
                    <legend className="block text-sm font-medium text-slate-800 mb-1">Transaction type</legend>
                    <p className="text-xs text-slate-500 mb-3">How this transaction will interact with the contract.</p>
                    <div className="grid grid-cols-3 gap-3 text-sm">
                        {[
                            { id: 'approve', label: 'Approve', description: 'Grant spending rights' },
                            { id: 'swap', label: 'Swap', description: 'Exchange one asset for another' },
                            { id: 'send', label: 'Send', description: 'Transfer assets directly' },
                        ].map((option) => {
                            const isActive = txType === option.id;
                            return (
                                <button
                                    key={option.id}
                                    type="button"
                                    onClick={() => setTxType(option.id)}
                                    className={`flex flex-col rounded-md border px-3 py-2 text-left transition-colors
                                        ${
                                            isActive
                                                ? 'border-indigo-500 bg-indigo-50 text-indigo-900'
                                                : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                                        }`}
                                    aria-pressed={isActive}
                                >
                                    <span className="font-medium text-sm">{option.label}</span>
                                    <span className="mt-0.5 text-xs text-slate-500">{option.description}</span>
                                </button>
                            );
                        })}
                    </div>
                </fieldset>
            </div>

            <button
                type="submit"
                disabled={loading}
                className="inline-flex w-full justify-center rounded-md bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
            >
                {loading ? 'Analyzing transaction…' : 'Analyze risk'}
            </button>
        </form>
    );
};

export default TransactionForm;

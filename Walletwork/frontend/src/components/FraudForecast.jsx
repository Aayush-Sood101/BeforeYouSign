import React from 'react';

const FraudForecast = ({ drainProb, windowBlocks }) => {
    const percentage = Math.round(drainProb * 100);
    const isHigh = percentage > 50;
    const barColor = isHigh ? 'bg-gradient-to-r from-red-600 to-orange-500' : 'bg-gradient-to-r from-blue-500 to-cyan-400';
    const textColor = isHigh ? 'text-red-400' : 'text-cyan-400';

    return (
        <div className="glass-panel p-5 rounded-xl border border-gray-700 h-full flex flex-col justify-between">
            <div>
                <h3 className="text-gray-400 text-xs font-mono uppercase tracking-widest mb-4">AI Fraud Forecast</h3>

                <div className="hidden hidden-v2"></div>
                <div className="flex justify-between items-end mb-2">
                    <span className="text-gray-300 text-sm">Drain Probability</span>
                    <span className={`text-2xl font-bold font-mono ${textColor}`}>{percentage}%</span>
                </div>

                <div className="w-full bg-gray-800 rounded-full h-3 mb-6 overflow-hidden">
                    <div
                        className={`h-full rounded-full ${barColor} shadow-[0_0_10px_rgba(0,0,0,0.5)] transition-all duration-1000`}
                        style={{ width: `${percentage}%` }}
                    ></div>
                </div>
            </div>

            <div className="pt-4 border-t border-gray-700/50">
                <div className="flex justify-between items-center text-xs">
                    <span className="text-gray-500">EST. ATTACK WINDOW</span>
                    <span className="text-gray-300 font-mono">
                        {windowBlocks > 0 ? `< ${windowBlocks} BLOCKS` : 'N/A'}
                    </span>
                </div>
            </div>
        </div>
    );
};

export default FraudForecast;

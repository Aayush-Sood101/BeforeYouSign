import React from 'react';

const FraudRadar = ({ distance, connected }) => {
    const isSafe = distance === -1 && !connected;
    const color = isSafe ? 'text-green-400' : 'text-red-500';
    const borderColor = isSafe ? 'border-green-500/30' : 'border-red-500/30';

    return (
        <div className={`glass-panel p-5 rounded-xl border ${borderColor} flex flex-col items-center justify-center text-center h-full`}>
            <h3 className="text-gray-400 text-xs font-mono uppercase tracking-widest mb-4">Scam Proximity Radar</h3>

            <div className="relative w-24 h-24 mb-4 flex items-center justify-center">
                {/* Radar Rings */}
                <div className={`absolute w-full h-full rounded-full border-2 ${borderColor} opacity-20 animate-ping`}></div>
                <div className={`absolute w-full h-full rounded-full border-2 ${borderColor} opacity-40`}></div>
                <div className={`absolute w-16 h-16 rounded-full border-2 ${borderColor} opacity-60`}></div>

                {/* Center Content */}
                <div className={`relative z-10 font-bold text-lg font-mono ${color}`}>
                    {isSafe ? 'SAFE' : `${distance} HOP`}
                </div>
            </div>

            <div className={`text-sm font-semibold ${color} mb-1`}>
                {connected ? "CRITICAL: SCAM LINKED" : isSafe ? "No Links Detected" : "Suspicious Link"}
            </div>
            <div className="text-xs text-gray-500">
                Distance to known blacklisted wallet
            </div>
        </div>
    );
};

export default FraudRadar;

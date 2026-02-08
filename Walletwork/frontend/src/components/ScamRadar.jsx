import React from 'react';

const ScamRadar = ({ distance, connected }) => {
    if (distance === -1 && !connected) {
        return (
            <div className="p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-700 mb-2">Scam Radar</h3>
                <p className="text-green-600">No connection to known scam clusters found.</p>
            </div>
        );
    }

    return (
        <div className="p-4 bg-white rounded-lg border border-red-200 shadow-sm">
            <h3 className="text-lg font-semibold text-red-700 mb-2">⚠️ Scam Proximity Radar</h3>
            <div className="flex items-center space-x-4">
                <div className="relative w-16 h-16 flex items-center justify-center bg-red-100 rounded-full text-red-800 font-bold text-xl border-2 border-red-400">
                    {distance === 0 ? "DIRECT" : `${distance} Hop`}
                </div>
                <div>
                    <p className="font-medium text-gray-900">
                        {connected ? "Connected to Scam Cluster" : "Potential Link Detected"}
                    </p>
                    <p className="text-sm text-gray-600">
                        Distance: {distance} hop(s) from a blacklisted address.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default ScamRadar;

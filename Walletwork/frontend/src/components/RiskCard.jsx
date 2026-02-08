import React from 'react';
import { AlertTriangle, CheckCircle, ShieldAlert, AlertOctagon } from 'lucide-react';

const RiskCard = ({ risk, score, reasons }) => {
    const getRiskConfig = (risk) => {
        switch (risk) {
            case 'SAFE':
                return {
                    icon: CheckCircle,
                    color: 'text-green-400',
                    border: 'border-green-500/30',
                    bg: 'bg-green-500/5',
                    bar: 'bg-green-500'
                };
            case 'SUSPICIOUS':
                return {
                    icon: AlertTriangle,
                    color: 'text-yellow-400',
                    border: 'border-yellow-500/30',
                    bg: 'bg-yellow-500/5',
                    bar: 'bg-yellow-500'
                };
            case 'HIGH_RISK':
                return {
                    icon: AlertOctagon,
                    color: 'text-red-500',
                    border: 'border-red-500/30',
                    bg: 'bg-red-500/10',
                    bar: 'bg-red-500'
                };
            default:
                return { icon: ShieldAlert, color: 'text-gray-400', border: 'border-gray-700', bg: 'bg-gray-800', bar: 'bg-gray-600' };
        }
    };

    const config = getRiskConfig(risk);
    const Icon = config.icon;

    return (
        <div className={`p-6 rounded-2xl border ${config.border} ${config.bg} backdrop-blur-sm transition-all duration-300`}>
            {/* Header */}
            <div className="flex justify-between items-stretch mb-8">
                <div className="flex flex-col justify-center">
                    <div className="flex items-center gap-3 mb-2">
                        <div className={`p-2 rounded-lg bg-black/40 ${config.border} border`}>
                            <Icon className={`w-6 h-6 ${config.color}`} />
                        </div>
                        <h2 className="text-gray-400 text-sm font-bold uppercase tracking-widest">Risk Verdict</h2>
                    </div>
                    <div className={`text-3xl md:text-4xl font-black ${config.color} tracking-tight drop-shadow-lg`}>
                        {risk.replace('_', ' ')}
                    </div>
                </div>

                <div className="flex flex-col items-end justify-center pl-6 border-l border-white/5">
                    <div className={`text-6xl font-mono font-black ${config.color} drop-shadow-[0_0_15px_rgba(0,0,0,0.5)]`}>
                        {score}
                    </div>
                    <div className="text-sm text-gray-400 font-medium uppercase tracking-wide mt-1">Risk Score</div>
                </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-black/20 rounded-full h-1.5 mb-6 overflow-hidden">
                <div
                    className={`h-full rounded-full ${config.bar} transition-all duration-1000 ease-out`}
                    style={{ width: `${score}%` }}
                ></div>
            </div>

            {/* Analysis */}
            <div>
                <h3 className="text-gray-300 text-sm font-semibold mb-3 flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-gray-500" />
                    Analysis Report
                </h3>
                <ul className="space-y-2">
                    {reasons.map((reason, index) => (
                        <li key={index} className="flex items-start gap-3 text-sm text-gray-400 bg-black/20 p-3 rounded-lg border border-white/5">
                            <span className={`mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0 ${config.bar}`}></span>
                            <span className="leading-relaxed">{reason}</span>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
};

export default RiskCard;

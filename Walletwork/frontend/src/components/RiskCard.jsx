import React from 'react';

const mapRisk = (risk) => {
    switch (risk) {
        case 'SAFE':
            return { label: 'Safe', tone: 'safe' };
        case 'SUSPICIOUS':
            return { label: 'Caution', tone: 'caution' };
        case 'HIGH_RISK':
            return { label: 'Dangerous', tone: 'danger' };
        default:
            return { label: 'Unknown', tone: 'neutral' };
    }
};

const toneClasses = {
    safe: {
        badge: 'bg-emerald-50 text-emerald-800 border-emerald-200',
        bar: 'bg-emerald-500',
    },
    caution: {
        badge: 'bg-amber-50 text-amber-800 border-amber-200',
        bar: 'bg-amber-500',
    },
    danger: {
        badge: 'bg-red-50 text-red-800 border-red-200',
        bar: 'bg-red-500',
    },
    neutral: {
        badge: 'bg-slate-50 text-slate-800 border-slate-200',
        bar: 'bg-slate-500',
    },
};

const RiskCard = ({ risk, score, reasons, tags }) => {
    const { label, tone } = mapRisk(risk);
    const toneCfg = toneClasses[tone] ?? toneClasses.neutral;
    const safeScore = typeof score === 'number' ? Math.min(Math.max(score, 0), 100) : 0;

    return (
        <section
            aria-label="Risk assessment result"
            className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm"
        >
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-4">
                <div>
                    <h2 className="text-sm font-medium text-slate-700 mb-1">Risk verdict</h2>
                    <div
                        className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium border ${toneCfg.badge}`}
                    >
                        {label}
                    </div>
                </div>

                <div className="text-right">
                    <p className="text-xs text-slate-500">Risk score (0–100)</p>
                    <p className="text-3xl font-semibold text-slate-900">{safeScore}</p>
                </div>
            </div>

            <div className="mt-2 mb-5">
                <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                    <span>Lower is safer</span>
                    <span>Higher risk</span>
                </div>
                <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                    <div
                        className={`h-2 rounded-full ${toneCfg.bar}`}
                        style={{ width: `${safeScore}%` }}
                    />
                </div>
            </div>

            {tags && tags.length > 0 && (
                <div className="mb-4">
                    <p className="text-xs font-medium text-slate-700 mb-1">Key signals</p>
                    <div className="flex flex-wrap gap-2">
                        {tags.map((tag) => (
                            <span
                                key={tag}
                                className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-[11px] text-slate-700"
                            >
                                {tag}
                            </span>
                        ))}
                    </div>
                </div>
            )}

            <div>
                <p className="text-sm font-medium text-slate-800 mb-2">Why this risk?</p>
                {reasons && reasons.length > 0 ? (
                    <ul className="space-y-1.5 text-sm text-slate-700">
                        {reasons.map((reason, index) => (
                            <li key={index} className="flex gap-2">
                                <span className="mt-1 h-1.5 w-1.5 rounded-full bg-slate-300" aria-hidden="true" />
                                <span>{reason}</span>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="text-sm text-slate-500">
                        No specific risk factors were reported for this transaction.
                    </p>
                )}
            </div>
        </section>
    );
};

export default RiskCard;

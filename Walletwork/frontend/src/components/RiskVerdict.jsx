import React from 'react';

const RiskVerdict = ({ risk, score, reasons }) => {
  const getColor = (risk) => {
    switch (risk) {
      case 'SAFE': return 'bg-green-100 text-green-800 border-green-300';
      case 'SUSPICIOUS': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'HIGH_RISK': return 'bg-red-100 text-red-800 border-red-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  return (
    <div className={`p-6 rounded-lg border-2 ${getColor(risk)} shadow-md`}>
      <h2 className="text-2xl font-bold mb-2">Risk Verdict: {risk}</h2>
      <div className="text-4xl font-extrabold mb-4">{score} / 100</div>
      <h3 className="font-semibold mb-2">Key Risk Factors:</h3>
      <ul className="list-disc list-inside space-y-1">
        {reasons.map((reason, index) => (
          <li key={index} className="text-sm">{reason}</li>
        ))}
      </ul>
    </div>
  );
};

export default RiskVerdict;

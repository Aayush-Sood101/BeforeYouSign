"use client";

import React, { useState } from "react";

interface Discrepancy {
  type: string;
  severity: string;
  pdfClaim: string;
  codeReality: string;
  description: string;
  impact: string;
  codeLocation: string;
}

interface Vulnerability {
  type: string;
  severity: string;
  location: string;
  description: string;
  exploit: string;
  codeSnippet: string;
  financialImpact: string;
}

interface RiskScore {
  overall: number;
  classification: string;
  confidence: string;
}

interface ContractAnalysisResult {
  discrepancies: Discrepancy[];
  vulnerabilities: Vulnerability[];
  codeQualityIssues: { type: string; severity: string; description: string; location: string }[];
  tokenomicsVerification: {
    documentedFee: string;
    actualFee: string;
    feeMismatch: boolean;
    documentedLateFee: string;
    actualLateFee: string;
    lateFeeMismatch: boolean;
    gracePeriodClaimed: string;
    gracePeriodEnforced: boolean;
    unlimitedMinting: boolean;
    canFreezeAccounts: boolean;
    canSeizeWithoutDefault: boolean;
    hasBackdoorAdmin: boolean;
    hasInstantUpgrade: boolean;
    fakeMultisig: boolean;
  };
  riskScore: RiskScore;
  summary: string;
  redFlags: string[];
  positiveAspects: string[];
}

export default function ContractAnalysis() {
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [githubUrl, setGithubUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ContractAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pdfFile || !githubUrl) {
      setError("Please provide both a PDF file and GitHub repository URL");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append("pdf", pdfFile);
      formData.append("githubUrl", githubUrl);

      const response = await fetch("http://localhost:3000/api/analyze", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`);
      }

      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity.toUpperCase()) {
      case "CRITICAL":
        return "bg-red-600 text-white";
      case "HIGH":
        return "bg-orange-500 text-white";
      case "MEDIUM":
        return "bg-yellow-500 text-black";
      case "LOW":
        return "bg-blue-500 text-white";
      default:
        return "bg-gray-500 text-white";
    }
  };

  const getRiskColor = (classification: string) => {
    switch (classification) {
      case "HIGH-RISK":
        return "text-red-500 border-red-500";
      case "SUSPICIOUS":
        return "text-orange-500 border-orange-500";
      case "SAFE":
        return "text-green-500 border-green-500";
      default:
        return "text-gray-500 border-gray-500";
    }
  };

  return (
    <div className="bg-zinc-900 rounded-xl p-6 border border-zinc-800">
      <h2 className="text-2xl font-bold text-white mb-4">
        Smart Contract Analysis
      </h2>
      <p className="text-zinc-400 mb-6">
        Upload a contract PDF and provide the GitHub repository link for AI-powered vulnerability analysis.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-2">
            Contract PDF
          </label>
          <input
            type="file"
            accept=".pdf"
            onChange={(e) => setPdfFile(e.target.files?.[0] || null)}
            className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-violet-600 file:text-white hover:file:bg-violet-500 cursor-pointer"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-2">
            GitHub Repository URL
          </label>
          <input
            type="url"
            value={githubUrl}
            onChange={(e) => setGithubUrl(e.target.value)}
            placeholder="https://github.com/username/repo"
            className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 px-6 bg-violet-600 hover:bg-violet-500 disabled:bg-zinc-700 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Analyzing Contract...
            </span>
          ) : (
            "Analyze Contract"
          )}
        </button>
      </form>

      {error && (
        <div className="mt-6 p-4 bg-red-900/50 border border-red-700 rounded-lg text-red-300">
          {error}
        </div>
      )}

      {result && (
        <div className="mt-8 space-y-6">
          {/* Risk Score */}
          <div className={`p-6 rounded-lg border-2 ${getRiskColor(result.riskScore.classification)}`}>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-white">Risk Assessment</h3>
                <p className={`text-3xl font-bold ${getRiskColor(result.riskScore.classification)}`}>
                  {result.riskScore.classification}
                </p>
              </div>
              <div className="text-right">
                <p className="text-zinc-400 text-sm">Overall Score</p>
                <p className="text-2xl font-bold text-white">{result.riskScore.overall}</p>
                <p className="text-zinc-400 text-sm">Confidence: {result.riskScore.confidence}</p>
              </div>
            </div>
          </div>

          {/* Summary */}
          <div className="p-4 bg-zinc-800 rounded-lg">
            <h3 className="text-lg font-semibold text-white mb-2">Summary</h3>
            <p className="text-zinc-300">{result.summary}</p>
          </div>

          {/* Red Flags */}
          {result.redFlags.length > 0 && (
            <div className="p-4 bg-red-900/20 border border-red-800 rounded-lg">
              <h3 className="text-lg font-semibold text-red-400 mb-3">
                🚩 Red Flags ({result.redFlags.length})
              </h3>
              <ul className="space-y-2">
                {result.redFlags.map((flag, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-zinc-300">
                    <span className="text-red-500 mt-1">•</span>
                    {flag}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Discrepancies */}
          {result.discrepancies.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-white mb-3">
                Discrepancies ({result.discrepancies.length})
              </h3>
              <div className="space-y-3">
                {result.discrepancies.map((disc, idx) => (
                  <details key={idx} className="bg-zinc-800 rounded-lg overflow-hidden">
                    <summary className="p-4 cursor-pointer hover:bg-zinc-700 flex items-center gap-3">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${getSeverityColor(disc.severity)}`}>
                        {disc.severity}
                      </span>
                      <span className="text-white font-medium">{disc.type.replace(/_/g, " ")}</span>
                    </summary>
                    <div className="p-4 border-t border-zinc-700 space-y-3">
                      <div>
                        <p className="text-sm text-zinc-400">PDF Claim:</p>
                        <p className="text-zinc-300">{disc.pdfClaim}</p>
                      </div>
                      <div>
                        <p className="text-sm text-zinc-400">Code Reality:</p>
                        <p className="text-zinc-300">{disc.codeReality}</p>
                      </div>
                      <div>
                        <p className="text-sm text-zinc-400">Impact:</p>
                        <p className="text-red-300">{disc.impact}</p>
                      </div>
                      <div>
                        <p className="text-sm text-zinc-400">Location:</p>
                        <code className="text-violet-400 text-sm">{disc.codeLocation}</code>
                      </div>
                    </div>
                  </details>
                ))}
              </div>
            </div>
          )}

          {/* Vulnerabilities */}
          {result.vulnerabilities.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-white mb-3">
                Vulnerabilities ({result.vulnerabilities.length})
              </h3>
              <div className="space-y-3">
                {result.vulnerabilities.map((vuln, idx) => (
                  <details key={idx} className="bg-zinc-800 rounded-lg overflow-hidden">
                    <summary className="p-4 cursor-pointer hover:bg-zinc-700 flex items-center gap-3">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${getSeverityColor(vuln.severity)}`}>
                        {vuln.severity}
                      </span>
                      <span className="text-white font-medium">{vuln.type.replace(/_/g, " ")}</span>
                    </summary>
                    <div className="p-4 border-t border-zinc-700 space-y-3">
                      <div>
                        <p className="text-sm text-zinc-400">Description:</p>
                        <p className="text-zinc-300">{vuln.description}</p>
                      </div>
                      <div>
                        <p className="text-sm text-zinc-400">Exploit:</p>
                        <p className="text-orange-300">{vuln.exploit}</p>
                      </div>
                      <div>
                        <p className="text-sm text-zinc-400">Financial Impact:</p>
                        <p className="text-red-300">{vuln.financialImpact}</p>
                      </div>
                      <div>
                        <p className="text-sm text-zinc-400">Location:</p>
                        <code className="text-violet-400 text-sm">{vuln.location}</code>
                      </div>
                      {vuln.codeSnippet && (
                        <div>
                          <p className="text-sm text-zinc-400">Code Snippet:</p>
                          <pre className="mt-1 p-3 bg-zinc-900 rounded text-xs text-zinc-300 overflow-x-auto">
                            {vuln.codeSnippet}
                          </pre>
                        </div>
                      )}
                    </div>
                  </details>
                ))}
              </div>
            </div>
          )}

          {/* Tokenomics Verification */}
          <div className="p-4 bg-zinc-800 rounded-lg">
            <h3 className="text-lg font-semibold text-white mb-3">Tokenomics Verification</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <div className={`p-3 rounded ${result.tokenomicsVerification.feeMismatch ? "bg-red-900/30" : "bg-green-900/30"}`}>
                <p className="text-xs text-zinc-400">Fee Mismatch</p>
                <p className={result.tokenomicsVerification.feeMismatch ? "text-red-400" : "text-green-400"}>
                  {result.tokenomicsVerification.feeMismatch ? "Yes" : "No"}
                </p>
              </div>
              <div className={`p-3 rounded ${result.tokenomicsVerification.unlimitedMinting ? "bg-red-900/30" : "bg-green-900/30"}`}>
                <p className="text-xs text-zinc-400">Unlimited Minting</p>
                <p className={result.tokenomicsVerification.unlimitedMinting ? "text-red-400" : "text-green-400"}>
                  {result.tokenomicsVerification.unlimitedMinting ? "Yes" : "No"}
                </p>
              </div>
              <div className={`p-3 rounded ${result.tokenomicsVerification.canFreezeAccounts ? "bg-red-900/30" : "bg-green-900/30"}`}>
                <p className="text-xs text-zinc-400">Can Freeze Accounts</p>
                <p className={result.tokenomicsVerification.canFreezeAccounts ? "text-red-400" : "text-green-400"}>
                  {result.tokenomicsVerification.canFreezeAccounts ? "Yes" : "No"}
                </p>
              </div>
              <div className={`p-3 rounded ${result.tokenomicsVerification.hasBackdoorAdmin ? "bg-red-900/30" : "bg-green-900/30"}`}>
                <p className="text-xs text-zinc-400">Backdoor Admin</p>
                <p className={result.tokenomicsVerification.hasBackdoorAdmin ? "text-red-400" : "text-green-400"}>
                  {result.tokenomicsVerification.hasBackdoorAdmin ? "Yes" : "No"}
                </p>
              </div>
              <div className={`p-3 rounded ${result.tokenomicsVerification.fakeMultisig ? "bg-red-900/30" : "bg-green-900/30"}`}>
                <p className="text-xs text-zinc-400">Fake Multisig</p>
                <p className={result.tokenomicsVerification.fakeMultisig ? "text-red-400" : "text-green-400"}>
                  {result.tokenomicsVerification.fakeMultisig ? "Yes" : "No"}
                </p>
              </div>
              <div className={`p-3 rounded ${!result.tokenomicsVerification.gracePeriodEnforced ? "bg-red-900/30" : "bg-green-900/30"}`}>
                <p className="text-xs text-zinc-400">Grace Period</p>
                <p className={!result.tokenomicsVerification.gracePeriodEnforced ? "text-red-400" : "text-green-400"}>
                  {result.tokenomicsVerification.gracePeriodEnforced ? "Enforced" : "Not Enforced"}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

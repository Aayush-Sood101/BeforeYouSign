"use client";

import { useState } from "react";
import ContractAnalysis from "../components/ContractAnalysis";
import WalletAnalysis from "../components/WalletAnalysis";
import Link from "next/link";

type Tab = "wallet" | "contract";

export default function AnalyzePage() {
  const [activeTab, setActiveTab] = useState<Tab>("wallet");

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="border-b border-zinc-800">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-xl">🛡️</span>
            </div>
            <div>
              <h1 className="text-xl font-bold">BeforeYouSign</h1>
              <p className="text-xs text-zinc-500">Blockchain Risk Analysis</p>
            </div>
          </Link>
          <nav className="flex items-center gap-4">
            <Link href="/home" className="text-zinc-400 hover:text-white transition-colors text-sm">
              Dashboard
            </Link>
            <Link href="/login" className="text-zinc-400 hover:text-white transition-colors text-sm">
              Login
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-16 px-6">
        <div className="max-w-6xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-violet-900/30 border border-violet-700 rounded-full text-violet-300 text-sm mb-6">
            <span className="w-2 h-2 bg-violet-400 rounded-full animate-pulse" />
            AI-Powered Blockchain Security
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 bg-gradient-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent">
            Protect Your Assets
            <br />
            Before You Sign
          </h1>
          <p className="text-lg text-zinc-400 max-w-2xl mx-auto mb-8">
            Detect scam tokens, phishing interactions, and malicious contract calls 
            using advanced AI analysis. Get real-time risk assessment before approving any transaction.
          </p>
          <div className="flex flex-wrap justify-center gap-4 text-sm">
            <div className="flex items-center gap-2 px-4 py-2 bg-zinc-900 rounded-full">
              <span className="text-green-400">✓</span> Wallet Analysis
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-zinc-900 rounded-full">
              <span className="text-green-400">✓</span> Smart Contract Audit
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-zinc-900 rounded-full">
              <span className="text-green-400">✓</span> Real-time Alerts
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="px-6 pb-20">
        <div className="max-w-4xl mx-auto">
          {/* Tab Navigation */}
          <div className="flex gap-2 mb-8 p-1 bg-zinc-900 rounded-xl w-fit mx-auto">
            <button
              onClick={() => setActiveTab("wallet")}
              className={`px-6 py-3 rounded-lg font-medium transition-all ${
                activeTab === "wallet"
                  ? "bg-violet-600 text-white shadow-lg"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              <span className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
                Wallet Analysis
              </span>
            </button>
            <button
              onClick={() => setActiveTab("contract")}
              className={`px-6 py-3 rounded-lg font-medium transition-all ${
                activeTab === "contract"
                  ? "bg-violet-600 text-white shadow-lg"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              <span className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Contract Analysis
              </span>
            </button>
          </div>

          {/* Analysis Components */}
          {activeTab === "wallet" ? <WalletAnalysis /> : <ContractAnalysis />}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-800 py-8 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-zinc-500">
          <p>© 2026 BeforeYouSign. Protecting your blockchain transactions.</p>
          <div className="flex items-center gap-6">
            <a href="#" className="hover:text-white transition-colors">Privacy</a>
            <a href="#" className="hover:text-white transition-colors">Terms</a>
            <a href="#" className="hover:text-white transition-colors">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

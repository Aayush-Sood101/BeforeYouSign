"use client";

import { useState } from "react";
import ContractAnalysis from "../components/ContractAnalysis";
import WalletAnalysis from "../components/WalletAnalysis";

type Tab = "wallet" | "contract";

export default function AnalyzePage() {
  const [activeTab, setActiveTab] = useState<Tab>("contract");

  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden">
      
      {/* Sophisticated Background Effects */}
      <div className="fixed inset-0 pointer-events-none">
        {/* Gradient orbs */}
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-white/[0.02] rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-white/[0.015] rounded-full blur-3xl" />
        
        {/* Subtle grid pattern */}
        <div 
          className="absolute inset-0 opacity-[0.015]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
            backgroundSize: '64px 64px'
          }}
        />
        
        {/* Top fade gradient */}
        <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-black to-transparent" />
      </div>

      {/* Hero Section */}
      <section className="relative py-20 md:py-28 px-6">
        <div className="max-w-5xl mx-auto text-center">
          {/* Status Badge */}
          <div className="inline-flex items-center gap-3 px-5 py-2.5 bg-gradient-to-r from-white/[0.08] to-white/[0.03] border border-white/10 rounded-full backdrop-blur-sm mb-8 shadow-2xl shadow-white/[0.02]">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white" />
            </span>
            <span className="text-zinc-300 text-sm font-medium tracking-wide">AI-Powered Blockchain Security</span>
          </div>
          
          {/* Main Heading */}
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-8 leading-[1.1] tracking-tight">
            <span className="bg-gradient-to-b from-white via-white to-zinc-400 bg-clip-text text-transparent">
              Protect Your Assets
            </span>
            <br />
            <span className="bg-gradient-to-b from-zinc-300 via-zinc-400 to-zinc-600 bg-clip-text text-transparent">
              Before You Sign
            </span>
          </h1>
          
          {/* Description */}
          <p className="text-lg md:text-xl text-zinc-400 max-w-2xl mx-auto mb-10 leading-relaxed font-light">
            Detect scam tokens, phishing interactions, and malicious contract calls 
            using advanced AI analysis. Get real-time risk assessment before approving any transaction.
          </p>
          
          {/* Feature Pills */}
          <div className="flex flex-wrap justify-center gap-3">
            {[
              { icon: "✓", text: "Wallet Analysis" },
              { icon: "✓", text: "Smart Contract Audit" },
              { icon: "✓", text: "Real-time Alerts" }
            ].map((feature, i) => (
              <div 
                key={i}
                className="group flex items-center gap-2.5 px-5 py-2.5 bg-gradient-to-b from-zinc-800/80 to-zinc-900/80 border border-zinc-700/50 rounded-full backdrop-blur-sm transition-all duration-300 hover:border-zinc-600 hover:from-zinc-800 hover:to-zinc-800"
              >
                <span className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-xs text-white group-hover:bg-white/20 transition-colors">
                  {feature.icon}
                </span>
                <span className="text-sm text-zinc-300 font-medium">{feature.text}</span>
              </div>
            ))}
          </div>
        </div>
        
        {/* Decorative line */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-px h-20 bg-gradient-to-b from-transparent via-zinc-700 to-transparent" />
      </section>

      {/* Main Content */}
      <main className="relative px-6 pb-24">
        <div className="max-w-5xl mx-auto">
          {/* Tab Navigation */}
          <div className="flex justify-center mb-10">
            <div className="inline-flex gap-1 p-1.5 bg-gradient-to-b from-zinc-800/90 to-zinc-900/90 border border-zinc-700/50 rounded-2xl backdrop-blur-xl shadow-2xl shadow-black/50">
              <button
                onClick={() => setActiveTab("contract")}
                className={`relative px-8 py-3.5 rounded-xl font-medium transition-all duration-300 ${
                  activeTab === "contract"
                    ? "bg-white text-black shadow-xl shadow-white/20"
                    : "text-zinc-400 hover:text-white hover:bg-white/[0.05]"
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span className="tracking-wide">Contract Analysis</span>
                </span>
              </button>
              <button
                onClick={() => setActiveTab("wallet")}
                className={`relative px-8 py-3.5 rounded-xl font-medium transition-all duration-300 ${
                  activeTab === "wallet"
                    ? "bg-white text-black shadow-xl shadow-white/20"
                    : "text-zinc-400 hover:text-white hover:bg-white/[0.05]"
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                  </svg>
                  <span className="tracking-wide">Wallet Analysis</span>
                </span>
              </button>
            </div>
          </div>

          {/* Analysis Components */}
          <div className="relative">
            {/* Subtle glow behind content */}
            <div className="absolute inset-0 bg-gradient-to-b from-white/[0.01] via-transparent to-transparent rounded-3xl blur-xl" />
            <div className="relative">
              {activeTab === "wallet" ? <WalletAnalysis /> : <ContractAnalysis />}
            </div>
          </div>
        </div>
      </main>

    </div>
  );
}

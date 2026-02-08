import React from 'react';
import { Shield } from 'lucide-react';

const Layout = ({ children }) => {
  return (
    <div className="min-h-screen bg-gradient-dark">
      {/* Animated grid overlay */}
      <div className="fixed inset-0 opacity-[0.03] pointer-events-none" 
           style={{
             backgroundImage: 'linear-gradient(rgba(99, 102, 241, 0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(99, 102, 241, 0.5) 1px, transparent 1px)',
             backgroundSize: '50px 50px'
           }} />
      
      {/* Top navbar */}
      <nav className="relative z-10 border-b border-slate-700/50 bg-slate-900/50 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="absolute inset-0 bg-indigo-500 blur-lg opacity-60 rounded-lg" />
              <div className="relative bg-gradient-to-br from-indigo-500 to-purple-600 p-2 rounded-lg">
                <Shield className="w-5 h-5 text-white" />
              </div>
            </div>
            <div>
              <h1 className="text-lg font-bold text-white tracking-tight">Walletwork</h1>
              <p className="text-[10px] text-slate-400 uppercase tracking-widest">Pre-Transaction Firewall</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30">
              <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
              <span className="text-xs text-emerald-400 font-medium">LIVE</span>
            </div>
          </div>
        </div>
      </nav>

      {/* Main content */}
      <main className="relative z-10">
        {children}
      </main>
    );
};

export default Layout;

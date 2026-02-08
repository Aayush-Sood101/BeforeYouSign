import React from 'react';
import { ShieldCheck, Github, ExternalLink } from 'lucide-react';

const Layout = ({ children }) => {
    return (
        <div className="min-h-screen flex flex-col relative font-sans text-gray-100 selection:bg-cyan-500/30">
            {/* Background Ambience */}
            <div className="fixed inset-0 z-[-1] pointer-events-none">
                <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-[128px]"></div>
                <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-cyan-600/10 rounded-full blur-[128px]"></div>
            </div>

            {/* Navbar */}
            <nav className="w-full border-b border-white/5 bg-black/20 backdrop-blur-md sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <ShieldCheck className="w-8 h-8 text-cyan-400" />
                        <span className="font-bold text-xl tracking-tight text-white">
                            WALLETWORK <span className="text-cyan-400">.AI</span>
                        </span>
                    </div>
                    <div className="flex items-center gap-6 text-sm font-medium text-gray-400">
                        <a href="#" className="hover:text-white transition-colors">Documentation</a>
                        <a href="#" className="hover:text-white transition-colors flex items-center gap-1">
                            <Github className="w-4 h-4" /> GitHub
                        </a>
                    </div>
                </div>
            </nav>

            {/* Main Content */}
            <main className="flex-grow w-full max-w-7xl mx-auto px-4 md:px-6 py-12">
                {children}
            </main>

            {/* Footer */}
            <footer className="w-full border-t border-white/5 bg-black/40 py-8">
                <div className="max-w-7xl mx-auto px-4 text-center text-gray-500 text-sm">
                    <p>© 2026 Walletwork Security. Built for the Web3 ecosystem.</p>
                    <div className="flex justify-center gap-4 mt-4">
                        <span className="flex items-center gap-1 hover:text-cyan-400 cursor-pointer">
                            Terms <ExternalLink className="w-3 h-3" />
                        </span>
                        <span className="flex items-center gap-1 hover:text-cyan-400 cursor-pointer">
                            Privacy <ExternalLink className="w-3 h-3" />
                        </span>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default Layout;

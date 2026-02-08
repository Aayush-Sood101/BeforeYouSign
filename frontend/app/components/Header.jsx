"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Menu, X, ShieldCheck } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

// Utility for cleaner tailwind class merging
function cn(...inputs) {
  return twMerge(clsx(inputs));
}

const navLinks = [
  { href: "/home", label: "Home" },
  { href: "/analyze", label: "Analyze" },
  { href: "/pricing", label: "Pricing" },
];

const Header = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Detect scroll to add background opacity/blur
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      <header
        className={cn(
          "fixed top-0 left-0 right-0 z-50 transition-all duration-300 border-b",
          isScrolled
            ? "bg-black/80 backdrop-blur-md border-white/10 py-3"
            : "bg-transparent border-transparent py-5"
        )}
      >
        <div className="max-w-7xl mx-auto px-6 h-12 flex items-center justify-between relative">
          
          {/* 1. LOGO AREA */}
          <Link href="/home" className="flex items-center gap-3 z-20 group">
            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-black transition-transform group-hover:scale-105">
              <ShieldCheck size={20} strokeWidth={2.5} />
            </div>
            <span className="text-white font-bold text-lg tracking-tight">
              BeforeYouSign
            </span>
          </Link>

          {/* 2. DESKTOP NAV - ABSOLUTE CENTERED 
              Using absolute positioning ensures it stays exactly in the center 
              of the header, regardless of logo width.
          */}
          <nav className="hidden md:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-zinc-400 hover:text-white transition-colors duration-200"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* 3. DESKTOP ACTIONS (RIGHT) */}
          <div className="hidden md:flex items-center gap-6 z-20">
            <Link
              href="/login"
              className="text-sm font-medium text-zinc-300 hover:text-white transition-colors"
            >
              Log in
            </Link>
            <Link
              href="/signup"
              className="px-5 py-2 text-sm font-semibold text-black bg-white rounded-full hover:bg-zinc-200 transition-all shadow-[0_0_20px_rgba(255,255,255,0.1)]"
            >
              Sign up
            </Link>
          </div>

          {/* 4. MOBILE TOGGLE */}
          <button
            className="md:hidden text-zinc-300 hover:text-white z-50 p-1"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </header>

      {/* MOBILE MENU OVERLAY */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-black pt-24 px-6 md:hidden flex flex-col items-center gap-8"
          >
            <div className="flex flex-col items-center gap-6 w-full">
              {navLinks.map((link, i) => (
                <motion.div
                  key={link.href}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                >
                  <Link
                    href={link.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="text-2xl font-medium text-zinc-400 hover:text-white"
                  >
                    {link.label}
                  </Link>
                </motion.div>
              ))}
            </div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="w-full max-w-xs flex flex-col gap-4 mt-8"
            >
              <Link
                href="/login"
                onClick={() => setIsMobileMenuOpen(false)}
                className="w-full py-3 text-center text-zinc-300 border border-white/10 rounded-full hover:bg-white/5 active:scale-95 transition-all"
              >
                Log in
              </Link>
              <Link
                href="/signup"
                onClick={() => setIsMobileMenuOpen(false)}
                className="w-full py-3 text-center font-semibold text-black bg-white rounded-full hover:bg-zinc-200 active:scale-95 transition-all"
              >
                Sign up
              </Link>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Header;
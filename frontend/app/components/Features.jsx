'use client';

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ShieldCheck, Search, FileText, Wallet, ArrowRight } from "lucide-react";

const features = [
  {
    icon: <ShieldCheck className="w-6 h-6" />,
    title: "Smart Contract Analysis",
    description:
      "Upload smart contract PDFs and GitHub repos for AI-powered vulnerability detection and risk assessment.",
  },
  {
    icon: <Wallet className="w-6 h-6" />,
    title: "Wallet Risk Detection",
    description:
      "Analyze wallet addresses and transactions to identify phishing attempts, scam tokens, and malicious actors.",
  },
  {
    icon: <Search className="w-6 h-6" />,
    title: "On-Chain Intelligence",
    description:
      "Leverage on-chain data analysis and graph-based signals to detect suspicious patterns before you sign.",
  },
  {
    icon: <FileText className="w-6 h-6" />,
    title: "Tokenomics Verification",
    description:
      "Verify token economics, detect discrepancies between documentation and actual contract code.",
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: "easeOut" },
  },
};

function Features() {
  return (
    <section className="relative bg-black pt-40 pb-24 overflow-hidden">
      {/* Background Gradients for subtle depth */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-white/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[30%] h-[30%] bg-white/5 rounded-full blur-[100px]" />
      </div>

      <div className="relative max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
        <motion.div
          className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-start"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
        >
          {/* Left Column: Typography & CTA */}
          <motion.div variants={itemVariants} className="lg:sticky lg:top-32">
            <h2 className="text-white tracking-tighter">
              <span className="block text-4xl md:text-6xl font-medium mb-2">
                Protect Assets.
              </span>
              <span className="block text-4xl md:text-6xl font-serif italic text-neutral-400">
                Verify Everything.
              </span>
            </h2>
            
            <div className="h-1 w-20 bg-white mt-8 mb-8" />

            <p className="text-lg md:text-xl text-neutral-400 leading-relaxed max-w-md font-light">
              BeforeYouSign provides comprehensive blockchain risk analysis,
              helping you identify vulnerabilities, scams, and malicious contracts
              before making any transaction.
            </p>

            <div className="mt-10">
              <Link
                href="/analyze"
                className="group inline-flex items-center justify-center gap-3 px-8 py-4 rounded-full bg-white text-black hover:bg-neutral-200 transition-all duration-300 text-lg font-semibold tracking-tight"
              >
                Start Analysis
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </motion.div>

          {/* Right Column: Feature Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                variants={itemVariants}
                className="group relative p-8 rounded-3xl border border-neutral-800 bg-neutral-900/50 backdrop-blur-sm hover:border-neutral-600 transition-colors duration-300"
              >
                <div className="mb-6 inline-flex items-center justify-center w-12 h-12 rounded-full bg-neutral-800 text-white group-hover:bg-white group-hover:text-black transition-colors duration-300">
                  {feature.icon}
                </div>
                
                <h3 className="text-white text-xl font-medium tracking-tight mb-3">
                  {feature.title}
                </h3>
                
                <p className="text-neutral-400 text-sm leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}

export default Features;
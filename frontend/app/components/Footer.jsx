import React from "react";
import Link from "next/link";
import { BsLinkedin, BsTelegram, BsTwitter } from "react-icons/bs";
import { ShieldCheck } from "lucide-react";

function Footer() {
  const navLinks = [
    { label: "Home", href: "/home" },
    { label: "Analyze", href: "/analyze" },
    { label: "Login", href: "/login" },
    { label: "Sign Up", href: "/signup" },
  ];
  const socialIcons = [
    { icon: <BsTwitter className="w-4 h-4" />, href: "/" },
    { icon: <BsTelegram className="w-4 h-4" />, href: "/" },
    { icon: <BsLinkedin className="w-4 h-4" />, href: "/" },
  ];

  return (
    <footer className="bg-black text-white border-t border-white/10">
      <div className="max-w-7xl mx-auto px-6 py-16 md:py-20">
        <div className="flex flex-col md:flex-row justify-between gap-12 md:gap-24">
          
          {/* Left Section: Brand & Nav */}
          <div className="flex-1">
            <Link href="/home" className="flex items-center gap-2 group w-fit mb-6">
              <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-black transition-transform group-hover:scale-105">
                <ShieldCheck size={20} strokeWidth={2.5} />
              </div>
              <span className="font-bold text-xl tracking-tight">BeforeYouSign</span>
            </Link>
            
            <p className="text-zinc-400 text-sm leading-relaxed max-w-sm mb-8">
              AI-powered blockchain security platform. Analyze smart contracts
              and wallets for risks before you sign.
            </p>

            <nav className="flex flex-wrap gap-x-8 gap-y-4">
              {navLinks.map((link, i) => (
                <Link key={i} href={link.href}>
                  <span className="text-sm font-medium text-zinc-400 hover:text-white transition-colors">
                    {link.label}
                  </span>
                </Link>
              ))}
            </nav>
          </div>

          {/* Right Section: Contact & Socials */}
          <div className="flex flex-col md:items-end">
            <p className="text-sm font-semibold text-white tracking-wider uppercase mb-4">
              Contact Us
            </p>
            <Link
              href="mailto:contact@beforeyousign.io"
              className="text-zinc-400 hover:text-white text-sm transition-colors mb-8"
            >
              contact@beforeyousign.io
            </Link>

            <div className="flex items-center gap-4">
              <span className="text-sm text-zinc-500 hidden md:block">Follow us</span>
              <div className="flex gap-3">
                {socialIcons.map((item, idx) => (
                  <Link
                    key={idx}
                    href={item.href}
                    target="_blank"
                    className="w-10 h-10 flex items-center justify-center rounded-full border border-white/10 bg-zinc-900 text-zinc-400 transition-all duration-300 hover:bg-white hover:text-black hover:border-white"
                  >
                    {item.icon}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-white/10 py-8">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-zinc-500">
            © {new Date().getFullYear()} BeforeYouSign. All rights reserved.
          </p>
          <div className="flex gap-6">
             {/* Optional: You can add Privacy/Terms links here later if needed */}
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
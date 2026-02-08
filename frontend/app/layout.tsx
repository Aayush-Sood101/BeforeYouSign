import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Header from "./components/Header";
import Footer from "./components/Footer";
import { ClerkProvider } from "@clerk/nextjs";
import { dark } from "@clerk/themes";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "BeforeYouSign - Blockchain Risk Analysis",
  description: "AI-powered blockchain security platform. Detect scam tokens, phishing wallet interactions, and malicious contract calls before signing any transaction.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider
      appearance={{
        baseTheme: dark,
        variables: {
          colorPrimary: "#a78bfa",
          colorBackground: "#18181b",
          colorInputBackground: "#27272a",
          colorInputText: "#ffffff",
          colorText: "#ffffff",
          colorTextSecondary: "#a1a1aa",
          colorTextOnPrimaryBackground: "#ffffff",
        },
        elements: {
          card: "bg-zinc-900 border border-zinc-800",
          headerTitle: "text-white",
          headerSubtitle: "text-zinc-400",
          formFieldLabel: "text-zinc-300",
          formFieldInput: "bg-zinc-800 border-zinc-700 text-white",
          footerActionLink: "text-violet-400 hover:text-violet-300",
          socialButtonsBlockButton: "bg-zinc-800 border-zinc-700 text-white hover:bg-zinc-700",
          socialButtonsBlockButtonText: "text-white",
          dividerLine: "bg-zinc-700",
          dividerText: "text-zinc-400",
          formButtonPrimary: "bg-violet-500 hover:bg-violet-600 text-white",
          identityPreviewText: "text-white",
          identityPreviewEditButtonIcon: "text-violet-400",
          formFieldInputShowPasswordButton: "text-zinc-400 hover:text-white",
          otpCodeFieldInput: "bg-zinc-800 border-zinc-700 text-white",
          formResendCodeLink: "text-violet-400 hover:text-violet-300",
          userButtonPopoverCard: "bg-zinc-900 border border-zinc-800",
          userButtonPopoverActionButton: "text-zinc-300 hover:text-white hover:bg-zinc-800",
          userButtonPopoverActionButtonText: "text-zinc-300",
          userButtonPopoverActionButtonIcon: "text-zinc-400",
          userButtonPopoverFooter: "hidden",
        },
      }}
    >
      <html lang="en">
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased bg-black`}
        >
          <Header />
          {children}
          <Footer />
        </body>
      </html>
    </ClerkProvider>
  );
}

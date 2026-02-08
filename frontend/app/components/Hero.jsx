import React from "react";
import { FaPlay } from "react-icons/fa6";
import Link from "next/link";

function Hero() {
  const commonClasses = {
    button:
      "inline-flex items-center justify-center px-5 py-2 font-sans text-base font-semibold transition-all duration-200 rounded-full sm:leading-8 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary focus:ring-offset-secondary",
    buttonPrimary:
      "border-2 border-transparent bg-white text-black hover:bg-opacity-90",
    buttonSecondary:
      "bg-transparent border-2 text-white border-primary hover:bg-white hover:text-black",
  };

  return (
    <div className="relative pt-48 pb-12 bg-black xl:pt-60 sm:pb-16 lg:pb-32 xl:pb-48 2xl:pb-56">
      <div className="absolute inset-0">
        <img
          className="object-cover w-full h-full opacity-60"
          src="https://www.auraui.com/memeimage/web-dev.jpeg"
          alt="Background"
        />
      </div>

      <div className="relative">
        <div className="px-6 mx-auto sm:px-8 lg:px-12 max-w-7xl">
          <div className="w-full lg:w-2/3 xl:w-1/2">
            <h1 className="font-sans text-base font-normal tracking-tight text-white text-opacity-70">
              AI-Powered Blockchain Security
            </h1>
            <p className="mt-6 tracking-tighter text-white">
              <span className="font-sans font-normal text-7xl">
                Protect with
              </span>
              <br />
              <span className="font-serif italic font-normal text-8xl">
                BeforeYouSign
              </span>
            </p>
            <p className="mt-12 font-sans text-base font-normal leading-7 text-white text-opacity-70">
              Detect scam tokens, phishing wallet interactions, and malicious 
              contract calls using advanced AI analysis. Get real-time risk 
              assessment before approving any transaction.
            </p>
            <p className="mt-8 font-sans text-xl font-normal text-white">
              Free to analyze. Secure by design.
            </p>

            <div className="flex items-center mt-5 space-x-3 sm:space-x-4">
              <Link
                href="/analyze"
                title="Start Analyzing"
                className={`${commonClasses.button} ${commonClasses.buttonPrimary}`}
                role="button"
              >
                Start Analyzing
              </Link>

              <Link
                href="/signup"
                title="Create Account"
                className={`${commonClasses.button} ${commonClasses.buttonSecondary}`}
                role="button"
              >
                <FaPlay className="h-5 w-5 mr-2" />
                Create Account
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Hero;

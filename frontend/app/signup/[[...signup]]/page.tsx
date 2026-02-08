import { SignUp } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import { WavyBackground } from "@/app/components/wavy-background";

export default function SignupPage() {
  return (
    <WavyBackground
      colors={["#38bdf8", "#818cf8", "#c084fc", "#e879f9", "#22d3ee"]}
      backgroundFill="black"
      blur={10}
      speed="slow"
      waveOpacity={0.5}
      // We use flexbox to perfectly center the sign-in card inside the available space.
      containerClassName="h-full flex items-center justify-center p-4"
    >
    <div className="min-h-screen bg-black text-white flex flex-col">
      <main className="flex-1 flex items-center justify-center px-6 py-12">
        <SignUp
          appearance={{
            baseTheme: dark,
            elements: {
              rootBox: "mx-auto",
              card: "bg-zinc-900 border border-zinc-800",
              headerTitle: "text-white",
              headerSubtitle: "text-zinc-400",
              socialButtonsBlockButton: "bg-zinc-800 border-zinc-700 text-white hover:bg-zinc-700",
              socialButtonsBlockButtonText: "text-white",
              formFieldLabel: "text-zinc-300",
              formFieldInput: "bg-zinc-800 border-zinc-700 text-white",
              footerActionLink: "text-violet-400 hover:text-violet-300",
              identityPreviewEditButton: "text-violet-400",
              identityPreviewText: "text-white",
              dividerLine: "bg-zinc-700",
              dividerText: "text-zinc-400",
              formButtonPrimary: "bg-violet-500 hover:bg-violet-600 text-white",
              formFieldInputShowPasswordButton: "text-zinc-400 hover:text-white",
              otpCodeFieldInput: "bg-zinc-800 border-zinc-700 text-white",
              formResendCodeLink: "text-violet-400 hover:text-violet-300",
              footer: "text-zinc-400",
              footerAction: "text-zinc-400",
            },
          }}
          routing="path"
          path="/signup"
          signInUrl="/login"
          forceRedirectUrl="/analyze"
        />
      </main>
    </div>
    </WavyBackground>
  );
}

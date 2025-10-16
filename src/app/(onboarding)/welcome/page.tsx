"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export default function WelcomePage() {
  const router = useRouter();

  const handleConnect = () => {
    router.push("/select-bank");
  };

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-6">
      <div className="w-full max-w-[560px] flex flex-col h-[calc(100vh-3rem)]">
        {/* Top spacing */}
        <div className="h-16" />

        {/* Headline */}
        <h1 className="text-[32px] leading-[40px] font-normal text-on-surface mb-4">
          The complete picture of your finances.
        </h1>

        {/* Body text */}
        <p className="text-base leading-6 font-normal text-on-surface-variant">
          Connect your accounts in seconds with Open Finance to see everything
          in one place. Securely and automatically.
        </p>

        {/* Spacer to push button to bottom */}
        <div className="flex-1" />

        {/* Primary CTA Button */}
        <Button
          onClick={handleConnect}
          className="w-full h-10 bg-primary text-on-primary hover:bg-primary/90 rounded-full text-sm font-medium transition-all duration-200 hover:shadow-lg active:scale-[0.98]"
        >
          Connect my first account
        </Button>

        {/* Bottom spacing */}
        <div className="h-6" />
      </div>
    </div>
  );
}

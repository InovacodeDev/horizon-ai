"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Shield } from "lucide-react";

export default function SecurityInterstitialPage() {
  const router = useRouter();
  const [bankName, setBankName] = useState("your bank");

  useEffect(() => {
    // Get selected bank from session storage
    const selectedBankData = sessionStorage.getItem("selectedBank");
    if (selectedBankData) {
      const bank = JSON.parse(selectedBankData);
      setBankName(bank.name);
    } else {
      // If no bank selected, redirect back to selection
      router.push("/select-bank");
    }
  }, [router]);

  const handleContinue = () => {
    // TODO: In task 7.1, this will initiate the Open Finance OAuth flow
    // For now, we'll just show a placeholder
    alert("Open Finance integration will be implemented in task 7.1");
    // router.push('/dashboard'); // Will be implemented later
  };

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-6">
      <div className="w-full max-w-[560px] flex flex-col items-center text-center">
        {/* Security Icon */}
        <div className="w-20 h-20 rounded-full bg-secondary/10 flex items-center justify-center mb-8">
          <Shield className="w-10 h-10 text-secondary" />
        </div>

        {/* Heading */}
        <h1 className="text-[22px] leading-7 font-medium text-on-surface mb-4">
          Secure Connection
        </h1>

        {/* Body Text */}
        <p className="text-base leading-6 font-normal text-on-surface-variant mb-2">
          You will be securely directed to{" "}
          <strong className="font-medium text-on-surface">{bankName}</strong> to
          authorize the connection.
        </p>

        {/* Security Emphasis */}
        <p className="text-base leading-6 font-medium text-on-surface mb-12">
          <strong>Horizon AI never sees your password.</strong>
        </p>

        {/* Continue Button */}
        <Button
          onClick={handleContinue}
          className="w-full max-w-sm h-10 bg-primary text-on-primary hover:bg-primary/90 rounded-full text-sm font-medium transition-all duration-200 hover:shadow-lg active:scale-[0.98]"
        >
          Continue
        </Button>

        {/* Back Link */}
        <button
          onClick={() => router.back()}
          className="mt-6 text-sm text-primary hover:underline"
        >
          Choose a different bank
        </button>
      </div>
    </div>
  );
}

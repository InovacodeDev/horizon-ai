"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Shield } from "lucide-react";

export default function SecurityInterstitialPage() {
  const router = useRouter();
  const [bankName, setBankName] = useState("your bank");
  const [bankId, setBankId] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Get selected bank from session storage
    const selectedBankData = sessionStorage.getItem("selectedBank");
    if (selectedBankData) {
      const bank = JSON.parse(selectedBankData);
      setBankName(bank.name);
      setBankId(bank.id);
    } else {
      // If no bank selected, redirect back to selection
      router.push("/select-bank");
    }
  }, [router]);

  const handleContinue = async () => {
    if (!bankId) {
      alert("Please select a bank first");
      return;
    }

    setIsLoading(true);

    try {
      // Call the Open Finance connect endpoint
      const response = await fetch("/api/v1/of/connect", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          institution: bankId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to initiate connection");
      }

      const data = await response.json();

      // Redirect to Open Finance OAuth page
      if (data.redirectUrl) {
        window.location.href = data.redirectUrl;
      } else {
        throw new Error("No redirect URL received");
      }
    } catch (error) {
      console.error("Connection error:", error);
      alert(
        error instanceof Error
          ? error.message
          : "Failed to connect to bank. Please try again."
      );
      setIsLoading(false);
    }
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
          disabled={isLoading}
          className="w-full max-w-sm h-10 bg-primary text-on-primary hover:bg-primary/90 rounded-full text-sm font-medium transition-all duration-200 hover:shadow-lg active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? "Connecting..." : "Continue"}
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

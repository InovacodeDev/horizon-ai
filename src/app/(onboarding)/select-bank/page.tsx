"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Search, ChevronRight } from "lucide-react";

// Brazilian banks data
const banks = [
  { id: "itau", name: "Itaú Unibanco", logo: "🏦" },
  { id: "bradesco", name: "Bradesco", logo: "🏦" },
  { id: "santander", name: "Santander", logo: "🏦" },
  { id: "bb", name: "Banco do Brasil", logo: "🏦" },
  { id: "nubank", name: "Nubank", logo: "💜" },
  { id: "inter", name: "Banco Inter", logo: "🧡" },
];

export default function SelectBankPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");

  const filteredBanks = banks.filter((bank) =>
    bank.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleBankSelect = (bankId: string, bankName: string) => {
    // Store selected bank in session storage for the interstitial
    sessionStorage.setItem(
      "selectedBank",
      JSON.stringify({ id: bankId, name: bankName })
    );
    router.push("/security-interstitial");
  };

  return (
    <div className="min-h-screen bg-surface">
      <div className="w-full max-w-[560px] mx-auto p-6">
        {/* Header */}
        <h1 className="text-[22px] leading-7 font-medium text-on-surface mb-6">
          Choose your bank
        </h1>

        {/* Search Bar */}
        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-on-surface-variant" />
          <Input
            type="text"
            placeholder="Search for your bank"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-12 h-14 rounded-full bg-surface border-outline text-on-surface placeholder:text-on-surface-variant"
          />
        </div>

        {/* Bank List */}
        <div className="space-y-2">
          {filteredBanks.map((bank, index) => (
            <button
              key={bank.id}
              onClick={() => handleBankSelect(bank.id, bank.name)}
              className="w-full h-[72px] bg-surface hover:bg-on-surface/[0.08] active:bg-primary/[0.12] rounded-xl px-4 flex items-center gap-4 transition-all duration-200 border border-transparent hover:border-outline group"
              style={{
                animation: `fadeIn 200ms ease-out ${index * 50}ms both`,
              }}
            >
              {/* Bank Logo */}
              <div className="w-12 h-12 rounded-full bg-primary-container flex items-center justify-center text-2xl">
                {bank.logo}
              </div>

              {/* Bank Name */}
              <span className="flex-1 text-left text-base font-normal text-on-surface">
                {bank.name}
              </span>

              {/* Chevron Icon */}
              <ChevronRight className="h-6 w-6 text-on-surface-variant group-hover:text-on-surface transition-colors" />
            </button>
          ))}

          {filteredBanks.length === 0 && (
            <div className="text-center py-12 text-on-surface-variant">
              No banks found matching &quot;{searchQuery}&quot;
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(16px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}

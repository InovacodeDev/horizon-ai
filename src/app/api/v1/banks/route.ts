import { NextResponse } from "next/server";
import { getCached, setCached, CACHE_KEYS, CACHE_TTL } from "@/lib/cache/redis";

// Brazilian banks data
const banks = [
  { id: "itau", name: "Itaú Unibanco", logo: "🏦" },
  { id: "bradesco", name: "Bradesco", logo: "🏦" },
  { id: "santander", name: "Santander", logo: "🏦" },
  { id: "bb", name: "Banco do Brasil", logo: "🏦" },
  { id: "nubank", name: "Nubank", logo: "💜" },
  { id: "inter", name: "Banco Inter", logo: "🧡" },
];

export async function GET() {
  try {
    // Try to get cached bank list
    const cachedBanks = await getCached(CACHE_KEYS.BANK_LIST);
    if (cachedBanks) {
      return NextResponse.json(cachedBanks, { status: 200 });
    }

    // If not cached, return banks and cache them
    const response = { banks };
    await setCached(CACHE_KEYS.BANK_LIST, response, CACHE_TTL.BANK_LIST);

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error("Error fetching banks:", error);
    return NextResponse.json(
      { error: "Failed to fetch banks" },
      { status: 500 }
    );
  }
}

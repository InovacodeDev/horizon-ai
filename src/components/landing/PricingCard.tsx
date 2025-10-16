"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";

interface PricingCardProps {
  plan: "free" | "premium";
  price: string;
  features: string[];
  highlighted?: boolean;
  ctaText: string;
  ctaHref: string;
  index: number;
}

export function PricingCard({
  plan,
  price,
  features,
  highlighted = false,
  ctaText,
  ctaHref,
  index,
}: PricingCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{
        duration: 0.4,
        delay: index * 0.1,
        ease: [0.4, 0, 0.2, 1],
      }}
      className={`bg-surface rounded-[var(--radius-m)] p-8 shadow-md hover:shadow-lg transition-all duration-[var(--duration-medium)] ${
        highlighted ? "border-2 border-primary ring-4 ring-primary/10" : ""
      }`}
    >
      <div className="flex flex-col h-full">
        <div className="mb-6">
          <h3 className="text-2xl font-bold text-on-surface mb-2 capitalize">
            {plan}
          </h3>
          <div className="flex items-baseline gap-1">
            <span className="text-4xl font-bold text-primary">{price}</span>
            {price !== "Grátis" && (
              <span className="text-on-surface-variant">/mês</span>
            )}
          </div>
        </div>

        <ul className="space-y-3 mb-8 flex-grow">
          {features.map((feature, idx) => (
            <li key={idx} className="flex items-start gap-3">
              <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
              <span className="text-on-surface-variant">{feature}</span>
            </li>
          ))}
        </ul>

        <Link href={ctaHref} className="w-full">
          <Button
            variant={highlighted ? "default" : "outline"}
            size="lg"
            className="w-full"
          >
            {ctaText}
          </Button>
        </Link>
      </div>
    </motion.div>
  );
}

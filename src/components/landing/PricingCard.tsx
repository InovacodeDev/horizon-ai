"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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

export function PricingCard({ plan, price, features, highlighted = false, ctaText, ctaHref, index }: PricingCardProps) {
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
    >
      <Card
        variant={highlighted ? "elevated" : "outlined"}
        interactive={false}
        className={`h-full ${highlighted ? "ring-2 ring-[hsl(var(--md-sys-color-primary))]" : ""}`}
      >
        <CardContent className="flex flex-col h-full py-8">
          <div className="mb-6">
            {/* MD3 Headline Medium Typography */}
            <h3 className="font-[family-name:var(--md-sys-typescale-headline-medium-font)] text-[length:var(--md-sys-typescale-headline-medium-size)] leading-[var(--md-sys-typescale-headline-medium-line-height)] font-[number:var(--md-sys-typescale-headline-medium-weight)] tracking-[var(--md-sys-typescale-headline-medium-tracking)] text-[hsl(var(--md-sys-color-on-surface))] mb-2 capitalize">
              {plan}
            </h3>
            <div className="flex items-baseline gap-1">
              {/* MD3 Display Medium Typography for price */}
              <span className="font-[family-name:var(--md-sys-typescale-display-medium-font)] text-[length:var(--md-sys-typescale-display-medium-size)] leading-[var(--md-sys-typescale-display-medium-line-height)] font-[number:var(--md-sys-typescale-display-medium-weight)] tracking-[var(--md-sys-typescale-display-medium-tracking)] text-[hsl(var(--md-sys-color-primary))]">
                {price}
              </span>
              {price !== "Grátis" && (
                <span className="font-[family-name:var(--md-sys-typescale-body-medium-font)] text-[length:var(--md-sys-typescale-body-medium-size)] leading-[var(--md-sys-typescale-body-medium-line-height)] font-[number:var(--md-sys-typescale-body-medium-weight)] tracking-[var(--md-sys-typescale-body-medium-tracking)] text-[hsl(var(--md-sys-color-on-surface-variant))]">
                  /mês
                </span>
              )}
            </div>
          </div>

          {/* Features List */}
          <ul className="space-y-3 mb-8 flex-grow">
            {features.map((feature, idx) => (
              <li key={idx} className="flex items-start gap-3">
                <Check className="w-5 h-5 text-[hsl(var(--md-sys-color-primary))] flex-shrink-0 mt-0.5" />
                <span className="font-[family-name:var(--md-sys-typescale-body-small-font)] text-[length:var(--md-sys-typescale-body-small-size)] leading-[var(--md-sys-typescale-body-small-line-height)] font-[number:var(--md-sys-typescale-body-small-weight)] tracking-[var(--md-sys-typescale-body-small-tracking)] text-[hsl(var(--md-sys-color-on-surface-variant))]">
                  {feature}
                </span>
              </li>
            ))}
          </ul>

          <Link href={ctaHref} className="w-full mb-8">
            <Button variant={highlighted ? "filled" : "outlined"} size="medium" className="w-full">
              {ctaText}
            </Button>
          </Link>
        </CardContent>
      </Card>
    </motion.div>
  );
}

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
        ease: [0.4, 0, 0.2, 1], // MD3 Standard easing
      }}
      className={highlighted ? "ring-2 ring-[hsl(var(--md-sys-color-primary))] ring-offset-4" : ""}
    >
      <Card variant="elevated" elevation={highlighted ? 2 : 1}>
        <CardContent className="flex flex-col h-full p-8">
          <div className="mb-6">
            <h3 className="text-[length:var(--md-sys-typescale-headline-small-size)] leading-[var(--md-sys-typescale-headline-small-line-height)] font-[var(--md-sys-typescale-headline-small-weight)] text-[hsl(var(--md-sys-color-on-surface))] mb-2 capitalize">
              {plan}
            </h3>
            <div className="flex items-baseline gap-1">
              <span className="text-[length:var(--md-sys-typescale-display-small-size)] leading-[var(--md-sys-typescale-display-small-line-height)] font-[var(--md-sys-typescale-display-small-weight)] text-[hsl(var(--md-sys-color-primary))]">
                {price}
              </span>
              {price !== "Grátis" && (
                <span className="text-[length:var(--md-sys-typescale-body-medium-size)] text-[hsl(var(--md-sys-color-on-surface-variant))]">
                  /mês
                </span>
              )}
            </div>
          </div>

          <ul className="space-y-3 mb-8 flex-grow">
            {features.map((feature, idx) => (
              <li key={idx} className="flex items-start gap-3">
                <Check className="w-5 h-5 text-[hsl(var(--md-sys-color-primary))] flex-shrink-0 mt-0.5" />
                <span className="text-[length:var(--md-sys-typescale-body-medium-size)] leading-[var(--md-sys-typescale-body-medium-line-height)] tracking-[var(--md-sys-typescale-body-medium-tracking)] text-[hsl(var(--md-sys-color-on-surface-variant))]">
                  {feature}
                </span>
              </li>
            ))}
          </ul>

          <Link href={ctaHref} className="w-full">
            <Button variant={highlighted ? "filled" : "outlined"} size="large" fullWidth>
              {ctaText}
            </Button>
          </Link>
        </CardContent>
      </Card>
    </motion.div>
  );
}

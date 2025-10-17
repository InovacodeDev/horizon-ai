"use client";

import { motion } from "framer-motion";
import { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";

interface FeatureCardProps {
  icon: ReactNode;
  title: string;
  description: string;
  index: number;
}

export function FeatureCard({ icon, title, description, index }: FeatureCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{
        duration: 0.4,
        delay: index * 0.1,
        ease: [0.4, 0, 0.2, 1], // Standard easing
      }}
    >
      <Card variant="elevated" interactive className="h-full">
        <CardContent className="flex flex-col items-center text-center pt-8">
          {/* MD3 Icon - 48px */}
          <div className="mb-4 text-[hsl(var(--md-sys-color-primary))] flex items-center justify-center h-12 w-12">
            {icon}
          </div>
          {/* MD3 Headline Small Typography */}
          <h3 className="font-[family-name:var(--md-sys-typescale-headline-small-font)] text-[length:var(--md-sys-typescale-headline-small-size)] leading-[var(--md-sys-typescale-headline-small-line-height)] font-[number:var(--md-sys-typescale-headline-small-weight)] tracking-[var(--md-sys-typescale-headline-small-tracking)] text-[hsl(var(--md-sys-color-on-surface))] mb-3">
            {title}
          </h3>
          {/* MD3 Body Medium Typography */}
          <p className="font-[family-name:var(--md-sys-typescale-body-medium-font)] text-[length:var(--md-sys-typescale-body-medium-size)] leading-[var(--md-sys-typescale-body-medium-line-height)] font-[number:var(--md-sys-typescale-body-medium-weight)] tracking-[var(--md-sys-typescale-body-medium-tracking)] text-[hsl(var(--md-sys-color-on-surface-variant))]">
            {description}
          </p>
        </CardContent>
      </Card>
    </motion.div>
  );
}

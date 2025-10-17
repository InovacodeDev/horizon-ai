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
        ease: [0.4, 0, 0.2, 1], // MD3 Standard easing
      }}
    >
      <Card variant="elevated" elevation={1}>
        <CardContent className="flex flex-col items-center text-center py-6">
          <div className="mb-4 text-[hsl(var(--md-sys-color-primary))]">{icon}</div>
          <h3 className="text-[length:var(--md-sys-typescale-title-large-size)] leading-[var(--md-sys-typescale-title-large-line-height)] font-[var(--md-sys-typescale-title-large-weight)] text-[hsl(var(--md-sys-color-on-surface))] mb-2">
            {title}
          </h3>
          <p className="text-[length:var(--md-sys-typescale-body-medium-size)] leading-[var(--md-sys-typescale-body-medium-line-height)] tracking-[var(--md-sys-typescale-body-medium-tracking)] text-[hsl(var(--md-sys-color-on-surface-variant))]">
            {description}
          </p>
        </CardContent>
      </Card>
    </motion.div>
  );
}

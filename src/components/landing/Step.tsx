"use client";

import { motion } from "framer-motion";
import { ReactNode } from "react";

interface StepProps {
  number: number;
  icon: ReactNode;
  title: string;
  description: string;
  index: number;
}

export function Step({ number, icon, title, description, index }: StepProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{
        duration: 0.5,
        delay: index * 0.2,
        ease: [0.4, 0, 0.2, 1],
      }}
      className="relative flex flex-col items-center text-center"
    >
      <div className="relative mb-6">
        {/* MD3 Primary container with icon */}
        <div className="w-20 h-20 rounded-full bg-[hsl(var(--md-sys-color-primary))] flex items-center justify-center text-[hsl(var(--md-sys-color-on-primary))] shadow-[var(--md-sys-elevation-level2)]">
          {icon}
        </div>
        {/* MD3 Tertiary badge with step number */}
        <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-[hsl(var(--md-sys-color-tertiary))] flex items-center justify-center text-[hsl(var(--md-sys-color-on-tertiary))] text-sm font-bold shadow-[var(--md-sys-elevation-level1)]">
          {number}
        </div>
      </div>
      {/* MD3 Headline Small Typography */}
      <h3 className="font-[family-name:var(--md-sys-typescale-headline-small-font)] text-[length:var(--md-sys-typescale-headline-small-size)] leading-[var(--md-sys-typescale-headline-small-line-height)] font-[number:var(--md-sys-typescale-headline-small-weight)] tracking-[var(--md-sys-typescale-headline-small-tracking)] text-[hsl(var(--md-sys-color-on-surface))] mb-3">
        {title}
      </h3>
      {/* MD3 Body Medium Typography */}
      <p className="font-[family-name:var(--md-sys-typescale-body-medium-font)] text-[length:var(--md-sys-typescale-body-medium-size)] leading-[var(--md-sys-typescale-body-medium-line-height)] font-[number:var(--md-sys-typescale-body-medium-weight)] tracking-[var(--md-sys-typescale-body-medium-tracking)] text-[hsl(var(--md-sys-color-on-surface-variant))] max-w-xs">
        {description}
      </p>
    </motion.div>
  );
}

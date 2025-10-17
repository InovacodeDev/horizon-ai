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
        ease: [0.4, 0, 0.2, 1], // MD3 Standard easing
      }}
      className="relative flex flex-col items-center text-center"
    >
      <div className="relative mb-6">
        <div className="w-20 h-20 rounded-[var(--md-sys-shape-corner-full)] bg-[hsl(var(--md-sys-color-primary))] flex items-center justify-center text-[hsl(var(--md-sys-color-on-primary))] shadow-[var(--md-sys-elevation-level2)]">
          {icon}
        </div>
        <div className="absolute -top-2 -right-2 w-8 h-8 rounded-[var(--md-sys-shape-corner-full)] bg-[hsl(var(--md-sys-color-secondary))] flex items-center justify-center text-[hsl(var(--md-sys-color-on-secondary))] text-[length:var(--md-sys-typescale-label-medium-size)] font-[var(--md-sys-typescale-label-medium-weight)] shadow-[var(--md-sys-elevation-level1)]">
          {number}
        </div>
      </div>
      <h3 className="text-[length:var(--md-sys-typescale-title-large-size)] leading-[var(--md-sys-typescale-title-large-line-height)] font-[var(--md-sys-typescale-title-large-weight)] text-[hsl(var(--md-sys-color-on-surface))] mb-3">
        {title}
      </h3>
      <p className="text-[length:var(--md-sys-typescale-body-medium-size)] leading-[var(--md-sys-typescale-body-medium-line-height)] tracking-[var(--md-sys-typescale-body-medium-tracking)] text-[hsl(var(--md-sys-color-on-surface-variant))] max-w-xs">
        {description}
      </p>
    </motion.div>
  );
}

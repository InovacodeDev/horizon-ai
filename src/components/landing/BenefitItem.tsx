"use client";

import { motion } from "framer-motion";
import { ReactNode } from "react";

interface BenefitItemProps {
  icon: ReactNode;
  title: string;
  description: string;
  index: number;
}

export function BenefitItem({ icon, title, description, index }: BenefitItemProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{
        duration: 0.5,
        delay: index * 0.15,
        ease: [0.4, 0, 0.2, 1], // MD3 Standard easing
      }}
      className="flex flex-col md:flex-row items-start gap-4"
    >
      <div className="flex-shrink-0 w-12 h-12 rounded-[var(--md-sys-shape-corner-full)] bg-[hsl(var(--md-sys-color-primary)/0.1)] flex items-center justify-center text-[hsl(var(--md-sys-color-primary))]">
        {icon}
      </div>
      <div>
        <h3 className="text-[length:var(--md-sys-typescale-title-large-size)] leading-[var(--md-sys-typescale-title-large-line-height)] font-[var(--md-sys-typescale-title-large-weight)] text-[hsl(var(--md-sys-color-on-surface))] mb-2">
          {title}
        </h3>
        <p className="text-[length:var(--md-sys-typescale-body-large-size)] leading-[var(--md-sys-typescale-body-large-line-height)] tracking-[var(--md-sys-typescale-body-large-tracking)] text-[hsl(var(--md-sys-color-on-surface-variant))]">
          {description}
        </p>
      </div>
    </motion.div>
  );
}

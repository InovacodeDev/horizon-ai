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
        ease: [0.4, 0, 0.2, 1],
      }}
      className="flex flex-col md:flex-row items-start gap-4"
    >
      {/* MD3 Icon container with primary state layer */}
      <div className="flex-shrink-0 w-12 h-12 rounded-full bg-[hsl(var(--md-sys-color-primary))] flex items-center justify-center text-[hsl(var(--md-sys-color-on-primary))]">
        {icon}
      </div>
      <div>
        {/* MD3 Headline Small Typography */}
        <h3 className="font-[family-name:var(--md-sys-typescale-headline-small-font)] text-[length:var(--md-sys-typescale-headline-small-size)] leading-[var(--md-sys-typescale-headline-small-line-height)] font-[number:var(--md-sys-typescale-headline-small-weight)] tracking-[var(--md-sys-typescale-headline-small-tracking)] text-[hsl(var(--md-sys-color-on-surface))] mb-2">
          {title}
        </h3>
        {/* MD3 Body Medium Typography */}
        <p className="font-[family-name:var(--md-sys-typescale-body-medium-font)] text-[length:var(--md-sys-typescale-body-medium-size)] leading-[var(--md-sys-typescale-body-medium-line-height)] font-[number:var(--md-sys-typescale-body-medium-weight)] tracking-[var(--md-sys-typescale-body-medium-tracking)] text-[hsl(var(--md-sys-color-on-surface-variant))]">
          {description}
        </p>
      </div>
    </motion.div>
  );
}

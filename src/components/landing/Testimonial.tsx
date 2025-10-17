"use client";

import { motion } from "framer-motion";
import { Quote } from "lucide-react";

interface TestimonialProps {
  quote: string;
  author: string;
  role: string;
  index: number;
}

export function Testimonial({ quote, author, role, index }: TestimonialProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{
        duration: 0.4,
        delay: index * 0.1,
        ease: [0.4, 0, 0.2, 1],
      }}
      className="bg-[hsl(var(--md-sys-color-surface))] rounded-[var(--md-sys-shape-corner-medium)] p-6 shadow-[var(--md-sys-elevation-level1)]"
    >
      <Quote className="w-8 h-8 text-[hsl(var(--md-sys-color-primary))] mb-4" />
      {/* MD3 Body Large Typography */}
      <p className="font-[family-name:var(--md-sys-typescale-body-large-font)] text-[length:var(--md-sys-typescale-body-large-size)] leading-[var(--md-sys-typescale-body-large-line-height)] font-[number:var(--md-sys-typescale-body-large-weight)] tracking-[var(--md-sys-typescale-body-large-tracking)] text-[hsl(var(--md-sys-color-on-surface))] mb-4 italic">
        &quot;{quote}&quot;
      </p>
      <div className="border-t border-[hsl(var(--md-sys-color-outline-variant))] pt-4">
        {/* MD3 Label Medium Typography */}
        <p className="font-[family-name:var(--md-sys-typescale-label-medium-font)] text-[length:var(--md-sys-typescale-label-medium-size)] leading-[var(--md-sys-typescale-label-medium-line-height)] font-[number:var(--md-sys-typescale-label-medium-weight)] tracking-[var(--md-sys-typescale-label-medium-tracking)] text-[hsl(var(--md-sys-color-on-surface))]">
          {author}
        </p>
        {/* MD3 Label Small Typography */}
        <p className="font-[family-name:var(--md-sys-typescale-label-small-font)] text-[length:var(--md-sys-typescale-label-small-size)] leading-[var(--md-sys-typescale-label-small-line-height)] font-[number:var(--md-sys-typescale-label-small-weight)] tracking-[var(--md-sys-typescale-label-small-tracking)] text-[hsl(var(--md-sys-color-on-surface-variant))]">
          {role}
        </p>
      </div>
    </motion.div>
  );
}

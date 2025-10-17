"use client";

import { motion } from "framer-motion";
import { Quote } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

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
        ease: [0.4, 0, 0.2, 1], // MD3 Standard easing
      }}
    >
      <Card variant="elevated" elevation={1}>
        <CardContent className="p-6">
          <Quote className="w-8 h-8 text-[hsl(var(--md-sys-color-primary))] mb-4" />
          <p className="text-[length:var(--md-sys-typescale-body-medium-size)] leading-[var(--md-sys-typescale-body-medium-line-height)] tracking-[var(--md-sys-typescale-body-medium-tracking)] text-[hsl(var(--md-sys-color-on-surface))] mb-4 italic">
            &quot;{quote}&quot;
          </p>
          <div className="border-t border-[hsl(var(--md-sys-color-outline-variant))] pt-4">
            <p className="text-[length:var(--md-sys-typescale-title-medium-size)] leading-[var(--md-sys-typescale-title-medium-line-height)] font-[var(--md-sys-typescale-title-medium-weight)] text-[hsl(var(--md-sys-color-on-surface))]">
              {author}
            </p>
            <p className="text-[length:var(--md-sys-typescale-body-small-size)] leading-[var(--md-sys-typescale-body-small-line-height)] tracking-[var(--md-sys-typescale-body-small-tracking)] text-[hsl(var(--md-sys-color-on-surface-variant))]">
              {role}
            </p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

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
      className="bg-surface rounded-[var(--radius-m)] p-6 shadow-md"
    >
      <Quote className="w-8 h-8 text-primary mb-4" />
      <p className="text-on-surface mb-4 italic">&quot;{quote}&quot;</p>
      <div className="border-t border-outline-variant pt-4">
        <p className="font-semibold text-on-surface">{author}</p>
        <p className="text-sm text-on-surface-variant">{role}</p>
      </div>
    </motion.div>
  );
}

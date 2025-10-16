"use client";

import { motion } from "framer-motion";
import { ReactNode } from "react";

interface FeatureCardProps {
  icon: ReactNode;
  title: string;
  description: string;
  index: number;
}

export function FeatureCard({
  icon,
  title,
  description,
  index,
}: FeatureCardProps) {
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
      className="bg-surface rounded-[var(--radius-m)] p-6 shadow-md hover:shadow-lg transition-shadow duration-[var(--duration-medium)]"
    >
      <div className="flex flex-col items-center text-center">
        <div className="mb-4 text-primary">{icon}</div>
        <h3 className="text-xl font-semibold text-on-surface mb-2">{title}</h3>
        <p className="text-on-surface-variant">{description}</p>
      </div>
    </motion.div>
  );
}

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
        <div className="w-20 h-20 rounded-full bg-primary flex items-center justify-center text-primary-foreground shadow-lg">
          {icon}
        </div>
        <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-secondary-foreground text-sm font-bold shadow-md">
          {number}
        </div>
      </div>
      <h3 className="text-xl font-semibold text-on-surface mb-3">{title}</h3>
      <p className="text-on-surface-variant max-w-xs">{description}</p>
    </motion.div>
  );
}

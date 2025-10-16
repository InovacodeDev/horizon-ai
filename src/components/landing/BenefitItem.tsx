"use client";

import { motion } from "framer-motion";
import { ReactNode } from "react";

interface BenefitItemProps {
  icon: ReactNode;
  title: string;
  description: string;
  index: number;
}

export function BenefitItem({
  icon,
  title,
  description,
  index,
}: BenefitItemProps) {
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
      <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
        {icon}
      </div>
      <div>
        <h3 className="text-xl font-semibold text-on-surface mb-2">{title}</h3>
        <p className="text-on-surface-variant leading-relaxed">{description}</p>
      </div>
    </motion.div>
  );
}

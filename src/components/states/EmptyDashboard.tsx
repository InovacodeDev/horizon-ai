"use client";

import { Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

interface EmptyDashboardProps {
  onConnectBank: () => void;
}

export function EmptyDashboard({ onConnectBank }: EmptyDashboardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.4, 0.0, 0.2, 1] }}
      className="min-h-screen bg-surface flex items-center justify-center p-6"
    >
      <div className="w-full max-w-[560px] text-center">
        <div className="mb-8">
          {/* Icon */}
          <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-primary/10 flex items-center justify-center">
            <Building2 className="w-12 h-12 text-primary" />
          </div>

          {/* Title */}
          <h1 className="text-[28px] leading-9 font-semibold text-on-surface mb-3">
            Conecte sua primeira conta
          </h1>

          {/* Description */}
          <p className="text-base leading-6 text-on-surface-variant">
            Conecte sua primeira conta para começar a ver seus dados financeiros
            consolidados em um só lugar.
          </p>
        </div>

        {/* CTA Button */}
        <Button
          onClick={onConnectBank}
          className="w-full max-w-xs h-10 bg-primary text-on-primary hover:bg-primary/90 rounded-full text-sm font-medium transition-all duration-200 hover:shadow-lg active:scale-[0.98]"
        >
          Conectar conta
        </Button>
      </div>
    </motion.div>
  );
}

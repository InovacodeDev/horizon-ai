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
      transition={{
        duration: 0.4,
        ease: [0.2, 0, 0, 1], // MD3 emphasized easing
      }}
      className="min-h-screen flex items-center justify-center p-6"
      style={{
        backgroundColor: "hsl(var(--md-sys-color-surface))",
      }}
    >
      <div className="w-full max-w-[560px] text-center">
        <div className="mb-8">
          {/* Icon with MD3 Primary Container */}
          <div
            className="w-24 h-24 mx-auto mb-6 rounded-full flex items-center justify-center"
            style={{
              backgroundColor: "hsl(var(--md-sys-color-primary-container) / 0.3)",
            }}
          >
            <Building2 className="w-12 h-12" style={{ color: "hsl(var(--md-sys-color-primary))" }} />
          </div>

          {/* Title - MD3 Headline Medium */}
          <h1
            className="mb-3"
            style={{
              fontSize: "var(--md-sys-typescale-headline-medium-size)",
              lineHeight: "var(--md-sys-typescale-headline-medium-line-height)",
              fontWeight: "600",
              color: "hsl(var(--md-sys-color-on-surface))",
            }}
          >
            Conecte sua primeira conta
          </h1>

          {/* Description - MD3 Body Large */}
          <p
            style={{
              fontSize: "var(--md-sys-typescale-body-large-size)",
              lineHeight: "var(--md-sys-typescale-body-large-line-height)",
              fontWeight: "var(--md-sys-typescale-body-large-weight)",
              color: "hsl(var(--md-sys-color-on-surface-variant))",
            }}
          >
            Conecte sua primeira conta para começar a ver seus dados financeiros consolidados em um só lugar.
          </p>
        </div>

        {/* CTA Button - MD3 Filled Button */}
        <Button onClick={onConnectBank} variant="filled" className="w-full max-w-xs">
          Conectar conta
        </Button>
      </div>
    </motion.div>
  );
}

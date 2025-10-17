"use client";

import { Package } from "lucide-react";
import { motion } from "framer-motion";

export function EmptyAssets() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.4,
        ease: [0.2, 0, 0, 1], // MD3 emphasized easing
      }}
      className="flex flex-col items-center justify-center min-h-[400px] p-6 text-center"
    >
      {/* Icon with MD3 Primary Container */}
      <div
        className="w-16 h-16 rounded-full flex items-center justify-center mb-6"
        style={{
          backgroundColor: "hsl(var(--md-sys-color-primary-container) / 0.3)",
        }}
      >
        <Package className="w-8 h-8" style={{ color: "hsl(var(--md-sys-color-primary))" }} />
      </div>

      {/* Title - MD3 Title Large */}
      <h2
        className="mb-3"
        style={{
          fontSize: "var(--md-sys-typescale-title-large-size)",
          lineHeight: "var(--md-sys-typescale-title-large-line-height)",
          fontWeight: "var(--md-sys-typescale-title-large-weight)",
          color: "hsl(var(--md-sys-color-on-surface))",
        }}
      >
        Nenhum ativo cadastrado
      </h2>

      {/* Message - MD3 Body Large */}
      <p
        className="max-w-md"
        style={{
          fontSize: "var(--md-sys-typescale-body-large-size)",
          lineHeight: "var(--md-sys-typescale-body-large-line-height)",
          fontWeight: "var(--md-sys-typescale-body-large-weight)",
          color: "hsl(var(--md-sys-color-on-surface-variant))",
        }}
      >
        Adicione notas fiscais para rastrear seus produtos e garantias em um só lugar.
      </p>
    </motion.div>
  );
}

"use client";

import { Receipt } from "lucide-react";
import { motion } from "framer-motion";

export function EmptyTransactionFeed() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.4, 0.0, 0.2, 1] }}
      className="flex flex-col items-center justify-center min-h-[400px] p-6 text-center"
    >
      {/* Icon */}
      <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-6">
        <Receipt className="w-8 h-8 text-primary" />
      </div>

      {/* Title */}
      <h2 className="text-[22px] leading-7 font-medium text-on-surface mb-3">
        Nenhuma transação ainda
      </h2>

      {/* Message */}
      <p className="text-base leading-6 font-normal text-on-surface-variant max-w-md">
        Suas transações aparecerão aqui após a primeira sincronização com suas
        contas bancárias.
      </p>
    </motion.div>
  );
}

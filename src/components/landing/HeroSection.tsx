"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface HeroSectionProps {
  title?: string;
  subtitle?: string;
  primaryCTA?: {
    text: string;
    href: string;
  };
  secondaryCTA?: {
    text: string;
    href: string;
  };
}

export function HeroSection({
  title = "O sistema operacional para as finanças da sua família",
  subtitle = "Consolide todas as suas contas, investimentos e despesas em um único lugar. Simplifique seu IRPF e nunca mais perca uma garantia.",
  primaryCTA = { text: "Criar Conta Grátis", href: "/register" },
  secondaryCTA = { text: "Entrar", href: "/login" },
}: HeroSectionProps = {}) {
  return (
    <section className="relative min-h-[600px] md:min-h-[700px] flex items-center justify-center overflow-hidden bg-gradient-to-br from-[hsl(var(--md-sys-color-primary))] via-[hsl(var(--md-sys-color-primary))] to-[hsl(var(--md-sys-color-primary-container))] px-6 py-24 md:py-32">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          duration: 0.6,
          ease: "easeInOut",
        }}
        className="max-w-4xl mx-auto text-center"
      >
        {/* MD3 Display Large Typography */}
        <h1 className="font-[family-name:var(--md-sys-typescale-display-large-font)] text-[length:var(--md-sys-typescale-display-large-size)] leading-[var(--md-sys-typescale-display-large-line-height)] font-[number:var(--md-sys-typescale-display-large-weight)] tracking-[var(--md-sys-typescale-display-large-tracking)] text-[hsl(var(--md-sys-color-on-primary))] mb-6">
          {title}
        </h1>
        {/* MD3 Body Large Typography */}
        <p className="font-[family-name:var(--md-sys-typescale-body-large-font)] text-[length:var(--md-sys-typescale-body-large-size)] leading-[var(--md-sys-typescale-body-large-line-height)] font-[number:var(--md-sys-typescale-body-large-weight)] tracking-[var(--md-sys-typescale-body-large-tracking)] text-[hsl(var(--md-sys-color-on-primary)/0.9)] mb-8 max-w-2xl mx-auto">
          {subtitle}
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link href={primaryCTA.href} className="w-full sm:w-auto">
            <Button variant="filled" size="medium" className="w-full">
              {primaryCTA.text}
            </Button>
          </Link>
          <Link href={secondaryCTA.href} className="w-full sm:w-auto">
            <Button variant="text" size="medium" className="w-full text-[hsl(var(--md-sys-color-on-primary))]">
              {secondaryCTA.text}
            </Button>
          </Link>
        </div>
      </motion.div>
    </section>
  );
}

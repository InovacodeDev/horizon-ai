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
          ease: [0.2, 0, 0, 1], // MD3 Emphasized easing
        }}
        className="max-w-4xl mx-auto text-center"
      >
        <h1 className="text-[length:var(--md-sys-typescale-display-medium-size)] md:text-[length:var(--md-sys-typescale-display-large-size)] leading-[var(--md-sys-typescale-display-medium-line-height)] md:leading-[var(--md-sys-typescale-display-large-line-height)] font-[var(--md-sys-typescale-display-large-weight)] tracking-[var(--md-sys-typescale-display-large-tracking)] text-[hsl(var(--md-sys-color-on-primary))] mb-6">
          {title}
        </h1>
        <p className="text-[length:var(--md-sys-typescale-body-large-size)] md:text-[length:var(--md-sys-typescale-title-large-size)] leading-[var(--md-sys-typescale-body-large-line-height)] md:leading-[var(--md-sys-typescale-title-large-line-height)] tracking-[var(--md-sys-typescale-body-large-tracking)] text-[hsl(var(--md-sys-color-on-primary)/0.9)] mb-8 max-w-2xl mx-auto">
          {subtitle}
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link href={primaryCTA.href} className="w-full sm:w-auto">
            <Button
              size="large"
              variant="filled"
              fullWidth
              className="sm:w-auto bg-[hsl(var(--md-sys-color-on-primary))] text-[hsl(var(--md-sys-color-primary))] hover:shadow-[var(--md-sys-elevation-level2)]"
            >
              {primaryCTA.text}
            </Button>
          </Link>
          <Link href={secondaryCTA.href} className="w-full sm:w-auto">
            <Button
              variant="outlined"
              size="large"
              fullWidth
              className="sm:w-auto border-[hsl(var(--md-sys-color-on-primary)/0.2)] text-[hsl(var(--md-sys-color-on-primary))] bg-[hsl(var(--md-sys-color-on-primary)/0.1)] hover:bg-[hsl(var(--md-sys-color-on-primary)/0.2)]"
            >
              {secondaryCTA.text}
            </Button>
          </Link>
        </div>
      </motion.div>
    </section>
  );
}

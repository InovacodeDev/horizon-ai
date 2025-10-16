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
    <section className="relative min-h-[600px] md:min-h-[700px] flex items-center justify-center overflow-hidden bg-gradient-to-br from-primary via-primary to-primary-container px-6 py-24 md:py-32">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          duration: 0.6,
          ease: [0.2, 0, 0, 1], // Emphasized easing
        }}
        className="max-w-4xl mx-auto text-center"
      >
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-primary-foreground mb-6 leading-tight">
          {title}
        </h1>
        <p className="text-lg md:text-xl text-primary-foreground/90 mb-8 max-w-2xl mx-auto">
          {subtitle}
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link href={primaryCTA.href} className="w-full sm:w-auto">
            <Button size="lg" className="w-full">
              {primaryCTA.text}
            </Button>
          </Link>
          <Link href={secondaryCTA.href} className="w-full sm:w-auto">
            <Button
              variant="outline"
              size="lg"
              className="w-full bg-white/10 border-white/20 text-white hover:bg-white/20"
            >
              {secondaryCTA.text}
            </Button>
          </Link>
        </div>
      </motion.div>
    </section>
  );
}

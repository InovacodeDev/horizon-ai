"use client";

import { Sparkles, Clock, Target } from "lucide-react";
import { BenefitItem } from "./BenefitItem";

const benefits = [
  {
    icon: <Sparkles size={24} />,
    title: "Acabe com a fragmentação financeira",
    description:
      "Chega de alternar entre múltiplos apps e planilhas. Tenha uma visão unificada de todas as suas contas, investimentos e despesas em um único lugar.",
  },
  {
    icon: <Clock size={24} />,
    title: "Economize horas no Imposto de Renda",
    description:
      "Simplifique sua declaração de IRPF com dados já organizados e categorizados. O que levava dias agora leva minutos.",
  },
  {
    icon: <Target size={24} />,
    title: "Nunca mais perca garantias",
    description:
      "Rastreie automaticamente todos os seus produtos e receba alertas antes das garantias expirarem. Economize dinheiro em reparos desnecessários.",
  },
];

export function BenefitsSection() {
  return (
    <section className="py-24 px-6 bg-[hsl(var(--md-sys-color-surface))]">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-[length:var(--md-sys-typescale-headline-medium-size)] md:text-[length:var(--md-sys-typescale-headline-large-size)] leading-[var(--md-sys-typescale-headline-medium-line-height)] md:leading-[var(--md-sys-typescale-headline-large-line-height)] font-[var(--md-sys-typescale-headline-large-weight)] text-[hsl(var(--md-sys-color-on-surface))] mb-4">
            Por que escolher a Horizon AI?
          </h2>
          <p className="text-[length:var(--md-sys-typescale-body-large-size)] leading-[var(--md-sys-typescale-body-large-line-height)] tracking-[var(--md-sys-typescale-body-large-tracking)] text-[hsl(var(--md-sys-color-on-surface-variant))] max-w-2xl mx-auto">
            Resolvemos os principais problemas que você enfrenta ao gerenciar suas finanças pessoais.
          </p>
        </div>
        <div className="space-y-12">
          {benefits.map((benefit, index) => (
            <BenefitItem
              key={index}
              icon={benefit.icon}
              title={benefit.title}
              description={benefit.description}
              index={index}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

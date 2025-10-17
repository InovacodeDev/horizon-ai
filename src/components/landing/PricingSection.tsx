"use client";

import { PricingCard } from "./PricingCard";

export function PricingSection() {
  const plans = [
    {
      plan: "free" as const,
      price: "Grátis",
      features: [
        "Consolidação de até 3 contas bancárias",
        "Visualização de transações dos últimos 30 dias",
        "Categorização básica de despesas",
        "Dashboard com visão geral financeira",
        "Suporte por email",
      ],
      highlighted: false,
      ctaText: "Começar Grátis",
      ctaHref: "/register",
    },
    {
      plan: "premium" as const,
      price: "R$ 29,90",
      features: [
        "Consolidação ilimitada de contas",
        "Histórico completo de transações",
        "Categorização inteligente via NF-e",
        "Gestão de garantias e produtos",
        "Consolidação de investimentos",
        "Otimização automática de IRPF",
        "Insights personalizados com IA",
        "Suporte prioritário",
      ],
      highlighted: true,
      ctaText: "Começar Premium",
      ctaHref: "/register",
    },
  ];

  return (
    <section className="py-24 px-6 bg-[hsl(var(--md-sys-color-background))]">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          {/* MD3 Display Small Typography */}
          <h2 className="font-[family-name:var(--md-sys-typescale-display-small-font)] text-[length:var(--md-sys-typescale-display-small-size)] leading-[var(--md-sys-typescale-display-small-line-height)] font-[number:var(--md-sys-typescale-display-small-weight)] tracking-[var(--md-sys-typescale-display-small-tracking)] text-[hsl(var(--md-sys-color-on-surface))] mb-4">
            Escolha o plano ideal para você
          </h2>
          {/* MD3 Body Large Typography */}
          <p className="font-[family-name:var(--md-sys-typescale-body-large-font)] text-[length:var(--md-sys-typescale-body-large-size)] leading-[var(--md-sys-typescale-body-large-line-height)] font-[number:var(--md-sys-typescale-body-large-weight)] tracking-[var(--md-sys-typescale-body-large-tracking)] text-[hsl(var(--md-sys-color-on-surface-variant))] max-w-2xl mx-auto">
            Comece gratuitamente e faça upgrade quando precisar de recursos avançados
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {plans.map((plan, index) => (
            <PricingCard key={plan.plan} {...plan} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
}

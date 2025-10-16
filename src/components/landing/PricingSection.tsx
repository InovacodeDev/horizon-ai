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
    <section className="py-24 px-6 bg-background">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-on-surface mb-4">
            Escolha o plano ideal para você
          </h2>
          <p className="text-lg text-on-surface-variant max-w-2xl mx-auto">
            Comece gratuitamente e faça upgrade quando precisar de recursos
            avançados
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

"use client";

import { Building2, FileText, Shield, TrendingUp, Calculator } from "lucide-react";
import { FeatureCard } from "./FeatureCard";

const features = [
  {
    icon: <Building2 size={48} />,
    title: "Open Finance",
    description: "Conecte todas as suas contas bancárias e veja seu patrimônio consolidado em um único lugar.",
  },
  {
    icon: <FileText size={48} />,
    title: "Integração com NF-e",
    description: "Importe suas notas fiscais automaticamente e categorize suas despesas com inteligência artificial.",
  },
  {
    icon: <Shield size={48} />,
    title: "Gestão de Garantias",
    description: "Nunca mais perca uma garantia. Rastreie todos os seus produtos e receba alertas antes do vencimento.",
  },
  {
    icon: <TrendingUp size={48} />,
    title: "Consolidação de Investimentos",
    description:
      "Visualize todos os seus investimentos em um dashboard único e acompanhe a performance do seu portfólio.",
  },
  {
    icon: <Calculator size={48} />,
    title: "Otimização de IRPF",
    description:
      "Simplifique sua declaração de imposto de renda com dados organizados e sugestões de otimização fiscal.",
  },
];

export function FeaturesSection() {
  return (
    <section className="py-24 px-6 bg-[hsl(var(--md-sys-color-background))]">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-[length:var(--md-sys-typescale-headline-medium-size)] md:text-[length:var(--md-sys-typescale-headline-large-size)] leading-[var(--md-sys-typescale-headline-medium-line-height)] md:leading-[var(--md-sys-typescale-headline-large-line-height)] font-[var(--md-sys-typescale-headline-large-weight)] text-[hsl(var(--md-sys-color-on-surface))] mb-4">
            Tudo que você precisa para gerenciar suas finanças
          </h2>
          <p className="text-[length:var(--md-sys-typescale-body-large-size)] leading-[var(--md-sys-typescale-body-large-line-height)] tracking-[var(--md-sys-typescale-body-large-tracking)] text-[hsl(var(--md-sys-color-on-surface-variant))] max-w-2xl mx-auto">
            Uma plataforma completa que centraliza todas as suas informações financeiras e facilita a tomada de
            decisões.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <FeatureCard
              key={index}
              icon={feature.icon}
              title={feature.title}
              description={feature.description}
              index={index}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

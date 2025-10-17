"use client";

import { Link2, FileUp, Lightbulb } from "lucide-react";
import { Step } from "./Step";

const steps = [
  {
    number: 1,
    icon: <Link2 size={32} />,
    title: "Conecte suas contas",
    description: "Conecte suas contas bancárias e cartões de crédito de forma segura através do Open Finance.",
  },
  {
    number: 2,
    icon: <FileUp size={32} />,
    title: "Adicione suas notas fiscais",
    description: "Importe suas NF-e para categorização automática e rastreamento de garantias de produtos.",
  },
  {
    number: 3,
    icon: <Lightbulb size={32} />,
    title: "Receba insights inteligentes",
    description: "Obtenha análises personalizadas, alertas importantes e recomendações para otimizar suas finanças.",
  },
];

export function HowItWorksSection() {
  return (
    <section className="py-24 px-6 bg-[hsl(var(--md-sys-color-background))]">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          {/* MD3 Display Small Typography */}
          <h2 className="font-[family-name:var(--md-sys-typescale-display-small-font)] text-[length:var(--md-sys-typescale-display-small-size)] leading-[var(--md-sys-typescale-display-small-line-height)] font-[number:var(--md-sys-typescale-display-small-weight)] tracking-[var(--md-sys-typescale-display-small-tracking)] text-[hsl(var(--md-sys-color-on-surface))] mb-4">
            Como funciona
          </h2>
          {/* MD3 Body Large Typography */}
          <p className="font-[family-name:var(--md-sys-typescale-body-large-font)] text-[length:var(--md-sys-typescale-body-large-size)] leading-[var(--md-sys-typescale-body-large-line-height)] font-[number:var(--md-sys-typescale-body-large-weight)] tracking-[var(--md-sys-typescale-body-large-tracking)] text-[hsl(var(--md-sys-color-on-surface-variant))] max-w-2xl mx-auto">
            Comece a organizar suas finanças em apenas 3 passos simples.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-8">
          {steps.map((step, index) => (
            <Step
              key={index}
              number={step.number}
              icon={step.icon}
              title={step.title}
              description={step.description}
              index={index}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

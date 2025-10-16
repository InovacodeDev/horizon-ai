"use client";

import { Link2, FileUp, Lightbulb } from "lucide-react";
import { Step } from "./Step";

const steps = [
  {
    number: 1,
    icon: <Link2 size={32} />,
    title: "Conecte suas contas",
    description:
      "Conecte suas contas bancárias e cartões de crédito de forma segura através do Open Finance.",
  },
  {
    number: 2,
    icon: <FileUp size={32} />,
    title: "Adicione suas notas fiscais",
    description:
      "Importe suas NF-e para categorização automática e rastreamento de garantias de produtos.",
  },
  {
    number: 3,
    icon: <Lightbulb size={32} />,
    title: "Receba insights inteligentes",
    description:
      "Obtenha análises personalizadas, alertas importantes e recomendações para otimizar suas finanças.",
  },
];

export function HowItWorksSection() {
  return (
    <section className="py-24 px-6 bg-background">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-on-surface mb-4">
            Como funciona
          </h2>
          <p className="text-lg text-on-surface-variant max-w-2xl mx-auto">
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

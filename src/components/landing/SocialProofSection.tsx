"use client";

import { Testimonial } from "./Testimonial";

export function SocialProofSection() {
  const testimonials = [
    {
      quote:
        "A Horizon AI transformou completamente como gerencio as finanças da minha família. Finalmente consigo ver tudo em um só lugar e entender para onde vai meu dinheiro.",
      author: "Maria Silva",
      role: "Empresária",
    },
    {
      quote:
        "A categorização automática via NF-e é genial. Não preciso mais ficar digitando manualmente cada compra. O sistema faz tudo sozinho e ainda me ajuda no IRPF.",
      author: "João Santos",
      role: "Profissional Liberal",
    },
    {
      quote:
        "Nunca mais perdi uma garantia de produto. O sistema me avisa quando algo está perto de vencer e mantém tudo organizado. Vale cada centavo do Premium.",
      author: "Ana Costa",
      role: "Gestora de Projetos",
    },
  ];

  return (
    <section className="py-24 px-6 bg-surface-container">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-on-surface mb-4">
            O que nossos usuários dizem
          </h2>
          <p className="text-lg text-on-surface-variant max-w-2xl mx-auto">
            Junte-se a milhares de famílias que já organizaram suas finanças
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <Testimonial key={index} {...testimonial} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
}

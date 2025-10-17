"use client";

import Link from "next/link";

export function Footer() {
  const currentYear = new Date().getFullYear();

  const footerLinks = {
    produto: [
      { label: "Funcionalidades", href: "#features" },
      { label: "Preços", href: "#pricing" },
      { label: "Como Funciona", href: "#how-it-works" },
    ],
    empresa: [
      { label: "Sobre Nós", href: "/about" },
      { label: "Blog", href: "/blog" },
      { label: "Contato", href: "/contact" },
    ],
    legal: [
      { label: "Termos de Uso", href: "/terms" },
      { label: "Política de Privacidade", href: "/privacy" },
      { label: "Documentação", href: "/docs" },
    ],
  };

  return (
    <footer className="bg-[hsl(var(--md-sys-color-surface-container-highest))] border-t border-[hsl(var(--md-sys-color-outline-variant))]">
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div className="md:col-span-1">
            {/* MD3 Title Medium Typography */}
            <h3 className="font-[family-name:var(--md-sys-typescale-title-medium-font)] text-[length:var(--md-sys-typescale-title-medium-size)] leading-[var(--md-sys-typescale-title-medium-line-height)] font-[number:var(--md-sys-typescale-title-medium-weight)] tracking-[var(--md-sys-typescale-title-medium-tracking)] text-[hsl(var(--md-sys-color-primary))] mb-2">
              Horizon AI
            </h3>
            {/* MD3 Body Small Typography */}
            <p className="font-[family-name:var(--md-sys-typescale-body-small-font)] text-[length:var(--md-sys-typescale-body-small-size)] leading-[var(--md-sys-typescale-body-small-line-height)] font-[number:var(--md-sys-typescale-body-small-weight)] tracking-[var(--md-sys-typescale-body-small-tracking)] text-[hsl(var(--md-sys-color-on-surface-variant))]">
              O sistema operacional para as finanças da sua família
            </p>
          </div>

          {/* Links */}
          <div>
            {/* MD3 Title Small Typography */}
            <h4 className="font-[family-name:var(--md-sys-typescale-title-small-font)] text-[length:var(--md-sys-typescale-title-small-size)] leading-[var(--md-sys-typescale-title-small-line-height)] font-[number:var(--md-sys-typescale-title-small-weight)] tracking-[var(--md-sys-typescale-title-small-tracking)] text-[hsl(var(--md-sys-color-on-surface))] mb-4">
              Produto
            </h4>
            <ul className="space-y-2">
              {footerLinks.produto.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="font-[family-name:var(--md-sys-typescale-body-small-font)] text-[length:var(--md-sys-typescale-body-small-size)] leading-[var(--md-sys-typescale-body-small-line-height)] font-[number:var(--md-sys-typescale-body-small-weight)] tracking-[var(--md-sys-typescale-body-small-tracking)] text-[hsl(var(--md-sys-color-on-surface-variant))] hover:text-[hsl(var(--md-sys-color-primary))] transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            {/* MD3 Title Small Typography */}
            <h4 className="font-[family-name:var(--md-sys-typescale-title-small-font)] text-[length:var(--md-sys-typescale-title-small-size)] leading-[var(--md-sys-typescale-title-small-line-height)] font-[number:var(--md-sys-typescale-title-small-weight)] tracking-[var(--md-sys-typescale-title-small-tracking)] text-[hsl(var(--md-sys-color-on-surface))] mb-4">
              Empresa
            </h4>
            <ul className="space-y-2">
              {footerLinks.empresa.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="font-[family-name:var(--md-sys-typescale-body-small-font)] text-[length:var(--md-sys-typescale-body-small-size)] leading-[var(--md-sys-typescale-body-small-line-height)] font-[number:var(--md-sys-typescale-body-small-weight)] tracking-[var(--md-sys-typescale-body-small-tracking)] text-[hsl(var(--md-sys-color-on-surface-variant))] hover:text-[hsl(var(--md-sys-color-primary))] transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            {/* MD3 Title Small Typography */}
            <h4 className="font-[family-name:var(--md-sys-typescale-title-small-font)] text-[length:var(--md-sys-typescale-title-small-size)] leading-[var(--md-sys-typescale-title-small-line-height)] font-[number:var(--md-sys-typescale-title-small-weight)] tracking-[var(--md-sys-typescale-title-small-tracking)] text-[hsl(var(--md-sys-color-on-surface))] mb-4">
              Legal
            </h4>
            <ul className="space-y-2">
              {footerLinks.legal.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="font-[family-name:var(--md-sys-typescale-body-small-font)] text-[length:var(--md-sys-typescale-body-small-size)] leading-[var(--md-sys-typescale-body-small-line-height)] font-[number:var(--md-sys-typescale-body-small-weight)] tracking-[var(--md-sys-typescale-body-small-tracking)] text-[hsl(var(--md-sys-color-on-surface-variant))] hover:text-[hsl(var(--md-sys-color-primary))] transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-[hsl(var(--md-sys-color-outline-variant))] pt-8">
          <p className="font-[family-name:var(--md-sys-typescale-body-small-font)] text-[length:var(--md-sys-typescale-body-small-size)] leading-[var(--md-sys-typescale-body-small-line-height)] font-[number:var(--md-sys-typescale-body-small-weight)] tracking-[var(--md-sys-typescale-body-small-tracking)] text-[hsl(var(--md-sys-color-on-surface-variant))] text-center">
            © {currentYear} Horizon AI. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
}

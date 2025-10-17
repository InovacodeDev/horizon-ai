"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-[hsl(var(--md-sys-color-background))]/80 backdrop-blur-md border-b border-[hsl(var(--md-sys-color-outline))]">
      <nav className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[hsl(var(--md-sys-color-primary))] rounded-lg flex items-center justify-center">
              <span className="text-[hsl(var(--md-sys-color-on-primary))] font-bold text-lg">H</span>
            </div>
            {/* MD3 Title Medium Typography */}
            <span className="font-[family-name:var(--md-sys-typescale-title-medium-font)] text-[length:var(--md-sys-typescale-title-medium-size)] leading-[var(--md-sys-typescale-title-medium-line-height)] font-[number:var(--md-sys-typescale-title-medium-weight)] tracking-[var(--md-sys-typescale-title-medium-tracking)] text-[hsl(var(--md-sys-color-on-background))]">
              Horizon AI
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-4">
            <Link href="/login">
              <Button variant="text">Entrar</Button>
            </Link>
            <Link href="/register">
              <Button variant="filled">Criar Conta</Button>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 text-[hsl(var(--md-sys-color-on-background))] hover:bg-[hsl(var(--md-sys-color-on-background)/0.08)] rounded-[var(--md-sys-shape-corner-medium)] transition-colors duration-[var(--md-sys-motion-duration-short2)] ease-[var(--md-sys-motion-easing-standard)]"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Navigation */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="md:hidden overflow-hidden"
            >
              <div className="flex flex-col gap-3 pt-4 pb-2">
                <Link href="/login" className="w-full">
                  <Button variant="text" className="w-full justify-start" onClick={() => setMobileMenuOpen(false)}>
                    Entrar
                  </Button>
                </Link>
                <Link href="/register" className="w-full">
                  <Button variant="filled" className="w-full" onClick={() => setMobileMenuOpen(false)}>
                    Criar Conta
                  </Button>
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>
    </header>
  );
}

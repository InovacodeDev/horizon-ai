"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-[hsl(var(--md-sys-color-background)/0.8)] backdrop-blur-md border-b border-[hsl(var(--md-sys-color-outline))]">
      <nav className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[hsl(var(--md-sys-color-primary))] rounded-[var(--md-sys-shape-corner-small)] flex items-center justify-center">
              <span className="text-[hsl(var(--md-sys-color-on-primary))] font-bold text-[length:var(--md-sys-typescale-body-large-size)]">
                H
              </span>
            </div>
            <span className="text-[length:var(--md-sys-typescale-title-large-size)] font-[var(--md-sys-typescale-title-large-weight)] text-[hsl(var(--md-sys-color-on-surface))]">
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
            className="md:hidden p-2 text-[hsl(var(--md-sys-color-on-surface))] hover:bg-[hsl(var(--md-sys-color-on-surface)/0.08)] rounded-[var(--md-sys-shape-corner-small)] transition-colors duration-[var(--md-sys-motion-duration-short2)]"
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
              transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
              className="md:hidden overflow-hidden"
            >
              <div className="flex flex-col gap-3 pt-4 pb-2">
                <Link href="/login" className="w-full">
                  <Button variant="text" fullWidth className="justify-start" onClick={() => setMobileMenuOpen(false)}>
                    Entrar
                  </Button>
                </Link>
                <Link href="/register" className="w-full">
                  <Button variant="filled" fullWidth onClick={() => setMobileMenuOpen(false)}>
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

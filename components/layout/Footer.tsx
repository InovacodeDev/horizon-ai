'use client';

import React from 'react';
import Link from 'next/link';

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-surface border-t border-outline px-6 py-4">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="text-sm text-on-surface-variant">
          © {currentYear} Horizon AI. Todos os direitos reservados.
        </div>
        
        <div className="flex items-center gap-6">
          <Link 
            href="/privacy" 
            className="text-sm text-on-surface-variant hover:text-primary transition-colors"
          >
            Política de Privacidade
          </Link>
          <Link 
            href="/terms" 
            className="text-sm text-on-surface-variant hover:text-primary transition-colors"
          >
            Termos de Serviço
          </Link>
          <Link 
            href="/help" 
            className="text-sm text-on-surface-variant hover:text-primary transition-colors"
          >
            Central de Ajuda
          </Link>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

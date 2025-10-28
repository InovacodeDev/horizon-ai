'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  HomeIcon,
  WalletIcon,
  SwapIcon,
  PieChartIcon,
  FileTextIcon,
  SettingsIcon,
  HelpCircleIcon,
  LogOutIcon,
  LandmarkIcon,
  RepeatIcon,
  ReceiptIcon,
  ShoppingCartIcon,
  CreditCardIcon,
  TrendingUpIcon,
} from '@/components/assets/Icons';
import Modal from '@/components/ui/Modal';
import Tooltip from '@/components/ui/Tooltip';
import type { User } from '@/lib/types';

interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  href: string;
  isActive: boolean;
  disabled?: boolean;
  tooltipText?: string;
}

const NavItem: React.FC<NavItemProps> = ({ icon, label, href, isActive, disabled = false, tooltipText }) => {
  const content = (
    <div
      className={`w-full flex items-center p-2.5 rounded-lg text-sm font-medium transition-colors
        ${disabled ? 'opacity-50 cursor-not-allowed text-on-surface-variant' : isActive ? 'bg-primary-container text-primary' : 'text-on-surface-variant hover:bg-on-surface/5'}`}
    >
      <div className="mr-3">{icon}</div>
      {label}
    </div>
  );

  if (disabled && tooltipText) {
    return <Tooltip content={tooltipText}>{content}</Tooltip>;
  }

  if (disabled) {
    return content;
  }

  return (
    <Link href={href} className="block">
      {content}
    </Link>
  );
};

const NavSection: React.FC<{ title: string }> = ({ title }) => (
  <h3 className="px-2.5 pt-4 pb-2 text-xs font-medium text-on-surface-variant/70 uppercase tracking-wider">
    {title}
  </h3>
);

interface DashboardLayoutProps {
  children: React.ReactNode;
  user: User;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children, user }) => {
  const pathname = usePathname();
  const router = useRouter();
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  const handleLogoutClick = () => {
    setIsLogoutModalOpen(true);
  };

  const handleConfirmLogout = async () => {
    setIsLogoutModalOpen(false);
    
    try {
      // Call the sign-out API
      await fetch('/api/auth/sign-out', {
        method: 'POST',
        credentials: 'include',
      });
      
      // Redirect to login
      router.push('/login');
    } catch (error) {
      console.error('Logout error:', error);
      // Still redirect even if API call fails
      router.push('/login');
    }
  };

  const mainNav = [
    { href: '/overview', label: 'Visão Geral', icon: <HomeIcon className="w-5 h-5" /> },
    { href: '/accounts', label: 'Contas', icon: <WalletIcon className="w-5 h-5" /> },
    { href: '/transactions', label: 'Transações', icon: <SwapIcon className="w-5 h-5" /> },
    { href: '/credit-card-bills', label: 'Faturas do Cartão', icon: <CreditCardIcon className="w-5 h-5" /> },
  ];

  const intelligenceNav = [
    { href: '/categories', label: 'Categorias', icon: <PieChartIcon className="w-5 h-5" /> },
    { href: '/shopping-list', label: 'Listas de Compras', icon: <ShoppingCartIcon className="w-5 h-5" /> },
    { href: '/invoices', label: 'Notas Fiscais', icon: <ReceiptIcon className="w-5 h-5" /> },
    // { href: '/warranties', label: 'Garantias', icon: <ShieldCheckIcon className="w-5 h-5" /> }, // TODO: Implementar
  ];

  const planningNav = [
    { href: '/investments', label: 'Investimentos', icon: <TrendingUpIcon className="w-5 h-5" /> },
    { href: '/taxes', label: 'Impostos (IRPF)', icon: <FileTextIcon className="w-5 h-5" /> },
    { href: '/planning-goals', label: 'Metas Financeiras', icon: <LandmarkIcon className="w-5 h-5" /> },
    // { href: '/succession', label: 'Sucessão', icon: <UsersIcon className="w-5 h-5" /> }, // TODO: Implementar
  ];

  const ecosystemNav = [
    // { href: '/insurance', label: 'Seguros', icon: <ShieldIcon className="w-5 h-5" /> }, // TODO: Implementar
    { href: '/integrations', label: 'Integrações', icon: <RepeatIcon className="w-5 h-5" /> },
  ];

  const secondaryNav = [
    { href: '/settings', label: 'Configurações', icon: <SettingsIcon className="w-5 h-5" /> },
    { href: '/help', label: 'Ajuda e Suporte', icon: <HelpCircleIcon className="w-5 h-5" /> },
  ];

  return (
    <div className="flex h-screen bg-surface">
      <aside className="w-72 bg-surface flex-shrink-0 p-4 flex flex-col border-r border-outline">
        <div className="text-2xl font-light text-primary mb-8 px-2.5">Horizon AI</div>

        <div className="flex-grow overflow-y-auto pr-2 -mr-2">
          <nav className="space-y-1.5">
            {mainNav.map((item) => (
              <NavItem
                key={item.href}
                {...item}
                isActive={pathname === item.href}
              />
            ))}
          </nav>

          <NavSection title="Intelligence" />
          <nav className="space-y-1.5">
            {intelligenceNav.map((item) => (
              <NavItem
                key={item.href}
                {...item}
                isActive={pathname === item.href}
                disabled={true}
                tooltipText="Em construção"
              />
            ))}
          </nav>

          <NavSection title="Gestão Patrimonial" />
          <nav className="space-y-1.5">
            {planningNav.map((item) => (
              <NavItem
                key={item.href}
                {...item}
                isActive={pathname === item.href}
                disabled={true}
                tooltipText="Em construção"
              />
            ))}
          </nav>

          <NavSection title="Ecossistema" />
          <nav className="space-y-1.5">
            {ecosystemNav.map((item) => (
              <NavItem
                key={item.href}
                {...item}
                isActive={pathname === item.href}
                disabled={true}
                tooltipText="Em construção"
              />
            ))}
          </nav>
        </div>

        <div className="pt-4 mt-4 border-t border-outline">
          <div className="p-2.5 flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-primary-container text-primary flex items-center justify-center font-bold">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="font-medium text-sm text-on-surface">{user.name}</p>
              <p className="text-xs text-on-surface-variant">
                {user.email}
              </p>
            </div>
          </div>
          <nav className="space-y-1.5">
            {secondaryNav.map((item) => (
              <NavItem
                key={item.href}
                {...item}
                isActive={pathname === item.href}
              />
            ))}
            <button
              onClick={handleLogoutClick}
              className="w-full flex items-center p-2.5 rounded-lg text-sm font-medium transition-colors text-on-surface-variant hover:bg-on-surface/5"
            >
              <div className="mr-3">
                <LogOutIcon className="w-5 h-5" />
              </div>
              Sair
            </button>
          </nav>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto">
        <div className="p-6 md:p-10">{children}</div>
      </main>

      {/* Logout Confirmation Modal */}
      <Modal isOpen={isLogoutModalOpen} onClose={() => setIsLogoutModalOpen(false)} title="Confirmar Saída">
        <div className="p-6">
          <p className="text-on-surface-variant mb-6">
            Tem certeza que deseja sair da sua conta? Você precisará fazer login novamente para acessar o
            sistema.
          </p>
          <div className="flex gap-3 justify-end">
            <button
              onClick={() => setIsLogoutModalOpen(false)}
              className="px-4 py-2 rounded-lg text-sm font-medium text-on-surface hover:bg-on-surface/5 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleConfirmLogout}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-error text-on-error hover:bg-error/90 transition-colors"
            >
              Sair
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default DashboardLayout;

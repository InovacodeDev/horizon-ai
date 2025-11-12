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
  UsersIcon,
} from '@/components/assets/Icons';
import Modal from '@/components/ui/Modal';
import Tooltip from '@/components/ui/Tooltip';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import type { User } from '@/lib/types';

interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  href: string;
  isActive: boolean;
  disabled?: boolean;
  tooltipText?: string;
  hasSubmenu?: boolean;
  isExpanded?: boolean;
  onToggle?: () => void;
  isSubmenuItem?: boolean;
}

const NavItem: React.FC<NavItemProps> = ({ 
  icon, 
  label, 
  href, 
  isActive, 
  disabled = false, 
  tooltipText,
  hasSubmenu = false,
  isExpanded = false,
  onToggle,
  isSubmenuItem = false
}) => {
  const baseClasses = `flex items-center p-2.5 rounded-md text-sm font-medium transition-colors-smooth focus:outline-none
    ${isSubmenuItem ? 'pl-11' : ''}
    ${disabled ? 'opacity-50 cursor-not-allowed text-text-secondary' : isActive ? 'bg-blue-primary text-white' : 'text-text-secondary hover:bg-bg-secondary'}`;

  if (disabled && tooltipText) {
    return (
      <Tooltip content={tooltipText}>
        <div className={baseClasses}>
          <div className="mr-3 w-5 h-5 flex items-center justify-center">{icon}</div>
          <span className="flex-grow">{label}</span>
        </div>
      </Tooltip>
    );
  }

  if (disabled) {
    return (
      <div className={baseClasses}>
        <div className="mr-3 w-5 h-5 flex items-center justify-center">{icon}</div>
        <span className="flex-grow">{label}</span>
      </div>
    );
  }

  if (hasSubmenu && onToggle) {
    return (
      <div className="flex items-center gap-1">
        <Link href={href} className="flex-1 focus:outline-none">
          <div className={baseClasses}>
            <div className="mr-3 w-5 h-5 flex items-center justify-center">{icon}</div>
            <span className="flex-grow">{label}</span>
          </div>
        </Link>
        <button
          onClick={onToggle}
          className="p-3 rounded-md text-text-secondary hover:bg-bg-secondary transition-colors-smooth focus:outline-none"
          aria-label={isExpanded ? 'Recolher submenu' : 'Expandir submenu'}
        >
          <svg
            className={`w-4 h-4 transition-transform-smooth ${isExpanded ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>
    );
  }

  return (
    <Link href={href} className="block focus:outline-none">
      <div className={baseClasses}>
        <div className="mr-3 w-5 h-5 flex items-center justify-center">{icon}</div>
        <span className="flex-grow">{label}</span>
      </div>
    </Link>
  );
};

const NavSection: React.FC<{ title: string }> = ({ title }) => (
  <h3 className="px-2.5 pt-4 pb-2 text-xs font-medium text-text-tertiary uppercase tracking-wider">
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
  const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>({
    invoices: pathname.startsWith('/invoices'),
  });

  const handleLogoutClick = () => {
    setIsLogoutModalOpen(true);
  };

  const toggleMenu = (menuKey: string) => {
    setExpandedMenus(prev => ({
      ...prev,
      [menuKey]: !prev[menuKey],
    }));
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
    // { href: '/warranties', label: 'Garantias', icon: <ShieldCheckIcon className="w-5 h-5" /> }, // TODO: Implementar
  ];

  const invoicesNav = {
    main: { href: '/invoices', label: 'Notas Fiscais', icon: <ReceiptIcon className="w-5 h-5" /> },
    submenu: [
      { href: '/invoices/insights', label: 'Insights', icon: <TrendingUpIcon className="w-4 h-4" /> },
      { href: '/invoices/products', label: 'Produtos', icon: <ShoppingCartIcon className="w-4 h-4" /> },
    ],
  };

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
    { href: '/joint-account', label: 'Conta Conjunta', icon: <UsersIcon className="w-5 h-5" /> },
    { href: '/help', label: 'Ajuda e Suporte', icon: <HelpCircleIcon className="w-5 h-5" /> },
  ];

  return (
    <div className="flex h-screen bg-bg-primary">
      <aside className="w-72 bg-surface-new-primary flex-shrink-0 p-4 flex flex-col border-r border-border-primary transition-all duration-200">
        <div className="text-2xl font-light text-blue-primary mb-8 px-2.5">Horizon AI</div>

        <div className="flex-grow overflow-y-auto pr-2 -mr-2 scrollbar-thin">
          <nav className="space-y-1.5">
            {mainNav.map((item) => (
              <NavItem
                key={item.href}
                {...item}
                isActive={pathname === item.href}
              />
            ))}
          </nav>

          <NavSection title="Inteligência" />
          <nav className="space-y-1.5">
            {intelligenceNav.map((item) => (
              <NavItem
                key={item.href}
                {...item}
                isActive={pathname === item.href}
              />
            ))}
            
            {/* Invoices with submenu */}
            <NavItem
              {...invoicesNav.main}
              isActive={pathname === invoicesNav.main.href}
              hasSubmenu={true}
              isExpanded={expandedMenus.invoices}
              onToggle={() => toggleMenu('invoices')}
            />
            {expandedMenus.invoices && (
              <div className="space-y-1.5">
                {invoicesNav.submenu.map((item) => (
                  <NavItem
                    key={item.href}
                    {...item}
                    isActive={pathname === item.href}
                    isSubmenuItem={true}
                  />
                ))}
              </div>
            )}
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

        <div className="pt-4 mt-4 border-t border-border-primary">
          <div className="p-2.5 flex items-center gap-3 mb-2">
            <div className="flex-1">
              <p className="font-medium text-sm text-text-primary">{user.name}</p>
              <p className="text-xs text-text-secondary">
                {user.email}
              </p>
            </div>
            <ThemeToggle />
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
              className="w-full flex items-center p-2.5 rounded-md text-sm font-medium transition-colors-smooth text-text-secondary hover:bg-bg-secondary"
            >
              <div className="mr-3 w-5 h-5 flex items-center justify-center">
                <LogOutIcon className="w-5 h-5" />
              </div>
              Sair
            </button>
          </nav>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto bg-bg-primary">
        <div className="px-4 py-4 md:px-8 md:py-8 max-w-[1280px] mx-auto w-full">
          {children}
        </div>
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

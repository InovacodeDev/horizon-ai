'use client';

import React, { useState } from 'react';
import { BellIcon, SearchIcon } from '@/components/assets/Icons';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import type { User } from '@/lib/types';

interface HeaderProps {
  user: User;
  title?: string;
}

const Header: React.FC<HeaderProps> = ({ user, title }) => {
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <header className="bg-surface-new-primary border-b border-border-primary px-6 py-4 flex items-center justify-between h-16 transition-colors-smooth">
      <div>
        {title && <h1 className="text-2xl font-semibold text-text-primary">{title}</h1>}
      </div>
      
      <div className="flex items-center gap-3">
        {/* Search Bar */}
        <div className="relative hidden md:block">
          <input
            type="text"
            placeholder="Buscar..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-10 w-64 pl-10 pr-4 bg-bg-secondary border border-border-primary rounded-md text-sm
                     placeholder:text-text-tertiary transition-colors-smooth
                     focus:border-border-focus focus:ring-2 focus:ring-border-focus focus:ring-opacity-10 focus:outline-none"
          />
          <SearchIcon className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary pointer-events-none" />
        </div>
        
        {/* Search Button (Mobile) */}
        <button 
          className="md:hidden p-2 rounded-md text-text-secondary hover:bg-bg-secondary transition-colors-smooth"
          aria-label="Buscar"
        >
          <SearchIcon className="w-5 h-5" />
        </button>
        
        {/* Notifications */}
        <button 
          className="p-2 rounded-md text-text-secondary hover:bg-bg-secondary transition-colors-smooth relative"
          aria-label="Notificações"
        >
          <BellIcon className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-text rounded-full"></span>
        </button>
        
        {/* Theme Toggle */}
        <ThemeToggle />
        
        {/* User Avatar */}
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-full bg-blue-light text-blue-primary flex items-center justify-center font-bold text-sm">
            {user.name.charAt(0).toUpperCase()}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;

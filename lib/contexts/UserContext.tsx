'use client';

import React, { createContext, useContext } from 'react';
import { User } from '@/lib/types';

interface UserContextType {
  user: User;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ 
  user, 
  children 
}: { 
  user: User; 
  children: React.ReactNode;
}) {
  return (
    <UserContext.Provider value={{ user }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}

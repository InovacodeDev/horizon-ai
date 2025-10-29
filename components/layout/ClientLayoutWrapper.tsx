'use client';

import React from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { UserProvider } from '@/lib/contexts/UserContext';
import { User } from '@/lib/types';

interface ClientLayoutWrapperProps {
  user: User;
  children: React.ReactNode;
}

export default function ClientLayoutWrapper({ user, children }: ClientLayoutWrapperProps) {
  return (
    <UserProvider user={user}>
      <DashboardLayout user={user}>
        {children}
      </DashboardLayout>
    </UserProvider>
  );
}

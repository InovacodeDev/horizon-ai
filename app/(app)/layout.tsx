import React from 'react';
import { redirect } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { getCurrentUser } from '@/lib/auth/session';
import { User } from '@/lib/types';

/**
 * Protected App Layout
 * Wraps all protected routes with DashboardLayout
 * Fetches current user on the server and redirects if not authenticated
 * Requirements: 2.5, 6.5
 */
export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Fetch current user on the server using Next.js 16 Async Request APIs
  const user = await getCurrentUser();

  // Redirect to login if not authenticated
  if (!user) {
    redirect('/login');
  }

  // Transform JWT payload to User format expected by DashboardLayout
  const userData: User = {
    $id: user.sub,
    ...user,
    email: user.email,
    name: user.name || user.email.split('@')[0],
    $createdAt: '',
    $updatedAt: '',
    auth_user_id: '',
    created_at: '',
    updated_at: ''
  };

  return (
    <DashboardLayout user={userData}>
      {children}
    </DashboardLayout>
  );
}

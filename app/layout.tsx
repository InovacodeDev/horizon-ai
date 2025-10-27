import type { Metadata, Viewport } from 'next';
import './globals.css';
import { initializeAppwrite } from '@/lib/appwrite/client';

export const metadata: Metadata = {
  title: 'Horizon AI - Financial Management Platform',
  description: 'Comprehensive financial management platform with AI-powered insights',
  keywords: ['finance', 'banking', 'financial management', 'AI', 'personal finance'],
  authors: [{ name: 'Horizon AI Team' }],
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0a0a0a' },
  ],
};

initializeAppwrite();

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body className="antialiased" suppressHydrationWarning>{children}</body>
    </html>
  );
}

import type { Metadata, Viewport } from 'next';
import './globals.css';
import { initializeAppwrite } from '@/lib/appwrite/client';
import '@/lib/server-init'; // Inicializa serviços em background

export const metadata: Metadata = {
  title: 'Horizon AI - Plataforma de Gestão Financeira',
  description: 'Plataforma completa de gestão financeira com insights impulsionados por IA',
  keywords: ['finanças', 'banco', 'gestão financeira', 'IA', 'finanças pessoais'],
  authors: [{ name: 'Equipe Horizon AI' }],
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

import React from 'react';

/**
 * Authentication Layout
 * Simple layout for public authentication pages (login, register)
 * No sidebar or complex navigation - just centered content
 */
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-bg-primary flex flex-col">
      {/* Header with logo */}
      <header className="w-full px-6 py-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl font-semibold text-blue-primary">Horizon AI</h1>
        </div>
      </header>

      {/* Main content area - centered */}
      <main className="flex-1 flex items-center justify-center px-4 py-8 sm:px-6">
        <div className="w-full max-w-md">
          {children}
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full px-6 py-8 text-center text-sm text-text-tertiary">
        <p>&copy; 2024 Horizon AI. Todos os direitos reservados.</p>
      </footer>
    </div>
  );
}

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Card from '@/components/ui/Card';
import { ArrowLeftIcon } from '@/components/assets/Icons';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/sign-in', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
        credentials: 'include',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Authentication failed');
      }

      // Redirect to overview page after successful login
      router.push('/overview');
    } catch (err: any) {
      setError(err.message || 'An error occurred during login');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full">
      <div className="mb-6">
        <Link href="/">
          <Button variant="ghost" size="sm" className="!px-2">
            <ArrowLeftIcon className="w-5 h-5 mr-2" />
            Voltar para Início
          </Button>
        </Link>
      </div>
      <Card variant="elevated" padding="lg">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-semibold text-text-primary mb-2">Bem-vindo de volta</h1>
          <p className="text-sm text-text-secondary">Entre para continuar no Horizon AI.</p>
        </div>
        <form className="space-y-5" onSubmit={handleSubmit}>
          {error && (
            <div className="p-4 bg-red-bg border border-red-border rounded-md text-red-text text-sm animate-slide-up">
              {error}
            </div>
          )}
          <Input
            id="email"
            label="Endereço de Email"
            type="email"
            placeholder="voce@exemplo.com"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isLoading}
          />
          <Input
            id="password"
            label="Senha"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isLoading}
          />
          <Button 
            type="submit" 
            variant="primary" 
            size="lg" 
            className="w-full mt-6" 
            loading={isLoading}
            disabled={isLoading}
          >
            {isLoading ? 'Entrando...' : 'Entrar'}
          </Button>
        </form>
        <div className="mt-8 pt-6 border-t border-border-primary">
          <p className="text-center text-sm text-text-secondary">
            Não tem uma conta?{' '}
            <Link 
              href="/register" 
              className="font-medium text-blue-primary hover:text-blue-hover transition-colors"
            >
              Cadastre-se
            </Link>
          </p>
        </div>
      </Card>
    </div>
  );
}

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Card from '@/components/ui/Card';
import { ArrowLeftIcon } from '@/components/assets/Icons';

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const validatePassword = (pwd: string) => {
    if (pwd.length < 8) {
      setPasswordError('A senha deve ter pelo menos 8 caracteres');
      return false;
    }
    if (!/(?=.*[a-z])/.test(pwd)) {
      setPasswordError('A senha deve conter pelo menos uma letra minúscula');
      return false;
    }
    if (!/(?=.*[A-Z])/.test(pwd)) {
      setPasswordError('A senha deve conter pelo menos uma letra maiúscula');
      return false;
    }
    if (!/(?=.*\d)/.test(pwd)) {
      setPasswordError('A senha deve conter pelo menos um número');
      return false;
    }
    setPasswordError('');
    return true;
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPassword = e.target.value;
    setPassword(newPassword);
    if (newPassword.length > 0) {
      validatePassword(newPassword);
    } else {
      setPasswordError('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!validatePassword(password)) {
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/sign-up', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
          firstName,
          lastName: lastName || undefined,
        }),
        credentials: 'include',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Registration failed');
      }

      // Redirect to overview page after successful registration
      router.push('/overview');
    } catch (err: any) {
      setError(err.message || 'An error occurred during registration');
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
          <h1 className="text-2xl font-semibold text-text-primary mb-2">Crie sua conta</h1>
          <p className="text-sm text-text-secondary">Comece sua jornada para clareza financeira.</p>
        </div>
        <form className="space-y-5" onSubmit={handleSubmit}>
          {error && (
            <div className="p-4 bg-red-bg border border-red-border rounded-md text-red-text text-sm animate-slide-up">
              {error}
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              id="firstName"
              label="Nome"
              type="text"
              placeholder="Mariana"
              required
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              disabled={isLoading}
            />
            <Input
              id="lastName"
              label="Sobrenome"
              type="text"
              placeholder="Silva"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              disabled={isLoading}
            />
          </div>
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
            placeholder="Mín. 8 caracteres"
            required
            minLength={8}
            value={password}
            onChange={handlePasswordChange}
            disabled={isLoading}
            error={passwordError}
            helperText={!passwordError ? 'Deve conter maiúscula, minúscula e número' : undefined}
          />
          <Button 
            type="submit" 
            variant="primary" 
            size="lg" 
            className="w-full mt-6" 
            loading={isLoading}
            disabled={isLoading}
          >
            {isLoading ? 'Criando Conta...' : 'Criar Conta'}
          </Button>
        </form>
        <div className="mt-8 pt-6 border-t border-border-primary">
          <p className="text-center text-sm text-text-secondary">
            Já tem uma conta?{' '}
            <Link 
              href="/login" 
              className="font-medium text-blue-primary hover:text-blue-hover transition-colors"
            >
              Entre
            </Link>
          </p>
        </div>
      </Card>
    </div>
  );
}

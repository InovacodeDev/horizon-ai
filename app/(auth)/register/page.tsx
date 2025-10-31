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
      <div className="mb-4">
        <Link href="/">
          <Button variant="outlined" className="border-none !px-2">
            <ArrowLeftIcon className="w-5 h-5 mr-2" />
            Voltar para Início
          </Button>
        </Link>
      </div>
      <Card className="p-8">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-medium text-on-surface">Crie sua conta</h1>
          <p className="text-on-surface-variant">Comece sua jornada para clareza financeira.</p>
        </div>
        <form className="space-y-4" onSubmit={handleSubmit}>
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}
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
          <div>
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
            />
            {passwordError && <p className="text-sm text-red-500 mt-1">{passwordError}</p>}
            <p className="text-xs text-on-surface-variant mt-1">
              Deve conter maiúscula, minúscula e número
            </p>
          </div>
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? 'Criando Conta...' : 'Criar Conta'}
          </Button>
        </form>
        <p className="text-center text-sm text-on-surface-variant mt-6">
          Já tem uma conta?{' '}
          <Link href="/login" className="font-medium text-primary hover:underline">
            Entre
          </Link>
        </p>
      </Card>
    </div>
  );
}

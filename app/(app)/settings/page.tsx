'use client';

import React, { useState } from 'react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs';
import { useUser } from '@/lib/contexts/UserContext';

export default function SettingsPage() {
  const { user } = useUser();
  const [toastMessage, setToastMessage] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>, message: string) => {
    event.preventDefault();
    setToastMessage({ message, type: 'success' });
    // Clear toast after 3 seconds
    setTimeout(() => setToastMessage(null), 3000);
  };

  return (
    <div className="p-4 md:p-8">
      <header className="mb-6">
        <h1 className="text-3xl font-normal text-on-surface">Configurações</h1>
        <p className="text-base text-on-surface-variant mt-1">Gerencie sua conta e preferências.</p>
      </header>

      {toastMessage && (
        <div
          className={`mb-6 p-4 rounded-lg ${
            toastMessage.type === 'success' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
          }`}
        >
          {toastMessage.message}
        </div>
      )}

      <Card className="p-6">
        <Tabs defaultValue="account">
          <TabsList>
            <TabsTrigger value="account">Conta</TabsTrigger>
            <TabsTrigger value="security">Segurança</TabsTrigger>
            <TabsTrigger value="notifications">Notificações</TabsTrigger>
            <TabsTrigger value="preferences">Preferências</TabsTrigger>
          </TabsList>

          <TabsContent value="account">
            <form
              className="space-y-4 max-w-md"
              onSubmit={(e) => handleSubmit(e, 'Informações da conta salvas!')}
            >
              <h3 className="text-lg font-semibold text-on-surface">Informações do Perfil</h3>
              <Input id="firstName" label="Nome" defaultValue={user.name} />
              <Input
                id="email"
                label="Endereço de Email"
                type="email"
                defaultValue={user.email}
                readOnly
              />
              <Button type="submit">Salvar Alterações</Button>
            </form>
          </TabsContent>

          <TabsContent value="security">
            <form
              className="space-y-4 max-w-md"
              onSubmit={(e) => handleSubmit(e, 'Senha atualizada com sucesso!')}
            >
              <h3 className="text-lg font-semibold text-on-surface">Alterar Senha</h3>
              <Input id="currentPassword" label="Senha Atual" type="password" />
              <Input id="newPassword" label="Nova Senha" type="password" />
              <Input id="confirmPassword" label="Confirmar Nova Senha" type="password" />
              <Button type="submit">Atualizar Senha</Button>
            </form>
            <hr className="my-6 border-outline" />
            <div>
              <h3 className="text-lg font-semibold text-on-surface">Ações da Conta</h3>
              <p className="text-sm text-on-surface-variant mt-2 mb-4">
                Excluir permanentemente sua conta e todos os dados associados.
              </p>
              <Button className="bg-error hover:bg-error/90">Excluir Conta</Button>
            </div>
          </TabsContent>

          <TabsContent value="notifications">
            <form
              className="space-y-4 max-w-md"
              onSubmit={(e) => handleSubmit(e, 'Preferências de notificação salvas!')}
            >
              <h3 className="text-lg font-semibold text-on-surface">Notificações por Email</h3>
              <div className="flex items-center justify-between p-3 bg-surface-variant/20 rounded-m">
                <label htmlFor="weekly-summary" className="font-medium">
                  Resumo Semanal
                </label>
                <input type="checkbox" id="weekly-summary" className="toggle" defaultChecked />
              </div>
              <div className="flex items-center justify-between p-3 bg-surface-variant/20 rounded-m">
                <label htmlFor="large-purchase" className="font-medium">
                  Alertas de Compras Grandes
                </label>
                <input type="checkbox" id="large-purchase" className="toggle" defaultChecked />
              </div>
              <div className="flex items-center justify-between p-3 bg-surface-variant/20 rounded-m">
                <label htmlFor="warranty-reminder" className="font-medium">
                  Lembretes de Expiração de Garantia
                </label>
                <input type="checkbox" id="warranty-reminder" className="toggle" defaultChecked />
              </div>
              <Button type="submit">Salvar Preferências</Button>
            </form>
          </TabsContent>

          <TabsContent value="preferences">
            <form className="space-y-6 max-w-md" onSubmit={(e) => handleSubmit(e, 'Preferências salvas!')}>
              <div>
                <h3 className="text-lg font-semibold text-on-surface">Preferências de Exibição</h3>
                <div className="space-y-4 mt-4">
                  <div>
                    <label
                      htmlFor="currency"
                      className="block text-sm font-medium text-on-surface-variant mb-1"
                    >
                      Moeda
                    </label>
                    <select
                      id="currency"
                      name="currency"
                      className="w-full h-12 px-3 bg-surface border border-outline rounded-xl focus:ring-2 focus:ring-primary focus:outline-none transition-colors duration-200"
                    >
                      <option value="BRL">Real Brasileiro (BRL)</option>
                      <option value="USD">Dólar Americano (USD)</option>
                      <option value="EUR">Euro (EUR)</option>
                    </select>
                  </div>
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-on-surface">Comportamento do App</h3>
                <div className="space-y-4 mt-4">
                  <div>
                    <label
                      htmlFor="startScreen"
                      className="block text-sm font-medium text-on-surface-variant mb-1"
                    >
                      Tela Inicial Padrão
                    </label>
                    <select
                      id="startScreen"
                      name="startScreen"
                      className="w-full h-12 px-3 bg-surface border border-outline rounded-xl focus:ring-2 focus:ring-primary focus:outline-none transition-colors duration-200"
                    >
                      <option value="overview">Visão Geral</option>
                      <option value="transactions">Transações</option>
                      <option value="accounts">Contas</option>
                    </select>
                  </div>
                </div>
              </div>
              <Button type="submit">Salvar Preferências</Button>
            </form>
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
}

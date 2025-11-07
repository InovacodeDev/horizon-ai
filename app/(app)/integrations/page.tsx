'use client';

import React from 'react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { MOCK_INTEGRATIONS } from '@/lib/constants';
import type { Integration, IntegrationCategory } from '@/lib/types';
import { CheckIcon, LandmarkIcon, ShoppingCartIcon, HomeIcon, GiftIcon } from '@/components/assets/Icons';

const IntegrationCard: React.FC<{ integration: Integration }> = ({ integration }) => {
  const { name, description, logo: Logo, connected } = integration;
  
  // Use the appropriate icon based on category
  const IconComponent = Logo || LandmarkIcon;
  
  return (
    <Card className="p-4 flex items-center gap-4 transition-all duration-300 hover:shadow-md hover:-translate-y-1">
      <div className="p-2 bg-primary-container rounded-lg flex-shrink-0">
        <IconComponent className="w-8 h-8 text-primary" />
      </div>
      <div className="flex-grow">
        <h3 className="font-medium text-on-surface">{name}</h3>
        <p className="text-sm text-on-surface-variant">{description}</p>
      </div>
      {connected ? (
        <Button variant="outline" disabled leftIcon={<CheckIcon className="w-4 h-4" />}>
          Conectado
        </Button>
      ) : (
        <Button variant="outline">Conectar</Button>
      )}
    </Card>
  );
};

export default function IntegrationsPage() {
  const groupedIntegrations = React.useMemo(() => {
    return MOCK_INTEGRATIONS.reduce((acc, integration) => {
      const category = integration.category;
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(integration);
      return acc;
    }, {} as Record<IntegrationCategory, Integration[]>);
  }, []);

  const categoryOrder: IntegrationCategory[] = ['Investments', 'E-commerce', 'Real Estate', 'Rewards'];

  return (
    <div className="p-4 md:p-8">
      <header className="mb-8">
        <h1 className="text-3xl font-normal text-on-surface">Integrações de Aplicativos</h1>
        <p className="text-base text-on-surface-variant">
          Conecte outros serviços para enriquecer seu panorama financeiro e automatizar o rastreamento.
        </p>
      </header>
      <main className="space-y-8">
        {categoryOrder.map(
          (category) =>
            groupedIntegrations[category] && (
              <section key={category}>
                <h2 className="text-xl font-medium text-on-surface mb-4">{category}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {groupedIntegrations[category].map((integration) => (
                    <IntegrationCard key={integration.name} integration={integration} />
                  ))}
                </div>
              </section>
            )
        )}
      </main>
    </div>
  );
}

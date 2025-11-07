'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs';
import { Spinner } from '@/components/ui/Spinner';
import type { TaxAsset, TaxIncome } from '@/lib/types';
import { AlertTriangleIcon, PlusIcon, SparklesIcon } from '@/components/assets/Icons';

// Mock data - in a real app, this would come from an API
const MOCK_TAX_ASSETS: TaxAsset[] = [
  {
    $id: '1',
    groupCode: '04',
    groupName: 'Aplicações e Investimentos',
    itemCode: '01',
    itemName: 'Depósito em conta poupança',
    location: 'Brasil',
    description: 'Conta Poupança no Itaú Unibanco, Ag 9999 C/C 99999-9',
    value2023: 23.83,
    value2024: 10.0,
  },
  {
    $id: '2',
    groupCode: '07',
    groupName: 'Fundos',
    itemCode: '01',
    itemName: 'Fundos de Investimento sujeitos à tributação periódica (come-cotas)',
    location: 'Brasil',
    description: 'ITAU PERSONNALITE FICFI MM CHRONOS FICFI MM, CNPJ do Fundo: 12.345.678/9123-99',
    value2023: 473441.57,
    value2024: 150613.17,
  },
];

const MOCK_TAX_INCOMES: TaxIncome[] = [
  {
    $id: '1',
    type: 'EXEMPT',
    code: '12',
    description:
      'Rendimentos de cadernetas de poupança, letras hipotecárias, letras de crédito do agronegócio e imobiliário (LCA e LCI) e certificados de recebíveis do agronegócio e imobiliários (CRA e CRI)',
    value: 15239.9,
    sourceName: 'Itaú Unibanco SA',
    sourceCnpj: '60.701.190/0001-04',
  },
  {
    $id: '2',
    type: 'EXCLUSIVE',
    code: '06',
    description: 'Rendimentos de aplicações financeiras',
    value: 15165.82,
    sourceName: 'Itaú Unibanco SA',
    sourceCnpj: '60.701.190/0001-04',
  },
];

const formatBRL = (value: number) => {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

function TaxAssetRow({ asset }: { asset: TaxAsset }) {
  return (
    <tr className="border-b border-outline last:border-b-0 hover:bg-surface-variant/5">
      <td className="p-3 text-on-surface-variant">
        {asset.groupCode}.{asset.itemCode}
      </td>
      <td className="p-3 font-medium text-on-surface">{asset.itemName}</td>
      <td className="p-3 text-on-surface-variant text-xs max-w-sm">{asset.description}</td>
      <td className="p-3 text-right font-mono text-on-surface-variant">{formatBRL(asset.value2023)}</td>
      <td className="p-3 text-right font-mono font-medium text-on-surface">{formatBRL(asset.value2024)}</td>
    </tr>
  );
}

function TaxIncomeRow({ income }: { income: TaxIncome }) {
  return (
    <tr className="border-b border-outline last:border-b-0 hover:bg-surface-variant/5">
      <td className="p-3 text-on-surface-variant">{income.code}</td>
      <td className="p-3 font-medium text-on-surface max-w-xs">{income.description}</td>
      <td className="p-3 text-on-surface-variant text-xs">
        {income.sourceName}
        <br />
        {income.sourceCnpj}
      </td>
      <td className="p-3 text-right font-mono font-medium text-on-surface">{formatBRL(income.value)}</td>
    </tr>
  );
}

function MarkdownRenderer({ content }: { content: string }) {
  const lines = content.split('\n');
  return (
    <div className="prose prose-sm max-w-none text-on-surface-variant">
      {lines.map((line, index) => {
        if (line.startsWith('## ')) {
          return (
            <h2 key={index} className="text-lg font-medium text-on-surface mt-4 mb-2">
              {line.substring(3)}
            </h2>
          );
        }
        if (line.startsWith('* ')) {
          const lineContent = line.substring(2);
          const parts = lineContent.split('**');
          const renderedLine = parts.map((part, i) =>
            i % 2 === 1 ? (
              <strong key={i} className="font-medium text-on-surface">
                {part}
              </strong>
            ) : (
              part
            ),
          );
          return (
            <li key={index} className="ml-4 list-disc">
              {renderedLine}
            </li>
          );
        }
        if (line.trim() === '') {
          return <br key={index} />;
        }
        const parts = line.split('**');
        const renderedLine = parts.map((part, i) =>
          i % 2 === 1 ? (
            <strong key={i} className="font-medium text-on-surface">
              {part}
            </strong>
          ) : (
            part
          ),
        );
        return (
          <p key={index} className="mb-2">
            {renderedLine}
          </p>
        );
      })}
    </div>
  );
}

export default function TaxesPage() {
  const [assets] = useState<TaxAsset[]>(MOCK_TAX_ASSETS);
  const [exemptIncomes] = useState<TaxIncome[]>(MOCK_TAX_INCOMES.filter((i) => i.type === 'EXEMPT'));
  const [exclusiveIncomes] = useState<TaxIncome[]>(MOCK_TAX_INCOMES.filter((i) => i.type === 'EXCLUSIVE'));
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [userRole] = useState<'FREE' | 'PREMIUM'>('PREMIUM'); // This would come from auth context

  const handleUpgrade = () => {
    window.location.href = '/pricing';
  };

  const handleGenerateSummary = async () => {
    setIsGenerating(true);
    setAiSummary(null);

    // Simulate AI generation
    setTimeout(() => {
      setAiSummary(`## Resumo da sua Declaração de IRPF 2025

Olá! Aqui está um resumo da sua declaração de imposto de renda referente ao ano-calendário 2024.

## Patrimônio

* **Patrimônio Total em 2024**: ${formatBRL(assets.reduce((sum, a) => sum + a.value2024, 0))}
* **Evolução em relação a 2023**: ${formatBRL(assets.reduce((sum, a) => sum + (a.value2024 - a.value2023), 0))}

## Principais Bens

* Você possui investimentos em **fundos** e **poupança**
* Seus principais ativos estão localizados no **Brasil**

## Rendimentos

* **Rendimentos Isentos**: ${formatBRL(exemptIncomes.reduce((sum, i) => sum + i.value, 0))}
* **Rendimentos com Tributação Exclusiva**: ${formatBRL(exclusiveIncomes.reduce((sum, i) => sum + i.value, 0))}

Este é um resumo gerado por IA e não substitui a consulta a um contador profissional.`);
      setIsGenerating(false);
    }, 2000);
  };

  if (userRole === 'FREE') {
    return (
      <div className="p-4 md:p-8 text-center flex flex-col items-center justify-center h-full">
        <div className="bg-tertiary/20 p-3 rounded-full mb-4">
          <AlertTriangleIcon className="w-8 h-8 text-tertiary" />
        </div>
        <h2 className="text-2xl font-medium text-on-surface mb-2">Simplifique sua Declaração de Imposto</h2>
        <p className="text-on-surface-variant max-w-md mb-6">
          Faça upgrade para Premium para ter seu relatório de IRPF gerado automaticamente a partir de suas contas e
          investimentos conectados.
        </p>
        <Button onClick={handleUpgrade}>Fazer Upgrade para Premium</Button>
      </div>
    );
  }

  const patrimonio2023 = assets.reduce((sum, asset) => sum + asset.value2023, 0);
  const patrimonio2024 = assets.reduce((sum, asset) => sum + asset.value2024, 0);
  const evolucaoPatrimonial = patrimonio2024 - patrimonio2023;

  return (
    <div className="p-4 md:p-8">
      <header className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-3xl font-normal text-on-surface">Imposto de Renda (IRPF) 2025</h1>
          <p className="text-base text-on-surface-variant">
            Ano-calendário 2024. Prepare sua declaração com dados pré-compilados.
          </p>
        </div>
        <Button
          onClick={handleGenerateSummary}
          disabled={isGenerating}
          leftIcon={<SparklesIcon className="w-5 h-5" />}
        >
          {isGenerating ? 'Gerando...' : 'Gerar Resumo com IA'}
        </Button>
      </header>

      <main className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="p-4">
            <p className="text-sm text-on-surface-variant">Imposto a Restituir (est.)</p>
            <p className="text-2xl font-medium text-secondary">{formatBRL(8500)}</p>
          </Card>
          <Card className="p-4">
            <p className="text-sm text-on-surface-variant">Imposto a Pagar (est.)</p>
            <p className="text-2xl font-medium text-on-surface">{formatBRL(0)}</p>
          </Card>
          <Card className="p-4">
            <p className="text-sm text-on-surface-variant">Evolução Patrimonial</p>
            <p className={`text-2xl font-medium ${evolucaoPatrimonial >= 0 ? 'text-secondary' : 'text-error'}`}>
              {formatBRL(evolucaoPatrimonial)}
            </p>
          </Card>
        </div>

        <Card>
          <Tabs defaultValue="bens-e-direitos">
            <TabsList>
              <TabsTrigger value="bens-e-direitos">Bens e Direitos</TabsTrigger>
              <TabsTrigger value="rendimentos-isentos">Rendimentos Isentos</TabsTrigger>
              <TabsTrigger value="rendimentos-exclusivos">Rendimentos Exclusivos</TabsTrigger>
            </TabsList>

            <div className="p-4 md:p-6">
              <TabsContent value="bens-e-direitos">
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <h3 className="text-lg font-medium">Bens e Direitos</h3>
                    <p className="text-sm text-on-surface-variant">Seu patrimônio em 31/12/2023 e 31/12/2024.</p>
                  </div>
                  <Button variant="outline" leftIcon={<PlusIcon className="w-4 h-4" />}>
                    Adicionar Bem
                  </Button>
                </div>
                <div className="overflow-x-auto border border-outline rounded-lg">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-surface-variant/20">
                      <tr>
                        <th className="p-3 font-medium text-on-surface-variant">Código</th>
                        <th className="p-3 font-medium text-on-surface-variant">Tipo</th>
                        <th className="p-3 font-medium text-on-surface-variant">Discriminação</th>
                        <th className="p-3 font-medium text-on-surface-variant text-right">Situação em 31/12/2023</th>
                        <th className="p-3 font-medium text-on-surface-variant text-right">Situação em 31/12/2024</th>
                      </tr>
                    </thead>
                    <tbody>
                      {assets.map((asset) => (
                        <TaxAssetRow key={asset.$id} asset={asset} />
                      ))}
                    </tbody>
                  </table>
                </div>
              </TabsContent>

              <TabsContent value="rendimentos-isentos">
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <h3 className="text-lg font-medium">Rendimentos Isentos e Não Tributáveis</h3>
                    <p className="text-sm text-on-surface-variant">
                      Valores recebidos que não possuem incidência de imposto.
                    </p>
                  </div>
                  <Button variant="outline" leftIcon={<PlusIcon className="w-4 h-4" />}>
                    Adicionar Rendimento
                  </Button>
                </div>
                <div className="overflow-x-auto border border-outline rounded-lg">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-surface-variant/20">
                      <tr>
                        <th className="p-3 font-medium text-on-surface-variant">Código</th>
                        <th className="p-3 font-medium text-on-surface-variant">Tipo de Rendimento</th>
                        <th className="p-3 font-medium text-on-surface-variant">Fonte Pagadora</th>
                        <th className="p-3 font-medium text-on-surface-variant text-right">Valor</th>
                      </tr>
                    </thead>
                    <tbody>
                      {exemptIncomes.map((income) => (
                        <TaxIncomeRow key={income.$id} income={income} />
                      ))}
                    </tbody>
                  </table>
                </div>
              </TabsContent>

              <TabsContent value="rendimentos-exclusivos">
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <h3 className="text-lg font-medium">Rendimentos Sujeitos à Tributação Exclusiva/Definitiva</h3>
                    <p className="text-sm text-on-surface-variant">Rendimentos com imposto retido na fonte.</p>
                  </div>
                  <Button variant="outline" leftIcon={<PlusIcon className="w-4 h-4" />}>
                    Adicionar Rendimento
                  </Button>
                </div>
                <div className="overflow-x-auto border border-outline rounded-lg">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-surface-variant/20">
                      <tr>
                        <th className="p-3 font-medium text-on-surface-variant">Código</th>
                        <th className="p-3 font-medium text-on-surface-variant">Tipo de Rendimento</th>
                        <th className="p-3 font-medium text-on-surface-variant">Fonte Pagadora</th>
                        <th className="p-3 font-medium text-on-surface-variant text-right">Valor</th>
                      </tr>
                    </thead>
                    <tbody>
                      {exclusiveIncomes.map((income) => (
                        <TaxIncomeRow key={income.$id} income={income} />
                      ))}
                    </tbody>
                  </table>
                </div>
              </TabsContent>
            </div>
          </Tabs>
        </Card>

        {isGenerating && (
          <div className="flex justify-center items-center py-10">
            <Spinner />
          </div>
        )}

        {aiSummary && (
          <Card className="p-6 bg-primary-container/50 border border-primary/20">
            <div className="flex items-center gap-3 mb-4">
              <SparklesIcon className="w-6 h-6 text-primary" />
              <h2 className="text-xl font-medium text-on-surface">Resumo da Declaração (IA)</h2>
            </div>
            <MarkdownRenderer content={aiSummary} />
          </Card>
        )}
      </main>
    </div>
  );
}

# 💰 Documentação - Transação de Salário

## 🎯 Visão Geral

Esta documentação cobre a implementação completa do novo tipo de transação **"Salário"** no Horizon AI. Esta feature permite registrar salários com desconto automático de impostos na fonte, mantendo tudo sincronizado e organizado.

## 📚 Documentação Disponível

### 🚀 Para Começar

1. **[Índice Completo](./SALARY_INDEX.md)**
   - Navegação completa de toda a documentação
   - Links rápidos por tópico e caso de uso
   - Estrutura de arquivos

2. **[Guia de Migração](./SALARY_MIGRATION_GUIDE.md)** ⭐ **COMECE AQUI**
   - Passo a passo completo de implementação
   - Checklist de tarefas
   - Troubleshooting
   - Tempo estimado: 1-2 horas

### 📖 Documentação Técnica

3. **[Resumo da Feature](./SALARY_FEATURE_SUMMARY.md)**
   - Visão geral executiva
   - Características principais
   - Arquivos modificados
   - Fluxo de dados

4. **[Documentação Completa](./SALARY_TRANSACTIONS.md)**
   - Especificação técnica detalhada
   - Estrutura de dados
   - Operações CRUD
   - Validações

### 💡 Exemplos e Uso

5. **[Exemplos de Uso](./SALARY_USAGE_EXAMPLES.md)**
   - 10+ exemplos práticos
   - Casos de uso reais (CLT, Freelancer, etc.)
   - Cálculos de imposto
   - Componentes de visualização

6. **[Exemplo de Formulário](./SALARY_FORM_EXAMPLE.tsx)**
   - Componente React completo
   - Pronto para usar
   - Com validações e feedback

### ❓ Suporte

7. **[FAQ - Perguntas Frequentes](./SALARY_FAQ.md)**
   - 20+ perguntas e respostas
   - Problemas comuns e soluções
   - Dicas e truques

## 🎯 Início Rápido

### Para Desenvolvedores

```bash
# 1. Executar migração do banco de dados
npx tsx scripts/migrate-add-salary-type.ts

# 2. Verificar tipos TypeScript
npx tsc --noEmit

# 3. Iniciar servidor de desenvolvimento
npm run dev

# 4. Testar criação de salário
# Acesse: http://localhost:3000/examples/create-transaction
```

### Para Usuários

1. Acesse o formulário de transações
2. Selecione tipo "Salary"
3. Preencha o valor do salário bruto
4. Informe o imposto retido (opcional)
5. Selecione a conta de destino
6. Clique em "Cadastrar"

## ✨ Características Principais

### 🔄 Recorrência Automática

- Configurado automaticamente como mensal
- Sem data de término
- Ideal para salários fixos

### 💸 Imposto Automático

- Cria transação de despesa automaticamente
- Vinculada ao salário
- Sincroniza saldo corretamente

### 🔗 Vinculação de Transações

- Salário e imposto sempre conectados
- Atualização em cascata
- Exclusão em cascata

### 📊 Saldo Líquido

- Entrada: Salário bruto
- Saída: Imposto retido
- Resultado: Saldo líquido na conta

## 📋 Exemplo Rápido

```typescript
import { createTransactionAction } from '@/actions/transaction.actions';

// Criar salário com imposto
const formData = new FormData();
formData.append('amount', '5000.00'); // Salário bruto
formData.append('type', 'salary');
formData.append('tax_amount', '750.00'); // Imposto (15%)
formData.append('date', '2024-01-05');
formData.append('account_id', 'account123');
formData.append('category', 'Salário');

const result = await createTransactionAction(null, formData);

if (result.success) {
  console.log('✅ Salário cadastrado!');
  // Duas transações criadas:
  // 1. Salário: +R$ 5.000,00
  // 2. Imposto: -R$ 750,00
  // Saldo líquido: +R$ 4.250,00
}
```

## 🗂️ Estrutura de Arquivos

```
docs/
├── SALARY_README.md                # Este arquivo
├── SALARY_INDEX.md                 # Índice completo
├── SALARY_MIGRATION_GUIDE.md       # Guia passo a passo ⭐
├── SALARY_FEATURE_SUMMARY.md       # Resumo executivo
├── SALARY_TRANSACTIONS.md          # Documentação técnica
├── SALARY_USAGE_EXAMPLES.md        # Exemplos práticos
├── SALARY_FORM_EXAMPLE.tsx         # Componente de formulário
└── SALARY_FAQ.md                   # Perguntas frequentes

scripts/
└── migrate-add-salary-type.ts      # Script de migração

lib/
├── appwrite/schema.ts              # Schema atualizado
├── services/transaction.service.ts # Lógica de negócio
└── types/index.ts                  # Tipos TypeScript

actions/
└── transaction.actions.ts          # Server actions

components/
└── examples/
    └── CreateTransactionForm.tsx   # Formulário atualizado
```

## 🎓 Fluxo de Aprendizado

### Iniciante

1. Leia o [Guia de Migração](./SALARY_MIGRATION_GUIDE.md)
2. Execute a migração do banco de dados
3. Teste com o [Exemplo de Formulário](./SALARY_FORM_EXAMPLE.tsx)
4. Consulte o [FAQ](./SALARY_FAQ.md) quando tiver dúvidas

### Intermediário

1. Leia o [Resumo da Feature](./SALARY_FEATURE_SUMMARY.md)
2. Explore os [Exemplos de Uso](./SALARY_USAGE_EXAMPLES.md)
3. Adapte para seu caso de uso
4. Implemente validações personalizadas

### Avançado

1. Estude a [Documentação Completa](./SALARY_TRANSACTIONS.md)
2. Revise o código em `lib/services/transaction.service.ts`
3. Implemente features customizadas
4. Crie relatórios e dashboards

## 🔍 Busca Rápida

### Por Tarefa

- **Implementar**: [Guia de Migração](./SALARY_MIGRATION_GUIDE.md)
- **Criar Salário**: [Exemplos](./SALARY_USAGE_EXAMPLES.md#exemplo-1-salário-simples-sem-imposto)
- **Calcular Imposto**: [Exemplos](./SALARY_USAGE_EXAMPLES.md#-cálculos-de-imposto)
- **Criar Formulário**: [Componente](./SALARY_FORM_EXAMPLE.tsx)
- **Resolver Problema**: [FAQ](./SALARY_FAQ.md)

### Por Conceito

- **Recorrência**: [Documentação](./SALARY_TRANSACTIONS.md#2-recorrência-automática)
- **Imposto**: [FAQ](./SALARY_FAQ.md#2-o-que-acontece-se-eu-não-informar-o-valor-do-imposto)
- **Vinculação**: [Documentação](./SALARY_TRANSACTIONS.md#estrutura-de-dados)
- **Saldo**: [FAQ](./SALARY_FAQ.md#8-o-imposto-afeta-o-saldo-da-conta)

## 💡 Casos de Uso

### CLT (Consolidação das Leis do Trabalho)

```typescript
{
  amount: 4500.00,
  taxAmount: 450.00,  // IRRF
  type: 'salary',
  category: 'Salário CLT'
}
```

### Freelancer

```typescript
{
  amount: 8000.00,
  taxAmount: 1200.00,  // Retenção na fonte
  type: 'salary',
  category: 'Freelance'
}
```

### Servidor Público

```typescript
{
  amount: 6000.00,
  taxAmount: 900.00,  // IRRF + contribuições
  type: 'salary',
  category: 'Salário Público'
}
```

## 🛠️ Ferramentas

### Scripts Disponíveis

```bash
# Migração do banco de dados
npx tsx scripts/migrate-add-salary-type.ts

# Verificar tipos
npx tsc --noEmit

# Lint
npx eslint lib/services/transaction.service.ts

# Testes
npm test
```

### Componentes Prontos

- [Formulário de Cadastro](./SALARY_FORM_EXAMPLE.tsx)
- [Visualização de Salário](./SALARY_USAGE_EXAMPLES.md#-componente-de-visualização)
- [Relatório de Salários](./SALARY_USAGE_EXAMPLES.md#-relatório-de-salários)

## 📊 Estatísticas

- **Arquivos Modificados**: 5
- **Arquivos de Documentação**: 7
- **Exemplos de Código**: 10+
- **Perguntas no FAQ**: 20+
- **Tempo de Implementação**: 1-2 horas

## ✅ Checklist de Implementação

- [ ] Ler o [Guia de Migração](./SALARY_MIGRATION_GUIDE.md)
- [ ] Fazer backup do banco de dados
- [ ] Atualizar schema do Appwrite
- [ ] Executar script de migração
- [ ] Testar criação de salário
- [ ] Testar criação com imposto
- [ ] Testar atualização
- [ ] Testar exclusão
- [ ] Verificar sincronização de saldo
- [ ] Deploy em staging
- [ ] Testes em staging
- [ ] Deploy em produção

## 🆘 Precisa de Ajuda?

1. **Consulte o [FAQ](./SALARY_FAQ.md)** - 20+ perguntas respondidas
2. **Veja os [Exemplos](./SALARY_USAGE_EXAMPLES.md)** - Código pronto para usar
3. **Leia a [Documentação](./SALARY_TRANSACTIONS.md)** - Especificação completa
4. **Siga o [Guia](./SALARY_MIGRATION_GUIDE.md)** - Passo a passo detalhado

## 🎉 Recursos Adicionais

- [Appwrite Documentation](https://appwrite.io/docs)
- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://react.dev)
- [TypeScript Documentation](https://www.typescriptlang.org/docs)

## 📝 Notas de Versão

### v1.0.0 - Lançamento Inicial

**Novidades:**

- ✅ Tipo de transação 'salary'
- ✅ Criação automática de imposto
- ✅ Recorrência mensal automática
- ✅ Sincronização de saldo
- ✅ Vinculação de transações
- ✅ Documentação completa
- ✅ Exemplos de uso
- ✅ FAQ com 20+ perguntas

**Compatibilidade:**

- Next.js 14+
- React 19+
- Appwrite 1.4+
- TypeScript 5+

## 🤝 Contribuindo

Encontrou um erro na documentação? Tem uma sugestão?

1. Abra uma issue
2. Envie um pull request
3. Entre em contato com a equipe

## 📄 Licença

Esta documentação faz parte do projeto Horizon AI e segue a mesma licença.

---

**Última atualização**: Novembro 2024

**Versão**: 1.0.0

**Autor**: Equipe Horizon AI

---

## 🚀 Comece Agora!

**Pronto para implementar?**

👉 [Guia de Migração - Passo a Passo](./SALARY_MIGRATION_GUIDE.md)

**Quer ver exemplos?**

👉 [Exemplos de Uso - 10+ Casos Práticos](./SALARY_USAGE_EXAMPLES.md)

**Tem dúvidas?**

👉 [FAQ - Perguntas Frequentes](./SALARY_FAQ.md)

---

<div align="center">
  <strong>Documentação completa e pronta para uso! 🎉</strong>
</div>

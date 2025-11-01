# 🚀 Guia de Migração - Transação de Salário

## Passo a Passo para Implementação

Este guia detalha todos os passos necessários para implementar a feature de transação de salário no seu projeto.

## ✅ Pré-requisitos

Antes de começar, certifique-se de que você tem:

- [ ] Next.js 14+ instalado
- [ ] React 19+ instalado
- [ ] Appwrite configurado
- [ ] Acesso ao Appwrite Console ou CLI
- [ ] Permissões de administrador no projeto Appwrite
- [ ] Git configurado (recomendado para backup)

## 📋 Checklist de Implementação

### Fase 1: Backup e Preparação

- [ ] **1.1** Fazer backup do banco de dados
- [ ] **1.2** Criar uma branch no Git
- [ ] **1.3** Verificar versões das dependências
- [ ] **1.4** Revisar a documentação

### Fase 2: Atualização do Schema

- [ ] **2.1** Atualizar o schema do Appwrite
- [ ] **2.2** Verificar a atualização
- [ ] **2.3** Testar queries básicas

### Fase 3: Atualização do Código

- [ ] **3.1** Atualizar tipos TypeScript
- [ ] **3.2** Atualizar serviços
- [ ] **3.3** Atualizar actions
- [ ] **3.4** Atualizar componentes

### Fase 4: Testes

- [ ] **4.1** Testar criação de salário
- [ ] **4.2** Testar criação com imposto
- [ ] **4.3** Testar atualização
- [ ] **4.4** Testar exclusão
- [ ] **4.5** Testar sincronização de saldo

### Fase 5: Deploy

- [ ] **5.1** Revisar mudanças
- [ ] **5.2** Fazer merge da branch
- [ ] **5.3** Deploy em staging
- [ ] **5.4** Testes em staging
- [ ] **5.5** Deploy em produção

---

## 📝 Instruções Detalhadas

### Fase 1: Backup e Preparação

#### 1.1 Fazer Backup do Banco de Dados

**Via Appwrite Console:**

1. Acesse https://cloud.appwrite.io/console
2. Selecione seu projeto
3. Vá em "Databases" → Seu database
4. Clique em "Export" (se disponível)

**Via CLI:**

```bash
# Exportar dados (se suportado)
appwrite databases export --databaseId=horizon_ai_db
```

**Alternativa - Backup Manual:**

```bash
# Criar snapshot das transações existentes
npx tsx scripts/backup-transactions.ts
```

#### 1.2 Criar Branch no Git

```bash
# Criar e mudar para nova branch
git checkout -b feature/salary-transactions

# Verificar status
git status
```

#### 1.3 Verificar Versões

```bash
# Verificar versões
node --version    # Deve ser 18+
npm --version
npx next --version

# Verificar dependências do projeto
cat package.json | grep -E "next|react"
```

#### 1.4 Revisar Documentação

- [ ] Ler [SALARY_FEATURE_SUMMARY.md](./SALARY_FEATURE_SUMMARY.md)
- [ ] Ler [SALARY_TRANSACTIONS.md](./SALARY_TRANSACTIONS.md)
- [ ] Revisar [SALARY_USAGE_EXAMPLES.md](./SALARY_USAGE_EXAMPLES.md)

---

### Fase 2: Atualização do Schema

#### 2.1 Atualizar Schema do Appwrite

**Opção A: Via Appwrite Console (Recomendado)**

1. Acesse https://cloud.appwrite.io/console
2. Navegue até seu projeto
3. Vá em "Databases" → `horizon_ai_db`
4. Clique na collection `transactions`
5. Encontre o atributo `type`
6. Clique em "Update Attribute"
7. Na lista de elementos, adicione `salary`:
   ```
   Antes: income, expense, transfer
   Depois: income, expense, transfer, salary
   ```
8. Clique em "Update"
9. Aguarde a atualização ser processada

**Opção B: Via Appwrite CLI**

```bash
# Instalar CLI se necessário
npm install -g appwrite-cli

# Login
appwrite login

# Atualizar atributo
appwrite databases updateAttribute \
  --databaseId="horizon_ai_db" \
  --collectionId="transactions" \
  --key="type" \
  --elements="income,expense,transfer,salary"
```

**Opção C: Via Script**

```bash
# Executar script de migração
npx tsx scripts/migrate-add-salary-type.ts
```

#### 2.2 Verificar Atualização

**Via Console:**

1. Volte para a collection `transactions`
2. Clique no atributo `type`
3. Verifique se `salary` aparece na lista de elementos

**Via Script:**

```bash
# Executar novamente para verificar
npx tsx scripts/migrate-add-salary-type.ts
```

Você deve ver:

```
✅ Migration already applied! "salary" type exists.
```

#### 2.3 Testar Queries Básicas

```bash
# Criar arquivo de teste
cat > test-salary-query.ts << 'EOF'
import { Client, Databases, Query } from 'node-appwrite';

const client = new Client()
  .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
  .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!)
  .setKey(process.env.APPWRITE_API_KEY!);

const databases = new Databases(client);

async function testQuery() {
  try {
    // Tentar buscar transações do tipo salary
    const result = await databases.listDocuments(
      'horizon_ai_db',
      'transactions',
      [Query.equal('type', 'salary')]
    );
    console.log('✅ Query funcionou! Encontradas:', result.total, 'transações');
  } catch (error) {
    console.error('❌ Erro na query:', error);
  }
}

testQuery();
EOF

# Executar teste
npx tsx test-salary-query.ts

# Limpar
rm test-salary-query.ts
```

---

### Fase 3: Atualização do Código

#### 3.1 Atualizar Tipos TypeScript

Os arquivos já foram atualizados:

- ✅ `lib/appwrite/schema.ts`
- ✅ `lib/types/index.ts`

**Verificar:**

```bash
# Verificar se não há erros de tipo
npx tsc --noEmit
```

#### 3.2 Atualizar Serviços

O arquivo já foi atualizado:

- ✅ `lib/services/transaction.service.ts`

**Verificar:**

```bash
# Verificar sintaxe
npx eslint lib/services/transaction.service.ts
```

#### 3.3 Atualizar Actions

O arquivo já foi atualizado:

- ✅ `actions/transaction.actions.ts`

**Verificar:**

```bash
# Verificar sintaxe
npx eslint actions/transaction.actions.ts
```

#### 3.4 Atualizar Componentes

O arquivo já foi atualizado:

- ✅ `components/examples/CreateTransactionForm.tsx`

**Verificar:**

```bash
# Verificar sintaxe
npx eslint components/examples/CreateTransactionForm.tsx
```

---

### Fase 4: Testes

#### 4.1 Testar Criação de Salário (sem imposto)

```bash
# Iniciar servidor de desenvolvimento
npm run dev
```

**Teste Manual:**

1. Acesse http://localhost:3000/examples/create-transaction
2. Preencha o formulário:
   - Amount: 3000
   - Type: Salary
   - Category: Salário
   - Date: Hoje
3. Clique em "Create Transaction"
4. Verifique se a transação foi criada
5. Verifique no Appwrite Console se aparece como `salary`

**Teste Programático:**

```typescript
// test-create-salary.ts
import { TransactionService } from '@/lib/services/transaction.service';

const service = new TransactionService();

async function test() {
  const salary = await service.createManualTransaction({
    userId: 'test_user',
    amount: 3000,
    type: 'salary',
    date: new Date().toISOString(),
    category: 'Salário',
    currency: 'BRL',
    status: 'completed',
  });

  console.log('✅ Salário criado:', salary.$id);
  console.log('   Recorrente:', salary.is_recurring);
}

test();
```

#### 4.2 Testar Criação com Imposto

**Teste Manual:**

1. Acesse o formulário novamente
2. Preencha:
   - Amount: 5000
   - Type: Salary
   - Tax Amount: 750
   - Category: Salário
   - Date: Hoje
3. Clique em "Create Transaction"
4. Verifique se DUAS transações foram criadas
5. Verifique no Appwrite Console:
   - Uma transação tipo `salary` com valor 5000
   - Uma transação tipo `expense` com valor 750 e categoria "Impostos"

**Verificar Vinculação:**

```typescript
// Buscar salário
const salary = await service.getTransactionById('salary_id');
const salaryData = JSON.parse(salary.data || '{}');
console.log('Tax ID vinculado:', salaryData.linked_transaction_id);

// Buscar imposto
const tax = await service.getTransactionById(salaryData.linked_transaction_id);
const taxData = JSON.parse(tax.data || '{}');
console.log('Salary ID vinculado:', taxData.linked_transaction_id);
```

#### 4.3 Testar Atualização

**Teste Manual:**

1. Edite o salário criado
2. Altere o valor do imposto para 850
3. Salve
4. Verifique se a transação de imposto foi atualizada

**Teste Programático:**

```typescript
await service.updateTransaction('salary_id', {
  taxAmount: 850,
});

// Verificar se imposto foi atualizado
const tax = await service.getTransactionById('tax_id');
console.log('Novo valor do imposto:', tax.amount); // Deve ser 850
```

#### 4.4 Testar Exclusão

**Teste Manual:**

1. Delete o salário criado
2. Verifique se a transação de imposto também foi deletada

**Teste Programático:**

```typescript
await service.deleteTransaction('salary_id');

// Tentar buscar imposto (deve falhar)
try {
  await service.getTransactionById('tax_id');
  console.log('❌ Imposto não foi deletado!');
} catch (error) {
  console.log('✅ Imposto foi deletado corretamente');
}
```

#### 4.5 Testar Sincronização de Saldo

**Teste:**

1. Anote o saldo inicial da conta
2. Crie um salário de R$ 5000 com imposto de R$ 750
3. Verifique se o saldo aumentou em R$ 4250 (5000 - 750)
4. Delete o salário
5. Verifique se o saldo voltou ao valor inicial

---

### Fase 5: Deploy

#### 5.1 Revisar Mudanças

```bash
# Ver arquivos modificados
git status

# Ver diferenças
git diff

# Adicionar arquivos
git add .

# Commit
git commit -m "feat: add salary transaction type with automatic tax handling"
```

#### 5.2 Fazer Merge da Branch

```bash
# Voltar para main
git checkout main

# Merge
git merge feature/salary-transactions

# Push
git push origin main
```

#### 5.3 Deploy em Staging

```bash
# Se você usa Vercel
vercel --prod=false

# Ou outro serviço
npm run deploy:staging
```

#### 5.4 Testes em Staging

Repita todos os testes da Fase 4 no ambiente de staging.

#### 5.5 Deploy em Produção

```bash
# Vercel
vercel --prod

# Ou
npm run deploy:production
```

---

## 🔍 Verificação Final

Após o deploy, verifique:

- [ ] Schema do Appwrite está atualizado
- [ ] Criação de salário funciona
- [ ] Criação de imposto automática funciona
- [ ] Atualização funciona
- [ ] Exclusão em cascata funciona
- [ ] Saldo da conta está correto
- [ ] Recorrência está configurada
- [ ] Vinculação entre transações funciona

---

## 🐛 Troubleshooting

### Erro: "Invalid document structure"

**Causa**: Schema não foi atualizado corretamente.

**Solução**:

1. Verifique no Appwrite Console se `salary` está nos elementos
2. Tente atualizar novamente via CLI
3. Aguarde alguns minutos para propagação

### Erro: "Transaction type is required"

**Causa**: Formulário não está enviando o tipo corretamente.

**Solução**:

```typescript
// Verificar se o campo está sendo enviado
console.log('Type:', formData.get('type'));
```

### Imposto não está sendo criado

**Causa**: `taxAmount` não está sendo enviado ou é zero.

**Solução**:

```typescript
// Verificar valor
console.log('Tax Amount:', formData.get('tax_amount'));

// Garantir que é um número
const taxAmount = parseFloat(formData.get('tax_amount') as string);
console.log('Parsed:', taxAmount, 'Valid:', !isNaN(taxAmount));
```

### Saldo da conta incorreto

**Causa**: Sincronização de saldo falhou.

**Solução**:

```typescript
// Forçar ressincronização
import { BalanceSyncService } from '@/lib/services/balance-sync.service';

const syncService = new BalanceSyncService();
await syncService.syncAfterUpdate(accountId, transactionId);
```

---

## 📞 Suporte

Se você encontrar problemas:

1. Consulte o [FAQ](./SALARY_FAQ.md)
2. Revise os [Exemplos](./SALARY_USAGE_EXAMPLES.md)
3. Verifique os logs do servidor
4. Verifique os logs do Appwrite Console

---

## 🎉 Conclusão

Parabéns! Você implementou com sucesso a feature de transação de salário.

**Próximos passos:**

- Criar interface de usuário personalizada
- Adicionar validações específicas do seu negócio
- Implementar relatórios de salários
- Configurar notificações de recebimento

**Recursos úteis:**

- [Documentação Completa](./SALARY_TRANSACTIONS.md)
- [Exemplos de Uso](./SALARY_USAGE_EXAMPLES.md)
- [FAQ](./SALARY_FAQ.md)
- [Índice](./SALARY_INDEX.md)

---

**Tempo estimado de implementação**: 1-2 horas

**Dificuldade**: Intermediária

**Última atualização**: Novembro 2024

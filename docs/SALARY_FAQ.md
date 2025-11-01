# FAQ - Transação de Salário

## ❓ Perguntas Frequentes

### 1. Por que criar um tipo específico para salário?

**R:** O tipo `salary` foi criado para:

- Automatizar a recorrência mensal sem data de término
- Facilitar o registro de impostos retidos na fonte
- Manter salário e imposto sempre sincronizados
- Simplificar relatórios e análises financeiras

### 2. O que acontece se eu não informar o valor do imposto?

**R:** Se você não informar o `taxAmount` ou informar zero:

- Apenas a transação de salário será criada
- Nenhuma transação de imposto será gerada
- O salário ainda será marcado como recorrente mensal

```typescript
// Salário sem imposto
{
  amount: 3000.00,
  type: 'salary',
  // taxAmount não informado
}
// Resultado: Apenas 1 transação criada
```

### 3. Posso editar o valor do imposto depois?

**R:** Sim! Ao atualizar o salário com um novo `taxAmount`:

- Se já existe uma transação de imposto vinculada, ela será atualizada
- Se não existe, uma nova será criada
- O saldo da conta é recalculado automaticamente

```typescript
// Atualizar imposto
await updateTransaction('salary_123', {
  taxAmount: 850.0, // Novo valor
});
```

### 4. O que acontece se eu deletar o salário?

**R:** Ao deletar uma transação de salário:

- A transação de imposto vinculada é deletada automaticamente
- O saldo da conta é ajustado (remove salário e imposto)
- Não é necessário deletar manualmente o imposto

### 5. Como funciona a recorrência?

**R:** Transações de salário são automaticamente configuradas como:

- **Frequência**: Mensal
- **Intervalo**: 1 mês
- **Data de término**: Nenhuma (indefinido)

Isso significa que o sistema pode gerar automaticamente as próximas ocorrências do salário.

### 6. Posso ter múltiplos salários?

**R:** Sim! Você pode ter quantos salários quiser:

- Salário principal
- Salário de trabalho secundário
- Freelance recorrente
- Etc.

Cada um terá sua própria transação de imposto vinculada.

### 7. Como diferenciar salário de outras receitas?

**R:** Use o tipo `salary` para receitas que:

- São recorrentes mensais
- Têm imposto retido na fonte
- Não têm data de término definida

Use `income` para:

- Receitas eventuais
- Vendas
- Reembolsos
- Outras entradas não recorrentes

### 8. O imposto afeta o saldo da conta?

**R:** Sim! O fluxo é:

1. Salário entra na conta (+R$ 5.000)
2. Imposto sai da conta (-R$ 750)
3. Saldo líquido: +R$ 4.250

Ambas as transações afetam o saldo automaticamente.

### 9. Posso vincular o salário a uma conta específica?

**R:** Sim! Use o campo `accountId`:

```typescript
{
  amount: 5000.00,
  type: 'salary',
  accountId: 'conta_corrente_123',
  taxAmount: 750.00,
}
```

Tanto o salário quanto o imposto serão vinculados à mesma conta.

### 10. Como calcular o imposto automaticamente?

**R:** Você pode criar uma função helper:

```typescript
function calculateIRRF(grossSalary: number): number {
  // Tabela IRRF 2024 (exemplo simplificado)
  if (grossSalary <= 2112.0) return 0;
  if (grossSalary <= 2826.65) return grossSalary * 0.075 - 158.4;
  if (grossSalary <= 3751.05) return grossSalary * 0.15 - 370.4;
  if (grossSalary <= 4664.68) return grossSalary * 0.225 - 651.73;
  return grossSalary * 0.275 - 884.96;
}

// Uso
const grossSalary = 5000.0;
const taxAmount = Math.max(0, calculateIRRF(grossSalary));
```

### 11. Posso ver todas as transações vinculadas?

**R:** Sim! Cada transação tem um campo `linked_transaction_id` no JSON `data`:

```typescript
const salary = await getTransactionById('salary_123');
const salaryData = JSON.parse(salary.data || '{}');
const taxId = salaryData.linked_transaction_id;

if (taxId) {
  const tax = await getTransactionById(taxId);
  console.log('Imposto vinculado:', tax);
}
```

### 12. O que acontece se eu mudar a conta do salário?

**R:** Ao atualizar o `accountId`:

- O saldo da conta antiga é ajustado (remove salário e imposto)
- O saldo da nova conta é ajustado (adiciona salário e imposto)
- A transação de imposto também é movida para a nova conta

### 13. Posso desativar a recorrência?

**R:** Tecnicamente sim, mas não é recomendado para salários. Se você precisa de uma receita única com imposto, use o tipo `income` e crie manualmente a transação de imposto.

### 14. Como gerar relatórios de salários?

**R:** Use filtros na listagem:

```typescript
const { transactions } = await listTransactions({
  userId: 'user_123',
  type: 'salary',
  startDate: '2024-01-01',
  endDate: '2024-12-31',
});

const totalGross = transactions.reduce((sum, t) => sum + t.amount, 0);
console.log(`Total de salários em 2024: R$ ${totalGross}`);
```

### 15. Posso ter impostos diferentes para cada mês?

**R:** Sim! Cada transação de salário pode ter um valor de imposto diferente:

```typescript
// Janeiro - 15% de imposto
await createTransaction({
  amount: 5000.0,
  taxAmount: 750.0,
  date: '2024-01-05',
});

// Fevereiro - 20% de imposto (aumento salarial)
await createTransaction({
  amount: 6000.0,
  taxAmount: 1200.0,
  date: '2024-02-05',
});
```

### 16. Como funciona com 13º salário?

**R:** Para 13º salário, você pode:

**Opção 1**: Criar como salário normal

```typescript
{
  amount: 5000.00,
  type: 'salary',
  category: '13º Salário',
  taxAmount: 750.00,
  isRecurring: false, // 13º não é recorrente mensal
}
```

**Opção 2**: Criar como receita

```typescript
{
  amount: 5000.00,
  type: 'income',
  category: '13º Salário',
  // Criar imposto manualmente se necessário
}
```

### 17. Posso exportar dados de salários?

**R:** Sim! Busque as transações e exporte:

```typescript
const salaries = await listTransactions({
  type: 'salary',
  startDate: '2024-01-01',
  endDate: '2024-12-31',
});

// Converter para CSV, Excel, etc.
const csv = salaries.map((s) => `${s.date},${s.amount},${s.taxAmount || 0}`).join('\n');
```

### 18. Como lidar com múltiplos descontos?

**R:** O campo `taxAmount` representa o total de descontos. Se você precisa detalhar:

```typescript
const irrf = 500.0;
const inss = 250.0;
const totalTax = irrf + inss;

await createTransaction({
  amount: 5000.0,
  type: 'salary',
  taxAmount: totalTax, // 750.00
  description: 'Salário (IRRF: R$ 500 + INSS: R$ 250)',
});
```

### 19. Posso ter salários em moedas diferentes?

**R:** Sim! Use o campo `currency`:

```typescript
{
  amount: 2000.00,
  type: 'salary',
  currency: 'USD',
  taxAmount: 300.00,
}
```

### 20. Como migrar salários existentes?

**R:** Se você já tem salários cadastrados como `income`:

```typescript
// Buscar salários antigos
const oldSalaries = await listTransactions({
  type: 'income',
  category: 'Salário',
});

// Converter para novo tipo
for (const old of oldSalaries) {
  await updateTransaction(old.$id, {
    type: 'salary',
    isRecurring: true,
    recurringPattern: {
      frequency: 'monthly',
      interval: 1,
    },
  });
}
```

## 🆘 Problemas Comuns

### Erro: "Transaction type is required"

**Causa**: O campo `type` não foi enviado ou está vazio.

**Solução**:

```typescript
formData.append('type', 'salary'); // Não esqueça!
```

### Erro: "Valid tax amount is required"

**Causa**: O `taxAmount` foi enviado mas não é um número válido.

**Solução**:

```typescript
const taxAmount = parseFloat(formData.get('tax_amount'));
if (!isNaN(taxAmount) && taxAmount >= 0) {
  // OK
}
```

### Transação de imposto não foi criada

**Causa**: O `taxAmount` é zero ou não foi informado.

**Solução**: Verifique se o valor está sendo enviado corretamente:

```typescript
console.log('Tax amount:', formData.get('tax_amount'));
```

### Saldo da conta não está correto

**Causa**: Pode haver um problema na sincronização de saldo.

**Solução**: Force uma ressincronização:

```typescript
const balanceSyncService = new BalanceSyncService();
await balanceSyncService.syncAfterUpdate(accountId, transactionId);
```

### Não consigo atualizar o tipo para "salary"

**Causa**: O schema do Appwrite ainda não foi atualizado.

**Solução**: Execute a migração:

```bash
npx tsx scripts/migrate-add-salary-type.ts
```

## 📞 Suporte

Se você tiver outras dúvidas:

1. Consulte a [Documentação Completa](./SALARY_TRANSACTIONS.md)
2. Veja os [Exemplos de Uso](./SALARY_USAGE_EXAMPLES.md)
3. Revise o [Resumo da Feature](./SALARY_FEATURE_SUMMARY.md)

## 🎓 Recursos Adicionais

- [Exemplo de Formulário](./SALARY_FORM_EXAMPLE.tsx)
- [Script de Migração](../scripts/migrate-add-salary-type.ts)
- [Código do Serviço](../lib/services/transaction.service.ts)
- [Actions](../actions/transaction.actions.ts)

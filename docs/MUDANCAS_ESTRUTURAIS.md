# Mudanças Estruturais - Sistema de Transações e Cartões de Crédito

## Resumo das Alterações

Este documento descreve as mudanças estruturais implementadas no banco de dados e nos serviços para melhorar o gerenciamento de transações e cartões de crédito.

---

## 1. Nova Estrutura da Tabela `transactions`

### Colunas Adicionadas

As seguintes colunas foram movidas do campo JSON `data` para colunas dedicadas:

| Coluna           | Tipo        | Descrição                           |
| ---------------- | ----------- | ----------------------------------- |
| `credit_card_id` | string(255) | ID do cartão de crédito vinculado   |
| `category`       | string(100) | Categoria da transação              |
| `description`    | string(500) | Descrição da transação              |
| `currency`       | string(10)  | Moeda (padrão: BRL)                 |
| `source`         | enum        | Origem: manual, integration, import |
| `merchant`       | string(255) | Estabelecimento/comerciante         |
| `tags`           | string(500) | Tags separadas por vírgula          |
| `is_recurring`   | boolean     | Se é transação recorrente           |

### Índices Criados

```typescript
-idx_credit_card_id(ASC) - idx_category - idx_source - idx_merchant;
```

### Campo `data` Reduzido

O campo JSON `data` agora armazena apenas:

- `location` (latitude, longitude, address)
- `receipt_url`
- `recurring_pattern` (frequency, interval, endDate)
- `integration_id` e `integration_data` (para transações de integração)

---

## 2. Migration Criada

**Arquivo**: `lib/database/migrations/20251029_000016_add_credit_card_id_to_transactions.ts`

### Comandos para Executar

```bash
# Aplicar migration
npm run migrate:up

# Reverter migration (se necessário)
npm run migrate:down
```

---

## 3. Novo Serviço: CreditCardService

**Arquivo**: `lib/services/credit-card.service.ts`

### Métodos Principais

#### `calculateAvailableLimit(creditCardId: string)`

Calcula o limite disponível do cartão:

```typescript
{
  creditLimit: 5000,      // Limite total
  usedLimit: 1200,        // Soma de todas as transações
  availableLimit: 3800    // Limite disponível
}
```

#### `syncUsedLimit(creditCardId: string)`

Atualiza o campo `used_limit` do cartão baseado nas transações.

**Quando é chamado:**

- Após criar uma transação
- Após atualizar uma transação
- Após deletar uma transação

---

## 4. Atualizações no TransactionService

### Método `createManualTransaction`

**Antes:**

```typescript
const transactionData = {
  category: data.category,
  description: data.description,
  credit_card_id: data.creditCardId,
  // ... tudo no JSON
};
payload.data = JSON.stringify(transactionData);
```

**Depois:**

```typescript
payload.category = data.category;
payload.description = data.description;
payload.credit_card_id = data.creditCardId;
// ... colunas dedicadas

// data JSON apenas para campos não estruturados
const transactionData = {
  location: data.location,
  receipt_url: data.receiptUrl,
  // ...
};
```

### Sincronização Automática

Após criar/atualizar/deletar transação:

1. **Se vinculada a conta**: Sincroniza saldo da conta
2. **Se vinculada a cartão**: Sincroniza limite usado do cartão

---

## 5. Nova API Endpoint

### GET `/api/credit-cards/[id]/limit`

Retorna informações de limite do cartão.

**Resposta:**

```json
{
  "success": true,
  "data": {
    "creditLimit": 5000,
    "usedLimit": 1200,
    "availableLimit": 3800
  }
}
```

---

## 6. Benefícios das Mudanças

### Performance

✅ **Queries mais rápidas**: Filtros diretos nas colunas indexadas
✅ **Sem parsing JSON**: Dados já estruturados
✅ **Índices otimizados**: Busca por cartão, categoria, merchant

### Manutenibilidade

✅ **Código mais limpo**: Menos manipulação de JSON
✅ **Type-safe**: TypeScript valida os campos
✅ **Debugging facilitado**: Dados visíveis no banco

### Funcionalidades

✅ **Limite em tempo real**: Calculado automaticamente
✅ **Filtros avançados**: Por cartão, categoria, merchant
✅ **Relatórios precisos**: Dados estruturados

---

## 7. Compatibilidade

### Backward Compatibility

O campo `data` ainda existe para:

- Transações antigas (antes da migration)
- Campos não estruturados (location, receipt_url)
- Extensibilidade futura

### Migration de Dados Existentes

Se você tem transações antigas, execute o script de migração:

```bash
# TODO: Criar script de migração de dados
npm run migrate:data
```

Este script irá:

1. Ler todas as transações
2. Extrair dados do campo JSON `data`
3. Mover para as novas colunas
4. Limpar o campo `data`

---

## 8. Exemplo de Uso

### Criar Transação com Cartão

```typescript
const transaction = await transactionService.createManualTransaction({
  userId: 'user_123',
  amount: 150.0,
  type: 'expense',
  category: 'Alimentação',
  description: 'Almoço',
  merchant: 'Restaurante XYZ',
  date: '2025-10-29',
  currency: 'BRL',
  creditCardId: 'card_456', // Vincula ao cartão
  status: 'completed',
});

// Limite do cartão é atualizado automaticamente
```

### Buscar Transações por Cartão

```typescript
const { transactions } = await transactionService.listTransactions({
  userId: 'user_123',
  creditCardId: 'card_456', // Filtro direto na coluna
});
```

### Verificar Limite Disponível

```typescript
const creditCardService = new CreditCardService();
const { availableLimit } = await creditCardService.calculateAvailableLimit('card_456');

console.log(`Limite disponível: R$ ${availableLimit}`);
```

---

## 9. Próximos Passos

- [ ] Executar migration no banco de dados
- [ ] Migrar dados existentes (se houver)
- [ ] Atualizar testes unitários
- [ ] Atualizar documentação da API
- [ ] Monitorar performance das queries

---

## 10. Rollback

Se necessário reverter as mudanças:

```bash
# 1. Reverter migration
npm run migrate:down

# 2. Restaurar código anterior
git revert <commit-hash>

# 3. Verificar integridade dos dados
npm run test
```

---

## Suporte

Para dúvidas ou problemas:

1. Verifique os logs de migration
2. Consulte a documentação do Appwrite
3. Revise os testes unitários

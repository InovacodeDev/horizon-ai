# Scripts de Sincronização de Saldo

Este diretório contém scripts utilitários para diagnosticar e corrigir problemas de sincronização de saldo.

## Problema Relatado

Ao editar uma transação, o sistema estava somando o novo valor inteiro ao saldo da conta, ao invés de calcular a diferença entre o valor antigo e o novo valor.

## Análise do Código

Após análise completa do código, identificamos que:

1. **O código está correto**: O método `syncAccountBalance` no `BalanceSyncService` sempre recalcula o saldo do zero, somando todas as transações da conta.

2. **Não há soma incremental**: O sistema não faz `balance += newAmount`, ele faz `balance = sum(all transactions)`.

3. **O problema não deveria ocorrer**: Com a implementação atual, o problema descrito não deveria acontecer.

## Possíveis Causas

Se o problema ainda está ocorrendo, pode ser devido a:

1. **Cache do navegador**: Dados antigos sendo exibidos
2. **Dados inconsistentes**: Transações duplicadas ou corrompidas no banco
3. **Condição de corrida**: Múltiplas atualizações simultâneas
4. **Problema de UI**: O frontend pode estar exibindo dados incorretos

## Scripts Disponíveis

### 1. test-balance-sync.ts

Testa a sincronização de saldo de uma conta específica.

**Como usar:**

```bash
# 1. Edite o arquivo e substitua YOUR_ACCOUNT_ID_HERE pelo ID real da conta
# 2. Execute o script
npx tsx scripts/test-balance-sync.ts
```

**O que ele faz:**

- Busca a conta e suas transações
- Calcula o saldo manualmente
- Compara com o saldo no banco
- Força um recálculo
- Verifica se o recálculo corrigiu o problema

### 2. recalculate-all-balances.ts

Recalcula o saldo de todas as contas do sistema.

**Como usar:**

```bash
npx tsx scripts/recalculate-all-balances.ts
```

**O que ele faz:**

- Busca todas as contas
- Recalcula o saldo de cada uma
- Mostra a diferença entre o saldo anterior e o novo
- Exibe um resumo ao final

**⚠️ Atenção**: Este script irá atualizar o saldo de TODAS as contas. Use com cuidado em produção.

## Como o Sistema Funciona

### Fluxo de Sincronização

1. **Criar Transação**:

   ```
   TransactionService.createManualTransaction()
   → BalanceSyncService.syncAfterCreate()
   → BalanceSyncService.syncAccountBalance()
   → Recalcula saldo do zero
   ```

2. **Editar Transação**:

   ```
   TransactionService.updateTransaction()
   → BalanceSyncService.syncAfterUpdate()
   → BalanceSyncService.syncAccountBalance()
   → Recalcula saldo do zero
   ```

3. **Deletar Transação**:
   ```
   TransactionService.deleteTransaction()
   → BalanceSyncService.syncAfterDelete()
   → BalanceSyncService.syncAccountBalance()
   → Recalcula saldo do zero
   ```

### Cálculo do Saldo

O método `syncAccountBalance` sempre:

1. Busca TODAS as transações da conta
2. Filtra transações de cartão de crédito (não afetam o saldo da conta)
3. Soma receitas: `balance += transaction.amount`
4. Subtrai despesas: `balance -= transaction.amount`
5. Atualiza o saldo da conta no banco

**Não há soma incremental!** O saldo é sempre recalculado do zero.

## Solução Recomendada

Se você está enfrentando o problema descrito:

1. **Execute o script de recálculo**:

   ```bash
   npx tsx scripts/recalculate-all-balances.ts
   ```

2. **Limpe o cache do navegador**:
   - Chrome/Edge: Cmd+Shift+R (Mac) ou Ctrl+Shift+R (Windows)
   - Firefox: Cmd+Shift+Delete (Mac) ou Ctrl+Shift+Delete (Windows)

3. **Verifique se há transações duplicadas**:
   - Acesse o banco de dados
   - Verifique se há transações com mesma descrição, valor e data

4. **Monitore o comportamento**:
   - Edite uma transação
   - Verifique o console do navegador
   - Verifique os logs do servidor

## Logs de Depuração

Para adicionar logs de depuração, você pode modificar temporariamente o `BalanceSyncService`:

```typescript
async syncAccountBalance(accountId: string): Promise<number> {
  console.log(`🔍 [DEBUG] Iniciando sync para conta ${accountId}`);

  // ... código existente ...

  console.log(`🔍 [DEBUG] Transações encontradas: ${transactions.length}`);
  console.log(`🔍 [DEBUG] Saldo calculado: ${newBalance}`);

  // ... resto do código ...
}
```

## Contato

Se o problema persistir após executar os scripts, por favor:

1. Execute o script de teste
2. Copie a saída completa
3. Verifique se há erros no console
4. Documente os passos para reproduzir o problema

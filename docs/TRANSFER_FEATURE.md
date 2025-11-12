# Funcionalidade de Transferência entre Contas

## Visão Geral

A funcionalidade de transferência permite que usuários transfiram saldo entre suas contas de forma simples e segura.

## Implementação

### 1. Transações Tipo "Transfer"

As transferências são implementadas como transações com `type='transfer'`:

- **Invisíveis**: Não aparecem em listagens de transações para o usuário
- **Automáticas**: Afetam o saldo das contas automaticamente via BalanceSyncService
- **Em Pares**: Cada transferência cria duas transações:
  - Uma com `transfer_direction: 'out'` (diminui saldo da origem)
  - Uma com `transfer_direction: 'in'` (aumenta saldo do destino)

### 2. Campos no JSON `data`

Cada transação tipo "transfer" contém no campo `data`:

```typescript
{
  transfer_direction: 'out' | 'in',
  transfer_to_account_id?: string,    // Para transações 'out'
  transfer_to_account_name?: string,  // Para transações 'out'
  transfer_from_account_id?: string,  // Para transações 'in'
  transfer_from_account_name?: string, // Para transações 'in'
  description?: string
}
```

### 3. Migration

- **Arquivo**: `lib/database/migrations/20251111_000029_drop_transfer_logs_table.ts`
- **Status**: Remove a tabela `transfer_logs` (não mais necessária)

### 4. Ação de Transferência

- **Arquivo**: `actions/account.actions.ts`
- **Função**: `transferBalanceAction`
- Valida contas de origem e destino
- Verifica saldo suficiente
- Cria transações tipo "transfer"

### 5. Serviço de Conta

- **Arquivo**: `lib/services/account.service.ts`
- **Método**: `transferBalance`
- Cria duas transações tipo "transfer" (saída + entrada)
- Sincroniza saldos via BalanceSyncService

### 6. Modal de Transferência

- **Arquivo**: `components/modals/TransferBalanceModal.tsx`
- Interface intuitiva com seleção de contas
- Validação de saldo em tempo real
- Campo opcional para descrição

### 7. Integração na Página de Contas

- Botão "Transferir" ao lado de "Adicionar Conta"
- Desabilitado quando há menos de 2 contas
- Ícone de transferência para melhor UX

## Como Usar

1. Acesse a página "Suas Contas"
2. Clique no botão "Transferir" (disponível quando há 2+ contas)
3. Selecione a conta de origem
4. Selecione a conta de destino
5. Informe o valor da transferência
6. Adicione uma descrição (opcional)
7. Clique em "Transferir"

## Validações

- Conta de origem e destino devem ser diferentes
- Valor deve ser maior que zero
- Saldo da conta de origem deve ser suficiente
- Ambas as contas devem pertencer ao usuário

## Logs

Todas as transferências são registradas como transações tipo "transfer":

- Duas transações são criadas (uma de saída, uma de entrada)
- Transações tipo "transfer" não aparecem na UI
- Afetam o saldo das contas automaticamente

## Observações

- A transferência cria transações invisíveis que afetam o saldo
- Os saldos são recalculados automaticamente pelo BalanceSyncService
- A interface é atualizada automaticamente via realtime
- Transações tipo "transfer" são filtradas em todas as listagens

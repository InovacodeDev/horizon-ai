# Funcionalidade de Transferência entre Contas

## Visão Geral

A funcionalidade de transferência permite que usuários transfiram saldo entre suas contas de forma simples e segura.

## Componentes Criados

### 1. Tabela `transfer_logs`

Criada para registrar todas as transferências realizadas:

- `user_id`: ID do usuário
- `from_account_id`: Conta de origem
- `to_account_id`: Conta de destino
- `amount`: Valor transferido
- `description`: Descrição opcional
- `status`: Status da transferência (completed/failed)
- `created_at`: Data da transferência

### 2. Migration

- **Arquivo**: `lib/database/migrations/20251031_000020_create_transfer_logs_table.ts`
- **Status**: ✅ Executada com sucesso

### 3. Schema Atualizado

- Adicionado `TRANSFER_LOGS` ao `COLLECTIONS`
- Adicionado interface `TransferLog` em `lib/appwrite/schema.ts`

### 4. Ação de Transferência

- **Arquivo**: `actions/account.actions.ts`
- **Função**: `transferBalanceAction`
- Valida contas de origem e destino
- Verifica saldo suficiente
- Registra a transferência no log

### 5. Serviço de Conta

- **Arquivo**: `lib/services/account.service.ts`
- **Método**: `transferBalance`
- Atualiza saldos das contas
- Registra log de transferência (sucesso ou falha)

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

Todas as transferências são registradas na tabela `transfer_logs`, incluindo:

- Transferências bem-sucedidas (status: completed)
- Transferências que falharam (status: failed)

## Observações

- A transferência apenas move o saldo entre contas
- Não cria transações adicionais
- Os saldos são atualizados imediatamente
- A interface é atualizada automaticamente via realtime

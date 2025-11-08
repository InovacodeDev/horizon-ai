# Atualização Automática de Saldo em Transferências

## Implementação

Foi implementado um sistema de atualização automática de saldo das contas quando uma transferência é realizada, utilizando o Appwrite Realtime.

## Como Funciona

### 1. Subscribe em `transfer_logs`

O hook `useAccounts` agora possui uma subscrição realtime para a coleção `transfer_logs`:

```typescript
useAppwriteRealtime({
  channels: [`databases.${databaseId}.collections.transfer_logs.documents`],
  onCreate: async (payload) => {
    // Quando uma transferência é criada, atualiza as contas afetadas
    const accountIds = [payload.from_account_id, payload.to_account_id];

    for (const accountId of accountIds) {
      // Busca o saldo atualizado da conta
      const updatedAccount = await fetch(`/api/accounts/${accountId}`);

      // Atualiza o estado local
      setAccounts((prev) => updateAccount(prev, updatedAccount));
    }
  },
});
```

### 2. Subscrições Ativas

O hook `useAccounts` agora possui 2 subscrições realtime:

1. **Contas (`accounts`)**: Detecta criação, atualização e exclusão de contas
2. **Transferências (`transfer_logs`)**: Detecta quando uma transferência é criada

### 3. Fluxo de Atualização

1. Usuário realiza uma transferência via `TransferBalanceModal`
2. A transferência é registrada na tabela `transfer_logs`
3. O Appwrite Realtime notifica todos os clientes conectados
4. O hook `useAccounts` recebe a notificação
5. As contas afetadas (origem e destino) são atualizadas automaticamente
6. A UI é atualizada instantaneamente sem necessidade de refresh

## Benefícios

- ✅ **Atualização instantânea**: Saldos são atualizados em tempo real
- ✅ **Sem polling**: Não há necessidade de fazer requisições periódicas
- ✅ **Eficiente**: Apenas as contas afetadas são atualizadas
- ✅ **Multi-dispositivo**: Funciona em múltiplos dispositivos/abas simultaneamente
- ✅ **Experiência fluida**: Usuário vê as mudanças imediatamente

## Configuração

### Variáveis de Ambiente Necessárias

```env
NEXT_PUBLIC_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
NEXT_PUBLIC_APPWRITE_PROJECT_ID=seu-project-id
NEXT_PUBLIC_APPWRITE_DATABASE_ID=seu-database-id
```

### Habilitar/Desabilitar Realtime

O realtime pode ser desabilitado passando a opção `enableRealtime: false`:

```typescript
const { accounts } = useAccounts({
  enableRealtime: false, // Desabilita realtime
});
```

## Testes

Para testar a funcionalidade:

1. Abra a página "Suas Contas" em duas abas diferentes
2. Realize uma transferência em uma das abas
3. Observe que os saldos são atualizados automaticamente em ambas as abas

## Logs de Debug

O sistema emite logs no console para facilitar o debug:

- `📡 Realtime: transfer detected` - Transferência detectada
- `✅ Account balances updated after transfer` - Saldos atualizados com sucesso
- `❌ Error updating accounts after transfer` - Erro ao atualizar saldos

## Arquivos Modificados

- `hooks/useAccounts.ts` - Adicionado suporte a realtime para contas e transferências
- `docs/REALTIME_TRANSFER_UPDATES.md` - Documentação da funcionalidade

## Próximos Passos

- [ ] Adicionar loading state durante atualização de saldos
- [ ] Implementar retry automático em caso de falha
- [ ] Adicionar notificação toast quando transferência é detectada
- [ ] Otimizar para evitar múltiplas requisições simultâneas

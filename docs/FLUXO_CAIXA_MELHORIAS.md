# Melhorias no Fluxo de Caixa

## Resumo das Mudanças

Esta implementação adiciona melhorias ao fluxo de caixa para melhor controle financeiro:

1. **Visualização expandida**: Mostra 4 meses anteriores, mês atual e próximo mês (6 meses no total)
2. **Faturas em aberto incluídas**: As despesas agora incluem faturas de cartão de crédito em aberto
3. **Melhor controle financeiro**: Permite visualizar compromissos futuros e passados

## Arquivos Modificados

### 1. `app/(app)/overview/page.tsx`

**Mudanças:**

- Importado novo hook `useCreditCardBills`
- Modificada função `getLastSixMonths()` para incluir 4 meses anteriores + atual + próximo
- Adicionado cálculo de faturas em aberto no `creditCardBillsByMonth`
- Atualizado título do gráfico para refletir nova visualização
- Adicionada descrição explicando que despesas incluem faturas em aberto

**Lógica de Cálculo:**

```typescript
// Faturas em aberto são adicionadas ao mês de vencimento
openBills.forEach((bill) => {
  const dueDate = new Date(bill.due_date);
  const billKey = getMonthKey(dueDate);
  const unpaidAmount = bill.total_amount - bill.paid_amount;

  if (unpaidAmount > 0) {
    billsMap.set(billKey, (billsMap.get(billKey) || 0) + unpaidAmount);
  }
});
```

### 2. `hooks/useCreditCardBills.ts` (NOVO)

**Funcionalidade:**

- Hook para buscar faturas de cartão de crédito
- Suporta filtros por cartão, status, e período
- Retorna lista de faturas, estado de loading e função de refetch

**Uso:**

```typescript
const { bills, loading, error, refetch } = useCreditCardBills({
  status: 'open', // Busca apenas faturas em aberto
});
```

### 3. `app/api/credit-cards/bills/route.ts` (NOVO)

**Endpoint:**

- `GET /api/credit-cards/bills`
- Parâmetros de query:
  - `creditCardId`: Filtrar por cartão específico
  - `status`: Filtrar por status (open, closed, paid, overdue)
  - `startDate`: Data inicial
  - `endDate`: Data final

**Resposta:**

```json
{
  "bills": [...],
  "total": 10
}
```

### 4. `lib/appwrite/schema.ts`

**Mudança:**

- Adicionado `CREDIT_CARD_BILLS: 'credit_card_bills'` ao objeto COLLECTIONS

### 5. `hooks/index.ts`

**Mudança:**

- Exportado novo hook `useCreditCardBills`

## Visualização do Fluxo de Caixa

### Antes

- Mostrava últimos 6 meses (5 meses anteriores + atual)
- Despesas = apenas transações diretas

### Depois

- Mostra 4 meses anteriores + atual + próximo mês
- Despesas = transações diretas + faturas de cartão em aberto
- Descrição clara explicando o que está incluído

## Exemplo de Uso

### Cenário: Usuário em Novembro/2025

**Meses exibidos:**

1. Julho/2025 (4 meses atrás)
2. Agosto/2025 (3 meses atrás)
3. Setembro/2025 (2 meses atrás)
4. Outubro/2025 (1 mês atrás)
5. Novembro/2025 (mês atual)
6. Dezembro/2025 (próximo mês)

**Despesas em Novembro incluem:**

- Transações diretas da conta (débito, transferências, etc.)
- Compras no cartão de crédito feitas em Novembro
- Faturas de cartão com vencimento em Novembro (mesmo que abertas)

## Benefícios

1. **Visão do passado**: 4 meses anteriores ajudam a identificar padrões
2. **Controle do presente**: Mês atual mostra situação real
3. **Planejamento futuro**: Próximo mês mostra compromissos já conhecidos
4. **Faturas visíveis**: Não há surpresas com faturas em aberto
5. **Melhor controle**: Usuário sabe exatamente quanto vai gastar

## Estrutura de Dados

### CreditCardBill

```typescript
interface CreditCardBill {
  $id: string;
  credit_card_id: string;
  user_id: string;
  due_date: string;
  closing_date: string;
  total_amount: number;
  paid_amount: number;
  status: 'open' | 'closed' | 'paid' | 'overdue';
}
```

### Cálculo de Despesas

```
Despesas do Mês =
  Transações Diretas (débito, transferências) +
  Compras no Cartão (agrupadas por mês da fatura) +
  Faturas em Aberto (valor não pago)
```

## Testes Recomendados

1. **Visualização básica**
   - Verificar se 6 meses são exibidos corretamente
   - Confirmar que o próximo mês aparece

2. **Faturas em aberto**
   - Criar fatura em aberto para mês futuro
   - Verificar se aparece nas despesas do mês correto

3. **Cálculo correto**
   - Comparar total de despesas com soma manual
   - Verificar se faturas pagas não são duplicadas

4. **Performance**
   - Testar com múltiplos cartões
   - Testar com muitas faturas em aberto

## Notas Técnicas

- As faturas são buscadas apenas com status 'open' para evitar duplicação
- O cálculo considera `total_amount - paid_amount` para faturas parcialmente pagas
- A data de vencimento (`due_date`) determina em qual mês a fatura aparece
- O hook usa `useCallback` e `useEffect` para otimizar re-renders

## Próximos Passos (Opcional)

1. Adicionar indicador visual para faturas em aberto no gráfico
2. Permitir clicar no mês para ver detalhes das despesas
3. Adicionar projeção de faturas futuras baseada em gastos recorrentes
4. Criar alertas para faturas próximas do vencimento

# Correções no Sistema de Parcelamento

## Problemas Identificados e Corrigidos

### 1. Problema de Timezone

**Problema:** Ao criar uma transação no dia 05/03, o sistema mostrava como dia 04/03.

**Causa:** O código estava usando `new Date(dateString)` que interpreta a data como UTC e depois converte para o timezone local, causando diferença de um dia.

**Solução:**

- Mudamos para fazer o parse manual da data no formato YYYY-MM-DD usando `split('-').map(Number)`
- Isso evita a conversão automática de timezone e mantém a data exata que o usuário inseriu
- Aplicado em:
  - `app/api/credit-cards/installments/route.ts`
  - `app/(app)/credit-card-bills/CreateTransactionModal.tsx`
  - `app/(app)/credit-card-bills/page.tsx`

### 2. Problema de Contagem de Parcelas

**Problema:** Compra feita em março dia 05 com fechamento dia 01 estava mostrando a 9ª parcela em outubro, quando deveria ser a 8ª.

**Causa:** A lógica estava usando `purchaseDay > closingDay` quando deveria ser `purchaseDay >= closingDay`.

**Exemplo do erro:**

- Compra: 05/03 (dia 05)
- Fechamento: dia 01
- Lógica antiga: `05 > 01` = true → primeira parcela em Abril ✅
- Mas a contagem estava errada nos meses seguintes

**Solução:**

- Corrigimos a lógica para usar `purchaseDay >= closingDay` de forma consistente
- **Corrigimos também o cálculo do mês:** mudamos de `installmentMonth = firstInstallmentMonth - 1 + i` para `installmentMonth = firstInstallmentMonth + i`
- Isso garante que:
  - Compras no dia de fechamento ou depois vão para a próxima fatura
  - Compras antes do dia de fechamento vão para a fatura atual
  - As parcelas seguintes são calculadas corretamente mês a mês

## Regra de Negócio Corrigida

### Quando uma compra entra em uma fatura?

**Regra Simples:** Uma compra entra na fatura do mês em que foi feita, a menos que seja no dia de fechamento ou depois.

- **Se dia da compra < dia de fechamento:** Entra na fatura do mês atual
- **Se dia da compra >= dia de fechamento:** Entra na fatura do próximo mês

### Exemplo com fechamento dia 30:

#### Compra dia 20/08 (dia 20 < dia 30)

- ✅ Primeira parcela: Agosto/2024
- ✅ Segunda parcela: Setembro/2024
- ✅ Terceira parcela: Outubro/2024

#### Compra dia 30/08 (dia 30 >= dia 30)

- ✅ Primeira parcela: Setembro/2024
- ✅ Segunda parcela: Outubro/2024
- ✅ Terceira parcela: Novembro/2024

## Arquivos Modificados

1. **app/api/credit-cards/installments/route.ts**
   - Parse manual da data para evitar timezone
   - Correção da lógica de comparação (`purchaseDay >= closingDay`)
   - Correção do cálculo do mês (`firstInstallmentMonth + i`)
   - Agora usa criação em bulk para melhor performance

2. **app/(app)/credit-card-bills/CreateTransactionModal.tsx**
   - Parse manual da data no preview
   - Correção da lógica de comparação
   - Atualização da mensagem de preview

3. **app/(app)/credit-card-bills/page.tsx**
   - Uso de `getUTCDate()` para evitar timezone
   - Mantém consistência com a lógica do backend

4. **lib/services/credit-card-transaction.service.ts**
   - Novo método `bulkCreateTransactions()` para criação em massa
   - Sincroniza limite do cartão apenas 1 vez

5. **app/api/credit-cards/transactions/bulk/route.ts** (NOVO)
   - Nova API para criação em massa de transações
   - Valida todas as transações antes de criar

6. **CREDIT_CARD_BILLING_LOGIC.md**
   - Atualização dos exemplos para refletir a correção
   - Exemplos agora usam fechamento dia 01 para maior clareza

## Testes Recomendados

Para validar as correções, teste os seguintes cenários:

### Cenário 1: Compra antes do fechamento

- Fechamento: dia 30
- Compra: 20/08
- Esperado: Primeira parcela em Agosto

### Cenário 2: Compra no dia de fechamento

- Fechamento: dia 30
- Compra: 30/08
- Esperado: Primeira parcela em Setembro

### Cenário 3: Compra depois do fechamento

- Fechamento: dia 30
- Compra: 31/08
- Esperado: Primeira parcela em Setembro

### Cenário 4: Verificar contagem de parcelas

- Compra: 20/08 em 12x (fechamento dia 30)
- Verificar que:
  - Parcela 1: Agosto
  - Parcela 2: Setembro
  - Parcela 3: Outubro
  - Parcela 12: Julho/2025

### Cenário 5: Verificar timezone

- Criar compra no dia 05
- Verificar que aparece como dia 05 (não dia 04)
- Verificar que a data de compra original está correta

## Impacto

✅ **Positivo:**

- Datas agora aparecem corretamente (sem diferença de timezone)
- Contagem de parcelas está correta
- Lógica consistente em todo o sistema

⚠️ **Atenção:**

- Transações criadas antes desta correção podem ter a contagem incorreta
- Recomenda-se revisar transações parceladas existentes se necessário

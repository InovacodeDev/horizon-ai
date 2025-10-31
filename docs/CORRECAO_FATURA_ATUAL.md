# Correção: Card "Fatura Atual"

## 🐛 Problema Identificado

O card "Fatura Atual" estava mostrando a soma de **todas as faturas em aberto**, quando deveria mostrar apenas o valor da **primeira fatura em aberto** (a próxima a vencer).

## ❌ Comportamento Anterior (Incorreto)

```
Faturas em aberto:
- Fatura de Setembro: R$ 500,00
- Fatura de Outubro: R$ 300,00
- Fatura de Novembro: R$ 200,00

Card "Fatura Atual": R$ 1.000,00 ❌ (soma de todas)
```

**Problema:** O usuário via um valor muito alto que não correspondia à próxima fatura a pagar.

## ✅ Comportamento Correto (Atual)

```
Faturas em aberto:
- Fatura de Setembro: R$ 500,00 ← Próxima a vencer
- Fatura de Outubro: R$ 300,00
- Fatura de Novembro: R$ 200,00

Card "Fatura Atual": R$ 500,00 ✅ (apenas a primeira)
```

**Solução:** O card agora mostra apenas o valor da primeira fatura em aberto (a que vence primeiro).

## 📊 Diferença entre "Fatura Atual" e "Limite Disponível"

### Fatura Atual

- **O que mostra:** Valor da primeira fatura em aberto
- **Propósito:** Mostrar quanto o usuário precisa pagar na próxima fatura
- **Cálculo:** `openBills[0].totalAmount`

### Limite Disponível

- **O que mostra:** Quanto ainda pode ser gasto no cartão
- **Propósito:** Mostrar o crédito disponível
- **Cálculo:** `creditLimit - totalUsedLimit`
- **Observação:** Considera TODAS as faturas abertas não fechadas

## 🔧 O Que Foi Alterado

### Código Anterior

```typescript
// Somava todas as faturas abertas não fechadas
const currentBillTotal = useMemo(() => {
  if (openBills.length === 0) return 0;
  return openBills
    .filter((bill) => !bill.isClosed)
    .reduce((acc, bill) => {
      return acc + bill.totalAmount;
    }, 0);
}, [openBills]);

const availableLimit = useMemo(() => {
  if (!selectedCard) return 0;
  const settings = getCardSettings(selectedCard);
  return settings.limit - currentBillTotal; // ❌ Usava o mesmo valor
}, [selectedCard, currentBillTotal]);
```

### Código Atual

```typescript
// Mostra apenas a primeira fatura
const currentBillTotal = useMemo(() => {
  if (openBills.length === 0) return 0;
  return openBills[0].totalAmount; // ✅ Apenas a primeira
}, [openBills]);

// Calcula o total usado (todas as faturas)
const totalUsedLimit = useMemo(() => {
  if (openBills.length === 0) return 0;
  return openBills.filter((bill) => !bill.isClosed).reduce((acc, bill) => acc + bill.totalAmount, 0);
}, [openBills]);

// Limite disponível usa o total usado
const availableLimit = useMemo(() => {
  if (!selectedCard) return 0;
  const settings = getCardSettings(selectedCard);
  return settings.limit - totalUsedLimit; // ✅ Usa o total correto
}, [selectedCard, totalUsedLimit]);
```

## 📝 Exemplo Prático

### Cenário

```
Limite do cartão: R$ 5.000,00

Faturas em aberto:
1. Fatura de Setembro (vence 10/09): R$ 800,00
2. Fatura de Outubro (vence 10/10): R$ 600,00
3. Fatura de Novembro (vence 10/11): R$ 400,00 (ainda aberta para compras)

Total usado: R$ 1.800,00
```

### Cards Exibidos

#### Card "Fatura Atual"

```
Fatura Atual
R$ 800,00 ✅
3 transação(ões)
```

**Mostra:** Apenas a primeira fatura (Setembro)

#### Card "Próximo Vencimento"

```
Próximo Vencimento
Dia 10/09 ✅
Fechamento: Dia 30/08
```

**Mostra:** Data de vencimento da primeira fatura

#### Card "Limite Disponível"

```
Limite Disponível
R$ 3.200,00 ✅
Limite total: R$ 5.000,00
```

**Cálculo:** R$ 5.000,00 - R$ 1.800,00 = R$ 3.200,00

## 🎯 Lógica Completa

### 1. Ordenar Faturas

```typescript
const openBills = useMemo(() => {
  const filteredBills = bills.filter((bill) => bill.isOpen);
  filteredBills.sort((a, b) => {
    const dateA = new Date(a.year, parseInt(a.month) - 1);
    const dateB = new Date(b.year, parseInt(b.month) - 1);
    return dateA.getTime() - dateB.getTime(); // Mais antiga primeiro
  });
  return filteredBills;
}, [bills]);
```

### 2. Fatura Atual (Primeira)

```typescript
const currentBillTotal = useMemo(() => {
  if (openBills.length === 0) return 0;
  return openBills[0].totalAmount; // Primeira fatura
}, [openBills]);
```

### 3. Total Usado (Todas)

```typescript
const totalUsedLimit = useMemo(() => {
  if (openBills.length === 0) return 0;
  return openBills.filter((bill) => !bill.isClosed).reduce((acc, bill) => acc + bill.totalAmount, 0);
}, [openBills]);
```

### 4. Limite Disponível

```typescript
const availableLimit = useMemo(() => {
  if (!selectedCard) return 0;
  const settings = getCardSettings(selectedCard);
  return settings.limit - totalUsedLimit;
}, [selectedCard, totalUsedLimit]);
```

## ✅ Benefícios da Correção

1. **Clareza:** Usuário vê exatamente quanto precisa pagar na próxima fatura
2. **Precisão:** Valor correto da fatura atual
3. **Consistência:** Alinhado com o card "Próximo Vencimento"
4. **Usabilidade:** Mais fácil de entender e planejar pagamentos

## 📊 Comparação Visual

### Antes (Incorreto)

```
┌─────────────────────────────┐
│ Fatura Atual                │
│ R$ 1.800,00 ❌              │
│ 15 transação(ões)           │
└─────────────────────────────┘
(Soma de todas as faturas)
```

### Depois (Correto)

```
┌─────────────────────────────┐
│ Fatura Atual                │
│ R$ 800,00 ✅                │
│ 5 transação(ões)            │
└─────────────────────────────┘
(Apenas a primeira fatura)
```

## 🧪 Como Testar

### Teste 1: Uma Fatura Aberta

```
Cenário:
- 1 fatura aberta: R$ 500,00

Esperado:
- Fatura Atual: R$ 500,00 ✅
- Limite Disponível: R$ 4.500,00 ✅
```

### Teste 2: Múltiplas Faturas Abertas

```
Cenário:
- Fatura 1: R$ 800,00
- Fatura 2: R$ 600,00
- Fatura 3: R$ 400,00

Esperado:
- Fatura Atual: R$ 800,00 ✅ (não R$ 1.800,00)
- Limite Disponível: R$ 3.200,00 ✅
```

### Teste 3: Nenhuma Fatura Aberta

```
Cenário:
- Nenhuma fatura aberta

Esperado:
- Fatura Atual: R$ 0,00 ✅
- Limite Disponível: R$ 5.000,00 ✅
```

## 📂 Arquivos Modificados

1. **app/(app)/credit-card-bills/page.tsx**
   - `currentBillTotal`: Agora mostra apenas a primeira fatura
   - `totalUsedLimit`: Novo cálculo para o total usado
   - `availableLimit`: Usa `totalUsedLimit` ao invés de `currentBillTotal`

## 🎉 Resultado

Agora o sistema funciona corretamente:

- ✅ "Fatura Atual" mostra apenas a primeira fatura
- ✅ "Limite Disponível" considera todas as faturas
- ✅ Valores corretos e consistentes
- ✅ Mais fácil de entender para o usuário

## 📚 Documentação Relacionada

- `NOMENCLATURA_FATURAS.md` - Como as faturas são nomeadas
- `CREDIT_CARD_BILLING_LOGIC.md` - Regras de negócio
- `LOGICA_SIMPLIFICADA_FATURAS.md` - Lógica geral

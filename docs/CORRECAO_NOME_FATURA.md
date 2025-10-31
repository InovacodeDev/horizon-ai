# Correção: Nome da Fatura Baseado no Vencimento

## 🐛 Problema Identificado

Fatura que vence em **10/11** estava sendo chamada de **"Fatura de Outubro"** quando deveria ser **"Fatura de Novembro"**.

## ❌ Comportamento Anterior (Incorreto)

```
Compra: 20/08
Fechamento: 30/08
Vencimento: 10/09
Nome: "Fatura de Agosto" ❌ (baseado no mês de fechamento)
```

**Problema:** O nome da fatura estava sendo baseado no mês de fechamento, não no mês de vencimento.

## ✅ Comportamento Correto (Atual)

```
Compra: 20/08
Fechamento: 30/08
Vencimento: 10/09
Nome: "Fatura de Setembro" ✅ (baseado no mês de vencimento)
```

**Solução:** O nome da fatura agora é baseado no mês do vencimento, seguindo o padrão dos cartões de crédito brasileiros.

## 📝 Regra de Nomenclatura

**O nome da fatura é baseado no mês do VENCIMENTO, não no mês de fechamento.**

### Por Quê?

Essa é a convenção padrão:

- ✅ "Fatura de Novembro" = Fatura que vence em Novembro
- ❌ "Fatura de Outubro" (se vence em Novembro) = Confuso!

## 🔧 O Que Foi Alterado

### Código Anterior

```typescript
// Nome baseado no mês de fechamento
let billMonth = transactionMonth;
if (transactionDay >= settings.closingDay) {
  billMonth += 1;
}

const billKey = `${billYear}-${String(billMonth + 1).padStart(2, '0')}`;

billsMap.set(billKey, {
  month: String(billMonth + 1).padStart(2, '0'), // ❌ Mês de fechamento
  year: billYear,
  // ...
});
```

### Código Atual

```typescript
// Calcular mês de fechamento
let billMonth = transactionMonth;
if (transactionDay >= settings.closingDay) {
  billMonth += 1;
}

// Calcular mês de vencimento
let dueMonth = billMonth;
let dueYear = billYear;

if (settings.dueDay <= settings.closingDay) {
  dueMonth += 1; // Vencimento no mês seguinte
  if (dueMonth > 11) {
    dueMonth = 0;
    dueYear += 1;
  }
}

const billKey = `${dueYear}-${String(dueMonth + 1).padStart(2, '0')}`;

billsMap.set(billKey, {
  month: String(dueMonth + 1).padStart(2, '0'), // ✅ Mês de vencimento
  year: dueYear,
  // ...
});
```

## 📊 Exemplos Práticos

### Exemplo 1: Fechamento dia 30, Vencimento dia 10

| Compra | Fechamento | Vencimento | Nome da Fatura            |
| ------ | ---------- | ---------- | ------------------------- |
| 20/08  | 30/08      | 10/09      | **Fatura de Setembro** ✅ |
| 30/08  | 30/09      | 10/10      | **Fatura de Outubro** ✅  |
| 31/08  | 30/09      | 10/10      | **Fatura de Outubro** ✅  |

### Exemplo 2: Fechamento dia 5, Vencimento dia 15

| Compra | Fechamento | Vencimento | Nome da Fatura            |
| ------ | ---------- | ---------- | ------------------------- |
| 03/10  | 05/10      | 15/10      | **Fatura de Outubro** ✅  |
| 05/10  | 05/11      | 15/11      | **Fatura de Novembro** ✅ |
| 10/10  | 05/11      | 15/11      | **Fatura de Novembro** ✅ |

### Exemplo 3: Vencimento Antes do Fechamento

**Fechamento dia 30, Vencimento dia 5**

| Compra | Fechamento | Vencimento | Nome da Fatura            |
| ------ | ---------- | ---------- | ------------------------- |
| 20/08  | 30/08      | 05/09      | **Fatura de Setembro** ✅ |
| 30/08  | 30/09      | 05/10      | **Fatura de Outubro** ✅  |

**Observação:** Quando o vencimento é antes do fechamento, o vencimento é automaticamente no mês seguinte.

## 🎯 Lógica Completa

### 1. Determinar Mês de Fechamento

```typescript
let billMonth = transactionMonth;

if (transactionDay >= closingDay) {
  billMonth += 1; // Vai para próximo mês
}
```

### 2. Determinar Mês de Vencimento

```typescript
let dueMonth = billMonth;

if (dueDay <= closingDay) {
  dueMonth += 1; // Vencimento no mês seguinte ao fechamento
}
```

### 3. Nome da Fatura

```typescript
const billName = `Fatura de ${monthNames[dueMonth]}/${dueYear}`;
```

## 📈 Timeline Visual

```
Agosto                 Setembro               Outubro
├─────────────────────┼─────────────────────┼─────────────────────┤
│                     │                     │                     │
│  Compra: 20/08      │                     │                     │
│  ↓                  │                     │                     │
│  Fecha: 30/08 ──────┼──→ Vence: 10/09     │                     │
│                     │     ↓               │                     │
│                     │  "Fatura de         │                     │
│                     │   Setembro" ✅      │                     │
│                     │                     │                     │
│                     │  Compra: 30/08      │                     │
│                     │  ↓                  │                     │
│                     │  Fecha: 30/09 ──────┼──→ Vence: 10/10     │
│                     │                     │     ↓               │
│                     │                     │  "Fatura de         │
│                     │                     │   Outubro" ✅       │
```

## ✅ Benefícios da Correção

1. **Padrão do mercado:** Alinhado com cartões de crédito brasileiros
2. **Clareza:** "Fatura de Novembro" = vence em Novembro
3. **Intuitividade:** Mais fácil de entender
4. **Consistência:** Segue convenção estabelecida

## 📂 Arquivos Modificados

1. **app/(app)/credit-card-bills/page.tsx**
   - Cálculo separado de `dueMonth` e `billMonth`
   - Nome da fatura baseado em `dueMonth`
   - Lógica para vencimento no mês seguinte

2. **CREDIT_CARD_BILLING_LOGIC.md**
   - Atualização dos exemplos
   - Explicação da nomenclatura

3. **NOMENCLATURA_FATURAS.md** (NOVO)
   - Documentação completa da nomenclatura
   - Exemplos práticos
   - Timeline visual

## 🧪 Como Testar

### Teste 1: Vencimento Depois do Fechamento

```
Configuração:
- Fechamento: dia 30
- Vencimento: dia 10

Compra: 20/08
Esperado: "Fatura de Setembro" ✅
```

### Teste 2: Vencimento Antes do Fechamento

```
Configuração:
- Fechamento: dia 30
- Vencimento: dia 5

Compra: 20/08
Esperado: "Fatura de Setembro" ✅
(vencimento é 05/09, não 05/08)
```

### Teste 3: Vencimento Igual ao Fechamento

```
Configuração:
- Fechamento: dia 30
- Vencimento: dia 30

Compra: 20/08
Esperado: "Fatura de Setembro" ✅
(vencimento é 30/09, não 30/08)
```

## 🎉 Resultado

Agora o sistema funciona corretamente:

- ✅ Nome da fatura baseado no mês de vencimento
- ✅ Alinhado com padrão do mercado
- ✅ Mais intuitivo para o usuário
- ✅ Lógica clara e consistente

## 📚 Documentação Relacionada

- `NOMENCLATURA_FATURAS.md` - Guia completo de nomenclatura
- `CREDIT_CARD_BILLING_LOGIC.md` - Regras de negócio
- `LOGICA_SIMPLIFICADA_FATURAS.md` - Lógica geral

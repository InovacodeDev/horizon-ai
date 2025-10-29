# Lógica de Parcelamento - Ajustada para Meses com Menos Dias

## Problema Resolvido

Quando você compra algo no dia 29, 30 ou 31, e o parcelamento passa por Fevereiro (que tem apenas 28 ou 29 dias), o sistema agora ajusta automaticamente a data para o último dia válido do mês.

## Como Funciona

### 1. Data de Compra é Mantida

O sistema usa a **data de compra** (não o dia de fechamento) para criar as parcelas.

**Exemplo:**

- Compra no dia **29 de Outubro**
- Todas as parcelas serão no dia **29** de cada mês
- **Exceto** em meses que não têm dia 29, 30 ou 31

### 2. Ajuste Automático para Fevereiro

Se a data de compra não existe no mês, o sistema usa o **último dia do mês**.

**Exemplo 1: Compra no dia 29**

```
Parcela 1: 29/10/2025 (Outubro)
Parcela 2: 29/11/2025 (Novembro)
Parcela 3: 29/12/2025 (Dezembro)
Parcela 4: 29/01/2026 (Janeiro)
Parcela 5: 28/02/2026 (Fevereiro - ajustado!)  ← Fevereiro tem apenas 28 dias
Parcela 6: 29/03/2026 (Março)
```

**Exemplo 2: Compra no dia 31**

```
Parcela 1: 31/10/2025 (Outubro)
Parcela 2: 30/11/2025 (Novembro - ajustado!)  ← Novembro tem apenas 30 dias
Parcela 3: 31/12/2025 (Dezembro)
Parcela 4: 31/01/2026 (Janeiro)
Parcela 5: 28/02/2026 (Fevereiro - ajustado!)  ← Fevereiro tem apenas 28 dias
Parcela 6: 31/03/2026 (Março)
```

### 3. Anos Bissextos

O sistema considera anos bissextos automaticamente.

**Exemplo: Compra no dia 30 em ano bissexto**

```
Parcela 1: 30/10/2024 (Outubro)
Parcela 2: 30/11/2024 (Novembro)
Parcela 3: 30/12/2024 (Dezembro)
Parcela 4: 30/01/2025 (Janeiro)
Parcela 5: 29/02/2024 (Fevereiro - ajustado!)  ← Ano bissexto, Fev tem 29 dias
Parcela 6: 30/03/2025 (Março)
```

## Código Implementado

### Função: `getLastDayOfMonth`

```typescript
const getLastDayOfMonth = (year: number, month: number): number => {
  return new Date(year, month + 1, 0).getDate();
};
```

**O que faz:**

- Retorna o último dia do mês
- Considera anos bissextos automaticamente
- Exemplos:
  - `getLastDayOfMonth(2025, 1)` → 28 (Fevereiro 2025)
  - `getLastDayOfMonth(2024, 1)` → 29 (Fevereiro 2024 - bissexto)
  - `getLastDayOfMonth(2025, 10)` → 30 (Novembro 2025)

### Função: `adjustDayForMonth`

```typescript
const adjustDayForMonth = (year: number, month: number, day: number): number => {
  const lastDay = getLastDayOfMonth(year, month);
  return Math.min(day, lastDay);
};
```

**O que faz:**

- Ajusta o dia para caber no mês
- Se o dia existe no mês, retorna o dia original
- Se não existe, retorna o último dia do mês
- Exemplos:
  - `adjustDayForMonth(2025, 1, 29)` → 28 (Fev não tem dia 29)
  - `adjustDayForMonth(2025, 1, 15)` → 15 (Fev tem dia 15)
  - `adjustDayForMonth(2025, 10, 31)` → 30 (Nov não tem dia 31)

## Exemplos Práticos

### Cenário 1: Notebook em 10x - Compra dia 29/10

**Dados:**

- Valor: R$ 1.200,00
- Parcelas: 10x de R$ 120,00
- Data de compra: 29/10/2025
- Fechamento: dia 30

**Resultado:**

```
Parcela  | Data       | Mês        | Observação
---------|------------|------------|---------------------------
1/10     | 29/10/2025 | Outubro    | Antes do fechamento
2/10     | 29/11/2025 | Novembro   |
3/10     | 29/12/2025 | Dezembro   |
4/10     | 29/01/2026 | Janeiro    |
5/10     | 28/02/2026 | Fevereiro  | Ajustado (Fev tem 28 dias)
6/10     | 29/03/2026 | Março      | Volta ao dia 29
7/10     | 29/04/2026 | Abril      |
8/10     | 29/05/2026 | Maio       |
9/10     | 29/06/2026 | Junho      |
10/10    | 29/07/2026 | Julho      |
```

### Cenário 2: Smartphone em 6x - Compra dia 31/10

**Dados:**

- Valor: R$ 600,00
- Parcelas: 6x de R$ 100,00
- Data de compra: 31/10/2025
- Fechamento: dia 30

**Resultado:**

```
Parcela | Data       | Mês        | Observação
--------|------------|------------|---------------------------
1/6     | 30/11/2025 | Novembro   | Ajustado (Nov tem 30 dias)
2/6     | 31/12/2025 | Dezembro   |
3/6     | 31/01/2026 | Janeiro    |
4/6     | 28/02/2026 | Fevereiro  | Ajustado (Fev tem 28 dias)
5/6     | 31/03/2026 | Março      |
6/6     | 30/04/2026 | Abril      | Ajustado (Abr tem 30 dias)
```

**Nota:** Como a compra foi dia 31 (depois do fechamento dia 30), a primeira parcela vai para Novembro.

### Cenário 3: Compra no dia do Fechamento

**Dados:**

- Valor: R$ 300,00
- Parcelas: 3x de R$ 100,00
- Data de compra: 30/10/2025
- Fechamento: dia 30

**Resultado:**

```
Parcela | Data       | Mês        | Observação
--------|------------|------------|---------------------------
1/3     | 30/10/2025 | Outubro    | No dia do fechamento
2/3     | 30/11/2025 | Novembro   |
3/3     | 30/12/2025 | Dezembro   |
```

## Regras de Negócio

### 1. Determinação da Primeira Parcela

```typescript
if (purchaseDay > closingDay) {
  // Compra DEPOIS do fechamento → Próxima fatura
  firstInstallmentMonth = purchaseMonth + 1;
} else {
  // Compra ANTES ou NO dia do fechamento → Fatura atual
  firstInstallmentMonth = purchaseMonth;
}
```

### 2. Data das Parcelas Subsequentes

- Cada parcela usa o **dia da compra**
- Ajustado automaticamente se o mês não tiver esse dia
- Mantém consistência: sempre o mesmo dia quando possível

### 3. Meses com Menos Dias

| Mês       | Dias  | Ajuste para dia 31 | Ajuste para dia 30 | Ajuste para dia 29 |
| --------- | ----- | ------------------ | ------------------ | ------------------ |
| Janeiro   | 31    | 31                 | 30                 | 29                 |
| Fevereiro | 28/29 | 28/29              | 28/29              | 28/29              |
| Março     | 31    | 31                 | 30                 | 29                 |
| Abril     | 30    | 30                 | 30                 | 29                 |
| Maio      | 31    | 31                 | 30                 | 29                 |
| Junho     | 30    | 30                 | 30                 | 29                 |
| Julho     | 31    | 31                 | 30                 | 29                 |
| Agosto    | 31    | 31                 | 30                 | 29                 |
| Setembro  | 30    | 30                 | 30                 | 29                 |
| Outubro   | 31    | 31                 | 30                 | 29                 |
| Novembro  | 30    | 30                 | 30                 | 29                 |
| Dezembro  | 31    | 31                 | 30                 | 29                 |

## Vantagens da Nova Lógica

✅ **Consistência**: Mantém o dia da compra sempre que possível
✅ **Previsibilidade**: Usuário sabe quando cada parcela cairá
✅ **Correção Automática**: Ajusta para Fevereiro e meses com 30 dias
✅ **Anos Bissextos**: Considera automaticamente
✅ **Transparência**: Lógica clara e documentada

## Testando

Para testar a lógica, crie parcelamentos com diferentes datas:

1. **Dia 28**: Nunca precisa ajuste
2. **Dia 29**: Ajusta em Fevereiro (anos não bissextos)
3. **Dia 30**: Ajusta em Fevereiro
4. **Dia 31**: Ajusta em Fevereiro, Abril, Junho, Setembro, Novembro

## Comparação: Antes vs Depois

### Antes (Usando dia de fechamento)

```
Compra dia 29, fechamento dia 30
Parcela 1: 30/10 (dia de fechamento)
Parcela 2: 30/11 (dia de fechamento)
Parcela 3: 30/12 (dia de fechamento)
❌ Problema: Não reflete a data real da compra
```

### Depois (Usando dia de compra)

```
Compra dia 29, fechamento dia 30
Parcela 1: 29/10 (dia da compra)
Parcela 2: 29/11 (dia da compra)
Parcela 3: 29/12 (dia da compra)
✅ Correto: Reflete a data real da compra
```

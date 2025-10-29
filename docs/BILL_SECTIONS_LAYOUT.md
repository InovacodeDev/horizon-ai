# Layout de Seções da Fatura

## Visão Geral

A fatura do cartão de crédito agora está organizada em **três seções distintas**, facilitando a visualização e o gerenciamento das diferentes tipos de transações.

## Estrutura Visual

```
┌─────────────────────────────────────────────────────────────────┐
│  Fatura de Novembro 2025                    Valor Total         │
│  Vencimento: 15/11                          R$ 1.270,80         │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┃ Assinaturas Recorrentes                                      │
│  ├──────────────────────────────────────────────────────────┐   │
│  │ Netflix Premium      │ 15/11 │ Lazer │ Recorrente │ R$ 49,90│   │
│  │ Spotify Premium      │ 01/11 │ Lazer │ Recorrente │ R$ 21,90│   │
│  │ Amazon Prime         │ 10/11 │ Lazer │ Recorrente │ R$ 14,90│   │
│  ├──────────────────────────────────────────────────────────┤   │
│  │ Subtotal Assinaturas                           R$ 86,70  │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┃ Compras Parceladas                                           │
│  ├──────────────────────────────────────────────────────────┐   │
│  │ Notebook Dell        │ 29/10 │ Compras │ 1 de 12 │ R$ 100,00│   │
│  │ iPhone 15            │ 15/10 │ Compras │ 2 de 10 │ R$ 350,00│   │
│  ├──────────────────────────────────────────────────────────┤   │
│  │ Subtotal Parceladas                            R$ 450,00 │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┃ Compras à Vista                                              │
│  ├──────────────────────────────────────────────────────────┐   │
│  │ Supermercado Extra   │ 05/11 │ Alimentação │ À vista │ R$ 234,10│   │
│  │ Posto Shell          │ 12/11 │ Transporte  │ À vista │ R$ 150,00│   │
│  │ Farmácia Drogasil    │ 18/11 │ Saúde       │ À vista │ R$ 350,00│   │
│  ├──────────────────────────────────────────────────────────┤   │
│  │ Subtotal à Vista                               R$ 734,10 │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ═══════════════════════════════════════════════════════════    │
│  Total da Fatura                                  R$ 1.270,80   │
│  3 assinatura(s) • 2 parcela(s) • 3 compra(s) à vista          │
└─────────────────────────────────────────────────────────────────┘
```

## Seções

### 1. Assinaturas Recorrentes (Tertiary Color)

**Identificação:**

- Badge: "Recorrente" (cor terciária)
- Barra lateral: Terciária
- Subtotal: Cor terciária

**Características:**

- Transações com `is_recurring: true`
- Cobradas automaticamente todo mês no mesmo dia
- Exemplos: Netflix, Spotify, Amazon Prime, Academia

**Informações Exibidas:**

- Descrição do serviço
- Data de cobrança
- Categoria
- Badge "Recorrente"
- Valor mensal

### 2. Compras Parceladas (Secondary Color)

**Identificação:**

- Badge: "X de Y" (cor secundária)
- Barra lateral: Secundária
- Subtotal: Cor secundária

**Características:**

- Transações com `installments > 1`
- Mostra parcela atual e total
- Exemplos: Notebook 12x, iPhone 10x, TV 6x

**Informações Exibidas:**

- Descrição do produto
- Data da compra original
- Categoria
- Badge "1 de 12" (parcela atual de total)
- Valor da parcela

### 3. Compras à Vista (Primary Color)

**Identificação:**

- Badge: "À vista" (cor primária)
- Barra lateral: Primária
- Subtotal: Cor primária

**Características:**

- Transações com `installments = 1` ou sem informação de parcelas
- Transações únicas, não recorrentes
- Exemplos: Supermercado, Posto, Farmácia

**Informações Exibidas:**

- Descrição da compra
- Data da transação
- Categoria
- Badge "À vista"
- Valor total

## Cabeçalho da Fatura

```
┌─────────────────────────────────────────────────────────┐
│  Fatura de Novembro 2025          Valor Total           │
│  Vencimento: 15/11                R$ 1.270,80           │
└─────────────────────────────────────────────────────────┘
```

**Elementos:**

- **Título:** Mês e ano da fatura
- **Vencimento:** Data de vencimento da fatura
- **Valor Total:** Soma de todas as seções (destaque em primary color)

## Rodapé da Fatura

```
═══════════════════════════════════════════════════════════
Total da Fatura                                R$ 1.270,80
3 assinatura(s) • 2 parcela(s) • 3 compra(s) à vista
```

**Elementos:**

- **Total da Fatura:** Valor total em destaque (primary color)
- **Resumo:** Quantidade de transações por tipo

## Cores e Identificação Visual

### Assinaturas (Tertiary)

```css
Badge: bg-tertiary/10 text-tertiary
Barra: bg-tertiary
Subtotal: text-tertiary
```

### Parcelas (Secondary)

```css
Badge: bg-secondary/10 text-secondary
Barra: bg-secondary
Subtotal: text-secondary
```

### À Vista (Primary)

```css
Badge: bg-primary/10 text-primary
Barra: bg-primary
Subtotal: text-primary
Total: text-primary
```

## Lógica de Categorização

### Como as transações são categorizadas:

```typescript
// 1. Assinaturas Recorrentes
const subscriptions = transactions.filter((t) => t.is_recurring);

// 2. Compras Parceladas
const installments = transactions.filter((t) => !t.is_recurring && t.installments && t.installments > 1);

// 3. Compras à Vista
const singlePurchases = transactions.filter((t) => !t.is_recurring && (!t.installments || t.installments === 1));
```

## Cálculo de Subtotais

```typescript
const subscriptionsTotal = subscriptions.reduce((sum, t) => sum + t.amount, 0);
const installmentsTotal = installments.reduce((sum, t) => sum + t.amount, 0);
const singlePurchasesTotal = singlePurchases.reduce((sum, t) => sum + t.amount, 0);

const billTotal = subscriptionsTotal + installmentsTotal + singlePurchasesTotal;
```

## Exemplos de Uso

### Exemplo 1: Fatura Completa

**Assinaturas:**

- Netflix: R$ 49,90
- Spotify: R$ 21,90
- **Subtotal: R$ 71,80**

**Parcelas:**

- Notebook (1/12): R$ 100,00
- iPhone (2/10): R$ 350,00
- **Subtotal: R$ 450,00**

**À Vista:**

- Supermercado: R$ 234,10
- Posto: R$ 150,00
- **Subtotal: R$ 384,10**

**Total da Fatura: R$ 905,90**

### Exemplo 2: Apenas Assinaturas

**Assinaturas:**

- Netflix: R$ 49,90
- Spotify: R$ 21,90
- Amazon Prime: R$ 14,90
- **Subtotal: R$ 86,70**

**Total da Fatura: R$ 86,70**

### Exemplo 3: Apenas Parcelas

**Parcelas:**

- Notebook (1/12): R$ 100,00
- TV (3/6): R$ 250,00
- Geladeira (2/10): R$ 180,00
- **Subtotal: R$ 530,00**

**Total da Fatura: R$ 530,00**

## Benefícios da Organização

### 1. Clareza Visual

- Fácil identificar gastos fixos (assinaturas)
- Visualizar compromissos futuros (parcelas)
- Controlar gastos variáveis (à vista)

### 2. Gestão Financeira

- Saber quanto vai gastar todo mês (assinaturas)
- Planejar pagamentos futuros (parcelas)
- Controlar gastos do mês (à vista)

### 3. Tomada de Decisão

- Cancelar assinaturas não utilizadas
- Evitar novas parcelas se já tem muitas
- Reduzir compras à vista se necessário

## Estados Especiais

### Fatura Vazia

```
┌─────────────────────────────────────────────────────────┐
│  Nenhuma fatura aberta                                  │
│                                                          │
│  As faturas serão geradas automaticamente quando você   │
│  adicionar transações no cartão.                        │
└─────────────────────────────────────────────────────────┘
```

### Apenas Uma Seção

Se houver apenas um tipo de transação, apenas essa seção é exibida:

```
┌─────────────────────────────────────────────────────────┐
│  ┃ Assinaturas Recorrentes                              │
│  ├──────────────────────────────────────────────────┐   │
│  │ Netflix Premium      │ 15/11 │ Lazer │ R$ 49,90  │   │
│  ├──────────────────────────────────────────────────┤   │
│  │ Subtotal Assinaturas                   R$ 49,90  │   │
│  └──────────────────────────────────────────────────┘   │
│                                                          │
│  ═══════════════════════════════════════════════════    │
│  Total da Fatura                           R$ 49,90     │
│  1 assinatura(s)                                        │
└─────────────────────────────────────────────────────────┘
```

## Responsividade

### Desktop

- Tabelas completas com todas as colunas
- Seções lado a lado quando possível

### Tablet

- Tabelas com scroll horizontal se necessário
- Seções empilhadas verticalmente

### Mobile

- Tabelas simplificadas ou cards
- Informações essenciais em destaque
- Scroll horizontal para tabelas

## Acessibilidade

- **Cores:** Contraste adequado para leitura
- **Badges:** Texto descritivo além da cor
- **Hierarquia:** Títulos semânticos (h2, h3)
- **Tabelas:** Headers apropriados para screen readers

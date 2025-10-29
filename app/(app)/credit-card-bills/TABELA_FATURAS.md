# Tabela de Faturas - Visualização

## Nova Estrutura da Tabela

A tabela de transações agora exibe as informações de forma organizada e clara:

### Colunas da Tabela

| Coluna        | Descrição                         | Exemplo                         |
| ------------- | --------------------------------- | ------------------------------- |
| **Descrição** | Nome da transação/estabelecimento | "Notebook" ou "Restaurante XYZ" |
| **Data**      | Data da transação                 | "29/10"                         |
| **Categoria** | Categoria da despesa              | Badge "Alimentação"             |
| **Parcela**   | Número da parcela                 | "5 de 12" ou "1 de 1"           |
| **Valor**     | Valor da transação                | "R$ 120,00"                     |

### Exemplo Visual

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│ Descrição              │ Data   │ Categoria    │ Parcela  │ Valor        │
├─────────────────────────────────────────────────────────────────────────────────┤
│ Notebook               │ 29/10  │ Eletrônicos  │ 1 de 10  │ R$ 120,00    │
│ Loja de Informática    │        │              │          │              │
├─────────────────────────────────────────────────────────────────────────────────┤
│ Almoço                 │ 28/10  │ Alimentação  │ 1 de 1   │ R$ 45,50     │
│ Restaurante XYZ        │        │              │          │              │
├─────────────────────────────────────────────────────────────────────────────────┤
│ Smartphone             │ 27/10  │ Eletrônicos  │ 2 de 6   │ R$ 100,00    │
│ Loja ABC               │        │              │          │              │
├─────────────────────────────────────────────────────────────────────────────────┤
│ Total da Fatura                                           │ R$ 265,50    │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## Características

### 1. **Descrição Limpa**

- Remove o sufixo "(X/Y)" da descrição
- Mostra o estabelecimento em uma segunda linha (se disponível)
- Exemplo: "Notebook" em vez de "Notebook (1/10)"

### 2. **Data Formatada**

- Formato brasileiro: DD/MM
- Exemplo: "29/10"

### 3. **Categoria com Badge**

- Badge colorido com fundo azul claro
- Texto em azul
- Exemplo: [Alimentação]

### 4. **Parcela Destacada**

- **Parcelado**: Badge laranja/secundário
  - Exemplo: "5 de 12" (parcela 5 de 12)
- **À vista**: Badge cinza discreto
  - Exemplo: "1 de 1"

### 5. **Valor Alinhado**

- Alinhado à direita
- Formato: R$ 0,00
- Fonte em negrito

### 6. **Total da Fatura**

- Linha separada com borda superior dupla
- Texto maior e em negrito
- Cor primária (azul)
- Destaque visual

## Comportamento Interativo

### Hover

- Linha muda de cor ao passar o mouse
- Fundo fica levemente mais escuro
- Transição suave

### Responsividade

- Tabela com scroll horizontal em telas pequenas
- Mantém formatação em todos os tamanhos

## Cores e Estilos

### Badges de Categoria

```css
background: rgba(primary, 0.1)
color: primary
padding: 4px 8px
border-radius: 4px
```

### Badges de Parcela (Parcelado)

```css
background: rgba(secondary, 0.1)
color: secondary
font-weight: 600
```

### Badges de Parcela (À Vista)

```css
background: rgba(surface-variant, 0.5)
color: on-surface-variant
```

### Total da Fatura

```css
font-size: 1.5rem (24px)
font-weight: 700
color: primary
```

## Exemplo de Dados

### Transação À Vista

```json
{
  "description": "Almoço",
  "merchant": "Restaurante XYZ",
  "date": "2025-10-29",
  "category": "Alimentação",
  "amount": 45.5
}
```

**Exibição:**

- Descrição: "Almoço" + "Restaurante XYZ" (segunda linha)
- Data: "29/10"
- Categoria: [Alimentação]
- Parcela: "1 de 1" (cinza)
- Valor: "R$ 45,50"

### Transação Parcelada

```json
{
  "description": "Notebook (5/12)",
  "merchant": "Loja de Informática",
  "date": "2025-10-29",
  "category": "Eletrônicos",
  "amount": 120.0
}
```

**Exibição:**

- Descrição: "Notebook" + "Loja de Informática" (segunda linha)
- Data: "29/10"
- Categoria: [Eletrônicos]
- Parcela: "5 de 12" (laranja)
- Valor: "R$ 120,00"

## Vantagens da Nova Estrutura

✅ **Organização**: Informações claras e bem estruturadas
✅ **Escaneabilidade**: Fácil de ler e encontrar informações
✅ **Destaque**: Parcelas e total bem destacados
✅ **Profissional**: Visual limpo e moderno
✅ **Responsivo**: Funciona em todos os dispositivos
✅ **Acessível**: Estrutura semântica com thead, tbody, tfoot

## Comparação: Antes vs Depois

### Antes (Cards)

```
┌─────────────────────────────────────┐
│ Notebook (5/12) [Eletrônicos]       │
│ 29/10                               │
│                        R$ 120,00    │
└─────────────────────────────────────┘
```

### Depois (Tabela)

```
│ Notebook               │ 29/10  │ Eletrônicos  │ 5 de 12  │ R$ 120,00 │
│ Loja de Informática    │        │              │          │           │
```

**Benefícios:**

- Mais compacto
- Melhor uso do espaço
- Informações alinhadas
- Mais fácil de comparar valores

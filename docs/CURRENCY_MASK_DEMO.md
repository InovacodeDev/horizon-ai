# Demonstração Visual da Máscara de Moeda

## Fluxo de Digitação

### Exemplo 1: Netflix (R$ 49,90)

```
┌─────────────────────────────────────┐
│ Valor Total *                       │
│ ┌─────────────────────────────────┐ │
│ │ R$ 0,00                         │ │  ← Estado inicial
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘

Usuário digita: 4
┌─────────────────────────────────────┐
│ Valor Total *                       │
│ ┌─────────────────────────────────┐ │
│ │ R$ 0,04                         │ │  ← 4 centavos
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘

Usuário digita: 9
┌─────────────────────────────────────┐
│ Valor Total *                       │
│ ┌─────────────────────────────────┐ │
│ │ R$ 0,49                         │ │  ← 49 centavos
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘

Usuário digita: 9
┌─────────────────────────────────────┐
│ Valor Total *                       │
│ ┌─────────────────────────────────┐ │
│ │ R$ 4,99                         │ │  ← 4 reais e 99 centavos
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘

Usuário digita: 0
┌─────────────────────────────────────┐
│ Valor Total *                       │
│ ┌─────────────────────────────────┐ │
│ │ R$ 49,90                        │ │  ← 49 reais e 90 centavos ✓
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

### Exemplo 2: Notebook Parcelado (R$ 1.200,00)

```
Estado inicial:
┌─────────────────────────────────────┐
│ R$ 0,00                             │
└─────────────────────────────────────┘

Digite: 1
┌─────────────────────────────────────┐
│ R$ 0,01                             │
└─────────────────────────────────────┘

Digite: 2
┌─────────────────────────────────────┐
│ R$ 0,12                             │
└─────────────────────────────────────┘

Digite: 0
┌─────────────────────────────────────┐
│ R$ 1,20                             │
└─────────────────────────────────────┘

Digite: 0
┌─────────────────────────────────────┐
│ R$ 12,00                            │
└─────────────────────────────────────┘

Digite: 0
┌─────────────────────────────────────┐
│ R$ 120,00                           │
└─────────────────────────────────────┘

Digite: 0
┌─────────────────────────────────────┐
│ R$ 1.200,00                         │  ← Separador de milhar aparece!
└─────────────────────────────────────┘

Selecione parcelamento: 12x
┌─────────────────────────────────────┐
│ Parcelamento *                      │
│ ┌─────────────────────────────────┐ │
│ │ 12x de R$ 100,00                │ │  ← Cálculo automático
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

### Exemplo 3: Assinatura Spotify (R$ 21,90)

```
Sequência de digitação: 2 → 1 → 9 → 0

R$ 0,00  →  R$ 0,02  →  R$ 0,21  →  R$ 2,19  →  R$ 21,90

┌─────────────────────────────────────────────────────┐
│ ☑ Assinatura Recorrente                             │
│                                                      │
│ Dia da Cobrança *                                   │
│ ┌─────────────────────────────────────────────────┐ │
│ │ Dia 1 de cada mês                               │ │
│ └─────────────────────────────────────────────────┘ │
│                                                      │
│ A transação será criada automaticamente             │
│ todo dia 1 do mês                                   │
└─────────────────────────────────────────────────────┘
```

## Comparação: Antes vs Depois

### ANTES (Máscara Antiga)

```
Usuário precisa digitar: 49.90
Campo mostra: 49.90
Problema: Confuso, não é intuitivo
```

### DEPOIS (Nova Máscara)

```
Usuário digita: 4990
Campo mostra: R$ 49,90
Vantagem: Natural, como uma calculadora
```

## Fluxo Completo: Criar Transação

```
┌────────────────────────────────────────────────────────┐
│                   Nova Transação                       │
├────────────────────────────────────────────────────────┤
│                                                        │
│  Cartão: Nubank                                        │
│  Final 1234                                            │
│                                                        │
│  Valor Total *                                         │
│  ┌──────────────────────────────────────────────────┐ │
│  │ R$ 49,90                                         │ │ ← Digite: 4990
│  └──────────────────────────────────────────────────┘ │
│                                                        │
│  ☑ Assinatura Recorrente                               │
│                                                        │
│  Dia da Cobrança *                                     │
│  ┌──────────────────────────────────────────────────┐ │
│  │ Dia 15 de cada mês                               │ │
│  └──────────────────────────────────────────────────┘ │
│                                                        │
│  Categoria *                                           │
│  ┌──────────────────────────────────────────────────┐ │
│  │ Lazer                                            │ │
│  └──────────────────────────────────────────────────┘ │
│                                                        │
│  Estabelecimento                                       │
│  ┌──────────────────────────────────────────────────┐ │
│  │ Netflix                                          │ │
│  └──────────────────────────────────────────────────┘ │
│                                                        │
│  Descrição                                             │
│  ┌──────────────────────────────────────────────────┐ │
│  │ Netflix Premium                                  │ │
│  └──────────────────────────────────────────────────┘ │
│                                                        │
│  Data *                                                │
│  ┌──────────────────────────────────────────────────┐ │
│  │ 2025-10-29                                       │ │
│  └──────────────────────────────────────────────────┘ │
│                                                        │
│  ┌──────────────┐  ┌──────────────────────────────┐  │
│  │  Cancelar    │  │  Criar Transação             │  │
│  └──────────────┘  └──────────────────────────────┘  │
│                                                        │
└────────────────────────────────────────────────────────┘

Ao clicar em "Criar Transação":

POST /api/credit-cards/recurring
{
  "credit_card_id": "card_123",
  "amount": 49.90,                    ← Valor numérico (não string!)
  "category": "Lazer",
  "description": "Netflix Premium",
  "merchant": "Netflix",
  "account_id": "account_123",
  "recurring_day": 15,
  "start_date": "2025-10-29"
}
```

## Casos Especiais

### Caso 1: Valores Pequenos

```
Digite: 1
Display: R$ 0,01

Digite: 5
Display: R$ 0,15

Digite: 0
Display: R$ 1,50
```

### Caso 2: Valores Grandes

```
Digite: 1234567890
Display: R$ 12.345.678,90

Separadores de milhar são adicionados automaticamente!
```

### Caso 3: Apagar e Redigitar

```
Valor atual: R$ 49,90

Selecionar tudo (Ctrl+A) e apagar:
Display: R$ 0,00

Digite: 2190
Display: R$ 21,90
```

### Caso 4: Colar Valor

```
Copiar: "4990"
Colar no campo:
Display: R$ 49,90

Copiar: "R$ 49,90" (com formatação)
Colar no campo:
Display: R$ 49,90
(Caracteres não numéricos são removidos automaticamente)
```

## Feedback Visual

### Estado Normal

```
┌─────────────────────────────────────┐
│ R$ 49,90                            │
└─────────────────────────────────────┘
```

### Estado Focado

```
┌─────────────────────────────────────┐
│ R$ 49,90                            │  ← Borda azul (focus ring)
└─────────────────────────────────────┘
```

### Estado com Erro

```
┌─────────────────────────────────────┐
│ R$ 0,00                             │  ← Borda vermelha
└─────────────────────────────────────┘
⚠ O valor deve ser maior que zero
```

## Integração com Parcelamento

```
Valor: R$ 1.200,00

┌─────────────────────────────────────────────────────┐
│ Parcelamento *                                      │
│ ┌─────────────────────────────────────────────────┐ │
│ │ À vista                                         │ │
│ │ 2x de R$ 600,00                                 │ │
│ │ 3x de R$ 400,00                                 │ │
│ │ 4x de R$ 300,00                                 │ │
│ │ 5x de R$ 240,00                                 │ │
│ │ 6x de R$ 200,00                                 │ │
│ │ 7x de R$ 171,43                                 │ │
│ │ 8x de R$ 150,00                                 │ │
│ │ 9x de R$ 133,33                                 │ │
│ │ 10x de R$ 120,00                                │ │
│ │ 11x de R$ 109,09                                │ │
│ │ 12x de R$ 100,00                                │ │ ← Selecionado
│ └─────────────────────────────────────────────────┘ │
│                                                      │
│ Compra antes do fechamento (dia 10).                │
│ Primeira parcela na fatura de Novembro/2025         │
└─────────────────────────────────────────────────────┘

Resultado: 12 transações de R$ 100,00 cada
```

## Dicas de UX

### ✅ Boas Práticas

1. **Sempre mostre o símbolo R$**
   - Deixa claro que é um valor em reais
   - Posicione à esquerda do valor

2. **Use separadores de milhar**
   - R$ 1.200,00 é mais legível que R$ 1200,00

3. **Mantenha sempre 2 casas decimais**
   - R$ 49,90 (não R$ 49,9)
   - R$ 100,00 (não R$ 100)

4. **Feedback imediato**
   - Atualize o display a cada tecla pressionada
   - Não espere o usuário sair do campo

5. **Validação clara**
   - Mostre mensagens de erro específicas
   - "O valor deve ser maior que zero"
   - Não apenas "Valor inválido"

### ❌ Evite

1. **Não use type="number"**
   - Não permite formatação customizada
   - Setas de incremento são confusas

2. **Não aceite valores negativos**
   - Para despesas, sempre positivo
   - O tipo (income/expense) define o sinal

3. **Não permita mais de 2 casas decimais**
   - Moeda brasileira só tem centavos
   - R$ 49,999 não faz sentido

4. **Não mostre valores sem formatação**
   - 4990 é confuso
   - R$ 49,90 é claro

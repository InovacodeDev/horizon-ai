# Exemplo de Parcelamento - Sistema de Faturas

## Cenário: Cartão com Fechamento no Dia 30

### Configuração do Cartão

- **Dia de Fechamento**: 30
- **Dia de Vencimento**: 10 (do mês seguinte)
- **Limite**: R$ 5.000,00

---

## Exemplo 1: Compra ANTES do Fechamento

### Dados da Compra

- **Data da Compra**: 29/10/2025 (antes do dia 30)
- **Valor Total**: R$ 1.200,00
- **Parcelamento**: 10x de R$ 120,00
- **Produto**: Notebook

### Distribuição das Parcelas

| Parcela | Valor  | Fatura         | Vencimento | Status          |
| ------- | ------ | -------------- | ---------- | --------------- |
| 1/10    | R$ 120 | Outubro/2025   | 10/11/2025 | ✅ Fatura atual |
| 2/10    | R$ 120 | Novembro/2025  | 10/12/2025 | 📅 Próxima      |
| 3/10    | R$ 120 | Dezembro/2025  | 10/01/2026 | 📅 Futura       |
| 4/10    | R$ 120 | Janeiro/2026   | 10/02/2026 | 📅 Futura       |
| 5/10    | R$ 120 | Fevereiro/2026 | 10/03/2026 | 📅 Futura       |
| 6/10    | R$ 120 | Março/2026     | 10/04/2026 | 📅 Futura       |
| 7/10    | R$ 120 | Abril/2026     | 10/05/2026 | 📅 Futura       |
| 8/10    | R$ 120 | Maio/2026      | 10/06/2026 | 📅 Futura       |
| 9/10    | R$ 120 | Junho/2026     | 10/07/2026 | 📅 Futura       |
| 10/10   | R$ 120 | Julho/2026     | 10/08/2026 | 📅 Futura       |

**Resultado**: A primeira parcela cai na fatura atual (Outubro/2025) porque a compra foi feita ANTES do fechamento.

---

## Exemplo 2: Compra DEPOIS do Fechamento

### Dados da Compra

- **Data da Compra**: 31/10/2025 (depois do dia 30)
- **Valor Total**: R$ 600,00
- **Parcelamento**: 6x de R$ 100,00
- **Produto**: Smartphone

### Distribuição das Parcelas

| Parcela | Valor  | Fatura         | Vencimento | Status            |
| ------- | ------ | -------------- | ---------- | ----------------- |
| 1/6     | R$ 100 | Novembro/2025  | 10/12/2025 | 📅 Próxima fatura |
| 2/6     | R$ 100 | Dezembro/2025  | 10/01/2026 | 📅 Futura         |
| 3/6     | R$ 100 | Janeiro/2026   | 10/02/2026 | 📅 Futura         |
| 4/6     | R$ 100 | Fevereiro/2026 | 10/03/2026 | 📅 Futura         |
| 5/6     | R$ 100 | Março/2026     | 10/04/2026 | 📅 Futura         |
| 6/6     | R$ 100 | Abril/2026     | 10/05/2026 | 📅 Futura         |

**Resultado**: A primeira parcela cai na próxima fatura (Novembro/2025) porque a compra foi feita DEPOIS do fechamento.

---

## Exemplo 3: Compra NO DIA do Fechamento

### Dados da Compra

- **Data da Compra**: 30/10/2025 (exatamente no dia 30)
- **Valor Total**: R$ 300,00
- **Parcelamento**: 3x de R$ 100,00
- **Produto**: Fone de Ouvido

### Distribuição das Parcelas

| Parcela | Valor  | Fatura        | Vencimento | Status          |
| ------- | ------ | ------------- | ---------- | --------------- |
| 1/3     | R$ 100 | Outubro/2025  | 10/11/2025 | ✅ Fatura atual |
| 2/3     | R$ 100 | Novembro/2025 | 10/12/2025 | 📅 Próxima      |
| 3/3     | R$ 100 | Dezembro/2025 | 10/01/2026 | 📅 Futura       |

**Resultado**: Compras no dia do fechamento entram na fatura atual (dia 30 ≤ dia 30).

---

## Visualização no Modal

Quando o usuário seleciona o parcelamento, o modal mostra:

### Antes do Fechamento (dia 29)

```
Parcelamento: 10x de R$ 120,00

ℹ️ Compra antes do fechamento (dia 30).
   Primeira parcela na fatura de Outubro/2025
```

### Depois do Fechamento (dia 31)

```
Parcelamento: 6x de R$ 100,00

ℹ️ Compra após o fechamento (dia 30).
   Primeira parcela na fatura de Novembro/2025
```

---

## Regras de Negócio

1. **Dia da Compra ≤ Dia de Fechamento** → Primeira parcela na fatura atual
2. **Dia da Compra > Dia de Fechamento** → Primeira parcela na próxima fatura
3. Cada parcela subsequente cai no mesmo dia do mês seguinte
4. Parcelas são identificadas com "(X/Y)" na descrição
5. Todas as parcelas têm o mesmo valor (divisão simples)

---

## Benefícios do Sistema

✅ **Transparência**: Usuário sabe exatamente quando cada parcela cairá
✅ **Controle**: Visualização clara do impacto nas faturas futuras
✅ **Automação**: Sistema calcula automaticamente a distribuição
✅ **Flexibilidade**: Suporta de 2x até 13x parcelas

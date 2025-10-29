# Faturas do Cartão de Crédito

## Funcionalidades Implementadas

### 1. Cálculo Automático de Faturas

- As faturas são calculadas automaticamente com base nas transações vinculadas ao cartão
- Considera o dia de fechamento e vencimento configurados no cartão
- Transações após o dia de fechamento vão para a fatura do próximo mês

### 2. Abas de Faturas por Mês

- Exibe apenas faturas abertas (antes da data de vencimento)
- Uma aba para cada mês com fatura aberta
- Mostra o total de cada fatura na aba
- Faturas passadas ficam ocultas automaticamente

### 3. Cards de Resumo

- **Fatura Atual**: Mostra o valor total e quantidade de transações
- **Próximo Vencimento**: Exibe a data de vencimento e fechamento
- **Limite Disponível**: Calcula automaticamente baseado no limite total menos o valor da fatura atual

### 4. Criação de Transações com Parcelamento

- Botão "Nova Transação" no canto superior direito
- Modal para criar transações do tipo "Cartão de Crédito"
- Campos disponíveis:
  - Valor Total (obrigatório)
  - Parcelamento (1x até 13x)
  - Categoria (obrigatório)
  - Estabelecimento
  - Descrição
  - Data da compra (obrigatório)
- Transação é automaticamente vinculada ao cartão selecionado

#### Sistema de Parcelamento Inteligente

- **Controle de Fechamento**: O sistema considera o dia de fechamento do cartão para determinar em qual fatura cada parcela cairá
- **Exemplo 1**: Compra no dia 29 em cartão que fecha dia 30
  - Primeira parcela: Fatura atual (antes do fechamento)
  - Demais parcelas: Faturas seguintes
- **Exemplo 2**: Compra no dia 31 em cartão que fecha dia 30
  - Primeira parcela: Próxima fatura (após o fechamento)
  - Demais parcelas: Faturas seguintes
- **Visualização**: O modal mostra em qual fatura a primeira parcela cairá
- **Identificação**: Parcelas são marcadas com badge "Parcela X/Y" na lista de transações

## Estrutura de Arquivos

```
app/(app)/credit-card-bills/
├── page.tsx                      # Página principal
├── CreateTransactionModal.tsx    # Modal de criação de transação
└── README.md                     # Esta documentação
```

## APIs Utilizadas

### GET /api/transactions?credit_card_id={id}

Busca todas as transações de um cartão específico.

### POST /api/transactions

Cria uma nova transação à vista vinculada ao cartão.

**Body:**

```json
{
  "amount": 100.0,
  "type": "expense",
  "category": "Alimentação",
  "description": "Almoço",
  "merchant": "Restaurante XYZ",
  "date": "2025-10-29",
  "credit_card_id": "card_id",
  "currency": "BRL",
  "status": "completed"
}
```

### POST /api/credit-cards/installments

Cria um plano de parcelamento para uma compra no cartão.

**Body:**

```json
{
  "credit_card_id": "card_id",
  "total_amount": 1200.0,
  "installments": 10,
  "category": "Eletrônicos",
  "description": "Notebook",
  "merchant": "Loja XYZ",
  "purchase_date": "2025-10-29",
  "closing_day": 30
}
```

**Resposta:**

```json
{
  "success": true,
  "data": {
    "installments": 10,
    "total_amount": 1200.0,
    "installment_amount": 120.0,
    "transactions": [...]
  }
}
```

## Lógica de Cálculo de Faturas

1. Para cada transação, verifica a data
2. Se a transação foi feita após o dia de fechamento, vai para a fatura do próximo mês
3. Calcula as datas de fechamento e vencimento para cada fatura
4. Agrupa transações por mês de fatura
5. Filtra apenas faturas abertas (antes do vencimento)

## Configurações do Cartão

As configurações são lidas do objeto do cartão:

- `closing_day`: Dia de fechamento da fatura
- `due_day`: Dia de vencimento da fatura
- `credit_limit`: Limite total do cartão

## Lógica de Parcelamento

### Cálculo da Primeira Parcela

```typescript
const purchaseDate = new Date(purchase_date);
const purchaseDay = purchaseDate.getDate();
let billMonth = purchaseDate.getMonth();
let billYear = purchaseDate.getFullYear();

// Se a compra foi após o fechamento, primeira parcela vai para próxima fatura
if (purchaseDay > closingDay) {
  billMonth += 1;
  if (billMonth > 11) {
    billMonth = 0;
    billYear += 1;
  }
}
```

### Distribuição das Parcelas

- Cada parcela é criada como uma transação separada
- As parcelas são distribuídas mensalmente a partir da primeira fatura
- Cada transação tem a descrição com o número da parcela: "Descrição (1/10)"
- Todas as parcelas têm o mesmo valor (total / número de parcelas)

## Próximas Melhorias Sugeridas

- [x] Adicionar suporte a parcelamento
- [ ] Permitir cancelar/editar parcelamento
- [ ] Permitir marcar fatura como paga
- [ ] Exportar fatura em PDF
- [ ] Gráficos de gastos por categoria
- [ ] Histórico de faturas pagas
- [ ] Notificações de vencimento
- [ ] Suporte a juros em parcelamentos

# Credit Card Bills Page

Gerenciamento de faturas de cartões de crédito.

## Rota

`/credit-card-bills`

## Propósito

Visualizar e gerenciar faturas de cartões de crédito, incluindo transações, parcelamentos e pagamentos.

## Funcionalidades

### 1. Lista de Cartões

**Visualização**:

- Cards dos cartões
- Nome do cartão
- Últimos 4 dígitos
- Bandeira (Visa, Mastercard, etc)
- Limite total
- Limite disponível
- Fatura atual

**Indicadores Visuais**:

- Barra de uso do limite
- Cores por nível de uso:
  - Verde: < 50%
  - Amarelo: 50-80%
  - Vermelho: > 80%

### 2. Fatura Atual

**Informações da Fatura**:

- Mês de referência
- Data de fechamento
- Data de vencimento
- Valor total
- Valor mínimo
- Status (aberta/fechada/paga)

**Detalhamento**:

- Compras do período
- Parcelamentos em andamento
- Juros e encargos
- Pagamentos realizados
- Saldo anterior

### 3. Transações do Cartão

**Lista de Transações**:

- Data da compra
- Descrição
- Estabelecimento
- Valor
- Parcela (se parcelado)
- Categoria
- Status

**Filtros**:

- Período
- Categoria
- Valor
- Parceladas/à vista
- Status

**Ações por Transação**:

- Editar descrição
- Alterar categoria
- Adicionar nota
- Ver detalhes
- Contestar (se fraude)

### 4. Adicionar Transação

**Modal de Criação**:

**Campos**:

- Cartão (obrigatório)
- Valor (obrigatório)
- Descrição (obrigatório)
- Data da compra (obrigatório)
- Categoria (obrigatório)
- Parcelamento:
  - À vista
  - Parcelado (2-24x)
  - Com juros (opcional)

**Cálculo de Parcelamento**:

```typescript
// Sem juros
valorParcela = valorTotal / numeroParcelas;

// Com juros
valorParcela = (valorTotal * (1 + taxa)) ^ (n / n);
```

**Validações**:

- Valor > 0
- Data não pode ser futura
- Número de parcelas: 2-24
- Taxa de juros: 0-10% ao mês

### 5. Parcelamentos

**Visualização de Parcelamentos**:

- Lista de compras parceladas
- Parcelas pagas vs pendentes
- Valor total vs pago
- Previsão de término

**Detalhes do Parcelamento**:

```
Compra: Notebook
Valor total: R$ 3.000,00
Parcelas: 10x de R$ 300,00
Pagas: 3/10
Restante: R$ 2.100,00
Término: Outubro/2024
```

**Ações**:

- Ver todas as parcelas
- Antecipar pagamento
- Cancelar (se possível)

### 6. Pagamento de Fatura

**Modal de Pagamento**:

**Opções**:

- Pagar valor total
- Pagar valor mínimo
- Pagar valor personalizado

**Informações**:

- Valor a pagar
- Data de vencimento
- Juros se atrasar
- Conta de débito

**Fluxo**:

```
1. Seleciona valor
2. Escolhe conta de débito
3. Confirma pagamento
4. Cria transação de débito
5. Marca fatura como paga
6. Atualiza limite disponível
```

**Validações**:

- Conta tem saldo suficiente
- Valor >= valor mínimo
- Data não passou do vencimento

### 7. Fechamento de Fatura

**Processo Automático**:

```
1. Dia do fechamento chega
2. Appwrite Function é triggerada
3. Calcula total da fatura
4. Marca fatura como fechada
5. Cria nova fatura (próximo mês)
6. Envia notificação ao usuário
```

**Cálculo do Total**:

```typescript
total = +saldoAnterior + comprasDoMes + parcelasDoMes + jurosEEncargos - pagamentosRealizados;
```

### 8. Histórico de Faturas

**Lista de Faturas Anteriores**:

- Mês/ano
- Valor total
- Status (paga/em atraso)
- Data de pagamento
- Método de pagamento

**Ações**:

- Ver detalhes
- Download PDF
- Reenviar por email
- Segunda via

### 9. Limite do Cartão

**Gerenciamento de Limite**:

- Limite atual
- Limite disponível
- Limite utilizado (%)
- Histórico de alterações

**Solicitação de Aumento**:

- Formulário de solicitação
- Justificativa
- Valor desejado
- Status da solicitação

### 10. Alertas e Notificações

**Tipos de Alerta**:

- Fatura próxima do vencimento (3 dias)
- Limite próximo do máximo (80%)
- Compra suspeita detectada
- Fatura fechada
- Pagamento confirmado

**Configurações**:

- Email
- Push notification
- SMS (opcional)
- Frequência

## Dados Carregados

### Server Component

```typescript
const user = await verifyAuth();
const creditCards = await creditCardService.list(user.id);
const currentBills = await creditCardService.getCurrentBills(user.id);
```

### Client Component (Realtime)

```typescript
useAppwriteRealtime(
  [`databases.${DB}.collections.credit_cards.documents`, `databases.${DB}.collections.credit_card_bills.documents`],
  (event) => {
    // Atualiza em tempo real
  },
);
```

## Lógica de Faturamento

### Ciclo de Faturamento

```
Dia 1-5: Fechamento da fatura anterior
Dia 5: Fatura fechada, total calculado
Dia 6-10: Período de pagamento
Dia 10: Vencimento
Dia 11+: Juros por atraso
```

### Cálculo de Parcelas

**Sem Juros**:

```typescript
const valorParcela = valorTotal / numeroParcelas;
// Exemplo: R$ 1.200 / 12 = R$ 100/mês
```

**Com Juros**:

```typescript
const taxa = 0.02; // 2% ao mês
const n = numeroParcelas;
const valorParcela = (valorTotal * (taxa * Math.pow(1 + taxa, n))) / (Math.pow(1 + taxa, n) - 1);
// Exemplo: R$ 1.200 em 12x com 2% = R$ 113,24/mês
```

### Distribuição de Parcelas

```typescript
// Compra em 15/01 parcelada em 3x
// Fechamento dia 5
Parcela 1: Fatura de Fevereiro (vence 10/02)
Parcela 2: Fatura de Março (vence 10/03)
Parcela 3: Fatura de Abril (vence 10/04)
```

## Estados da Página

### Loading

- Skeleton cards
- Shimmer effect

### Empty State

- "Nenhum cartão cadastrado"
- Botão "Adicionar cartão"
- Tutorial

### Error State

- Mensagem de erro
- Botão "Tentar novamente"

## Componentes

### CreditCardCard

```typescript
interface CreditCardCardProps {
  card: CreditCard;
  currentBill: CreditCardBill;
  onViewBill: (id: string) => void;
}
```

### BillDetailsModal

```typescript
interface BillDetailsModalProps {
  billId: string;
  isOpen: boolean;
  onClose: () => void;
}
```

### PayBillModal

```typescript
interface PayBillModalProps {
  billId: string;
  amount: number;
  dueDate: string;
  isOpen: boolean;
  onClose: () => void;
}
```

### CreateTransactionModal

```typescript
interface CreateTransactionModalProps {
  cardId: string;
  isOpen: boolean;
  onClose: () => void;
}
```

## Integração com Server Actions

```typescript
import { closeBillAction, createCreditCardTransactionAction, payBillAction } from '@/actions/credit-card.actions';
```

## Responsividade

### Desktop

- Grid 3 colunas
- Tabelas completas
- Gráficos detalhados

### Tablet

- Grid 2 colunas
- Tabelas scrolláveis
- Gráficos médios

### Mobile

- Lista vertical
- Cards compactos
- Gráficos simplificados

## Acessibilidade

- Labels descritivos
- Anúncios de valores
- Navegação por teclado
- Contraste adequado
- Foco visível

## Performance

### Otimizações

- Server Components
- Streaming
- Cache de 30 segundos
- Lazy load de histórico

### Métricas

- LCP < 2.5s
- FID < 100ms
- CLS < 0.1

## Segurança

### Proteções

- Últimos 4 dígitos apenas
- Número completo nunca exibido
- Transações criptografadas
- 2FA para pagamentos altos

### Validações

- Verifica ownership
- Valida limites
- Detecta fraudes

## Analytics

**Eventos**:

- `bill_viewed`
- `transaction_created`
- `bill_paid`
- `installment_created`
- `limit_exceeded_warning`

## Testes

```bash
pnpm test:credit-cards
```

## Melhorias Futuras

- [ ] Integração com bancos
- [ ] Cashback automático
- [ ] Programa de pontos
- [ ] Análise de gastos
- [ ] Sugestões de economia
- [ ] Negociação de dívidas
- [ ] Simulador de parcelamento

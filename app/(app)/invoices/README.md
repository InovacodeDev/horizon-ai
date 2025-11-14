# Invoices Page (Notas Fiscais)

Gerenciamento de notas fiscais eletrônicas (NFe).

## Rota

`/invoices`

## Propósito

Armazenar, visualizar e analisar notas fiscais para tracking de preços e gestão de compras.

## Funcionalidades

### 1. Upload de NFe

**Métodos de Upload**:

- Drag & drop de arquivo XML
- Click para selecionar arquivo
- Scan de QR Code da NFe
- URL da NFe (busca automática)

**Formatos Aceitos**:

- XML (NFe padrão)
- PDF com QR Code
- Imagem do QR Code

**Processamento**:

```
1. Upload do arquivo
2. Validação do XML
3. Extração de dados (estabelecimento, produtos, valores)
4. Categorização automática de produtos (IA)
5. Normalização de nomes
6. Armazenamento no banco
7. Indexação para busca
```

### 2. Lista de Notas Fiscais

**Visualização**:

- Cards em grid (desktop)
- Lista (mobile)
- Paginação (20 por página)

**Informações por NFe**:

- Logo/nome do estabelecimento
- Data da compra
- Valor total
- Quantidade de produtos
- Chave de acesso (últimos 8 dígitos)
- Status (processada/erro)

**Ordenação**:

- Data (mais recente/antiga)
- Valor (maior/menor)
- Estabelecimento (A-Z)

**Filtros**:

- Período (data início/fim)
- Estabelecimento
- Valor mínimo/máximo
- Produtos específicos

### 3. Detalhes da NFe

**Modal de Detalhes**:

**Informações do Estabelecimento**:

- Nome fantasia
- CNPJ
- Endereço completo
- Telefone

**Informações da Compra**:

- Data e hora
- Número da nota
- Série
- Chave de acesso
- Protocolo de autorização

**Lista de Produtos**:

- Nome do produto
- Código (EAN/GTIN)
- Quantidade
- Unidade
- Valor unitário
- Valor total
- Categoria (auto-atribuída)

**Totais**:

- Subtotal
- Descontos
- Acréscimos
- Valor total
- Forma de pagamento

**Ações**:

- Download XML original
- Exportar para PDF
- Adicionar à lista de compras
- Comparar preços
- Deletar NFe

### 4. Comparação de Preços

**Funcionalidade**:

- Seleciona produto
- Mostra histórico de preços
- Compara entre estabelecimentos
- Identifica melhor preço
- Mostra tendência (subindo/descendo)

**Gráfico de Preços**:

- Linha do tempo
- Preço por estabelecimento
- Média de mercado
- Alertas de variação

**Tabela Comparativa**:

```
Produto: Arroz 5kg
┌─────────────────┬────────┬──────────┬──────────┐
│ Estabelecimento │ Preço  │ Data     │ Variação │
├─────────────────┼────────┼──────────┼──────────┤
│ Supermercado A  │ R$25.00│ 15/01/24 │ -5%      │
│ Supermercado B  │ R$27.00│ 10/01/24 │ +2%      │
│ Supermercado C  │ R$24.50│ 08/01/24 │ -8%      │
└─────────────────┴────────┴──────────┴──────────┘
```

### 5. Lista de Compras Inteligente

**Geração Automática**:

- Analisa compras anteriores
- Identifica produtos recorrentes
- Sugere quando comprar novamente
- Indica melhor estabelecimento

**Personalização**:

- Adicionar/remover produtos
- Ajustar quantidades
- Marcar como comprado
- Adicionar notas

**Otimização**:

- Agrupa por estabelecimento
- Calcula rota otimizada
- Estima valor total
- Sugere alternativas mais baratas

### 6. Insights e Analytics

**Painel de Insights**:

**Gastos por Estabelecimento**:

- Gráfico de pizza
- Top 5 estabelecimentos
- Valor total por cada
- Frequência de compras

**Gastos por Categoria**:

- Alimentação
- Limpeza
- Higiene
- Outros

**Produtos Mais Comprados**:

- Top 10 produtos
- Quantidade total
- Valor gasto
- Frequência

**Economia Potencial**:

- Quanto poderia economizar
- Comprando no melhor preço
- Por produto
- Total mensal

**Tendências**:

- Inflação por categoria
- Variação de preços
- Padrões de consumo

### 7. Busca de Produtos

**Busca Avançada**:

- Nome do produto
- Código de barras (EAN)
- Categoria
- Estabelecimento
- Faixa de preço

**Resultados**:

- Lista de produtos encontrados
- Histórico de preços
- Onde comprar mais barato
- Última compra

### 8. Alertas de Preço

**Configuração de Alertas**:

- Seleciona produto
- Define preço alvo
- Escolhe estabelecimentos
- Ativa notificação

**Notificações**:

- Email quando preço cair
- Push notification
- In-app notification
- Resumo semanal

### 9. Orçamento de Compras

**Planejamento**:

- Define orçamento mensal
- Categoriza gastos
- Acompanha execução
- Alertas de limite

**Visualização**:

- Barra de progresso
- Gasto vs orçado
- Projeção fim do mês
- Sugestões de economia

## Dados Carregados

### Server Component

```typescript
const user = await verifyAuth();
const invoices = await invoiceService.list(user.id, {
  limit: 20,
  offset: 0,
});
const stats = await invoiceService.getStats(user.id);
```

### Client Component (Realtime)

```typescript
useAppwriteRealtime(`databases.${DB}.collections.invoices.documents`, (event) => {
  // Atualiza lista quando nova NFe é processada
});
```

## Processamento de NFe

### Extração de Dados

```typescript
1. Parse XML da NFe
2. Extrai dados do emitente
3. Extrai dados dos produtos
4. Valida assinatura digital
5. Categoriza produtos com IA
6. Normaliza nomes de produtos
7. Salva no banco de dados
8. Indexa para busca
```

### Categorização com IA

```typescript
// Google AI (Gemini) categoriza produtos
const category = await categorizeProduct({
  name: 'ARROZ TIPO 1 5KG',
  description: 'Arroz branco tipo 1',
});
// Retorna: "Alimentação > Grãos > Arroz"
```

### Normalização de Nomes

```typescript
// Normaliza variações do mesmo produto
"COCA COLA 2L" → "Coca-Cola 2 Litros"
"COCA-COLA 2 LITROS" → "Coca-Cola 2 Litros"
"Coca Cola 2000ml" → "Coca-Cola 2 Litros"
```

## Estados da Página

### Loading

- Skeleton cards
- Shimmer effect

### Empty State

- Ilustração
- "Nenhuma nota fiscal cadastrada"
- Botão "Adicionar primeira NFe"
- Tutorial de como usar

### Processing

- "Processando NFe..."
- Barra de progresso
- Estimativa de tempo

### Error State

- "Erro ao processar NFe"
- Detalhes do erro
- Botão "Tentar novamente"

## Componentes

### InvoiceCard

```typescript
interface InvoiceCardProps {
  invoice: Invoice;
  onView: (id: string) => void;
  onDelete: (id: string) => void;
}
```

### InvoiceDetailsModal

```typescript
interface InvoiceDetailsModalProps {
  invoiceId: string;
  isOpen: boolean;
  onClose: () => void;
}
```

### PriceComparisonTable

```typescript
interface PriceComparisonTableProps {
  productId: string;
  invoices: Invoice[];
}
```

### ShoppingListBuilder

```typescript
interface ShoppingListBuilderProps {
  userId: string;
  onSave: (list: ShoppingList) => void;
}
```

## Integração com Server Actions

```typescript
import { deleteInvoiceAction, generateShoppingListAction, uploadInvoiceAction } from '@/actions/invoice.actions';
```

## Responsividade

### Desktop

- Grid 3 colunas
- Gráficos lado a lado
- Tabelas completas

### Tablet

- Grid 2 colunas
- Gráficos empilhados
- Tabelas scrolláveis

### Mobile

- Lista vertical
- Cards compactos
- Gráficos simplificados

## Acessibilidade

- Labels em formulários
- Alt text em imagens
- Anúncios de processamento
- Navegação por teclado
- Contraste adequado

## Performance

### Otimizações

- Lazy load de imagens
- Virtualização de listas longas
- Cache de produtos
- Compressão de XMLs
- CDN para assets

### Métricas

- LCP < 2.5s
- FID < 100ms
- CLS < 0.1

## Segurança

### Validações

- Validação de XML (schema NFe)
- Verificação de assinatura digital
- Sanitização de dados
- Limite de tamanho (5MB)

### Privacidade

- Dados sensíveis não são compartilhados
- XMLs armazenados criptografados
- Acesso apenas do owner

## Analytics

**Eventos**:

- `invoice_uploaded`
- `invoice_processed`
- `price_compared`
- `shopping_list_generated`
- `alert_created`

## Testes

```bash
pnpm test:invoices
```

## Melhorias Futuras

- [ ] OCR para notas em papel
- [ ] Integração com supermercados
- [ ] Cashback automático
- [ ] Receitas baseadas em compras
- [ ] Compartilhamento de listas
- [ ] Gamificação (economia)
- [ ] Previsão de gastos com IA

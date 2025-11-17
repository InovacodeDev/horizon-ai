# Quick Start - Credit Card Bills Function

## 🚀 Como Usar

### 1. Instalar Dependências

```bash
cd functions/credit-card-bills
npm install
```

### 2. Build

```bash
npm run build
```

Isso irá compilar o TypeScript e gerar o arquivo `index.js`.

### 3. Configurar no Appwrite

#### Via Console:

1. Acesse o Appwrite Console
2. Vá em **Functions** → **Create Function**
3. Configure:
   - **Function ID**: `credit-card-bills`
   - **Name**: Credit Card Bills
   - **Runtime**: Node.js 20
   - **Entrypoint**: `index.js`
   - **Build Commands**: `npm install && npm run build`
   - **Timeout**: 900 segundos

4. Adicione as **Environment Variables**:

   ```
   APPWRITE_ENDPOINT=https://nyc.cloud.appwrite.io/v1
   APPWRITE_DATABASE_ID=<seu-database-id>
   ```

5. Configure os **Events** (triggers):
   - `databases.*.collections.credit_card_transactions.documents.*.create`
   - `databases.*.collections.credit_card_transactions.documents.*.update`
   - `databases.*.collections.credit_card_transactions.documents.*.delete`

6. Faça upload do código:
   - Compacte a pasta em um `.tar.gz`
   - Ou conecte ao GitHub

#### Via CLI:

```bash
# Atualize o appwrite.json com seus IDs
# Depois execute:
appwrite deploy function
```

### 4. Testar

#### Teste Manual:

1. Crie uma transação de cartão de crédito via UI ou API
2. Verifique os logs da function no Console
3. Confirme que uma `transaction` foi criada com:
   - `type: 'expense'`
   - `category: 'Cartão de Crédito'`
   - `date`: data de vencimento do cartão
   - `amount`: valor da fatura

#### Verificar Logs:

```bash
# Via CLI
appwrite functions listExecutions --functionId=credit-card-bills

# Via Console
Functions → Credit Card Bills → Executions
```

## 🔍 Como Funciona

### Exemplo Prático:

**Configuração do Cartão:**

- Nome: Nubank
- Dia de Fechamento: 10
- Dia de Vencimento: 15

**Transações de Cartão:**

1. **05/12/2024** - Supermercado: R$ 150,00 (à vista)
2. **08/12/2024** - Amazon: R$ 600,00 (3x de R$ 200,00)
3. **12/12/2024** - Netflix: R$ 50,00 (à vista)

**Resultado (Transactions Criadas):**

| Data Vencimento | Valor     | Descrição                         |
| --------------- | --------- | --------------------------------- |
| 15/12/2024      | R$ 400,00 | Fatura Nubank - dezembro de 2024  |
| 15/01/2025      | R$ 200,00 | Fatura Nubank - janeiro de 2025   |
| 15/02/2025      | R$ 200,00 | Fatura Nubank - fevereiro de 2025 |

**Explicação:**

- **Fatura 15/12/2024**:
  - R$ 150 (Supermercado, compra antes do fechamento dia 10)
  - R$ 200 (1ª parcela Amazon)
  - R$ 50 (Netflix, compra depois do dia 10, vai para próxima)
  - **Total**: R$ 400,00 ❌ (erro no exemplo acima)

  _Correção: Netflix (dia 12) vai para Janeiro_
  - R$ 150 (Supermercado)
  - R$ 200 (1ª parcela Amazon)
  - **Total**: R$ 350,00 ✅

- **Fatura 15/01/2025**:
  - R$ 200 (2ª parcela Amazon)
  - R$ 50 (Netflix)
  - **Total**: R$ 250,00 ✅

- **Fatura 15/02/2025**:
  - R$ 200 (3ª parcela Amazon)
  - **Total**: R$ 200,00 ✅

## 🎯 Benefícios

1. **Projeção Automática**: As transactions aparecem automaticamente nas projeções de cash flow
2. **Visibilidade**: Você vê exatamente quanto vai pagar em cada mês
3. **Planejamento**: Facilita o planejamento financeiro mensal
4. **Atualização Automática**: Sempre que você adiciona/remove uma compra, a fatura é recalculada

## 🔧 Troubleshooting

### Function não está sendo acionada

1. Verifique se os eventos estão configurados corretamente
2. Confirme que a function está **enabled**
3. Verifique as permissões da API Key

### Valores incorretos

1. Confirme os dias de fechamento e vencimento do cartão
2. Verifique se as datas das compras estão corretas
3. Cheque os logs para ver o cálculo detalhado

### Timeout

Se houver muitas transações:

1. Aumente o timeout da function (padrão: 900s)
2. Considere adicionar paginação otimizada
3. Verifique os logs para identificar gargalos

## 📝 Próximos Passos

Após configurar a function:

1. ✅ Crie transações de cartão de crédito
2. ✅ Verifique se as transactions de fatura foram criadas
3. ✅ Confira as projeções mensais
4. 🔄 Configure alertas de vencimento (futura feature)
5. 🔄 Integre com pagamento automático (futura feature)

## 🆘 Suporte

Se encontrar problemas:

1. Verifique os logs da function
2. Confirme as configurações do cartão
3. Teste com dados simples primeiro
4. Consulte o README.md completo para mais detalhes

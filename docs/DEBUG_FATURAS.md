# Debug - Faturas do Cartão de Crédito

## Problema

As faturas do cartão não estão aparecendo na tela de "Faturas do Cartão de Crédito".

## Possíveis Causas e Soluções

### 1. Verificar se a Migration foi Aplicada

Execute no terminal:

```bash
npm run migrate:status
```

Verifique se a migration `20251029_000016` está na lista de migrations aplicadas.

Se não estiver, execute:

```bash
npm run migrate:up
```

### 2. Verificar se Existem Transações no Banco

Abra o console do navegador (F12) e vá para a aba "Console".

Você deve ver logs como:

```
Fetching transactions for card: card_123abc
Response status: 200
API Response: { success: true, data: [...], total: 5 }
Transactions data: [...]
Number of transactions: 5
Mapped transactions: [...]
```

### 3. Verificar se as Transações Têm `credit_card_id`

Se você criou transações ANTES da migration, elas não terão o campo `credit_card_id`.

**Solução**: Crie novas transações usando o botão "Nova Transação" na tela de faturas.

### 4. Verificar a Estrutura da Transação

No console do navegador, verifique se as transações têm a estrutura correta:

```javascript
{
  $id: "transaction_123",
  amount: 150.00,
  date: "2025-10-29T00:00:00.000Z",
  category: "Alimentação",
  description: "Almoço",
  merchant: "Restaurante XYZ",
  credit_card_id: "card_123abc"  // ← Este campo é essencial!
}
```

### 5. Testar a API Diretamente

Abra o console do navegador e execute:

```javascript
// Substitua CARD_ID pelo ID do seu cartão
const cardId = 'CARD_ID_AQUI';

fetch(`/api/transactions?credit_card_id=${cardId}`, {
  credentials: 'include',
})
  .then((r) => r.json())
  .then((data) => console.log('Transações:', data));
```

### 6. Verificar se o Cartão Está Selecionado

Na tela de faturas:

1. Verifique se há cartões na aba superior
2. Clique em um cartão para selecioná-lo
3. Verifique se o ID do cartão aparece no console

### 7. Criar uma Transação de Teste

1. Clique no botão "Nova Transação"
2. Preencha os campos:
   - Valor: 100
   - Categoria: Alimentação
   - Data: Hoje
3. Clique em "Criar Transação"
4. Verifique se a transação aparece na lista

### 8. Verificar o Cálculo das Faturas

O sistema calcula as faturas baseado em:

- **Dia de fechamento do cartão**: Transações até este dia vão para a fatura atual
- **Dia de vencimento**: Faturas após o vencimento são ocultadas

**Exemplo:**

- Cartão fecha dia 30
- Compra dia 29 → Fatura de Outubro
- Compra dia 31 → Fatura de Novembro

### 9. Verificar se Há Faturas Abertas

O sistema só mostra faturas ABERTAS (antes do vencimento).

Se todas as faturas já venceram, você verá:

```
"Nenhuma fatura aberta"
```

**Solução**: Crie uma transação com data recente.

### 10. Logs Detalhados

Com os logs adicionados, você deve ver no console:

```
Fetching transactions for card: card_abc123
Response status: 200
API Response: { success: true, data: [...] }
Transactions data: [{ $id: "...", amount: 100, ... }]
Number of transactions: 1
Mapped transactions: [{ id: "...", amount: 100, ... }]
```

Se algum desses logs não aparecer, há um problema naquela etapa.

## Checklist de Verificação

- [ ] Migration aplicada (`npm run migrate:status`)
- [ ] Cartão de crédito cadastrado
- [ ] Cartão selecionado na tela
- [ ] Transação criada com `credit_card_id`
- [ ] Data da transação é recente (fatura aberta)
- [ ] Console do navegador mostra os logs
- [ ] API retorna transações (`/api/transactions?credit_card_id=...`)

## Comandos Úteis

```bash
# Ver status das migrations
npm run migrate:status

# Aplicar migrations pendentes
npm run migrate:up

# Ver logs do servidor
# (se estiver rodando npm run dev)
```

## Exemplo de Transação Válida

Para que uma transação apareça nas faturas, ela deve ter:

```json
{
  "amount": 150.0,
  "type": "expense",
  "category": "Alimentação",
  "description": "Almoço",
  "merchant": "Restaurante XYZ",
  "date": "2025-10-29",
  "credit_card_id": "card_abc123", // ← ESSENCIAL
  "currency": "BRL",
  "status": "completed"
}
```

## Próximos Passos

1. Abra o console do navegador (F12)
2. Vá para a tela de faturas
3. Selecione um cartão
4. Verifique os logs no console
5. Compartilhe os logs se o problema persistir

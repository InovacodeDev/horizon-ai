# Testando Assinaturas Recorrentes

## Setup Inicial

### 1. Configurar Variável de Ambiente

Adicione no seu `.env.local`:

```env
CRON_SECRET=test-secret-123
```

### 2. Executar Migrações

```bash
npm run migrate:up
```

## Testando a Interface

### 1. Criar uma Assinatura Recorrente

1. Acesse a página de faturas do cartão de crédito
2. Clique em "Nova Transação"
3. Preencha os campos:
   - **Valor Total**: Digite `R$ 49,90` (a máscara será aplicada automaticamente)
   - Marque a opção **"Assinatura Recorrente"**
   - **Dia da Cobrança**: Escolha um dia (ex: dia 15)
   - **Categoria**: Selecione "Lazer"
   - **Estabelecimento**: Digite "Netflix"
   - **Descrição**: Digite "Netflix Premium"
   - **Data**: Selecione a data de hoje
4. Clique em "Criar Transação"

### 2. Verificar a Transação Criada

A transação deve aparecer na lista com:

- Flag `is_recurring: true`
- Data ajustada para o dia escolhido

## Testando o Cron Job

### Método 1: Chamada Manual (Recomendado para Testes)

```bash
# Usando curl
curl -H "Authorization: Bearer test-secret-123" http://localhost:3000/api/cron/process-recurring

# Ou usando fetch no browser console
fetch('/api/cron/process-recurring', {
  headers: {
    'Authorization': 'Bearer test-secret-123'
  }
}).then(r => r.json()).then(console.log)
```

### Método 2: Ajustar Data para Teste

Para testar rapidamente:

1. Crie uma assinatura com o dia de hoje
2. Aguarde até 00:00 UTC (21:00 BRT)
3. O cron job deve processar automaticamente

### Método 3: Teste Unitário

Crie um teste que simula o processamento:

```typescript
// test/recurring.test.ts
import { GET } from '@/app/api/cron/process-recurring/route';

describe('Recurring Subscriptions', () => {
  it('should process recurring transactions', async () => {
    const request = new Request('http://localhost:3000/api/cron/process-recurring', {
      headers: {
        Authorization: 'Bearer test-secret-123',
      },
    });

    const response = await GET(request);
    const data = await response.json();

    expect(data.success).toBe(true);
    expect(data.data.processed_count).toBeGreaterThanOrEqual(0);
  });
});
```

## Cenários de Teste

### Cenário 1: Assinatura Netflix (Dia 15)

**Setup:**

- Valor: R$ 49,90
- Dia: 15
- Data de criação: 29/10/2025

**Resultado Esperado:**

- Primeira transação: 15/11/2025
- Próxima transação: 15/12/2025 (criada automaticamente no dia 15/12)

### Cenário 2: Múltiplas Assinaturas no Mesmo Dia

**Setup:**

- Netflix: R$ 49,90 - Dia 15
- Spotify: R$ 21,90 - Dia 15
- Amazon Prime: R$ 14,90 - Dia 15

**Resultado Esperado:**

- Todas as 3 transações são criadas no dia 15 de cada mês

### Cenário 3: Assinatura com Dia Já Passado

**Setup:**

- Data de criação: 29/10/2025
- Dia escolhido: 10
- Valor: R$ 99,90

**Resultado Esperado:**

- Primeira transação: 10/11/2025 (próximo mês)

### Cenário 4: Cancelamento de Assinatura

**Setup:**

1. Criar assinatura Netflix
2. Deletar a transação original

**Resultado Esperado:**

- Nenhuma nova transação é criada nos meses seguintes

## Verificando Logs

### No Vercel

1. Acesse o Vercel Dashboard
2. Vá em "Deployments"
3. Clique em "Functions"
4. Procure por `/api/cron/process-recurring`
5. Veja os logs de execução

### Localmente

Os logs aparecem no console do servidor Next.js:

```bash
npm run dev
# Logs aparecerão aqui quando o cron rodar
```

## Troubleshooting

### Problema: Transação não foi criada automaticamente

**Verificar:**

1. O cron job está rodando? (Vercel Cron ou local)
2. O dia atual corresponde ao `recurring_day`?
3. Já existe uma transação para este mês?
4. A transação original tem `is_recurring: true`?

**Solução:**

```bash
# Verificar transações recorrentes no banco
# Buscar por is_recurring: true
```

### Problema: Duplicatas sendo criadas

**Causa:** O sistema de prevenção de duplicatas não está funcionando

**Verificar:**

- Os campos `user_id`, `credit_card_id`, `category`, `merchant`, `amount` estão corretos?
- A data está dentro do mês atual?

### Problema: Máscara de valor não funciona

**Verificar:**

1. O campo está usando `type="text"` (não `type="number"`)
2. A função `formatCurrency` está sendo chamada no `onChange`

**Teste:**

```javascript
// No console do browser
formatCurrency('123456'); // Deve retornar "R$ 1.234,56"
```

## Checklist de Testes

- [ ] Criar assinatura com máscara de valor funcionando
- [ ] Criar assinatura com dia futuro no mês atual
- [ ] Criar assinatura com dia já passado no mês atual
- [ ] Processar cron job manualmente
- [ ] Verificar que não há duplicatas
- [ ] Cancelar assinatura (deletar transação)
- [ ] Alterar valor da assinatura
- [ ] Alterar dia de cobrança
- [ ] Criar múltiplas assinaturas no mesmo dia
- [ ] Verificar logs do cron job

## Próximos Passos

Após testar localmente:

1. Deploy no Vercel
2. Configurar `CRON_SECRET` nas variáveis de ambiente do Vercel
3. Verificar que o cron job está agendado corretamente
4. Monitorar os logs de execução
5. Criar assinaturas reais e aguardar o processamento automático

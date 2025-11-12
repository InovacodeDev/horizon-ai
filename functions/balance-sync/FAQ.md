# Balance Sync - Perguntas Frequentes (FAQ)

Respostas para as perguntas mais comuns sobre a função Balance Sync.

## 📋 Geral

### O que é a função Balance Sync?

É uma função serverless do Appwrite que mantém o saldo das contas sempre atualizado baseado nas transações. Ela executa automaticamente quando transações são criadas/editadas/removidas e também diariamente às 20:00 para processar transações futuras.

### Por que preciso dessa função?

Sem ela, você precisaria atualizar manualmente o saldo das contas toda vez que uma transação for modificada. A função automatiza esse processo, garantindo que os saldos estejam sempre corretos.

### Quanto custa?

A função usa os recursos gratuitos do Appwrite Cloud:

- **Execuções**: 750.000/mês grátis
- **Bandwidth**: 2GB/mês grátis
- **Build Time**: Ilimitado

Para a maioria dos casos, você ficará dentro do plano gratuito.

## 🚀 Deploy

### Como faço o deploy?

Siga o [QUICKSTART.md](./QUICKSTART.md) para um guia rápido de 5 minutos, ou [DEPLOYMENT.md](./DEPLOYMENT.md) para instruções detalhadas.

### Preciso instalar algo no meu servidor?

Não! A função roda nos servidores do Appwrite. Você só precisa fazer upload do código.

### Posso usar Appwrite self-hosted?

Sim! A função funciona tanto no Appwrite Cloud quanto em instâncias self-hosted. Basta ajustar o `APPWRITE_ENDPOINT` nas variáveis de ambiente.

### Como atualizo a função?

1. Modifique o código
2. Execute `./deploy.sh`
3. Faça upload do novo `balance-sync.tar.gz` no Console
4. Aguarde o build completar

## ⚙️ Configuração

### Quais variáveis de ambiente preciso?

```
APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
APPWRITE_DATABASE_ID=seu-database-id
APPWRITE_API_KEY=sua-api-key
```

### Como obtenho a API Key?

1. Appwrite Console > Settings > API Keys
2. Create API Key
3. Nome: `Balance Sync Function`
4. Scopes: `databases.read`, `databases.write`
5. Copie a chave gerada

### Posso mudar o horário da execução diária?

Sim! Edite o schedule na configuração da função. Por exemplo:

- `0 8 * * *` - 08:00
- `0 12 * * *` - 12:00
- `0 0 * * *` - 00:00 (meia-noite)

Use [crontab.guru](https://crontab.guru/) para gerar expressões cron.

### Posso desabilitar a execução diária?

Sim! Remova o schedule nas configurações da função. A sincronização em tempo real continuará funcionando.

## 🔧 Funcionamento

### Como a função sabe quando executar?

Ela é acionada por:

1. **Eventos**: Quando transações são criadas/editadas/removidas
2. **Schedule**: Diariamente às 20:00
3. **Manual**: Quando você executa manualmente

### O que acontece quando uma transação é criada?

1. Evento dispara a função
2. Função busca todas as transações da conta
3. Recalcula o saldo do zero
4. Atualiza o campo `balance` da conta

### Por que recalcular do zero em vez de incrementar?

Para garantir consistência. Se apenas incrementássemos, erros poderiam se acumular. Recalculando do zero, sempre temos o valor correto.

### Transações futuras afetam o saldo?

Não! Transações com data futura são ignoradas até chegarem na data. Elas são processadas pela execução diária às 20:00.

### E transações de cartão de crédito?

São ignoradas pela função. Transações de cartão são gerenciadas separadamente através das faturas.

### Como funciona a execução diária?

1. Às 20:00, a função executa
2. Busca todas as contas do sistema
3. Para cada usuário, verifica transações futuras que chegaram na data
4. Atualiza os saldos das contas afetadas

## 🐛 Problemas

### A função não está executando

**Verifique**:

1. Triggers configurados corretamente
2. Variáveis de ambiente corretas
3. API Key válida e com permissões
4. Status da função: `Ready`

**Teste**:

- Execute manualmente com `{"userId": "seu-user-id"}`
- Verifique logs na aba `Executions`

### O saldo está incorreto

**Causas comuns**:

1. Transações futuras sendo contabilizadas
2. Transações de cartão sendo contabilizadas
3. Erro na lógica de cálculo

**Solução**:

```typescript
// Recalcular do zero
await reprocessAllBalancesAction();
```

### A função está demorando muito

**Causas**:

1. Muitas transações (> 1000)
2. Timeout muito baixo
3. Problemas de rede

**Soluções**:

1. Aumentar timeout (máximo: 900s)
2. Otimizar queries
3. Usar paginação adequada

### Erro: "Insufficient permissions"

**Causa**: API Key sem permissões corretas

**Solução**:

1. Criar nova API Key
2. Adicionar scopes: `databases.read`, `databases.write`
3. Atualizar variável `APPWRITE_API_KEY`

### Build falhou

**Causas**:

1. Erro no `package.json`
2. Dependências indisponíveis
3. Erro de sintaxe no código

**Solução**:

```bash
cd functions/balance-sync
npm install
npm run build
```

Se funcionar localmente, o problema está no Appwrite. Verifique logs de build.

## 📊 Performance

### Quantas transações a função suporta?

Testado com até 10.000 transações por conta. Para volumes maiores, considere otimizações.

### Qual o tempo de execução típico?

- **Eventos**: 1-5s (1-100 transações)
- **Schedule**: 30s-5min (dependendo do número de usuários)
- **Manual**: 5-30s (dependendo do usuário)

### A função pode causar timeout?

Sim, se houver muitas transações. O timeout padrão é 15s, máximo 900s. Configure adequadamente.

### Como otimizar a performance?

1. Use paginação adequada (500 itens por vez)
2. Aumente timeout se necessário
3. Monitore tempo de execução
4. Otimize queries

## 💰 Custos

### Quanto vou gastar?

Para a maioria dos casos, **zero**! O plano gratuito do Appwrite Cloud inclui:

- 750.000 execuções/mês
- 2GB bandwidth/mês

### Exemplo de uso:

**Cenário**: 100 usuários, 10 transações/dia cada

- **Eventos**: 100 usuários × 10 transações × 30 dias = 30.000 execuções/mês
- **Schedule**: 1 execução/dia × 30 dias = 30 execuções/mês
- **Total**: ~30.000 execuções/mês (4% do limite gratuito)

### Quando preciso pagar?

Apenas se ultrapassar os limites do plano gratuito. Para volumes maiores, consulte os [planos do Appwrite](https://appwrite.io/pricing).

## 🔒 Segurança

### A API Key é segura?

Sim, desde que:

1. Não seja exposta no código
2. Seja configurada como variável de ambiente
3. Tenha apenas as permissões necessárias

### Posso limitar as permissões?

Sim! A função precisa apenas de:

- `databases.read` - Para ler transações e contas
- `databases.write` - Para atualizar saldos

### Os dados são criptografados?

Sim! O Appwrite usa HTTPS para todas as comunicações e criptografa dados em repouso.

### Quem pode executar a função?

Apenas:

1. Eventos de database (automático)
2. Schedule (automático)
3. Usuários com API Key válida (manual)

## 🔄 Integração

### Como usar no código Next.js?

```typescript
// Server Action
import { processDueTransactionsAction } from '@/actions/transaction.actions';

const result = await processDueTransactionsAction();
console.log(`Processed ${result.processed} accounts`);
```

### Posso chamar a função via API?

Sim! Use a API do Appwrite:

```bash
curl -X POST \
  https://cloud.appwrite.io/v1/functions/balance-sync/executions \
  -H "X-Appwrite-Project: seu-project-id" \
  -H "X-Appwrite-Key: sua-api-key" \
  -H "Content-Type: application/json" \
  -d '{"userId": "seu-user-id"}'
```

### Posso usar em outros projetos?

Sim! A função é independente e pode ser reutilizada em qualquer projeto Appwrite.

### Como integrar com webhooks?

Configure webhooks no Appwrite para receber notificações quando a função executar.

## 📈 Monitoramento

### Como vejo os logs?

Appwrite Console > Functions > Balance Sync > Executions

Clique em uma execução para ver logs detalhados.

### Quais métricas devo monitorar?

1. **Taxa de Sucesso**: Deve estar > 95%
2. **Tempo de Execução**: Deve ser consistente
3. **Frequência**: Deve corresponder aos eventos
4. **Erros**: Devem ser raros

### Como configuro alertas?

Use ferramentas de monitoramento externas ou configure webhooks para receber notificações de erros.

### Posso exportar métricas?

Sim! Use a API do Appwrite para buscar execuções e exportar dados.

## 🔮 Futuro

### Posso adicionar mais funcionalidades?

Sim! Modifique o código em `src/main.ts` e faça um novo deploy.

### Posso criar outras funções?

Sim! Siga a estrutura da pasta `functions/` e crie novas funções conforme necessário.

### Há planos para novas features?

Possíveis melhorias futuras:

1. Retry automático em caso de falha
2. Métricas exportadas
3. Notificações de erro
4. Processamento em lote otimizado

### Como contribuo?

1. Fork o repositório
2. Crie uma branch com sua feature
3. Faça commit das mudanças
4. Abra um Pull Request

## 📚 Recursos

### Onde encontro mais informações?

- [README.md](./README.md) - Documentação completa
- [DEPLOYMENT.md](./DEPLOYMENT.md) - Guia de deploy
- [QUICKSTART.md](./QUICKSTART.md) - Guia rápido
- [EXAMPLES.md](./EXAMPLES.md) - Exemplos práticos
- [CHECKLIST.md](./CHECKLIST.md) - Checklist de deploy

### Documentação Oficial

- [Appwrite Functions](https://appwrite.io/docs/products/functions)
- [Appwrite Functions Quick Start](https://appwrite.io/docs/products/functions/quick-start)
- [Appwrite Functions Runtimes](https://appwrite.io/docs/products/functions/runtimes)

### Suporte

- [Appwrite Discord](https://appwrite.io/discord)
- [Appwrite GitHub](https://github.com/appwrite/appwrite)
- [Appwrite Documentation](https://appwrite.io/docs)

## ❓ Ainda tem dúvidas?

Se sua pergunta não foi respondida aqui:

1. Consulte a [documentação completa](./README.md)
2. Verifique os [exemplos práticos](./EXAMPLES.md)
3. Abra uma issue no GitHub
4. Entre em contato com a equipe

---

**Última atualização**: Janeiro 2024

**Versão**: 1.0.0

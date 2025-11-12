# Balance Sync - Checklist de Deploy

Use este checklist para garantir que a função foi configurada corretamente.

## ✅ Pré-Deploy

### Código

- [ ] Código compilado sem erros: `npm run build`
- [ ] Dependências instaladas: `npm install`
- [ ] Arquivo tar.gz criado: `./deploy.sh`
- [ ] Tamanho do arquivo < 100MB

### Appwrite

- [ ] Conta Appwrite criada
- [ ] Projeto criado
- [ ] Database criado
- [ ] Collection `transactions` existe
- [ ] Collection `accounts` existe

### API Key

- [ ] API Key criada
- [ ] Scope `databases.read` habilitado
- [ ] Scope `databases.write` habilitado
- [ ] API Key copiada e salva

## ✅ Deploy

### Criar Função

- [ ] Função criada no Console
- [ ] Nome: `Balance Sync`
- [ ] Runtime: `Node.js 20.x`
- [ ] Entrypoint: `src/main.ts`
- [ ] Build Commands: `npm install && npm run build`

### Variáveis de Ambiente

- [ ] `APPWRITE_ENDPOINT` configurado
- [ ] `APPWRITE_DATABASE_ID` configurado
- [ ] `APPWRITE_API_KEY` configurado
- [ ] Valores corretos (sem espaços ou caracteres extras)

### Triggers - Eventos

- [ ] Evento `create` configurado
- [ ] Evento `update` configurado
- [ ] Evento `delete` configurado
- [ ] Pattern correto: `databases.*.collections.transactions.documents.*.*`

### Triggers - Schedule

- [ ] Schedule configurado
- [ ] Cron: `0 20 * * *`
- [ ] Timezone correto (ex: `America/Sao_Paulo`)
- [ ] Schedule habilitado

### Upload

- [ ] Arquivo `balance-sync.tar.gz` enviado
- [ ] Build iniciado
- [ ] Build completado com sucesso
- [ ] Status: `Ready`

## ✅ Pós-Deploy

### Teste Manual

- [ ] Execução manual testada
- [ ] Payload correto: `{"userId": "..."}`
- [ ] Execução completou com sucesso
- [ ] Logs sem erros
- [ ] Resultado esperado retornado

### Teste de Evento

- [ ] Transação criada no banco
- [ ] Função executou automaticamente
- [ ] Execução apareceu na aba `Executions`
- [ ] Logs mostram processamento correto
- [ ] Saldo da conta foi atualizado

### Teste de Schedule

- [ ] Aguardou execução às 20:00 OU
- [ ] Forçou execução manual do schedule
- [ ] Função executou
- [ ] Logs mostram processamento de múltiplos usuários
- [ ] Transações futuras foram processadas

### Verificação de Dados

- [ ] Saldo das contas está correto
- [ ] Transações futuras não afetam saldo atual
- [ ] Transações de cartão são ignoradas
- [ ] Campo `synced_transaction_ids` está atualizado

## ✅ Monitoramento

### Logs

- [ ] Logs acessíveis no Console
- [ ] Logs mostram informações úteis
- [ ] Sem erros críticos
- [ ] Tempo de execução aceitável

### Métricas

- [ ] Taxa de sucesso > 95%
- [ ] Tempo de execução:
  - [ ] Eventos: < 5s
  - [ ] Schedule: < 5min
- [ ] Sem timeouts frequentes

### Alertas

- [ ] Alertas configurados (opcional)
- [ ] Email/notificação para erros
- [ ] Monitoramento de taxa de sucesso

## ✅ Documentação

- [ ] README.md lido
- [ ] DEPLOYMENT.md consultado
- [ ] QUICKSTART.md seguido
- [ ] EXAMPLES.md revisado
- [ ] Equipe informada sobre deploy

## ✅ Segurança

- [ ] API Key não exposta no código
- [ ] Variáveis de ambiente seguras
- [ ] Permissões mínimas necessárias
- [ ] Logs não expõem dados sensíveis

## ✅ Backup

- [ ] Código versionado no Git
- [ ] Arquivo tar.gz salvo
- [ ] Configurações documentadas
- [ ] Deployment anterior mantido (rollback)

## 🚨 Problemas Comuns

### Build Falhou

**Sintomas**:

- Status: `Failed`
- Erro no log de build

**Verificar**:

- [ ] `package.json` correto
- [ ] Dependências disponíveis
- [ ] Build local funciona
- [ ] Comandos de build corretos

**Solução**:

```bash
cd functions/balance-sync
npm install
npm run build
```

### Função Não Executa

**Sintomas**:

- Nenhuma execução na aba `Executions`
- Transações criadas mas saldo não muda

**Verificar**:

- [ ] Triggers configurados
- [ ] Collection name correto
- [ ] Variáveis de ambiente corretas
- [ ] API Key válida

**Solução**:

1. Revisar configuração de triggers
2. Testar execução manual
3. Verificar logs de erro

### Erro de Permissão

**Sintomas**:

- Erro: `Insufficient permissions`
- Status: `Failed`

**Verificar**:

- [ ] API Key tem scopes corretos
- [ ] API Key não expirou
- [ ] Database ID correto

**Solução**:

1. Criar nova API Key
2. Adicionar scopes: `databases.read`, `databases.write`
3. Atualizar variável de ambiente

### Timeout

**Sintomas**:

- Erro: `Function execution timeout`
- Execução demora muito

**Verificar**:

- [ ] Número de transações
- [ ] Timeout configurado (padrão: 15s)
- [ ] Performance do código

**Solução**:

1. Aumentar timeout (máximo: 900s)
2. Otimizar queries
3. Usar paginação

### Saldo Incorreto

**Sintomas**:

- Saldo não bate com transações
- Valores estranhos

**Verificar**:

- [ ] Transações futuras
- [ ] Transações de cartão
- [ ] Lógica de cálculo

**Solução**:

```typescript
// Recalcular do zero
await reprocessAllBalancesAction();
```

## 📊 Métricas de Sucesso

### Imediato (Primeiras 24h)

- [ ] Taxa de sucesso > 90%
- [ ] Tempo de execução < 10s
- [ ] Sem erros críticos
- [ ] Saldos corretos

### Curto Prazo (Primeira Semana)

- [ ] Taxa de sucesso > 95%
- [ ] Tempo de execução estável
- [ ] Schedule executando diariamente
- [ ] Sem reclamações de usuários

### Longo Prazo (Primeiro Mês)

- [ ] Taxa de sucesso > 99%
- [ ] Performance otimizada
- [ ] Monitoramento estabelecido
- [ ] Documentação atualizada

## 🎯 Próximos Passos

Após deploy bem-sucedido:

1. **Monitorar** por 24-48h
2. **Documentar** problemas encontrados
3. **Otimizar** se necessário
4. **Comunicar** equipe sobre status
5. **Planejar** próximas funções

## 📞 Suporte

Se encontrar problemas:

1. **Consultar documentação**:
   - [README.md](./README.md)
   - [DEPLOYMENT.md](./DEPLOYMENT.md)
   - [EXAMPLES.md](./EXAMPLES.md)

2. **Verificar logs**:
   - Appwrite Console > Functions > Balance Sync > Executions

3. **Testar localmente**:

   ```bash
   cd functions/balance-sync
   npm install
   npm run build
   ```

4. **Buscar ajuda**:
   - Documentação Appwrite
   - GitHub Issues
   - Equipe de desenvolvimento

## ✨ Conclusão

Se todos os itens estão marcados, a função está pronta para produção! 🎉

**Lembre-se**:

- Monitore regularmente
- Mantenha documentação atualizada
- Faça backups antes de mudanças
- Teste sempre antes de deploy

---

**Data do Deploy**: ******\_\_\_******

**Responsável**: ******\_\_\_******

**Status**: [ ] Sucesso [ ] Pendente [ ] Falhou

**Observações**:

---

---

---

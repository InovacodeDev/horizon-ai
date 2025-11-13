# Changelog

Todas as mudanças notáveis neste projeto serão documentadas neste arquivo.

## [1.1.0] - 2025-11-13

### Adicionado

- **Reprocessamento Manual Completo**: Nova funcionalidade que permite reprocessar TODAS as transações de todas as contas do usuário
  - Adicione `"reprocessAll": true` no body da execução manual
  - Útil para corrigir inconsistências de saldo
  - Ideal para manutenção após migrações de dados
  - Documentação completa em [MANUAL_EXECUTION.md](./MANUAL_EXECUTION.md)

### Melhorado

- Documentação expandida com exemplos de uso via API, SDK e Console
- Logs mais detalhados para debug de reprocessamento
- Comentários no código explicando a nova funcionalidade

### Exemplo de Uso

```json
{
  "userId": "68fbd3a700145f22609d",
  "reprocessAll": true
}
```

## [1.0.0] - 2025-11-XX

### Inicial

- Sincronização automática de saldo via eventos de database
- Processamento diário de transações vencidas (schedule)
- Suporte para transações futuras
- Ignorar transações de cartão de crédito
- Execução manual básica

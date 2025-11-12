# Atualizações de Conta Conjunta e Balance Sync

## Resumo das Mudanças

Este documento descreve as atualizações realizadas no sistema de conta conjunta e sincronização de saldo.

## 1. Nova Página de Conta Conjunta

### Localização

- `app/(app)/settings/joint-account/page.tsx`

### Funcionalidades

#### Para Usuários Responsáveis (Owners)

- **Visualizar Membros**: Lista todos os membros que têm acesso aos seus dados
- **Convidar Membros**: Enviar convites por email para novos membros
- **Remover Membros**: Encerrar o compartilhamento com membros específicos
- **Informações do Membro**: Nome, email e data de início do compartilhamento

#### Para Usuários Membros

- **Visualizar Responsável**: Ver informações do usuário que compartilha os dados
- **Sair da Conta Conjunta**: Encerrar o acesso aos dados compartilhados

#### Para Usuários sem Relacionamento

- **Informações**: Explicação sobre como funciona a conta conjunta
- **Convidar**: Opção para começar a compartilhar dados

### Componentes Criados

#### InviteMemberModal

- `components/modals/InviteMemberModal.tsx`
- Modal para enviar convites por email
- Validação de email
- Feedback de erro e sucesso
- Informações sobre permissões de leitura

## 2. Integração com Configurações

### Localização

- `app/(app)/settings/page.tsx`

### Mudanças

- Adicionada nova aba "Conta Conjunta" no menu de configurações
- Link direto para a página de gerenciamento de conta conjunta
- Informações sobre como funciona o compartilhamento
- Benefícios e limitações do sistema

## 3. Remoção do Balance Sync Automático

### Motivação

O balance sync automático foi removido para:

- Reduzir carga no servidor
- Dar mais controle ao usuário sobre quando recalcular saldos
- Evitar recálculos desnecessários
- Melhorar performance geral do sistema

### Arquivos Modificados

#### `lib/services/auto-balance-sync.service.ts`

- Serviço marcado como **DEPRECATED**
- Todos os métodos agora são no-op (não fazem nada)
- Mantido para compatibilidade com código existente
- Logs informativos sobre a depreciação

#### `lib/services/init-services.ts`

- Removida inicialização do serviço de balance sync automático
- Comentários explicando a mudança
- Serviço não é mais iniciado na aplicação

#### `actions/balance-sync.actions.ts`

- Removida importação do `getAutoBalanceSyncService`
- Funções `forceGlobalSyncAction` e `getAutoSyncStatusAction` marcadas como deprecated
- Retornam mensagens informando que o sync é manual

### Funcionalidade Mantida

#### Balance Sync Manual

O reprocessamento de saldo continua funcionando através do botão "Reprocessar Saldo" em cada conta:

```typescript
// Função mantida e funcional
export async function reprocessAccountBalanceAction(accountId: string): Promise<BalanceSyncActionState>;
```

**Características:**

- Cooldown de 15 minutos por conta
- Recalcula saldo baseado em todas as transações e transferências
- Atualiza apenas a conta específica
- Feedback visual durante o processamento

## 4. Estrutura de Dados

### Tabelas Utilizadas

#### `sharing_relationships`

- `responsible_user_id`: Usuário que compartilha os dados (owner)
- `member_user_id`: Usuário que tem acesso aos dados (membro)
- `status`: 'active' | 'terminated'
- `started_at`: Data de início do compartilhamento
- `terminated_at`: Data de encerramento (opcional)
- `terminated_by`: Quem encerrou o relacionamento (opcional)

#### `sharing_invitations`

- `responsible_user_id`: Quem enviou o convite
- `invited_email`: Email do convidado
- `invited_user_id`: ID do usuário convidado (após aceitar)
- `token`: Token único para validação
- `status`: 'pending' | 'accepted' | 'rejected' | 'cancelled' | 'expired'
- `expires_at`: Data de expiração do convite

### APIs Existentes

#### Invitations

- `POST /api/family/invitations` - Criar convite
- `POST /api/family/invitations/accept` - Aceitar convite
- `POST /api/family/invitations/reject` - Rejeitar convite
- `POST /api/family/invitations/[id]/cancel` - Cancelar convite
- `POST /api/family/invitations/[id]/resend` - Reenviar convite
- `GET /api/family/invitations/validate` - Validar token de convite

#### Relationships

- `GET /api/family/relationships` - Obter relacionamento ativo
- `POST /api/family/relationships/[id]/terminate` - Encerrar relacionamento
- `GET /api/family/members` - Listar membros (para owners)

#### Shared Data

- `GET /api/sharing/context` - Contexto de dados compartilhados
- `GET /api/sharing/accounts` - Contas próprias + compartilhadas
- `GET /api/sharing/transactions` - Transações próprias + compartilhadas
- `GET /api/sharing/credit-cards` - Cartões próprios + compartilhados
- `GET /api/sharing/invoices` - Notas fiscais próprias + compartilhadas

## 5. Permissões e Segurança

### Regras de Acesso

#### Leitura (Read)

- Usuários podem ler seus próprios dados
- Usuários podem ler dados de usuários com quem têm relacionamento ativo
- Membros têm acesso de leitura aos dados do responsável
- Responsáveis têm acesso de leitura aos dados dos membros

#### Modificação (Update)

- Usuários podem modificar APENAS seus próprios dados
- Membros NÃO podem modificar dados compartilhados
- Responsáveis NÃO podem modificar dados dos membros

#### Exclusão (Delete)

- Usuários podem excluir APENAS seus próprios dados
- Membros NÃO podem excluir dados compartilhados
- Responsáveis NÃO podem excluir dados dos membros

### Implementação

- `lib/auth/sharing-permissions.ts` - Funções de verificação de permissões
- `canAccessResource()` - Verifica se pode ler
- `canModifyResource()` - Verifica se pode modificar
- `canDeleteResource()` - Verifica se pode excluir

## 6. UI/UX

### Indicadores Visuais

#### OwnershipBadge

- `components/ui/OwnershipBadge.tsx`
- Badge que indica se um item é próprio ou compartilhado
- Mostra o nome do dono quando é compartilhado
- Tamanhos: 'sm' | 'md' | 'lg'

#### Botões de Ação

- Botões de edição/exclusão desabilitados para dados compartilhados
- Mensagens informativas ao tentar modificar dados compartilhados
- Ícone de cadeado para indicar somente leitura

### Feedback ao Usuário

- Confirmações antes de remover membros
- Confirmações antes de sair da conta conjunta
- Alertas de sucesso/erro nas operações
- Loading states durante processamento

## 7. Fluxo de Uso

### Criar Conta Conjunta (Owner)

1. Acessar Configurações > Conta Conjunta
2. Clicar em "Convidar Membro"
3. Inserir email do membro
4. Enviar convite
5. Aguardar aceitação do convite

### Aceitar Convite (Member)

1. Receber email com link de convite
2. Clicar no link (redireciona para validação)
3. Fazer login ou criar conta
4. Aceitar o convite
5. Ter acesso aos dados compartilhados

### Remover Membro (Owner)

1. Acessar Configurações > Conta Conjunta
2. Localizar o membro na lista
3. Clicar em "Remover"
4. Confirmar ação
5. Membro perde acesso imediatamente

### Sair da Conta Conjunta (Member)

1. Acessar Configurações > Conta Conjunta
2. Clicar em "Sair da Conta Conjunta"
3. Confirmar ação
4. Perder acesso aos dados compartilhados

## 8. Reprocessamento de Saldo

### Como Usar

1. Acessar página de Contas
2. Expandir a conta desejada
3. Clicar no menu (três pontos)
4. Selecionar "Reprocessar Saldo"
5. Aguardar conclusão (indicador visual)

### Limitações

- Cooldown de 15 minutos por conta
- Apenas o dono da conta pode reprocessar
- Não disponível para contas compartilhadas (somente leitura)

### Quando Usar

- Após importar transações em lote
- Quando o saldo parecer incorreto
- Após corrigir transações antigas
- Após transferências entre contas

## 9. Próximos Passos

### Melhorias Futuras

- [ ] Notificações por email para convites
- [ ] Notificações quando membro é removido
- [ ] Histórico de compartilhamentos
- [ ] Permissões granulares (escolher o que compartilhar)
- [ ] Compartilhamento temporário (com data de expiração)
- [ ] Múltiplos membros simultâneos
- [ ] Logs de auditoria detalhados

### Considerações

- Sistema atual suporta apenas 1 membro ativo por vez (índice único)
- Para múltiplos membros, remover índice único `idx_member_user_status`
- Avaliar impacto de performance com muitos membros
- Considerar cache para dados compartilhados frequentemente acessados

## 10. Testes Recomendados

### Testes Funcionais

- [ ] Criar convite como owner
- [ ] Aceitar convite como member
- [ ] Rejeitar convite
- [ ] Cancelar convite
- [ ] Remover membro
- [ ] Sair da conta conjunta
- [ ] Visualizar dados compartilhados
- [ ] Tentar modificar dados compartilhados (deve falhar)
- [ ] Tentar excluir dados compartilhados (deve falhar)

### Testes de Permissão

- [ ] Verificar acesso de leitura para membros
- [ ] Verificar bloqueio de modificação para membros
- [ ] Verificar bloqueio de exclusão para membros
- [ ] Verificar que owner pode modificar seus dados
- [ ] Verificar que owner pode excluir seus dados

### Testes de Balance Sync

- [ ] Reprocessar saldo de conta própria
- [ ] Verificar cooldown de 15 minutos
- [ ] Tentar reprocessar conta compartilhada (deve falhar)
- [ ] Verificar cálculo correto após reprocessamento
- [ ] Verificar que sync automático não executa mais

## 11. Documentação Relacionada

- `docs/SHARING_SYSTEM.md` - Documentação completa do sistema de sharing
- `docs/AUTO_BALANCE_SYNC.md` - Documentação do balance sync (agora deprecated)
- `lib/types/sharing.types.ts` - Tipos TypeScript para sharing
- `lib/appwrite/schema.ts` - Schema das tabelas de sharing

## 12. Suporte

Para dúvidas ou problemas:

1. Verificar logs do servidor para erros
2. Verificar console do navegador para erros de frontend
3. Consultar documentação das APIs
4. Verificar permissões no Appwrite Console
5. Revisar índices das tabelas de sharing

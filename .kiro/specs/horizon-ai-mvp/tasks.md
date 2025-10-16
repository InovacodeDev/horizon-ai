# Implementation Plan

- [x] 1. Setup do projeto e configuração inicial
  - Criar projeto Next.js 15 com TypeScript, ESLint, Tailwind CSS e App Router
  - Instalar dependências principais (Drizzle ORM, autenticação, TanStack Query, Zustand)
  - Configurar Shadcn/UI com Design System (cores, tipografia, shape)
  - Configurar Drizzle ORM e criar arquivo drizzle.config.ts
  - Criar arquivo .env.example com variáveis necessárias
  - Adicionar scripts ao package.json (db:generate, db:push, db:studio, typecheck)
  - Configurar Husky e lint-staged para qualidade de código
  - _Requirements: 8.1, 8.2, 9.1, 9.2, 9.6_

- [ ] 2. Configurar infraestrutura e banco de dados
  - Provisionar banco PostgreSQL no Supabase
  - Configurar integração Vercel + Supabase
  - Configurar variáveis de ambiente na Vercel
  - Criar pipeline de CI/CD no GitHub Actions (.github/workflows/validate.yml)
  - _Requirements: 8.3, 8.4, 8.6_

- [ ] 3. Implementar schema do banco de dados
  - Criar arquivo src/lib/db/schema.ts com todas as tabelas (users, refreshTokens, connections, accounts, transactions)
  - Definir enums (userRole, accountType, transactionType, connectionStatus)
  - Adicionar indexes para performance (userId, transactionDate)
  - Executar pnpm db:push para sincronizar schema com banco
  - _Requirements: 1.2, 4.1, 5.6, 6.5_

- [ ] 4. Implementar sistema de autenticação
- [ ] 4.1 Criar utilitários de autenticação
  - Criar src/lib/auth/tokens.ts com funções generateAccessToken e generateRefreshToken
  - Criar src/lib/auth/password.ts com funções hashPassword e verifyPassword usando bcryptjs
  - Criar src/lib/auth/cookies.ts com funções para serializar cookies seguros
  - _Requirements: 1.2, 5.1_

- [ ] 4.2 Implementar endpoint de registro
  - Criar src/app/api/v1/auth/register/route.ts
  - Implementar validação com Zod (email, password min 8 chars, firstName)
  - Verificar email duplicado e retornar 409 se existir
  - Gerar hash da senha com bcrypt (salt round 12)
  - Inserir usuário no banco usando Drizzle ORM
  - Retornar 201 Created em sucesso
  - _Requirements: 1.1, 1.2, 1.3, 5.1_

- [ ] 4.3 Implementar endpoint de login
  - Criar src/app/api/v1/auth/login/route.ts
  - Implementar validação com Zod (email, password)
  - Buscar usuário por email e verificar senha com bcrypt.compare
  - Gerar Access Token (15 min) e Refresh Token (7 dias)
  - Armazenar hash do Refresh Token no banco
  - Enviar tokens como cookies httpOnly, secure, sameSite: 'strict'
  - Retornar 200 OK com dados públicos do usuário
  - _Requirements: 1.4, 1.5, 1.6, 5.4_

- [ ] 4.4 Implementar endpoint de refresh
  - Criar src/app/api/v1/auth/refresh/route.ts
  - Ler Refresh Token do cookie
  - Validar token e buscar no banco
  - Gerar novo par de Access/Refresh tokens
  - Atualizar hash no banco
  - Enviar novos tokens como cookies
  - _Requirements: 1.7, 1.8_

- [ ] 4.5 Implementar middleware de autenticação
  - Criar src/middleware.ts
  - Verificar Access Token em rotas protegidas
  - Se expirado, tentar refresh automático
  - Se refresh falhar, redirecionar para /login
  - Anexar userId ao cabeçalho da requisição
  - _Requirements: 1.7, 1.8, 5.5_

- [ ]\* 4.6 Escrever testes de autenticação
  - Testar registro com sucesso (201)
  - Testar registro com email duplicado (409)
  - Testar login com credenciais válidas (200)
  - Testar login com credenciais inválidas (401)
  - Testar refresh de token com sucesso
  - Testar refresh com token inválido
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6_

- [ ] 5. Implementar páginas de autenticação no frontend
- [ ] 5.1 Criar página de registro
  - Criar src/app/(auth)/register/page.tsx
  - Implementar formulário com react-hook-form e Zod
  - Usar componentes Shadcn/UI (Input, Button, Label)
  - Implementar useMutation do TanStack Query para chamar API
  - Gerenciar estados de loading e erro
  - Redirecionar para /login em sucesso
  - Garantir acessibilidade (labels, ordem de foco)
  - _Requirements: 1.1, 7.5, 7.3, 7.4_

- [ ] 5.2 Criar página de login
  - Criar src/app/(auth)/login/page.tsx
  - Implementar formulário com react-hook-form e Zod
  - Usar componentes Shadcn/UI
  - Implementar useMutation para chamar API de login
  - Gerenciar estados de loading e erro
  - Redirecionar para /onboarding/welcome em sucesso
  - _Requirements: 1.4, 7.5, 7.3, 7.4_

- [ ] 5.3 Configurar TanStack Query Provider
  - Criar src/lib/react-query/provider.tsx
  - Configurar QueryClient com retry logic para erros 401
  - Implementar handleAuthError para refresh automático
  - Adicionar ReactQueryDevtools
  - Envolver aplicação com Provider no layout
  - _Requirements: 1.7, 6.5_

- [ ]\* 5.4 Testar fluxo de autenticação no frontend
  - Testar registro de novo usuário
  - Testar login com credenciais válidas
  - Testar mensagens de erro apropriadas
  - Testar acessibilidade com leitor de tela
  - _Requirements: 7.3, 7.4, 7.5_

- [ ] 6. Implementar fluxo de onboarding
- [ ] 6.1 Criar tela de boas-vindas
  - Criar src/app/(onboarding)/welcome/page.tsx
  - Implementar layout conforme blueprint.md (Material Design 3)
  - Usar microcopy definida (onboarding.title, onboarding.body, onboarding.cta)
  - Implementar botão "Connect my first account" com cor primary (#0D47A1)
  - Garantir responsividade (mobile, tablet, desktop)
  - Implementar animações Shared Axis (300-400ms)
  - _Requirements: 2.1, 7.1, 7.6, 7.7, 7.8_

- [ ] 6.2 Criar tela de seleção de banco
  - Criar src/app/(onboarding)/select-bank/page.tsx
  - Implementar barra de busca no topo
  - Criar lista de bancos principais (Itaú, Bradesco, Santander, BB, Nubank, Inter)
  - Usar componente Bank List Item conforme blueprint.md
  - Implementar animação Fade Through para entrada de itens
  - Implementar busca/filtro de bancos
  - _Requirements: 2.2, 7.1, 7.6, 7.7_

- [ ] 6.3 Criar tela intersticial de segurança
  - Criar componente SecurityInterstitial
  - Exibir mensagem explicando redirecionamento seguro
  - Enfatizar que "Horizon AI nunca verá sua senha"
  - Implementar botão "Continue" para prosseguir
  - _Requirements: 2.3, 7.5_

- [ ] 6.4 Implementar estados de loading e erro
  - Criar componente LoadingState com progress indicator
  - Criar componente ErrorState com mensagem e ações de recuperação
  - Criar componente SuccessToast para confirmações
  - Implementar estados conforme Interface State Matrix do blueprint.md
  - _Requirements: 2.7, 2.8, 7.5_

- [ ]\* 6.5 Testar fluxo de onboarding
  - Testar navegação entre telas
  - Testar animações e transições
  - Testar responsividade em diferentes dispositivos
  - Testar acessibilidade (contraste, navegação por teclado)
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.8_

- [ ] 7. Implementar integração com Open Finance
- [ ] 7.1 Criar endpoint de inicialização de conexão
  - Criar src/app/api/v1/of/connect/route.ts
  - Implementar validação de institution com Zod
  - Iniciar fluxo OAuth com API do Open Finance
  - Retornar redirectUrl para o frontend
  - Implementar tratamento de erros
  - _Requirements: 2.4, 5.2_

- [ ] 7.2 Criar endpoint de troca de código
  - Criar src/app/api/v1/of/exchange/route.ts
  - Receber código de autorização do callback
  - Trocar código por access token na API do Open Finance
  - Criptografar token antes de armazenar
  - Salvar conexão no banco (tabela connections)
  - Iniciar sincronização inicial de dados
  - _Requirements: 2.5, 2.6, 5.2_

- [ ] 7.3 Implementar sincronização inicial de dados
  - Criar src/lib/of/sync.ts com função syncConnection
  - Buscar contas (accounts) da instituição
  - Buscar transações dos últimos 90 dias
  - Armazenar dados no banco com userId
  - Aplicar categorização básica automática
  - Atualizar lastSyncAt na conexão
  - _Requirements: 2.6, 4.1, 3.3_

- [ ] 7.4 Implementar callback handler
  - Criar src/app/of/callback/page.tsx
  - Capturar código de autorização da URL
  - Chamar endpoint /api/v1/of/exchange
  - Exibir LoadingState durante processamento
  - Redirecionar para dashboard em sucesso
  - Tratar erro de cancelamento pelo usuário
  - _Requirements: 2.5, 2.7, 2.8_

- [ ]\* 7.5 Testar integração com Open Finance
  - Testar fluxo completo de conexão
  - Testar tratamento de erro de API
  - Testar cancelamento pelo usuário
  - Testar criptografia de tokens
  - Testar sincronização de dados
  - _Requirements: 2.4, 2.5, 2.6, 2.7, 2.8, 5.2_

- [ ] 8. Implementar dashboard consolidado
- [ ] 8.1 Criar endpoint de dashboard
  - Criar src/app/api/v1/dashboard/route.ts
  - Buscar todas as contas do usuário com saldos
  - Calcular saldo consolidado total
  - Buscar transações recentes (últimos 30 dias)
  - Aplicar filtro obrigatório por userId
  - Implementar paginação para transações
  - Retornar dados estruturados
  - _Requirements: 3.1, 3.2, 5.6, 6.1_

- [ ] 8.2 Criar componente de saldo consolidado
  - Criar src/components/dashboard/ConsolidatedBalance.tsx
  - Exibir saldo total de todas as contas
  - Exibir breakdown por tipo de conta
  - Usar cores do Design System
  - Implementar loading state
  - _Requirements: 3.1, 7.1_

- [ ] 8.3 Criar componente de feed de transações
  - Criar src/components/dashboard/TransactionFeed.tsx
  - Exibir lista cronológica de transações
  - Implementar infinite scroll com paginação
  - Exibir categoria auto-atribuída
  - Implementar deduplicação de pagamentos de cartão
  - _Requirements: 3.2, 3.3, 3.4_

- [ ] 8.4 Criar componente de lista de contas
  - Criar src/components/dashboard/AccountList.tsx
  - Exibir todas as contas conectadas
  - Mostrar saldo individual e última sincronização
  - Implementar botão de sincronização manual
  - Implementar botão de desconexão
  - _Requirements: 3.7_

- [ ] 8.5 Criar página do dashboard
  - Criar src/app/(app)/dashboard/page.tsx
  - Usar useQuery do TanStack Query para buscar dados
  - Compor componentes (ConsolidatedBalance, TransactionFeed, AccountList)
  - Implementar estado vazio quando não há contas
  - Garantir carregamento em menos de 3 segundos
  - Implementar auto-refresh ao abrir app
  - _Requirements: 3.1, 3.5, 3.6, 6.1_

- [ ]\* 8.6 Testar dashboard
  - Testar exibição de saldo consolidado
  - Testar feed de transações com paginação
  - Testar deduplicação de transações
  - Testar estado vazio
  - Testar performance de carregamento
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6_

- [ ] 9. Implementar sistema de sincronização periódica
- [ ] 9.1 Criar endpoint de sincronização
  - Criar src/app/api/v1/of/sync/route.ts
  - Receber connectionId como parâmetro
  - Validar que conexão pertence ao usuário
  - Buscar novos dados desde lastSyncAt
  - Atualizar saldos e transações
  - Retornar número de itens sincronizados
  - _Requirements: 4.2, 4.3, 5.6_

- [ ] 9.2 Implementar job de sincronização periódica
  - Criar src/lib/jobs/sync-job.ts
  - Buscar todas as conexões ativas
  - Para cada conexão, executar sincronização
  - Implementar backoff exponencial em erros
  - Atualizar status da conexão (ACTIVE, ERROR, EXPIRED)
  - Registrar logs de sincronização
  - _Requirements: 4.2, 4.6_

- [ ] 9.3 Configurar cron job ou webhook
  - Configurar Vercel Cron Job para executar a cada 6 horas
  - Ou implementar endpoint /api/cron/sync para ser chamado externamente
  - Implementar autenticação do cron (secret token)
  - _Requirements: 4.2_

- [ ] 9.4 Implementar renovação automática de tokens
  - Criar função renewOpenFinanceToken em src/lib/of/tokens.ts
  - Detectar tokens expirados durante sincronização
  - Tentar renovar usando refresh token do Open Finance
  - Atualizar tokens criptografados no banco
  - Se falhar, marcar conexão como EXPIRED e notificar usuário
  - _Requirements: 4.4, 4.5_

- [ ] 9.5 Implementar sincronização on-demand
  - Adicionar botão "Sync Now" no dashboard
  - Implementar rate limiting (1 sync por minuto por conexão)
  - Disparar sincronização ao abrir app se > 1 hora desde última
  - Exibir feedback visual durante sincronização
  - _Requirements: 4.7_

- [ ]\* 9.6 Testar sistema de sincronização
  - Testar sincronização periódica
  - Testar renovação de tokens
  - Testar tratamento de erros
  - Testar rate limiting
  - Testar sincronização on-demand
  - _Requirements: 4.2, 4.3, 4.4, 4.5, 4.6, 4.7_

- [ ] 10. Implementar categorização automática de transações
  - Criar src/lib/categorization/auto-categorize.ts
  - Implementar regras baseadas em descrição (ex: "UBER" → "Transporte")
  - Criar mapeamento de palavras-chave para categorias
  - Aplicar categorização durante sincronização
  - Permitir que usuário corrija categorias (futuro)
  - _Requirements: 3.3_

- [ ] 11. Implementar otimizações de performance
- [ ] 11.1 Configurar Redis cache
  - Configurar conexão com Upstash Redis
  - Criar src/lib/cache/redis.ts com funções get/set
  - Implementar cache de dashboard (5 min TTL)
  - Implementar cache de lista de bancos
  - Implementar invalidação de cache após sincronização
  - _Requirements: 6.5_

- [ ] 11.2 Adicionar indexes ao banco de dados
  - Criar migration com indexes em transactions(user_id, transaction_date DESC)
  - Criar index em accounts(user_id)
  - Criar index em connections(user_id, status)
  - Executar migration no banco
  - _Requirements: 6.5_

- [ ] 11.3 Otimizar queries do dashboard
  - Implementar paginação eficiente com cursor
  - Usar select específico em vez de select \*
  - Implementar eager loading de relacionamentos
  - Adicionar EXPLAIN ANALYZE para queries lentas
  - _Requirements: 6.1, 6.5_

- [ ]\* 11.4 Testar performance
  - Medir tempo de resposta das APIs (<200ms)
  - Medir tempo de carregamento do dashboard (<3s)
  - Testar com volume realista de dados (1000+ transações)
  - Identificar e otimizar gargalos
  - _Requirements: 6.1, 6.2_

- [ ] 12. Implementar segurança adicional
- [ ] 12.1 Implementar rate limiting
  - Adicionar rate limiting em endpoints de autenticação
  - Usar Vercel Edge Config ou Upstash Rate Limit
  - Limitar tentativas de login (5 por minuto por IP)
  - Limitar requisições de API (100 por minuto por usuário)
  - _Requirements: 5.8_

- [ ] 12.2 Implementar auditoria de segurança
  - Criar tabela audit_logs para eventos importantes
  - Registrar tentativas de login (sucesso e falha)
  - Registrar acessos não autorizados
  - Registrar mudanças em dados sensíveis
  - _Requirements: 5.8_

- [ ] 12.3 Configurar CORS e headers de segurança
  - Configurar CORS para origens específicas
  - Adicionar headers de segurança (CSP, X-Frame-Options, etc.)
  - Configurar no next.config.js
  - _Requirements: 5.7_

- [ ]\* 12.4 Realizar testes de segurança
  - Testar prevenção de SQL injection
  - Testar prevenção de XSS
  - Testar proteção CSRF via sameSite cookies
  - Testar tentativas de bypass de autorização
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 5.8_

- [ ] 13. Implementar componentes de UI do Design System
- [ ] 13.1 Instalar e configurar componentes Shadcn/UI
  - Instalar componentes necessários: Button, Input, Label, Card, Dialog, Toast
  - Configurar tema com cores do Design System (Primary: #0D47A1, Secondary: #4CAF50)
  - Configurar tipografia (Figtree)
  - Configurar shape tokens (corner radius)
  - _Requirements: 7.1, 9.2_

- [ ] 13.2 Criar componentes customizados
  - Criar BankListItem conforme blueprint.md
  - Criar LoadingSpinner com animação
  - Criar ErrorMessage component
  - Criar SuccessToast component
  - Garantir acessibilidade em todos os componentes
  - _Requirements: 7.1, 7.3, 7.4_

- [ ] 13.3 Implementar animações e transições
  - Configurar motion tokens (duration, easing)
  - Implementar Shared Axis transition entre telas
  - Implementar Fade Through para listas
  - Implementar Ripple effect em botões
  - _Requirements: 7.6, 7.7_

- [ ]\* 13.4 Testar componentes de UI
  - Testar responsividade em mobile, tablet, desktop
  - Testar contraste de cores (WCAG 2.1 AA)
  - Testar navegação por teclado
  - Testar com leitor de tela
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.8_

- [ ] 14. Implementar tratamento de erros global
- [ ] 14.1 Criar error boundaries
  - Criar src/components/ErrorBoundary.tsx
  - Implementar fallback UI para erros não tratados
  - Registrar erros para debugging
  - Adicionar no layout principal
  - _Requirements: 7.5_

- [ ] 14.2 Criar páginas de erro customizadas
  - Criar src/app/error.tsx para erros gerais
  - Criar src/app/not-found.tsx para 404
  - Usar linguagem clara e empática
  - Fornecer ações de recuperação
  - _Requirements: 7.5_

- [ ] 14.3 Implementar logging estruturado
  - Criar src/lib/logger.ts
  - Implementar níveis de log (error, warn, info, debug)
  - Integrar com serviço de logging (Vercel Logs ou Sentry)
  - Adicionar contexto útil aos logs (userId, requestId)
  - _Requirements: 8.7_

- [ ] 15. Documentação e finalização
- [ ] 15.1 Criar documentação do projeto
  - Atualizar README.md com instruções de setup
  - Documentar estrutura de pastas
  - Documentar variáveis de ambiente necessárias
  - Criar guia de contribuição
  - _Requirements: 9.7_

- [ ] 15.2 Criar documentação da API
  - Documentar todos os endpoints com exemplos
  - Incluir schemas de request/response
  - Documentar códigos de erro
  - Gerar documentação OpenAPI/Swagger
  - _Requirements: 9.7_

- [ ] 15.3 Preparar para produção
  - Revisar todas as variáveis de ambiente
  - Configurar domínio customizado na Vercel
  - Configurar SSL/TLS
  - Realizar smoke tests em produção
  - _Requirements: 8.3, 8.4_

- [ ]\* 15.4 Realizar testes finais end-to-end
  - Testar fluxo completo: registro → login → onboarding → conexão → dashboard
  - Testar em diferentes navegadores
  - Testar em diferentes dispositivos
  - Validar métricas de performance
  - Validar conformidade com requisitos
  - _Requirements: 2.10, 3.5, 6.1, 6.2_

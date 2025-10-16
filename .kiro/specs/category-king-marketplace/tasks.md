# Implementation Plan

- [ ] 1. Setup da infraestrutura base do marketplace
  - Criar schema do banco de dados para parceiros, produtos e ofertas
  - Configurar enums necessários (partner_category, offer_status)
  - Criar migrations com Drizzle ORM
  - Adicionar indexes de performance
  - _Requirements: 3.1, 3.2, 3.3_

- [ ] 2. Implementar o Partner Service
  - [ ] 2.1 Criar interface e tipos do Partner Service em `src/lib/marketplace/partner-service.ts`
    - Definir tipos TypeScript para Partner, MarketplaceProduct
    - Implementar métodos registerPartner, addProduct, syncPartnerCatalog
    - Adicionar criptografia para API keys usando crypto nativo
    - _Requirements: 3.1, 3.2, 8.2_

  - [ ] 2.2 Criar API endpoints para gestão de parceiros
    - POST /api/admin/partners - registrar novo parceiro
    - POST /api/admin/partners/[id]/products - adicionar produto
    - GET /api/admin/partners - listar parceiros
    - Adicionar validação com Zod para todos os payloads
    - _Requirements: 3.1, 3.2_

- [ ] 3. Implementar o Recommendation Engine V1 (baseado em regras)
  - [ ] 3.1 Criar estrutura base do motor em `src/lib/marketplace/recommendation-engine.ts`
    - Definir interface RecommendationEngine
    - Implementar método evaluateUserEligibility
    - Implementar método evaluateProductEligibility
    - Criar função auxiliar para buscar perfil consolidado do usuário
    - _Requirements: 2.5, 2.6_

  - [ ] 3.2 Implementar regras de elegibilidade
    - Criar função para avaliar critérios numéricos (minNetWorth, minAge, maxAge)
    - Criar função para avaliar critérios booleanos (hasDependents)
    - Criar função para avaliar critérios de categoria (assetTypes)
    - Implementar lógica de matching entre critérios e perfil do usuário
    - _Requirements: 2.5, 2.6_

  - [ ] 3.3 Implementar sistema de eventos e triggers
    - Criar tipos para UserEvent (USER_SIGNUP, ASSET_CONNECTED, etc.)
    - Implementar processEvent que aciona avaliação de elegibilidade
    - Criar helper para detectar mudanças significativas de patrimônio (>20%)
    - Criar helper para inferir eventos de vida baseado em padrões de despesas
    - _Requirements: 2.1, 2.2, 2.3, 2.4_

- [ ] 4. Implementar o Offer Service
  - [ ] 4.1 Criar serviço de ofertas em `src/lib/marketplace/offer-service.ts`
    - Implementar createOffer com validações
    - Implementar getActiveOffers com filtros por status
    - Implementar getOfferDetails com joins de produto e parceiro
    - Implementar acceptOffer com atualização de status e timestamp
    - Implementar rejectOffer com atualização de status
    - _Requirements: 1.2, 1.5, 1.6_

  - [ ] 4.2 Criar API endpoints para ofertas do usuário
    - GET /api/v1/offers - listar ofertas ativas do usuário logado
    - GET /api/v1/offers/[id] - detalhes de uma oferta específica
    - POST /api/v1/offers/[id]/accept - aceitar oferta
    - POST /api/v1/offers/[id]/reject - rejeitar oferta
    - Adicionar middleware de autenticação em todos os endpoints
    - _Requirements: 1.3, 1.4, 1.5, 1.6_

  - [ ] 4.3 Implementar job de expiração automática de ofertas
    - Criar Vercel Cron Job em `src/app/api/cron/expire-offers/route.ts`
    - Implementar lógica para buscar ofertas expiradas (expiresAt < now)
    - Atualizar status para EXPIRED em batch
    - Adicionar logging de quantas ofertas foram expiradas
    - _Requirements: 1.7_

- [ ] 5. Implementar Partner API Gateway
  - [ ] 5.1 Criar sistema de autenticação OAuth 2.0
    - Implementar endpoint POST /api/partner/v1/auth/token
    - Validar client_id e client_secret contra tabela partners
    - Gerar JWT com expiração de 1 hora
    - Adicionar middleware para validar token em rotas protegidas
    - _Requirements: 4.1, 4.2_

  - [ ] 5.2 Criar endpoints da Partner API
    - POST /api/partner/v1/offers/create - notificar parceiro de oferta aceita
    - GET /api/partner/v1/products/catalog - sincronizar catálogo
    - Implementar validação de payloads com Zod
    - Adicionar rate limiting (100 req/min por parceiro)
    - _Requirements: 4.3, 4.4, 4.5_

  - [ ] 5.3 Implementar logging e monitoramento
    - Criar tabela partner_api_logs para audit trail
    - Registrar todas as chamadas (timestamp, partnerId, endpoint, status)
    - Implementar alertas para rate limit exceeded
    - Adicionar métricas para Vercel Analytics
    - _Requirements: 4.7_

- [ ] 6. Implementar integração com parceiro de seguros
  - [ ] 6.1 Criar Insurance Partner Client em `src/lib/partners/clients/insurance-client.ts`
    - Estender BasePartnerClient com lógica específica de seguros
    - Implementar método getQuote que chama API do parceiro
    - Implementar método finalizePolicy para formalização
    - Adicionar tratamento de erros específicos (timeout, API down)
    - _Requirements: 5.1, 5.2, 5.5_

  - [ ] 6.2 Criar Base Partner Client com circuit breaker
    - Implementar classe BasePartnerClient em `src/lib/partners/clients/base-client.ts`
    - Adicionar circuit breaker pattern (threshold: 5 falhas, reset: 60s)
    - Implementar retry logic com exponential backoff
    - Adicionar timeout de 10 segundos para todas as requests
    - _Requirements: 5.5, 9.4_

  - [ ] 6.3 Integrar Insurance Client com Offer Service
    - Modificar createOffer para chamar getQuote quando produto é de seguros
    - Preencher offerDetails com dados da cotação (coverage, premium)
    - Modificar acceptOffer para chamar finalizePolicy
    - Adicionar tratamento de erro quando API do parceiro falha
    - _Requirements: 5.3, 5.4_

- [ ] 7. Implementar UI do Marketplace
  - [ ] 7.1 Criar página do marketplace em `src/app/(app)/marketplace/page.tsx`
    - Criar layout da página com header "Oportunidades para Você"
    - Buscar ofertas ativas via GET /api/v1/offers
    - Renderizar lista de ofertas como cards
    - Adicionar estados de loading e empty state
    - _Requirements: 1.3_

  - [ ] 7.2 Criar componente OfferCard
    - Criar `src/components/marketplace/offer-card.tsx`
    - Exibir nome do produto, parceiro, detalhe principal
    - Exibir justificativa da recomendação
    - Adicionar badge com categoria (Seguro, Crédito, etc.)
    - Tornar card clicável para página de detalhes
    - _Requirements: 1.4_

  - [ ] 7.3 Criar página de detalhes da oferta
    - Criar `src/app/(app)/marketplace/offers/[id]/page.tsx`
    - Buscar detalhes completos via GET /api/v1/offers/[id]
    - Exibir todas as informações do produto e parceiro
    - Adicionar botões "Aceitar Oferta" e "Não Tenho Interesse"
    - Implementar confirmação antes de aceitar
    - _Requirements: 1.4, 1.5, 1.6_

  - [ ] 7.4 Implementar fluxo de aceitação de oferta
    - Criar modal de confirmação com resumo da oferta
    - Chamar POST /api/v1/offers/[id]/accept ao confirmar
    - Redirecionar para página de sucesso com próximos passos
    - Adicionar link para site do parceiro quando aplicável
    - _Requirements: 1.5_

- [ ] 8. Implementar sistema de processamento assíncrono de eventos
  - [ ] 8.1 Configurar Inngest para background jobs
    - Instalar e configurar Inngest SDK
    - Criar endpoint /api/inngest em `src/app/api/inngest/route.ts`
    - Configurar Inngest client com chaves de ambiente
    - _Requirements: 9.1, 9.2_

  - [ ] 8.2 Criar função Inngest para processar eventos de usuário
    - Criar `src/inngest/functions/process-user-event.ts`
    - Implementar steps: evaluate-eligibility, generate-offers, notify-user
    - Adicionar error handling e retry logic
    - Registrar métricas de processamento
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 9.1_

  - [ ] 8.3 Integrar eventos do sistema com Inngest
    - Emitir evento 'user/signup' após cadastro
    - Emitir evento 'user/asset-connected' após conexão de ativo
    - Emitir evento 'user/wealth-change' quando patrimônio muda >20%
    - Emitir evento 'user/life-event' quando detectado
    - _Requirements: 2.1, 2.2, 2.3, 2.4_

- [ ] 9. Implementar sistema de acesso delegado para contadores
  - [ ] 9.1 Criar Delegated Access Service em `src/lib/accountant/delegated-access-service.ts`
    - Implementar inviteAccountant que cria registro PENDING
    - Implementar acceptInvitation que ativa acesso
    - Implementar revokeAccess que desativa acesso
    - Implementar hasAccess para validação
    - Implementar getAccountantClients para listar clientes
    - _Requirements: 6.1, 6.2, 6.3, 6.5, 6.6_

  - [ ] 9.2 Criar API endpoints para acesso delegado
    - POST /api/v1/accountant/invite - enviar convite
    - POST /api/v1/accountant/invitations/[id]/accept - aceitar convite
    - DELETE /api/v1/accountant/access/[id] - revogar acesso
    - GET /api/v1/accountant/clients - listar clientes (para contadores)
    - _Requirements: 6.1, 6.3, 6.5_

  - [ ] 9.3 Implementar sistema de convites por email
    - Criar template de email de convite
    - Gerar token único para cada convite
    - Criar página de aceitação de convite em `/accountant/accept/[token]`
    - Implementar expiração de convites após 7 dias
    - _Requirements: 6.1, 6.2_

  - [ ] 9.4 Adicionar middleware de autorização para acesso delegado
    - Criar middleware em `src/middleware/delegated-access.ts`
    - Validar header X-On-Behalf-Of-User-ID
    - Verificar se existe acesso delegado ativo
    - Adicionar middleware em endpoints de leitura de dados
    - _Requirements: 6.4, 6.7, 6.8_

- [ ] 10. Implementar Portal do Contador
  - [ ] 10.1 Criar aplicação do contador em subdomínio
    - Configurar roteamento para `/accountant/*`
    - Criar layout específico para contadores
    - Implementar autenticação separada com role ACCOUNTANT
    - _Requirements: 7.5_

  - [ ] 10.2 Criar dashboard principal do contador
    - Criar `src/app/accountant/dashboard/page.tsx`
    - Buscar lista de clientes via GET /api/v1/accountant/clients
    - Exibir cards com informações básicas de cada cliente
    - Adicionar busca e filtros
    - _Requirements: 7.1_

  - [ ] 10.3 Criar visualização de dados do cliente
    - Criar `src/app/accountant/clients/[id]/page.tsx`
    - Reutilizar componentes do dashboard principal do usuário
    - Modificar chamadas de API para incluir X-On-Behalf-Of-User-ID
    - Adicionar indicador visual de "Visualizando como contador"
    - Desabilitar ações de escrita (apenas leitura)
    - _Requirements: 7.2, 7.3_

  - [ ] 10.4 Implementar exportação de relatórios IRPF
    - Criar endpoint POST /api/v1/accountant/reports/irpf
    - Gerar relatório consolidado em formato CSV/PDF
    - Permitir seleção de múltiplos clientes
    - Adicionar filtro por ano fiscal
    - _Requirements: 7.4_

- [ ] 11. Implementar sistema de métricas e monitoramento
  - [ ] 11.1 Criar serviço de métricas em `src/lib/metrics/marketplace-metrics.ts`
    - Implementar trackOfferGenerated
    - Implementar trackOfferPresented
    - Implementar trackOfferAccepted/Rejected
    - Implementar trackRevenueFromCommission
    - _Requirements: 10.1, 10.2, 10.3, 10.4_

  - [ ] 11.2 Integrar tracking em pontos-chave
    - Adicionar tracking ao criar oferta (OFFER_GENERATED)
    - Adicionar tracking ao usuário visualizar oferta (OFFER_PRESENTED)
    - Adicionar tracking ao aceitar/rejeitar (OFFER_ACCEPTED/REJECTED)
    - Adicionar tracking de receita quando parceiro confirma comissão
    - _Requirements: 10.1, 10.2, 10.3, 10.4_

  - [ ] 11.3 Criar dashboard de métricas para admin
    - Criar `src/app/admin/marketplace/metrics/page.tsx`
    - Exibir ARR atual e projeção
    - Exibir taxa de conversão por categoria de produto
    - Exibir número de parceiros ativos
    - Exibir LTV médio dos usuários do marketplace
    - _Requirements: 10.5, 10.6_

- [ ] 12. Implementar segurança e compliance
  - [ ] 12.1 Adicionar criptografia de dados sensíveis
    - Criar utility de criptografia em `src/lib/security/encryption.ts`
    - Implementar encryptApiKey e decryptApiKey usando AES-256
    - Aplicar criptografia ao salvar chaves de parceiros
    - _Requirements: 8.1, 8.2_

  - [ ] 12.2 Implementar audit logging
    - Criar tabela audit_logs no banco
    - Registrar todos os acessos a dados de usuários
    - Registrar compartilhamentos de dados com parceiros
    - Registrar concessões e revogações de acesso delegado
    - _Requirements: 8.4_

  - [ ] 12.3 Adicionar sistema de consentimento LGPD
    - Criar modal de consentimento ao aceitar primeira oferta
    - Armazenar consentimento explícito no banco
    - Permitir revogação de consentimento nas configurações
    - Implementar exclusão de dados ao revogar consentimento
    - _Requirements: 8.1, 8.5_

- [ ] 13. Implementar otimizações de performance
  - [ ] 13.1 Configurar Redis para caching
    - Configurar Upstash Redis
    - Criar utility de cache em `src/lib/cache/redis.ts`
    - Implementar get, set, invalidate com TTL configurável
    - _Requirements: 9.5_

  - [ ] 13.2 Implementar caching de perfil do usuário
    - Cachear perfil consolidado do usuário (TTL: 1 hora)
    - Invalidar cache ao conectar novo ativo
    - Invalidar cache ao detectar mudança de patrimônio
    - _Requirements: 9.5_

  - [ ] 13.3 Implementar caching de produtos ativos
    - Cachear lista de produtos ativos (TTL: 5 minutos)
    - Invalidar cache ao adicionar/atualizar produto
    - Usar cache no motor de recomendação
    - _Requirements: 9.5_

- [ ] 14. Testes e validação
  - [ ]\* 14.1 Escrever testes unitários para Recommendation Engine
    - Testar avaliação de elegibilidade com diferentes perfis
    - Testar geração de justificativas
    - Testar detecção de eventos de vida
    - _Requirements: 2.5, 2.6, 2.7_

  - [ ]\* 14.2 Escrever testes de integração para Partner API
    - Testar autenticação OAuth 2.0
    - Testar rate limiting
    - Testar validação de payloads
    - _Requirements: 4.1, 4.2, 4.5, 4.6_

  - [ ]\* 14.3 Escrever testes E2E para fluxo completo
    - Testar fluxo: cadastro → oferta gerada → aceitar oferta
    - Testar fluxo: convite contador → aceitar → visualizar dados
    - Testar fluxo: parceiro sincroniza catálogo → recebe notificação
    - _Requirements: 1.1-1.7, 6.1-6.8_

- [ ] 15. Documentação e deployment
  - [ ] 15.1 Criar documentação da Partner API
    - Documentar endpoints com exemplos de request/response
    - Documentar processo de autenticação
    - Documentar rate limits e error codes
    - Criar guia de integração para novos parceiros
    - _Requirements: 4.1-4.7_

  - [ ] 15.2 Configurar feature flags
    - Implementar sistema de feature flags
    - Criar flags: MARKETPLACE_ENABLED, INSURANCE_OFFERS, ACCOUNTANT_PORTAL
    - Adicionar UI de admin para gerenciar flags
    - _Requirements: Todos_

  - [ ] 15.3 Configurar monitoramento e alertas
    - Configurar Sentry para error tracking
    - Configurar alertas para métricas críticas (response time, error rate)
    - Configurar alertas para circuit breakers abertos
    - Configurar alertas para queda na taxa de conversão
    - _Requirements: 9.4, 10.1-10.6_

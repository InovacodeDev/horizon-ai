# Implementation Plan

- [ ] 1. Expandir schema do banco de dados para suportar notas fiscais, produtos e garantias
  - Adicionar tabelas `invoices`, `products` e `warranties` ao schema do Drizzle ORM
  - Criar enum `invoice_processing_status` com valores PENDING, PROCESSING, COMPLETED, FAILED
  - Configurar relacionamentos entre tabelas (foreign keys e cascade deletes)
  - Gerar e aplicar migração do banco de dados
  - _Requirements: 1.2, 1.3, 1.6, 2.1_

- [ ] 2. Implementar API endpoints para upload e processamento de notas fiscais
  - [ ] 2.1 Criar endpoint POST /api/v1/invoices/upload-url
    - Implementar validação de entrada com Zod (fileName, fileType)
    - Gerar URL pré-assinada para upload no S3/R2 com expiração de 15 minutos
    - Criar registro na tabela invoices com status PENDING
    - Validar autenticação e associar invoice ao userId
    - _Requirements: 1.1, 1.2, 4.2, 4.3_

  - [ ] 2.2 Criar endpoint POST /api/v1/invoices/start-processing
    - Validar que o usuário autenticado é proprietário da invoice
    - Disparar função de processamento assíncrono
    - Retornar resposta 202 Accepted imediatamente
    - _Requirements: 1.3, 4.3, 6.1_

  - [ ] 2.3 Criar endpoint GET /api/v1/invoices/:id/status
    - Validar propriedade do recurso
    - Retornar status atual e mensagem de erro se houver
    - _Requirements: 1.4, 6.3_

- [ ] 3. Implementar função serverless de processamento de IA
  - [ ] 3.1 Criar serviço de processamento de invoices
    - Implementar download de arquivo do storage usando storageUrl
    - Adicionar extração de texto para PDFs usando pdf-parse
    - Adicionar parsing direto para arquivos XML de NF-e
    - Atualizar status da invoice para PROCESSING no início
    - _Requirements: 1.3, 5.1, 5.2, 6.2_

  - [ ] 3.2 Integrar com serviço de LLM para extração de dados
    - Construir prompt otimizado para extração de produtos de notas fiscais brasileiras
    - Implementar chamada ao LLM (GPT-4 ou Claude) com timeout de 30s
    - Adicionar retry logic com exponential backoff (3 tentativas)
    - Validar resposta JSON do LLM com schema Zod
    - _Requirements: 5.3, 5.4, 5.5, 6.4_

  - [ ] 3.3 Persistir produtos e garantias extraídos
    - Criar registros na tabela products para cada item extraído
    - Calcular data de expiração de garantia (purchaseDate + 1 ano)
    - Criar registros na tabela warranties associados aos produtos
    - Usar transações do banco para garantir consistência
    - Atualizar status da invoice para COMPLETED ou FAILED
    - _Requirements: 1.5, 1.6, 5.6, 6.4_

  - [ ]\* 3.4 Escrever testes unitários para o processador
    - Testar extração de texto de PDFs e XMLs
    - Testar validação de resposta do LLM
    - Testar cálculo de data de expiração de garantia
    - Testar tratamento de erros e atualização de status
    - _Requirements: 5.7, 7.1_

- [ ] 4. Criar endpoints de API para produtos e garantias
  - [ ] 4.1 Criar endpoint GET /api/v1/products
    - Implementar paginação com limit e offset
    - Retornar produtos do usuário com warranties associadas
    - Ordenar por data de expiração de garantia (mais próximas primeiro)
    - _Requirements: 2.1, 2.2_

  - [ ] 4.2 Criar endpoint GET /api/v1/products/:id
    - Validar propriedade do produto
    - Retornar detalhes completos incluindo invoice original
    - _Requirements: 2.5_

- [ ] 5. Implementar integração com Stripe para monetização
  - [ ] 5.1 Criar endpoint POST /api/v1/billing/create-checkout-session
    - Instalar e configurar SDK do Stripe
    - Validar autenticação do usuário
    - Criar Stripe Checkout Session com priceId do plano
    - Incluir userId nos metadados da sessão
    - Configurar success_url e cancel_url
    - Retornar URL da sessão de checkout
    - _Requirements: 3.4, 3.6_

  - [ ] 5.2 Criar endpoint POST /api/v1/webhooks/stripe
    - Implementar verificação de assinatura do webhook
    - Processar evento checkout.session.completed
    - Extrair userId dos metadados e atualizar role para PREMIUM
    - Processar evento customer.subscription.deleted para downgrades
    - Processar evento invoice.payment_failed
    - Retornar 200 OK para confirmar recebimento
    - _Requirements: 3.5, 4.4, 7.3_

  - [ ]\* 5.3 Escrever testes de integração para fluxo de pagamento
    - Testar criação de checkout session
    - Testar processamento de webhook com credenciais de teste
    - Testar atualização de role do usuário
    - _Requirements: 7.2, 7.3_

- [ ] 6. Implementar feature gating e controle de acesso Premium
  - [ ] 6.1 Adicionar middleware de verificação de plano Premium
    - Criar função para extrair e validar role do JWT
    - Adicionar verificação nos endpoints de features Premium
    - Retornar 403 Forbidden para usuários gratuitos
    - _Requirements: 3.1, 3.7, 4.6_

  - [ ] 6.2 Atualizar endpoints de invoice para verificar plano Premium
    - Aplicar middleware de verificação nos endpoints de upload e processamento
    - _Requirements: 3.2, 3.7_

- [ ] 7. Criar página frontend "Meus Ativos"
  - [ ] 7.1 Implementar componente de upload de notas fiscais
    - Criar interface de upload com drag-and-drop
    - Implementar chamada ao endpoint de upload-url
    - Adicionar upload do arquivo para URL pré-assinada
    - Implementar chamada ao endpoint de start-processing
    - Mostrar indicador de progresso durante upload
    - _Requirements: 1.1, 1.2, 1.3_

  - [ ] 7.2 Implementar polling de status de processamento
    - Criar hook useInvoiceStatus com Tanstack Query
    - Configurar refetchInterval para polling automático
    - Exibir status em tempo real (Pendente, Processando, Concluído, Falhou)
    - Parar polling quando status for final (COMPLETED ou FAILED)
    - _Requirements: 1.4, 6.3_

  - [ ] 7.3 Implementar lista de produtos e garantias
    - Criar hook para buscar produtos com useQuery
    - Implementar layout de cards ou tabela responsivo
    - Exibir nome, preço, data de compra e data de expiração
    - Adicionar contagem regressiva para expiração de garantia
    - Destacar visualmente garantias próximas de expirar
    - Adicionar link para nota fiscal original
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

  - [ ] 7.4 Adicionar estado vazio quando não há produtos
    - Exibir mensagem incentivando primeiro upload
    - Incluir CTA para upload de nota fiscal
    - _Requirements: 2.6_

- [ ] 8. Criar página de preços e componentes de upgrade
  - [ ] 8.1 Implementar página de comparação de planos
    - Criar layout de comparação entre planos Free e Premium
    - Listar features de cada plano baseado no Business Plan
    - Adicionar botão de upgrade para plano Premium
    - _Requirements: 3.1, 3.3_

  - [ ] 8.2 Implementar fluxo de checkout
    - Criar mutation para chamar endpoint de create-checkout-session
    - Redirecionar usuário para URL do Stripe no sucesso
    - Adicionar tratamento de erros
    - _Requirements: 3.4_

  - [ ] 8.3 Criar componente UpgradePrompt reutilizável
    - Implementar componente para feature gating visual
    - Adicionar explicação do valor da feature Premium
    - Incluir link para página de preços
    - _Requirements: 3.2_

  - [ ] 8.4 Criar hook useCurrentUser
    - Extrair dados do usuário do JWT
    - Incluir flag isPremium baseado no role
    - Usar hook para feature gating nos componentes
    - _Requirements: 3.6_

  - [ ] 8.5 Aplicar feature gating no componente de upload
    - Verificar se usuário é Premium antes de mostrar upload
    - Exibir UpgradePrompt para usuários gratuitos
    - _Requirements: 3.2_

- [ ] 9. Configurar infraestrutura de storage e processamento
  - [ ] 9.1 Configurar bucket S3/R2 para armazenamento de invoices
    - Criar bucket com criptografia habilitada
    - Configurar políticas de acesso e CORS
    - Adicionar variáveis de ambiente para credenciais
    - _Requirements: 4.1, 4.2_

  - [ ] 9.2 Configurar função serverless para processamento
    - Criar função com timeout estendido (5 minutos)
    - Configurar variáveis de ambiente para LLM API
    - Implementar mecanismo de invocação (Vercel Cron ou QStash)
    - _Requirements: 6.2, 6.5_

- [ ] 10. Adicionar testes de integração ao pipeline CI/CD
  - [ ] 10.1 Atualizar workflow do GitHub Actions
    - Adicionar step para rodar testes de integração
    - Configurar variáveis de ambiente de teste
    - Provisionar banco de dados de teste
    - _Requirements: 7.1, 7.2_

  - [ ] 10.2 Criar script de testes de integração
    - Adicionar comando test:integration ao package.json
    - Configurar ambiente de teste isolado
    - _Requirements: 7.2, 7.4_

  - [ ]\* 10.3 Escrever testes de integração para fluxos críticos
    - Testar fluxo completo de upload e processamento de invoice
    - Testar fluxo de checkout e webhook do Stripe
    - Testar feature gating e controle de acesso
    - _Requirements: 7.3, 7.5_

- [ ] 11. Implementar tratamento de erros e logging
  - [ ] 11.1 Adicionar error handling nos endpoints de API
    - Implementar formato padronizado de resposta de erro
    - Adicionar logging estruturado de erros
    - Configurar diferentes códigos de status HTTP apropriados
    - _Requirements: 1.7, 6.4_

  - [ ] 11.2 Adicionar retry logic no processador de IA
    - Implementar exponential backoff para chamadas ao LLM
    - Adicionar retry para operações de storage
    - Registrar tentativas e falhas no banco
    - _Requirements: 6.4_

  - [ ] 11.3 Adicionar tratamento de erros no frontend
    - Implementar exibição de mensagens de erro amigáveis
    - Adicionar opção de retry para uploads falhados
    - Mostrar detalhes de erro quando processamento falha
    - _Requirements: 1.7_

- [ ] 12. Implementar segurança e validações
  - [ ] 12.1 Adicionar rate limiting nos endpoints
    - Implementar limite de 100 requisições por minuto por usuário
    - Retornar 429 Too Many Requests quando excedido
    - _Requirements: 4.5_

  - [ ] 12.2 Implementar validação de propriedade de recursos
    - Adicionar verificação em todos os endpoints que acessam recursos
    - Garantir que usuário só acessa seus próprios dados
    - _Requirements: 4.3, 4.6_

  - [ ] 12.3 Adicionar sanitização de dados para LLM
    - Remover informações sensíveis antes de enviar ao LLM
    - Validar e sanitizar respostas do LLM
    - _Requirements: 4.7_

- [ ] 13. Configurar monitoramento e métricas
  - [ ] 13.1 Adicionar logging de métricas de performance
    - Registrar tempo de processamento de invoices
    - Registrar tempo de resposta de APIs
    - Monitorar taxa de sucesso de extração de dados
    - _Requirements: 1.8, 5.7_

  - [ ] 13.2 Configurar alertas para falhas críticas
    - Alertar quando taxa de falha de processamento > 10%
    - Alertar quando tempo de processamento > 2 minutos (p95)
    - Alertar quando webhooks do Stripe falham
    - _Requirements: 7.5_

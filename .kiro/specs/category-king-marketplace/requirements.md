# Requirements Document

## Introduction

Esta especificação define os requisitos para a transformação da Horizon AI em uma plataforma de marketplace de produtos financeiros personalizados (Horizonte 3 - "Category King"). O objetivo é evoluir de um aplicativo B2C para uma plataforma B2B2C indispensável, conectando usuários que entendem profundamente suas finanças com os melhores produtos financeiros do mercado (seguros, crédito, investimentos) de forma personalizada e proativa.

A plataforma utilizará o conhecimento profundo dos dados dos usuários para inverter o modelo tradicional: em vez de usuários caçarem produtos, os produtos certos virão até eles de forma proativa e perfeitamente ajustada às suas necessidades. Este é o ápice do Data Network Effect, onde a plataforma se torna mais valiosa para usuários com cada produto oferecido, e mais valiosa para parceiros com cada novo usuário.

## Requirements

### Requirement 1: Marketplace de Produtos Financeiros

**User Story:** Como usuário da Horizon AI, eu quero receber ofertas personalizadas de produtos financeiros (seguros, crédito, investimentos) baseadas nos meus dados reais, para que eu possa acessar os produtos mais adequados ao meu perfil sem precisar procurá-los ativamente.

#### Acceptance Criteria

1. WHEN o sistema detecta que um usuário é elegível para um produto financeiro THEN o sistema SHALL gerar automaticamente uma oferta personalizada
2. WHEN uma oferta é gerada THEN o sistema SHALL armazenar os detalhes da oferta incluindo justificativa, detalhes específicos e data de expiração
3. WHEN o usuário acessa a área de marketplace THEN o sistema SHALL apresentar todas as ofertas ativas em formato de cards de oportunidade
4. WHEN o usuário visualiza uma oferta THEN o sistema SHALL exibir o nome do produto, parceiro, detalhe principal e justificativa da recomendação
5. WHEN o usuário aceita uma oferta THEN o sistema SHALL atualizar o status da oferta para "ACCEPTED" e notificar o parceiro
6. WHEN o usuário rejeita uma oferta THEN o sistema SHALL atualizar o status da oferta para "REJECTED"
7. WHEN uma oferta expira THEN o sistema SHALL atualizar automaticamente o status para "EXPIRED"

### Requirement 2: Motor de Recomendação Baseado em Regras

**User Story:** Como plataforma, eu quero um motor de recomendação que faça o match perfeito entre usuário e produto baseado em regras de elegibilidade, para que possamos validar hipóteses de negócio antes de investir em Machine Learning.

#### Acceptance Criteria

1. WHEN um usuário se cadastra THEN o motor de recomendação SHALL avaliar todos os produtos disponíveis para elegibilidade
2. WHEN um novo ativo é conectado THEN o motor de recomendação SHALL reavaliar a elegibilidade do usuário para produtos relacionados
3. WHEN há uma mudança significativa no patrimônio do usuário THEN o motor de recomendação SHALL reavaliar ofertas de produtos de wealth management
4. WHEN um evento de vida é detectado (casamento, filhos) THEN o motor de recomendação SHALL avaliar produtos relacionados ao evento
5. WHEN o motor avalia um produto THEN o sistema SHALL comparar os critérios de elegibilidade do produto com o perfil consolidado do usuário
6. IF todos os critérios de elegibilidade são atendidos THEN o sistema SHALL gerar uma oferta personalizada
7. WHEN uma oferta é gerada THEN o sistema SHALL incluir uma justificativa transparente baseada nos dados do usuário

### Requirement 3: Gestão de Parceiros e Catálogo de Produtos

**User Story:** Como administrador da plataforma, eu quero gerenciar parceiros e seus catálogos de produtos, para que possamos expandir o marketplace de forma controlada e segura.

#### Acceptance Criteria

1. WHEN um novo parceiro é integrado THEN o sistema SHALL armazenar informações do parceiro incluindo nome, categoria, informações de contato e chaves de API criptografadas
2. WHEN um parceiro adiciona um produto THEN o sistema SHALL armazenar o produto com código, nome, descrição e critérios de elegibilidade estruturados
3. WHEN um produto é cadastrado THEN o sistema SHALL associá-lo ao parceiro correspondente
4. WHEN critérios de elegibilidade são definidos THEN o sistema SHALL armazená-los em formato estruturado (JSON schema)
5. IF um parceiro é removido THEN o sistema SHALL desativar todos os produtos associados

### Requirement 4: Partner API Gateway

**User Story:** Como parceiro integrado, eu quero uma API segura e versionada para interagir com a plataforma Horizon AI, para que eu possa sincronizar produtos e receber notificações de ofertas aceitas.

#### Acceptance Criteria

1. WHEN um parceiro tenta acessar a API THEN o sistema SHALL exigir autenticação via OAuth 2.0 Client Credentials
2. WHEN um parceiro se autentica THEN o sistema SHALL fornecer um token de acesso de curta duração
3. WHEN a plataforma notifica que uma oferta foi aceita THEN o sistema SHALL enviar os dados necessários via endpoint POST /v1/offers/create
4. WHEN um parceiro sincroniza seu catálogo THEN o sistema SHALL disponibilizar endpoint GET /v1/products/catalog
5. WHEN qualquer chamada é feita à API THEN o sistema SHALL aplicar rate limiting estrito
6. WHEN qualquer payload é recebido THEN o sistema SHALL validar com Zod
7. WHEN qualquer chamada é processada THEN o sistema SHALL registrar logs detalhados para monitoramento

### Requirement 5: Integração com Parceiro de Seguros

**User Story:** Como plataforma, eu quero integrar com um parceiro de seguros para oferecer apólices personalizadas, para que possamos validar o modelo de marketplace com uma vertical de alto impacto.

#### Acceptance Criteria

1. WHEN o sistema precisa gerar uma cotação THEN o sistema SHALL comunicar-se com a API do parceiro de forma segura
2. WHEN uma cotação é solicitada THEN o sistema SHALL enviar os dados do usuário necessários de forma criptografada
3. WHEN a API do parceiro responde THEN o sistema SHALL processar a resposta e armazenar os detalhes da oferta
4. WHEN um usuário aceita uma oferta de seguro THEN o sistema SHALL notificar o parceiro para formalização da apólice
5. IF a API do parceiro está indisponível THEN o sistema SHALL tratar o erro graciosamente sem impactar a aplicação principal
6. IF os dados são inválidos THEN o sistema SHALL registrar o erro e notificar a equipe técnica

### Requirement 6: Portal do Contador

**User Story:** Como usuário, eu quero conceder acesso seguro aos meus dados financeiros para meu contador, para que ele possa me ajudar de forma mais eficiente através da plataforma.

#### Acceptance Criteria

1. WHEN um usuário deseja adicionar seu contador THEN o sistema SHALL permitir enviar um convite via e-mail
2. WHEN um convite é enviado THEN o sistema SHALL criar um registro de acesso delegado com status "PENDING"
3. WHEN o contador aceita o convite THEN o sistema SHALL atualizar o status para "ACTIVE"
4. WHEN o acesso está ativo THEN o contador SHALL poder visualizar os dados financeiros do cliente em modo leitura
5. WHEN o usuário deseja revogar acesso THEN o sistema SHALL permitir revogação a qualquer momento
6. WHEN o acesso é revogado THEN o contador SHALL perder imediatamente o acesso aos dados
7. WHEN um contador acessa dados de cliente THEN o sistema SHALL validar a existência de acesso delegado ativo
8. IF não há acesso delegado ativo THEN o sistema SHALL negar o acesso

### Requirement 7: Dashboard do Contador

**User Story:** Como contador, eu quero um painel dedicado para visualizar e gerenciar as finanças dos meus clientes que me concederam acesso, para que eu possa oferecer um serviço mais eficiente.

#### Acceptance Criteria

1. WHEN um contador faz login THEN o sistema SHALL exibir uma lista de todos os clientes que concederam acesso
2. WHEN o contador seleciona um cliente THEN o sistema SHALL exibir o dashboard financeiro do cliente em modo leitura
3. WHEN o contador visualiza dados THEN o sistema SHALL buscar os dados usando o header X-On-Behalf-Of-User-ID
4. WHEN o contador precisa de relatórios THEN o sistema SHALL permitir exportação de relatórios consolidados de IRPF
5. WHEN o contador acessa a plataforma THEN o sistema SHALL manter separação clara entre aplicação do usuário e do contador
6. IF o acesso foi revogado THEN o cliente SHALL desaparecer da lista do contador

### Requirement 8: Segurança e Privacidade do Ecossistema

**User Story:** Como plataforma que conecta usuários e parceiros, eu quero garantir os mais altos padrões de segurança e privacidade, para que a confiança dos usuários seja mantida ao abrir o ecossistema.

#### Acceptance Criteria

1. WHEN dados são compartilhados com parceiros THEN o sistema SHALL criptografar todas as comunicações
2. WHEN chaves de API de parceiros são armazenadas THEN o sistema SHALL criptografá-las no banco de dados
3. WHEN um parceiro é integrado THEN o sistema SHALL validar que o parceiro adere aos padrões de segurança da plataforma
4. WHEN dados do usuário são acessados THEN o sistema SHALL registrar logs de auditoria
5. WHEN um usuário questiona uma oferta THEN o sistema SHALL fornecer transparência total sobre como a recomendação foi gerada
6. IF há tentativa de acesso não autorizado THEN o sistema SHALL bloquear e alertar a equipe de segurança

### Requirement 9: Performance e Escalabilidade

**User Story:** Como plataforma em crescimento, eu quero que o marketplace opere sem impactar a performance da aplicação principal, para que a experiência do usuário permaneça excelente.

#### Acceptance Criteria

1. WHEN ofertas são geradas THEN o processo SHALL executar de forma assíncrona sem bloquear operações principais
2. WHEN o motor de recomendação é acionado THEN o sistema SHALL processar em background
3. WHEN há picos de tráfego THEN o sistema SHALL escalar automaticamente usando arquitetura serverless
4. WHEN integrações com parceiros falham THEN o sistema SHALL usar circuit breakers para evitar cascata de falhas
5. WHEN dados são consultados THEN o sistema SHALL usar caching apropriado para otimizar performance

### Requirement 10: Métricas e Monitoramento

**User Story:** Como equipe de produto, eu quero monitorar o desempenho do marketplace, para que possamos otimizar continuamente e atingir nossos OKRs.

#### Acceptance Criteria

1. WHEN uma oferta é gerada THEN o sistema SHALL registrar métricas de geração
2. WHEN uma oferta é apresentada ao usuário THEN o sistema SHALL registrar a visualização
3. WHEN uma oferta é aceita ou rejeitada THEN o sistema SHALL registrar a conversão
4. WHEN há receita de comissão THEN o sistema SHALL rastrear para cálculo de ARR
5. WHEN um parceiro é integrado THEN o sistema SHALL rastrear métricas de integração
6. WHEN o LTV do cliente aumenta THEN o sistema SHALL atribuir ao marketplace quando aplicável

# Requirements Document

## Introdução

Esta especificação define os requisitos para o **Horizonte 2: "Da Clareza à Inteligência"** da plataforma Horizon AI. O objetivo desta fase é evoluir a plataforma de uma ferramenta de visualização financeira para um cérebro financeiro inteligente, introduzindo o motor de IA para processamento de notas fiscais (NF-e/NFC-e) e implementando o modelo de monetização através do plano Premium.

Esta fase representa a transmutação de documentos fiscais mundanos em fontes de dados valiosas, automatizando a categorização de despesas e, crucialmente, o rastreamento de garantias de produtos. O sistema também validará a disposição dos usuários em pagar por automação inteligente e insights avançados.

## Requisitos

### Requisito 1: Processamento Inteligente de Notas Fiscais

**User Story:** Como usuário da plataforma, eu quero fazer upload de minhas notas fiscais (NF-e/NFC-e) para que o sistema extraia automaticamente informações sobre meus produtos e garantias, sem necessidade de entrada manual de dados.

#### Acceptance Criteria

1. WHEN o usuário acessa a área de ativos THEN o sistema SHALL exibir uma interface para upload de arquivos de nota fiscal
2. WHEN o usuário seleciona um arquivo PDF ou XML de nota fiscal THEN o sistema SHALL gerar uma URL de upload pré-assinada e criar um registro com status "PENDING"
3. WHEN o arquivo é enviado com sucesso THEN o sistema SHALL iniciar o processamento assíncrono da nota fiscal
4. WHEN o processamento é iniciado THEN o sistema SHALL atualizar o status para "PROCESSING" e exibir o progresso ao usuário em tempo real
5. WHEN o processamento é concluído com sucesso THEN o sistema SHALL extrair nome, preço e data de compra de cada produto contido na nota fiscal
6. WHEN produtos são extraídos THEN o sistema SHALL criar registros de produtos e garantias associadas no banco de dados
7. WHEN o processamento falha THEN o sistema SHALL atualizar o status para "FAILED" e registrar a mensagem de erro
8. IF o processamento não for concluído em 2 minutos (p95) THEN o sistema SHALL considerar isso uma violação de performance

### Requisito 2: Gestão e Visualização de Ativos e Garantias

**User Story:** Como usuário, eu quero visualizar todos os meus produtos e suas garantias em um único lugar para que eu possa acompanhar quando as garantias estão próximas de expirar e não perder oportunidades de uso.

#### Acceptance Criteria

1. WHEN o usuário acessa a página "Meus Ativos" THEN o sistema SHALL exibir uma lista de todos os produtos extraídos de notas fiscais
2. WHEN um produto é exibido THEN o sistema SHALL mostrar nome, preço de compra, data de compra e data de expiração da garantia
3. WHEN uma garantia está próxima de expirar THEN o sistema SHALL destacar visualmente o produto com prioridade
4. WHEN a lista de produtos é carregada THEN o sistema SHALL exibir uma contagem regressiva para expiração de cada garantia (ex: "Expira em 95 dias")
5. WHEN o usuário visualiza um produto THEN o sistema SHALL permitir acesso à nota fiscal original associada
6. IF não houver produtos cadastrados THEN o sistema SHALL exibir uma mensagem incentivando o upload da primeira nota fiscal

### Requisito 3: Modelo de Monetização com Plano Premium

**User Story:** Como usuário gratuito, eu quero entender claramente os benefícios do plano Premium e poder fazer upgrade de forma simples e segura para que eu possa acessar features avançadas de automação e inteligência.

#### Acceptance Criteria

1. WHEN o sistema é acessado THEN o sistema SHALL oferecer dois planos: gratuito e Premium
2. WHEN um usuário gratuito tenta acessar features de IA THEN o sistema SHALL exibir um prompt explicando o valor da feature e oferecendo upgrade
3. WHEN o usuário acessa a página de preços THEN o sistema SHALL exibir uma comparação clara entre os planos gratuito e Premium
4. WHEN o usuário clica em "Upgrade para Premium" THEN o sistema SHALL iniciar o processo de checkout através do Stripe
5. WHEN o pagamento é concluído com sucesso THEN o sistema SHALL atualizar automaticamente o role do usuário para "PREMIUM"
6. WHEN um usuário Premium acessa features de IA THEN o sistema SHALL permitir acesso completo sem restrições
7. IF um usuário gratuito tenta acessar endpoints de API Premium THEN o sistema SHALL retornar 403 Forbidden
8. WHEN uma assinatura é cancelada THEN o sistema SHALL atualizar o role do usuário de volta para gratuito

### Requisito 4: Segurança e Privacidade de Dados Sensíveis

**User Story:** Como usuário, eu quero ter certeza de que minhas notas fiscais e dados financeiros são tratados com o mais alto nível de segurança para que eu me sinta confortável compartilhando documentos sensíveis com a plataforma.

#### Acceptance Criteria

1. WHEN um arquivo de nota fiscal é enviado THEN o sistema SHALL armazenar o arquivo em um bucket seguro com criptografia
2. WHEN URLs de upload são geradas THEN o sistema SHALL criar URLs pré-assinadas com tempo de expiração limitado
3. WHEN o sistema acessa dados de notas fiscais THEN o sistema SHALL validar que o usuário autenticado é o proprietário do recurso
4. WHEN webhooks do Stripe são recebidos THEN o sistema SHALL verificar a assinatura do webhook antes de processar
5. IF uma requisição não possui autenticação válida THEN o sistema SHALL retornar 401 Unauthorized
6. IF uma requisição tenta acessar recursos de outro usuário THEN o sistema SHALL retornar 403 Forbidden
7. WHEN dados sensíveis são processados THEN o sistema SHALL seguir práticas de segurança alinhadas com PCI-DSS (delegadas ao Stripe)

### Requisito 5: Extração de Dados com Alta Precisão

**User Story:** Como plataforma, eu quero extrair dados de notas fiscais com alta precisão para que os usuários confiem nas informações apresentadas e não precisem fazer correções manuais frequentes.

#### Acceptance Criteria

1. WHEN uma nota fiscal em formato PDF é processada THEN o sistema SHALL extrair o texto usando OCR ou parsing de PDF
2. WHEN uma nota fiscal em formato XML é processada THEN o sistema SHALL parsear diretamente a estrutura XML
3. WHEN o texto é extraído THEN o sistema SHALL enviar o conteúdo para um modelo de linguagem (LLM) com prompt otimizado
4. WHEN o LLM retorna dados THEN o sistema SHALL validar a estrutura JSON usando Zod
5. WHEN produtos são identificados THEN o sistema SHALL extrair nome, preço em centavos e data de compra
6. WHEN garantias são criadas THEN o sistema SHALL calcular a data de expiração como data de compra + 1 ano (padrão)
7. IF a precisão na extração de dados for inferior a 90% THEN o sistema SHALL considerar isso uma violação de qualidade

### Requisito 6: Infraestrutura Assíncrona e Resiliente

**User Story:** Como plataforma, eu quero processar notas fiscais de forma assíncrona e resiliente para que o sistema permaneça responsivo mesmo durante operações longas e possa se recuperar de falhas.

#### Acceptance Criteria

1. WHEN o processamento de nota fiscal é iniciado THEN o sistema SHALL desacoplar a operação do fluxo de requisição/resposta da API
2. WHEN uma função de processamento é invocada THEN o sistema SHALL usar funções serverless com timeout estendido
3. WHEN o processamento está em andamento THEN o sistema SHALL permitir que o usuário consulte o status periodicamente
4. WHEN uma falha ocorre durante o processamento THEN o sistema SHALL registrar o erro e atualizar o status da nota fiscal
5. IF o sistema de filas não estiver disponível THEN o sistema SHALL usar um mecanismo de fallback (ex: Vercel Cron)
6. WHEN múltiplas notas fiscais são enviadas THEN o sistema SHALL processar cada uma de forma independente

### Requisito 7: Testes de Integração e Qualidade

**User Story:** Como equipe de desenvolvimento, eu quero ter uma suíte robusta de testes de integração para que possamos validar fluxos críticos de negócio e prevenir regressões em features de faturamento e IA.

#### Acceptance Criteria

1. WHEN o pipeline de CI/CD é executado THEN o sistema SHALL rodar testes de integração automaticamente
2. WHEN testes de integração são executados THEN o sistema SHALL usar um banco de dados de teste isolado
3. WHEN testes de faturamento são executados THEN o sistema SHALL usar credenciais de teste do Stripe
4. WHEN um PR é criado THEN o sistema SHALL bloquear o merge se os testes de integração falharem
5. IF testes críticos falharem THEN o sistema SHALL notificar a equipe imediatamente

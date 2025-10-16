# Requirements Document

## Introduction

O Horizon AI é uma plataforma de gestão financeira pessoal que visa se tornar o "sistema operacional" das finanças da família moderna brasileira. O MVP foca em resolver o problema central de fragmentação financeira através da consolidação automatizada de contas via Open Finance, proporcionando uma visão unificada e inteligente da vida financeira do usuário.

A visão do produto é libertar usuários como "Mariana, a Planejadora Proativa" do caos financeiro causado pela dispersão de dados entre múltiplos bancos, cartões, investimentos e notas fiscais. O objetivo é automatizar 95% do trabalho manual de gestão financeira, transformando uma tarefa temida em um momento de empoderamento.

Este MVP serve para validar a hipótese crítica: que a consolidação automatizada de contas via Open Finance é uma dor real e que podemos resolvê-la de forma mágica e segura, atingindo o Product-Market Fit.

## Requirements

### Requirement 1: Autenticação e Registro de Usuários

**User Story:** Como um novo usuário, eu quero criar uma conta e fazer login de forma segura, para que eu possa começar a usar a plataforma e ter meus dados protegidos.

#### Acceptance Criteria

1. WHEN um usuário acessa a página de registro THEN o sistema SHALL exibir um formulário solicitando email, senha e nome
2. WHEN um usuário submete o formulário de registro com dados válidos THEN o sistema SHALL criar uma nova conta, gerar um hash seguro da senha usando bcrypt, e armazenar os dados no banco de dados
3. WHEN um usuário tenta se registrar com um email já existente THEN o sistema SHALL retornar um erro 409 informando que o email já está cadastrado
4. WHEN um usuário acessa a página de login THEN o sistema SHALL exibir um formulário solicitando email e senha
5. WHEN um usuário submete credenciais válidas THEN o sistema SHALL gerar um Access Token JWT (15 minutos) e um Refresh Token JWT (7 dias), armazenar o hash do Refresh Token no banco, e enviar ambos como cookies httpOnly, secure e sameSite
6. WHEN um usuário submete credenciais inválidas THEN o sistema SHALL retornar um erro 401 sem revelar se o email ou a senha está incorreto
7. WHEN um Access Token expira THEN o middleware SHALL automaticamente tentar usar o Refresh Token para gerar um novo par de tokens
8. IF o Refresh Token for inválido ou expirado THEN o sistema SHALL redirecionar o usuário para a página de login

### Requirement 2: Onboarding e Conexão com Open Finance

**User Story:** Como um usuário registrado, eu quero conectar minhas contas bancárias de forma rápida e segura através do Open Finance, para que eu possa ver todas as minhas informações financeiras consolidadas em um único lugar.

#### Acceptance Criteria

1. WHEN um usuário faz login pela primeira vez THEN o sistema SHALL exibir a tela de boas-vindas do onboarding com um CTA claro para "Conectar minha primeira conta"
2. WHEN um usuário clica no CTA de conexão THEN o sistema SHALL exibir uma tela de seleção de bancos com uma barra de busca e lista dos principais bancos brasileiros
3. WHEN um usuário seleciona um banco THEN o sistema SHALL exibir uma tela intersticial explicando que o usuário será redirecionado de forma segura e que a Horizon AI nunca verá sua senha
4. WHEN um usuário confirma o redirecionamento THEN o sistema SHALL iniciar o fluxo de consentimento do Open Finance através da API da instituição selecionada
5. WHEN o usuário completa a autenticação no banco THEN o sistema SHALL receber o código de autorização e trocá-lo por um access token da instituição
6. WHEN o token é obtido THEN o sistema SHALL armazenar o token de forma criptografada no banco de dados e iniciar a sincronização de dados (contas e saldos)
7. WHEN a sincronização é concluída THEN o sistema SHALL redirecionar o usuário para o dashboard e exibir uma mensagem de sucesso
8. IF o usuário cancela o fluxo no banco THEN o sistema SHALL retornar para a tela de seleção de bancos com uma mensagem informativa
9. IF ocorrer um erro na API do banco THEN o sistema SHALL exibir uma mensagem de erro clara com opções para tentar novamente ou escolher outro banco
10. WHEN o fluxo de onboarding é concluído THEN o sistema SHALL ser completado em menos de 5 minutos

### Requirement 3: Dashboard Consolidado

**User Story:** Como um usuário com contas conectadas, eu quero ver um dashboard que consolide todas as minhas informações financeiras, para que eu possa ter uma visão clara e unificada do meu patrimônio.

#### Acceptance Criteria

1. WHEN um usuário acessa o dashboard THEN o sistema SHALL exibir o saldo consolidado de todas as contas conectadas
2. WHEN o dashboard é carregado THEN o sistema SHALL exibir uma lista unificada e cronológica de transações de todas as contas
3. WHEN transações são exibidas THEN o sistema SHALL aplicar categorização automática básica (ex: identificar "Uber" como "Transporte")
4. WHEN há pagamentos de cartão de crédito THEN o sistema SHALL evitar contagem dupla ao mesclar débitos bancários com pagamentos de cartão
5. WHEN o usuário visualiza o dashboard THEN o sistema SHALL carregar a página inicial em menos de 3 segundos
6. WHEN não há contas conectadas THEN o sistema SHALL exibir um estado vazio incentivando o usuário a conectar sua primeira conta
7. WHEN o usuário possui múltiplas contas THEN o sistema SHALL permitir visualizar o saldo e transações de cada conta individualmente ou consolidado

### Requirement 4: Sincronização de Dados Financeiros

**User Story:** Como um usuário ativo, eu quero que meus dados financeiros sejam sincronizados automaticamente, para que eu sempre tenha informações atualizadas sem esforço manual.

#### Acceptance Criteria

1. WHEN uma conta é conectada pela primeira vez THEN o sistema SHALL realizar uma sincronização inicial completa dos últimos 90 dias de transações
2. WHEN o sistema executa sincronizações periódicas THEN o sistema SHALL buscar novos dados a cada 6 horas para contas ativas
3. WHEN novos dados são sincronizados THEN o sistema SHALL atualizar o dashboard automaticamente sem necessidade de refresh manual
4. IF um token de acesso do Open Finance expira THEN o sistema SHALL tentar renovar o token automaticamente
5. IF a renovação falhar THEN o sistema SHALL notificar o usuário para reconectar a conta
6. WHEN ocorre um erro de sincronização THEN o sistema SHALL registrar o erro e tentar novamente após um período de backoff exponencial
7. WHEN o usuário abre o app THEN o sistema SHALL disparar uma sincronização se a última foi há mais de 1 hora

### Requirement 5: Segurança e Privacidade de Dados

**User Story:** Como um usuário preocupado com segurança, eu quero ter certeza de que meus dados financeiros estão protegidos, para que eu possa confiar na plataforma com minhas informações sensíveis.

#### Acceptance Criteria

1. WHEN senhas são armazenadas THEN o sistema SHALL usar bcrypt com salt round mínimo de 12
2. WHEN tokens de acesso do Open Finance são armazenados THEN o sistema SHALL criptografar os tokens em repouso no banco de dados
3. WHEN dados são transmitidos THEN o sistema SHALL usar HTTPS/TLS para todas as comunicações
4. WHEN cookies de autenticação são enviados THEN o sistema SHALL configurá-los como httpOnly, secure e sameSite: 'strict'
5. WHEN um usuário acessa dados THEN o sistema SHALL aplicar autorização na camada da aplicação, filtrando queries pelo userId
6. WHEN queries ao banco são executadas THEN o sistema SHALL obrigatoriamente incluir cláusulas WHERE para filtrar por userId
7. WHEN o sistema processa dados pessoais THEN o sistema SHALL estar em conformidade total com a LGPD
8. WHEN ocorre uma tentativa de acesso não autorizado THEN o sistema SHALL registrar o evento para auditoria

### Requirement 6: Performance e Escalabilidade

**User Story:** Como um usuário, eu quero que a aplicação seja rápida e responsiva, para que eu possa acessar minhas informações financeiras sem demora ou frustração.

#### Acceptance Criteria

1. WHEN uma API é chamada THEN o sistema SHALL responder em menos de 200ms para 95% das requisições
2. WHEN o dashboard inicial é carregado após onboarding THEN o sistema SHALL completar o carregamento em menos de 3 segundos
3. WHEN o sistema escala THEN a arquitetura SHALL suportar crescimento horizontal sem degradação de performance
4. WHEN múltiplos usuários acessam simultaneamente THEN o sistema SHALL manter a performance sem impacto perceptível
5. WHEN dados são consultados frequentemente THEN o sistema SHALL utilizar cache Redis para otimizar performance
6. WHEN o sistema atinge 99.95% de uptime THEN o sistema SHALL ser considerado confiável para uso em produção

### Requirement 7: Experiência do Usuário e Acessibilidade

**User Story:** Como um usuário com necessidades de acessibilidade, eu quero que a interface seja clara, intuitiva e acessível, para que eu possa usar a plataforma independentemente de minhas capacidades.

#### Acceptance Criteria

1. WHEN a interface é renderizada THEN o sistema SHALL seguir o Material Design 3 com a paleta de cores definida (Primary: #0D47A1)
2. WHEN elementos interativos são exibidos THEN o sistema SHALL garantir contraste mínimo de 4.5:1 conforme WCAG 2.1 AA
3. WHEN um usuário navega por teclado THEN o sistema SHALL fornecer uma ordem de foco lógica e indicadores visuais claros
4. WHEN um leitor de tela é usado THEN o sistema SHALL fornecer labels ARIA apropriados para todos os elementos interativos
5. WHEN mensagens de erro são exibidas THEN o sistema SHALL usar linguagem clara, empática e acionável
6. WHEN o usuário interage com botões THEN o sistema SHALL fornecer feedback visual imediato (ripple effect)
7. WHEN transições de tela ocorrem THEN o sistema SHALL usar animações Shared Axis com duração de 300-400ms
8. WHEN a aplicação é acessada em diferentes dispositivos THEN o sistema SHALL ser totalmente responsivo (mobile, tablet, desktop)

### Requirement 8: Infraestrutura e DevOps

**User Story:** Como um desenvolvedor, eu quero que a infraestrutura seja confiável e o processo de deploy seja automatizado, para que possamos entregar features rapidamente com qualidade.

#### Acceptance Criteria

1. WHEN código é commitado THEN o sistema SHALL executar linting e type checking automaticamente via Husky
2. WHEN um Pull Request é aberto THEN o sistema SHALL executar o pipeline de CI que valida lint, types e build
3. WHEN o código é mergeado na main THEN o sistema SHALL fazer deploy automático na Vercel
4. WHEN variáveis de ambiente são necessárias THEN o sistema SHALL gerenciá-las de forma segura via Vercel e .env.local
5. WHEN migrações de banco são criadas THEN o sistema SHALL usar Drizzle Kit para gerar e aplicar migrações
6. WHEN o banco de dados é provisionado THEN o sistema SHALL usar a integração Vercel + Supabase
7. WHEN logs são gerados THEN o sistema SHALL registrar eventos importantes para debugging e auditoria

### Requirement 9: Qualidade de Código e Manutenibilidade

**User Story:** Como um membro da equipe de desenvolvimento, eu quero que o código seja limpo, bem documentado e testável, para que possamos manter e evoluir a aplicação com confiança.

#### Acceptance Criteria

1. WHEN código TypeScript é escrito THEN o sistema SHALL usar strict mode e seguir as convenções do projeto
2. WHEN componentes são criados THEN o sistema SHALL usar Shadcn/UI alinhado ao Design System
3. WHEN validação de dados é necessária THEN o sistema SHALL usar Zod para schemas de validação
4. WHEN queries ao banco são feitas THEN o sistema SHALL usar Drizzle ORM com sintaxe type-safe
5. WHEN estado do cliente é gerenciado THEN o sistema SHALL usar Tanstack Query para server state e Zustand para client state
6. WHEN código é formatado THEN o sistema SHALL usar Prettier e ESLint configurados no projeto
7. WHEN funções são criadas THEN o sistema SHALL incluir comentários explicativos para lógica complexa

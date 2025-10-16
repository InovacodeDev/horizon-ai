# Requirements Document

## Introduction

Este documento define os requisitos para duas melhorias críticas na experiência do usuário da Horizon AI: (1) permitir que usuários autenticados acessem a aplicação sem a obrigatoriedade de ter um banco conectado, e (2) criar uma landing page completa e animada que apresente toda a proposta de valor do produto.

## Glossary

- **Sistema**: A plataforma web Horizon AI
- **Usuário Autenticado**: Um usuário que completou o registro e fez login no Sistema
- **Conexão Bancária**: Uma integração ativa entre a conta do Usuário Autenticado e uma instituição financeira via Open Finance
- **Landing Page**: A página inicial pública do Sistema acessível antes do login
- **Dashboard**: A interface principal do Sistema após autenticação
- **Open Finance**: Sistema regulamentado pelo Banco Central do Brasil para compartilhamento de dados financeiros

## Requirements

### Requirement 1: Acesso Sem Banco Conectado

**User Story:** Como um usuário autenticado, eu quero acessar o dashboard e explorar a plataforma mesmo sem ter conectado um banco, para que eu possa entender o valor do produto antes de compartilhar meus dados financeiros.

#### Acceptance Criteria

1. WHEN um Usuário Autenticado acessa o Dashboard, THE Sistema SHALL exibir a interface principal independentemente de ter ou não uma Conexão Bancária ativa
2. WHILE um Usuário Autenticado não possui Conexão Bancária, THE Sistema SHALL exibir um estado vazio (empty state) com uma mensagem clara e um call-to-action para conectar a primeira conta
3. WHEN um Usuário Autenticado sem Conexão Bancária clica no call-to-action de conexão, THE Sistema SHALL iniciar o fluxo de onboarding do Open Finance
4. THE Sistema SHALL remover qualquer validação ou redirecionamento forçado que exija Conexão Bancária para acessar o Dashboard
5. WHILE um Usuário Autenticado navega pela aplicação sem Conexão Bancária, THE Sistema SHALL exibir estados vazios apropriados em todas as seções que dependem de dados financeiros

### Requirement 2: Landing Page Completa

**User Story:** Como um visitante do site, eu quero ver uma landing page completa e atraente que explique todos os benefícios da Horizon AI, para que eu possa entender o valor do produto e decidir me cadastrar.

#### Acceptance Criteria

1. THE Sistema SHALL exibir uma Landing Page na rota raiz ("/") para usuários não autenticados
2. THE Landing Page SHALL apresentar o hero section com o título "O sistema operacional para as finanças da sua família" e um call-to-action proeminente
3. THE Landing Page SHALL incluir uma seção de features destacando as funcionalidades principais: consolidação de contas, categorização inteligente via NF-e, gestão de garantias, consolidação de investimentos e otimização de IRPF
4. THE Landing Page SHALL apresentar uma seção de benefícios explicando como o Sistema resolve as dores de fragmentação financeira, complexidade do IRPF e perda de garantias
5. THE Landing Page SHALL incluir uma seção de "Como Funciona" com três passos claros: conectar contas, adicionar notas fiscais e receber insights
6. THE Landing Page SHALL apresentar uma seção de pricing comparando os planos Free e Premium
7. THE Landing Page SHALL incluir uma seção de social proof com depoimentos ou estatísticas de uso
8. THE Landing Page SHALL ter um footer com links para documentação, termos de uso e política de privacidade
9. WHEN um elemento da Landing Page entra no viewport, THE Sistema SHALL executar animações suaves de entrada usando as transições definidas no Design System
10. THE Landing Page SHALL ser totalmente responsiva e funcionar perfeitamente em dispositivos mobile, tablet e desktop
11. THE Landing Page SHALL seguir o Design System Material 3 definido no blueprint, utilizando a paleta de cores primária (#0D47A1), tipografia Figtree e componentes especificados
12. WHEN um usuário autenticado acessa a rota raiz ("/"), THE Sistema SHALL redirecionar automaticamente para o Dashboard

### Requirement 3: Navegação e Fluxo de Usuário

**User Story:** Como um visitante ou usuário, eu quero uma navegação clara entre a landing page, registro, login e dashboard, para que eu possa facilmente explorar e usar a plataforma.

#### Acceptance Criteria

1. THE Landing Page SHALL incluir um header com botões "Entrar" e "Criar Conta"
2. WHEN um visitante clica em "Criar Conta" na Landing Page, THE Sistema SHALL redirecionar para a página de registro
3. WHEN um visitante clica em "Entrar" na Landing Page, THE Sistema SHALL redirecionar para a página de login
4. WHEN um Usuário Autenticado completa o login, THE Sistema SHALL redirecionar para o Dashboard
5. THE Dashboard SHALL incluir navegação para todas as seções da aplicação (Dashboard, Conexões, Ativos, Portfólio, IRPF, Marketplace)

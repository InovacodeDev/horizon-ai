# App / (app)

Rotas protegidas da aplicação que requerem autenticação.

## Estrutura de Rotas

- **/accounts** - Gerenciamento de contas bancárias
- **/analytics** - Dashboard de análises e insights financeiros
- **/categories** - Gerenciamento de categorias de transações
- **/compliance** - Conformidade e regulamentações
- **/credit** - Gestão de crédito e score
- **/credit-card-bills** - Faturas de cartões de crédito
- **/family** - Gestão financeira familiar
- **/help** - Central de ajuda
- **/insurance** - Seguros
- **/integrations** - Integrações com bancos e serviços
- **/investments** - Investimentos
- **/invoices** - Notas fiscais (NFe)
- **/joint-account** - Contas compartilhadas
- **/marketplace** - Marketplace de produtos financeiros
- **/notifications** - Central de notificações
- **/overview** - Dashboard principal
- **/planning-goals** - Planejamento e metas financeiras
- **/retirement** - Planejamento de aposentadoria
- **/settings** - Configurações do usuário
- **/shopping-list** - Lista de compras inteligente
- **/succession** - Planejamento sucessório
- **/taxes** - Impostos e declarações
- **/transactions** - Transações financeiras
- **/warranties** - Garantias de produtos

## Layout

O arquivo `layout.tsx` define o layout compartilhado para todas as rotas protegidas, incluindo:

- Header com navegação
- Sidebar
- Verificação de autenticação
- Providers de contexto

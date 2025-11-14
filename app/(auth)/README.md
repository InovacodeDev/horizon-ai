# App / (auth)

Rotas públicas de autenticação acessíveis sem login.

## Rotas

- **/login** - Página de login com email/senha
- **/register** - Página de registro de novos usuários

## Layout

O arquivo `layout.tsx` define o layout para páginas de autenticação:

- Design minimalista focado no formulário
- Sem header/sidebar
- Redirecionamento automático se já autenticado

## Funcionalidades

- Validação de formulários
- Mensagens de erro amigáveis
- Redirecionamento pós-login
- Proteção contra CSRF
- Rate limiting

# Login Page

Página de autenticação para usuários existentes.

## Rota

`/login`

## Propósito

Permite que usuários autentiquem-se no sistema usando email e senha.

## Funcionalidades

### Formulário de Login

**Campos**:

- Email (obrigatório, validação de formato)
- Senha (obrigatório, mínimo 8 caracteres)
- "Lembrar-me" (opcional, mantém sessão por 30 dias)

**Validações Client-Side**:

- Email deve ser válido
- Senha não pode estar vazia
- Feedback visual em tempo real

**Validações Server-Side**:

- Email existe no sistema
- Senha corresponde ao hash armazenado
- Conta não está bloqueada
- Limite de tentativas (5 por hora)

### Fluxo de Autenticação

```
1. Usuário preenche formulário
2. Submit → Server Action (loginAction)
3. Valida credenciais com Appwrite Auth
4. Gera JWT token
5. Define cookie httpOnly
6. Redireciona para /overview
```

### Tratamento de Erros

**Erros Possíveis**:

- "Email ou senha incorretos" (401)
- "Conta bloqueada temporariamente" (429)
- "Erro ao conectar ao servidor" (500)

**UX de Erro**:

- Mensagem clara e amigável
- Não revela se email existe (segurança)
- Sugere recuperação de senha
- Mostra tempo de espera se bloqueado

### Links Relacionados

- **Esqueci minha senha**: `/forgot-password`
- **Criar conta**: `/register`
- **Voltar ao site**: `/`

## Segurança

### Proteções Implementadas

1. **Rate Limiting**: 5 tentativas por hora por IP
2. **CSRF Protection**: Token em formulário
3. **Brute Force**: Bloqueio temporário após falhas
4. **Password Hashing**: bcrypt com salt
5. **Secure Cookies**: httpOnly, secure, sameSite

### Prevenção de Ataques

**SQL Injection**: Appwrite SDK sanitiza automaticamente
**XSS**: React escapa HTML automaticamente
**CSRF**: Token validado no servidor
**Timing Attack**: Resposta constante independente do erro

## Acessibilidade

- Labels associados a inputs
- Mensagens de erro anunciadas por screen readers
- Navegação por teclado (Tab, Enter)
- Foco visível em elementos interativos
- Contraste adequado (WCAG AA)

## Performance

- Server Component (renderizado no servidor)
- Formulário funciona sem JavaScript (Progressive Enhancement)
- Validação client-side para feedback rápido
- Prefetch da página /overview

## Estados da Página

### Loading

- Botão mostra spinner
- Inputs desabilitados
- Mensagem "Autenticando..."

### Error

- Mensagem de erro destacada
- Campos mantêm valores preenchidos
- Foco retorna ao primeiro campo com erro

### Success

- Feedback visual de sucesso
- Redirecionamento automático
- Loading state durante redirect

## Redirecionamentos

**Se já autenticado**: Redireciona para `/overview`
**Após login bem-sucedido**: Redireciona para página anterior ou `/overview`
**Após logout**: Redireciona para `/login`

## Integração com Server Actions

```typescript
// Server Action usada
import { loginAction } from '@/actions/auth.actions';

const [state, formAction, isPending] = useActionState(loginAction, { success: false });
```

## Testes

### Casos de Teste

1. Login com credenciais válidas
2. Login com email inválido
3. Login com senha incorreta
4. Login após 5 tentativas falhas
5. Login com "Lembrar-me" marcado
6. Redirecionamento após login
7. Funcionamento sem JavaScript

### Comandos

```bash
pnpm test:auth
```

## Melhorias Futuras

- [ ] Login com Google/Facebook
- [ ] Autenticação de dois fatores (2FA)
- [ ] Biometria (WebAuthn)
- [ ] Magic link (login sem senha)
- [ ] Captcha após múltiplas tentativas

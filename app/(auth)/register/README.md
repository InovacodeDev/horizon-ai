# Register Page

Página de registro para novos usuários.

## Rota

`/register`

## Propósito

Permite que novos usuários criem uma conta no sistema.

## Funcionalidades

### Formulário de Registro

**Campos**:

- Nome completo (obrigatório, 3-100 caracteres)
- Email (obrigatório, único no sistema)
- Senha (obrigatório, mínimo 8 caracteres)
- Confirmar senha (deve ser igual à senha)
- Aceitar termos (obrigatório)

**Validações Client-Side**:

- Nome não pode conter números
- Email deve ser válido
- Senha deve ter: letras, números, mínimo 8 caracteres
- Senhas devem ser iguais
- Termos devem ser aceitos

**Validações Server-Side**:

- Email não está em uso
- Senha atende requisitos de segurança
- Nome não contém caracteres especiais
- Rate limiting (3 registros por hora por IP)

### Requisitos de Senha

**Força da Senha**:

- Mínimo 8 caracteres
- Pelo menos 1 letra maiúscula
- Pelo menos 1 letra minúscula
- Pelo menos 1 número
- Caracteres especiais (recomendado)

**Indicador Visual**:

- Fraca (vermelho): < 8 caracteres
- Média (amarelo): 8+ caracteres, sem maiúsculas/números
- Forte (verde): Atende todos os requisitos

### Fluxo de Registro

```
1. Usuário preenche formulário
2. Submit → Server Action (registerAction)
3. Valida dados (Zod)
4. Verifica se email já existe
5. Cria usuário no Appwrite Auth
6. Cria perfil no banco de dados
7. Envia email de boas-vindas
8. Faz login automático
9. Redireciona para /overview
```

### Tratamento de Erros

**Erros Possíveis**:

- "Email já está em uso" (409)
- "Senha muito fraca" (400)
- "Senhas não coincidem" (400)
- "Termos devem ser aceitos" (400)
- "Erro ao criar conta" (500)

**UX de Erro**:

- Mensagem específica para cada campo
- Destaque visual no campo com erro
- Sugestões de correção
- Mantém dados preenchidos (exceto senhas)

### Links Relacionados

- **Já tem conta?**: `/login`
- **Termos de Uso**: `/terms`
- **Política de Privacidade**: `/privacy`

## Segurança

### Proteções Implementadas

1. **Email Verification**: Email de confirmação enviado
2. **Password Hashing**: bcrypt com salt único
3. **Rate Limiting**: 3 registros por hora por IP
4. **CSRF Protection**: Token em formulário
5. **Input Sanitization**: Remove scripts maliciosos

### Prevenção de Spam

- Captcha após 3 tentativas
- Verificação de email obrigatória
- Bloqueio de emails temporários
- Detecção de bots

## Validação de Email

### Processo

1. Usuário registra com email
2. Sistema envia email com link de verificação
3. Usuário clica no link
4. Email é marcado como verificado
5. Acesso completo liberado

### Email Não Verificado

**Restrições**:

- Pode fazer login
- Não pode criar transações
- Banner de aviso persistente
- Opção de reenviar email

## Acessibilidade

- Labels descritivos
- Mensagens de erro claras
- Navegação por teclado
- Foco visível
- Contraste adequado
- Anúncios para screen readers

## Performance

- Server Component
- Validação client-side instantânea
- Debounce na verificação de email (500ms)
- Prefetch de /overview

## Estados da Página

### Idle

- Formulário vazio
- Botão habilitado
- Sem mensagens

### Validating

- Verificando email disponível
- Spinner no campo de email
- Botão desabilitado

### Submitting

- Botão mostra "Criando conta..."
- Todos os campos desabilitados
- Loading spinner

### Success

- Mensagem de sucesso
- "Redirecionando..."
- Animação de check

### Error

- Mensagem de erro destacada
- Campos mantêm valores
- Foco no primeiro erro

## Integração com Server Actions

```typescript
import { registerAction } from '@/actions/auth.actions';

const [state, formAction, isPending] = useActionState(registerAction, { success: false });
```

## Dados Criados

### Appwrite Auth

```typescript
{
  $id: 'user123',
  email: 'user@example.com',
  name: 'João Silva',
  emailVerification: false,
  prefs: {}
}
```

### Database (users collection)

```typescript
{
  $id: 'user123',
  email: 'user@example.com',
  name: 'João Silva',
  created_at: '2024-01-01T00:00:00Z',
  email_verified: false,
  preferences: {
    currency: 'BRL',
    language: 'pt-BR',
    theme: 'light'
  }
}
```

## Email de Boas-Vindas

**Conteúdo**:

- Saudação personalizada
- Link de verificação
- Próximos passos
- Links úteis (tutorial, suporte)

**Template**: `emails/welcome.html`

## Testes

### Casos de Teste

1. Registro com dados válidos
2. Registro com email duplicado
3. Registro com senha fraca
4. Registro sem aceitar termos
5. Senhas não coincidem
6. Verificação de email
7. Login automático após registro

### Comandos

```bash
pnpm test:auth
```

## Analytics

**Eventos Rastreados**:

- `register_started`: Usuário acessou página
- `register_completed`: Registro bem-sucedido
- `register_failed`: Erro no registro
- `email_verified`: Email verificado

## Melhorias Futuras

- [ ] Registro com Google/Facebook
- [ ] Verificação de telefone (SMS)
- [ ] Onboarding interativo
- [ ] Importação de dados de outros apps
- [ ] Convite de amigos com benefícios

# Settings Page

Configurações da conta e preferências do usuário.

## Rota
`/settings`

## Propósito
Permitir que usuários personalizem sua experiência e gerenciem configurações.

## Funcionalidades

### 1. Perfil
- Nome completo
- Email (não editável)
- Foto de perfil
- Telefone
- Data de nascimento

### 2. Preferências
- Moeda padrão (BRL, USD, EUR)
- Idioma (PT-BR, EN, ES)
- Tema (Light, Dark, Auto)
- Formato de data
- Formato de número

### 3. Notificações
- Email notifications
- Push notifications
- SMS (opcional)
- Frequência de resumos
- Tipos de alertas

### 4. Segurança
- Alterar senha
- Autenticação de dois fatores (2FA)
- Sessões ativas
- Histórico de login
- Dispositivos conectados

### 5. Privacidade
- Visibilidade de dados
- Compartilhamento
- Exportar dados (LGPD)
- Deletar conta

### 6. Integrações
- Conectar com bancos
- Open Banking
- APIs de terceiros
- Webhooks

### 7. Assinatura
- Plano atual
- Uso de recursos
- Upgrade/downgrade
- Histórico de pagamentos
- Cancelar assinatura

## Dados Carregados
```typescript
const user = await userService.getProfile(user.id);
const preferences = await userService.getPreferences(user.id);
const subscription = await subscriptionService.get(user.id);
```

## Testes
```bash
pnpm test:settings
```

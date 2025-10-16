# API Documentation

Documentação completa da API REST do Horizon AI MVP.

## 📋 Índice

- [Visão Geral](#visão-geral)
- [Autenticação](#autenticação)
- [Endpoints](#endpoints)
  - [Authentication](#authentication)
  - [Banks](#banks)
  - [Open Finance](#open-finance)
  - [Dashboard](#dashboard)
- [Códigos de Erro](#códigos-de-erro)
- [Rate Limiting](#rate-limiting)
- [Exemplos de Uso](#exemplos-de-uso)

## Visão Geral

### Base URL

```
Development: http://localhost:3000/api/v1
Production: https://your-domain.com/api/v1
```

### Content Type

Todas as requisições e respostas usam `application/json`.

### Autenticação

A maioria dos endpoints requer autenticação via cookies httpOnly. Após o login, os tokens são automaticamente incluídos nas requisições subsequentes.

## Autenticação

### Fluxo de Autenticação

1. Usuário faz registro via `/auth/register`
2. Usuário faz login via `/auth/login` (recebe Access Token + Refresh Token)
3. Access Token expira em 15 minutos
4. Refresh Token é usado automaticamente pelo middleware para renovar tokens
5. Refresh Token expira em 7 dias

### Tokens

- **Access Token**: JWT válido por 15 minutos, enviado como cookie httpOnly
- **Refresh Token**: JWT válido por 7 dias, enviado como cookie httpOnly

## Endpoints

### Authentication

#### POST /auth/register

Cria uma nova conta de usuário.

**Request Body:**

```json
{
  "email": "user@example.com",
  "password": "securepassword123",
  "firstName": "João",
  "lastName": "Silva" // opcional
}
```

**Validação:**

- `email`: Deve ser um email válido
- `password`: Mínimo de 8 caracteres
- `firstName`: Obrigatório, mínimo 1 caractere
- `lastName`: Opcional

**Success Response (201 Created):**

```json
{
  "message": "User created successfully",
  "user": {
    "id": "clx1234567890",
    "email": "user@example.com",
    "first_name": "João",
    "last_name": "Silva",
    "role": "FREE",
    "created_at": "2024-10-16T10:00:00.000Z"
  }
}
```

**Error Responses:**

```json
// 400 Bad Request - Validação falhou
{
  "error": "Validation failed",
  "details": [
    {
      "code": "too_small",
      "minimum": 8,
      "type": "string",
      "path": ["password"],
      "message": "Password must be at least 8 characters"
    }
  ]
}

// 409 Conflict - Email já existe
{
  "error": "Email already registered"
}

// 429 Too Many Requests - Rate limit excedido
{
  "error": "Too many requests. Please try again later."
}
```

**Rate Limit:** 5 requisições por minuto por IP

---

#### POST /auth/login

Autentica um usuário e retorna tokens de acesso.

**Request Body:**

```json
{
  "email": "user@example.com",
  "password": "securepassword123"
}
```

**Success Response (200 OK):**

```json
{
  "message": "Login successful",
  "user": {
    "id": "clx1234567890",
    "email": "user@example.com",
    "firstName": "João",
    "lastName": "Silva",
    "role": "FREE"
  }
}
```

**Headers (Set-Cookie):**

```
accessToken=<jwt>; HttpOnly; Secure; SameSite=Strict; Max-Age=900
refreshToken=<jwt>; HttpOnly; Secure; SameSite=Strict; Max-Age=604800
```

**Error Responses:**

```json
// 401 Unauthorized - Credenciais inválidas
{
  "error": "Invalid credentials"
}

// 400 Bad Request - Validação falhou
{
  "error": "Validation failed",
  "details": [...]
}

// 429 Too Many Requests
{
  "error": "Too many requests. Please try again later."
}
```

**Rate Limit:** 5 requisições por minuto por IP

---

#### POST /auth/refresh

Renova os tokens de acesso usando o refresh token.

**Request:** Nenhum body necessário. O refresh token é lido automaticamente dos cookies.

**Success Response (200 OK):**

```json
{
  "message": "Tokens refreshed successfully"
}
```

**Headers (Set-Cookie):**

```
accessToken=<new_jwt>; HttpOnly; Secure; SameSite=Strict; Max-Age=900
refreshToken=<new_jwt>; HttpOnly; Secure; SameSite=Strict; Max-Age=604800
```

**Error Responses:**

```json
// 401 Unauthorized - Token inválido ou expirado
{
  "error": "Invalid or expired refresh token"
}

// 401 Unauthorized - Token não encontrado
{
  "error": "Refresh token not found"
}
```

**Nota:** Este endpoint é geralmente chamado automaticamente pelo middleware quando o access token expira.

---

### Banks

#### GET /banks

Retorna a lista de bancos disponíveis para conexão.

**Authentication:** Não requerida

**Success Response (200 OK):**

```json
{
  "banks": [
    {
      "id": "itau",
      "name": "Itaú Unibanco",
      "logo": "🏦"
    },
    {
      "id": "bradesco",
      "name": "Bradesco",
      "logo": "🏦"
    },
    {
      "id": "santander",
      "name": "Santander",
      "logo": "🏦"
    },
    {
      "id": "bb",
      "name": "Banco do Brasil",
      "logo": "🏦"
    },
    {
      "id": "nubank",
      "name": "Nubank",
      "logo": "💜"
    },
    {
      "id": "inter",
      "name": "Banco Inter",
      "logo": "🧡"
    }
  ]
}
```

**Cache:** Resposta é cacheada por 24 horas

---

### Open Finance

#### POST /of/connect

Inicia o fluxo de conexão OAuth com uma instituição financeira.

**Authentication:** Requerida

**Request Body:**

```json
{
  "institution": "itau"
}
```

**Success Response (200 OK):**

```json
{
  "redirectUrl": "https://api.openfinance.example.com/auth?client_id=...&redirect_uri=...&state=...",
  "state": "eyJ1c2VySWQiOiJjbHgxMjM0NTY3ODkwIiwiaW5zdGl0dXRpb24iOiJpdGF1IiwidGltZXN0YW1wIjoxNjk3NDU2Nzg5fQ"
}
```

**Error Responses:**

```json
// 400 Bad Request - Validação falhou
{
  "error": "Validation failed",
  "details": [...]
}

// 401 Unauthorized - Não autenticado
{
  "error": "Unauthorized"
}

// 500 Internal Server Error - Configuração ausente
{
  "error": "Open Finance integration not configured"
}
```

**Fluxo:**

1. Cliente chama este endpoint
2. Recebe `redirectUrl`
3. Redireciona usuário para `redirectUrl`
4. Usuário autentica no banco
5. Banco redireciona para `/of/callback` com código de autorização

---

#### POST /of/exchange

Troca o código de autorização por tokens de acesso e inicia sincronização.

**Authentication:** Requerida

**Request Body:**

```json
{
  "code": "auth_code_from_bank",
  "state": "eyJ1c2VySWQiOiJjbHgxMjM0NTY3ODkwIiwiaW5zdGl0dXRpb24iOiJpdGF1IiwidGltZXN0YW1wIjoxNjk3NDU2Nzg5fQ"
}
```

**Success Response (200 OK):**

```json
{
  "success": true,
  "connectionId": "clx9876543210",
  "message": "Connection established successfully"
}
```

**Error Responses:**

```json
// 400 Bad Request - State inválido
{
  "error": "Invalid state parameter"
}

// 400 Bad Request - State não corresponde ao usuário
{
  "error": "State validation failed"
}

// 401 Unauthorized
{
  "error": "Unauthorized"
}

// 502 Bad Gateway - Falha na troca de código
{
  "error": "Failed to exchange authorization code"
}
```

**Nota:** Este endpoint inicia automaticamente a sincronização inicial de dados em background.

---

#### POST /of/sync

Sincroniza manualmente os dados de uma conexão.

**Authentication:** Requerida

**Request Body:**

```json
{
  "connectionId": "clx9876543210"
}
```

**Success Response (200 OK):**

```json
{
  "success": true,
  "synced": 45,
  "accountsUpdated": 3,
  "lastSync": "2024-10-16T10:30:00.000Z"
}
```

**Error Responses:**

```json
// 400 Bad Request - Conexão desconectada
{
  "error": "Connection is disconnected"
}

// 400 Bad Request - Conexão expirada
{
  "error": "Connection expired",
  "message": "Please reconnect your account"
}

// 404 Not Found - Conexão não encontrada
{
  "error": "Connection not found or access denied"
}

// 429 Too Many Requests - Rate limit
{
  "error": "Too many requests. Please try again later."
}

// 500 Internal Server Error
{
  "error": "Sync failed. Please try again later."
}
```

**Rate Limit:** 1 sincronização por minuto por conexão

---

### Dashboard

#### GET /dashboard

Retorna dados consolidados do dashboard do usuário.

**Authentication:** Requerida

**Query Parameters:**

| Parâmetro | Tipo   | Obrigatório | Padrão | Descrição                                  |
| --------- | ------ | ----------- | ------ | ------------------------------------------ |
| `cursor`  | string | Não         | -      | ID da última transação para paginação      |
| `limit`   | number | Não         | 30     | Número de transações por página (max: 100) |

**Success Response (200 OK):**

```json
{
  "consolidatedBalance": {
    "total": 15750.5,
    "currency": "BRL",
    "byType": {
      "CHECKING": 5000.0,
      "SAVINGS": 10000.0,
      "CREDIT_CARD": 750.5
    }
  },
  "accounts": [
    {
      "id": "clx1111111111",
      "name": "Conta Corrente",
      "accountType": "CHECKING",
      "accountNumber": "12345-6",
      "balance": 5000.0,
      "currency": "BRL",
      "institutionName": "Itaú",
      "lastSync": "2024-10-16T10:00:00.000Z",
      "status": "ACTIVE",
      "connectionId": "clx9876543210"
    }
  ],
  "transactions": {
    "data": [
      {
        "id": "clx2222222222",
        "type": "DEBIT",
        "amount": 150.0,
        "description": "UBER *TRIP",
        "category": "Transporte",
        "date": "2024-10-15T18:30:00.000Z",
        "accountName": "Conta Corrente",
        "accountType": "CHECKING",
        "institutionName": "Itaú"
      }
    ],
    "pagination": {
      "cursor": null,
      "nextCursor": "clx2222222222",
      "limit": 30,
      "total": 150,
      "hasMore": true
    }
  }
}
```

**Error Responses:**

```json
// 400 Bad Request - Parâmetros inválidos
{
  "error": "Invalid query parameters",
  "details": [...]
}

// 401 Unauthorized
{
  "error": "Unauthorized"
}

// 500 Internal Server Error
{
  "error": "Failed to fetch accounts"
}
```

**Cache:** Resposta inicial (sem cursor) é cacheada por 5 minutos

**Paginação:**

Para buscar a próxima página de transações:

```
GET /dashboard?cursor=clx2222222222&limit=30
```

---

## Códigos de Erro

### Códigos HTTP

| Código | Significado           | Descrição                         |
| ------ | --------------------- | --------------------------------- |
| 200    | OK                    | Requisição bem-sucedida           |
| 201    | Created               | Recurso criado com sucesso        |
| 400    | Bad Request           | Dados de entrada inválidos        |
| 401    | Unauthorized          | Autenticação necessária ou falhou |
| 403    | Forbidden             | Acesso negado                     |
| 404    | Not Found             | Recurso não encontrado            |
| 409    | Conflict              | Conflito (ex: email já existe)    |
| 429    | Too Many Requests     | Rate limit excedido               |
| 500    | Internal Server Error | Erro no servidor                  |
| 502    | Bad Gateway           | Erro em serviço externo           |

### Estrutura de Erro

Todos os erros seguem o formato:

```json
{
  "error": "Mensagem de erro legível",
  "details": [] // Opcional: detalhes adicionais (ex: erros de validação)
}
```

### Erros de Validação (Zod)

```json
{
  "error": "Validation failed",
  "details": [
    {
      "code": "too_small",
      "minimum": 8,
      "type": "string",
      "path": ["password"],
      "message": "Password must be at least 8 characters"
    },
    {
      "code": "invalid_string",
      "validation": "email",
      "path": ["email"],
      "message": "Invalid email format"
    }
  ]
}
```

## Rate Limiting

### Limites por Endpoint

| Endpoint         | Limite        | Janela   | Identificador |
| ---------------- | ------------- | -------- | ------------- |
| `/auth/register` | 5 requisições | 1 minuto | IP            |
| `/auth/login`    | 5 requisições | 1 minuto | IP            |
| `/of/sync`       | 1 requisição  | 1 minuto | Connection ID |

### Headers de Rate Limit

Quando o rate limit é excedido, a resposta inclui:

```
X-RateLimit-Limit: 5
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1697456789
```

### Resposta de Rate Limit

```json
{
  "error": "Too many requests. Please try again later."
}
```

## Exemplos de Uso

### Exemplo 1: Registro e Login

```javascript
// 1. Registrar novo usuário
const registerResponse = await fetch(
  "http://localhost:3000/api/v1/auth/register",
  {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: "joao@example.com",
      password: "securepass123",
      firstName: "João",
      lastName: "Silva",
    }),
  }
);

const registerData = await registerResponse.json();
console.log(registerData);
// { message: "User created successfully", user: {...} }

// 2. Fazer login
const loginResponse = await fetch("http://localhost:3000/api/v1/auth/login", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  credentials: "include", // Importante para cookies
  body: JSON.stringify({
    email: "joao@example.com",
    password: "securepass123",
  }),
});

const loginData = await loginResponse.json();
console.log(loginData);
// { message: "Login successful", user: {...} }
// Cookies são automaticamente armazenados pelo navegador
```

### Exemplo 2: Conectar Banco

```javascript
// 1. Buscar lista de bancos
const banksResponse = await fetch("http://localhost:3000/api/v1/banks");
const banksData = await banksResponse.json();
console.log(banksData.banks);

// 2. Iniciar conexão com banco
const connectResponse = await fetch("http://localhost:3000/api/v1/of/connect", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  credentials: "include",
  body: JSON.stringify({
    institution: "itau",
  }),
});

const connectData = await connectResponse.json();
console.log(connectData);
// { redirectUrl: "https://...", state: "..." }

// 3. Redirecionar usuário para o banco
window.location.href = connectData.redirectUrl;

// 4. Após callback, trocar código por token
// (Isso é feito automaticamente pela página /of/callback)
const exchangeResponse = await fetch(
  "http://localhost:3000/api/v1/of/exchange",
  {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify({
      code: "auth_code_from_url",
      state: "state_from_url",
    }),
  }
);

const exchangeData = await exchangeResponse.json();
console.log(exchangeData);
// { success: true, connectionId: "...", message: "..." }
```

### Exemplo 3: Buscar Dashboard

```javascript
// 1. Buscar dados do dashboard
const dashboardResponse = await fetch(
  "http://localhost:3000/api/v1/dashboard",
  {
    credentials: "include",
  }
);

const dashboardData = await dashboardResponse.json();
console.log(dashboardData);
// { consolidatedBalance: {...}, accounts: [...], transactions: {...} }

// 2. Buscar próxima página de transações
const nextPageResponse = await fetch(
  `http://localhost:3000/api/v1/dashboard?cursor=${dashboardData.transactions.pagination.nextCursor}&limit=30`,
  {
    credentials: "include",
  }
);

const nextPageData = await nextPageResponse.json();
console.log(nextPageData.transactions.data);
```

### Exemplo 4: Sincronização Manual

```javascript
// Sincronizar uma conexão específica
const syncResponse = await fetch("http://localhost:3000/api/v1/of/sync", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  credentials: "include",
  body: JSON.stringify({
    connectionId: "clx9876543210",
  }),
});

const syncData = await syncResponse.json();
console.log(syncData);
// { success: true, synced: 45, accountsUpdated: 3, lastSync: "..." }
```

### Exemplo 5: Tratamento de Erros

```javascript
async function loginUser(email, password) {
  try {
    const response = await fetch("http://localhost:3000/api/v1/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      // Tratar diferentes tipos de erro
      switch (response.status) {
        case 400:
          console.error("Dados inválidos:", data.details);
          break;
        case 401:
          console.error("Credenciais inválidas");
          break;
        case 429:
          console.error("Muitas tentativas. Tente novamente mais tarde.");
          break;
        default:
          console.error("Erro desconhecido:", data.error);
      }
      throw new Error(data.error);
    }

    return data;
  } catch (error) {
    console.error("Erro na requisição:", error);
    throw error;
  }
}
```

## Segurança

### Cookies

Todos os cookies de autenticação são configurados com:

- `HttpOnly`: Não acessível via JavaScript
- `Secure`: Apenas HTTPS (em produção)
- `SameSite=Strict`: Proteção contra CSRF

### HTTPS

Em produção, todas as requisições devem usar HTTPS.

### CORS

A API aceita requisições apenas de origens configuradas.

### Criptografia

- Senhas: bcrypt com salt round 12
- Tokens Open Finance: AES-256 encryption
- Tokens JWT: Assinados com secrets seguros

## Versionamento

A API usa versionamento via URL (`/api/v1/`). Mudanças breaking serão introduzidas em novas versões (`/api/v2/`).

## Suporte

Para dúvidas ou problemas com a API:

- Abra uma issue no repositório
- Entre em contato com a equipe de desenvolvimento

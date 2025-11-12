# Appwrite Functions

Este diretório contém as funções serverless do Appwrite para o projeto Horizon AI.

## Funções Disponíveis

### 1. Balance Sync (`balance-sync/`)

Gerencia automaticamente o saldo das contas baseado nas transações.

**Funcionalidades**:

- Sincroniza saldo quando transações são criadas/editadas/removidas
- Processa transações futuras diariamente às 20:00
- Ignora transações futuras no cálculo do saldo
- Ignora transações de cartão de crédito

**Triggers**:

- Eventos: `transactions.*.create`, `transactions.*.update`, `transactions.*.delete`
- Schedule: Diariamente às 20:00 (cron: `0 20 * * *`)

**Documentação**: Ver [balance-sync/README.md](./balance-sync/README.md)

**Deploy**: Ver [balance-sync/DEPLOYMENT.md](./balance-sync/DEPLOYMENT.md)

## Estrutura

```
functions/
├── README.md                    # Este arquivo
└── balance-sync/               # Função de sincronização de saldo
    ├── src/
    │   └── main.ts            # Código principal
    ├── package.json           # Dependências
    ├── tsconfig.json          # Config TypeScript
    ├── deploy.sh              # Script de deploy
    ├── appwrite.json.example  # Config Appwrite CLI
    ├── DEPLOYMENT.md          # Guia de deploy
    └── README.md              # Documentação
```

## Como Adicionar Novas Funções

1. Crie uma nova pasta com o nome da função:

   ```bash
   mkdir functions/nome-da-funcao
   cd functions/nome-da-funcao
   ```

2. Inicialize o projeto Node.js:

   ```bash
   npm init -y
   ```

3. Instale dependências:

   ```bash
   npm install node-appwrite
   npm install -D typescript @types/node
   ```

4. Crie a estrutura:

   ```
   nome-da-funcao/
   ├── src/
   │   └── main.ts
   ├── package.json
   ├── tsconfig.json
   └── README.md
   ```

5. Implemente a função em `src/main.ts`:

   ```typescript
   export default async ({ req, res, log, error }: any) => {
     try {
       log('Function started');

       // Seu código aqui

       return res.json({
         success: true,
         message: 'Function executed successfully',
       });
     } catch (err: any) {
       error('Function error:', err);
       return res.json(
         {
           success: false,
           error: err.message,
         },
         500,
       );
     }
   };
   ```

6. Configure no Appwrite Console e faça deploy

## Boas Práticas

### 1. Estrutura de Código

- Use TypeScript para type safety
- Separe lógica de negócio em funções auxiliares
- Mantenha o código limpo e bem documentado
- Use async/await para operações assíncronas

### 2. Tratamento de Erros

```typescript
try {
  // Código principal
} catch (err: any) {
  error('Detailed error message:', err);
  return res.json({
    success: false,
    error: err.message || 'Unknown error'
  }, 500);
}
```

### 3. Logging

```typescript
log('Info message');
error('Error message');
```

### 4. Variáveis de Ambiente

- Use `process.env.VARIABLE_NAME` para acessar
- Configure no Appwrite Console
- Nunca commite valores sensíveis no código

### 5. Timeout

- Configure timeout adequado (padrão: 15s, máximo: 900s)
- Otimize código para executar rapidamente
- Use paginação para grandes volumes de dados

### 6. Testes

- Teste localmente antes de fazer deploy
- Use execução manual para testes
- Monitore logs após deploy

## Deploy

### Via Appwrite Console (Recomendado)

1. Prepare o código:

   ```bash
   cd functions/nome-da-funcao
   npm install
   npm run build
   tar -czf nome-da-funcao.tar.gz src/ package.json tsconfig.json
   ```

2. Faça upload no Appwrite Console:
   - Functions > Create Function
   - Configure runtime, entrypoint, etc.
   - Upload do arquivo tar.gz
   - Configure variáveis de ambiente
   - Configure triggers

### Via Appwrite CLI

1. Instale o CLI:

   ```bash
   npm install -g appwrite-cli
   ```

2. Login:

   ```bash
   appwrite login
   ```

3. Deploy:
   ```bash
   cd functions/nome-da-funcao
   appwrite deploy function
   ```

## Monitoramento

### Logs

Acesse logs no Appwrite Console:

- Functions > [Nome da Função] > Executions
- Clique em uma execução para ver logs detalhados

### Métricas

Monitore:

- Taxa de sucesso
- Tempo de execução
- Frequência de execução
- Erros

### Alertas

Configure alertas para:

- Taxa de erro > 5%
- Timeout frequente
- Falhas consecutivas

## Troubleshooting

### Build Falhou

1. Verifique `package.json` e dependências
2. Teste build local: `npm install && npm run build`
3. Verifique logs de build no Console

### Função Não Executa

1. Verifique triggers configurados
2. Verifique variáveis de ambiente
3. Verifique permissões da API Key
4. Verifique logs de erro

### Timeout

1. Aumente timeout nas configurações
2. Otimize código
3. Use paginação
4. Divida em múltiplas execuções

### Erro de Permissão

1. Verifique API Key
2. Verifique scopes necessários
3. Crie nova API Key se necessário

## Recursos

- [Appwrite Functions Documentation](https://appwrite.io/docs/products/functions)
- [Appwrite Functions Quick Start](https://appwrite.io/docs/products/functions/quick-start)
- [Appwrite Functions Runtimes](https://appwrite.io/docs/products/functions/runtimes)
- [Appwrite CLI Documentation](https://appwrite.io/docs/command-line)
- [Node.js Runtime](https://appwrite.io/docs/products/functions/runtimes#node)

## Suporte

Para dúvidas ou problemas:

1. Consulte a documentação oficial do Appwrite
2. Verifique os logs de execução
3. Revise a configuração da função
4. Teste localmente antes de fazer deploy

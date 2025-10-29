# Edição/Exclusão em Massa de Parcelas

## Visão Geral

Ao editar ou excluir uma transação parcelada, o sistema oferece a opção de aplicar a mesma alteração para todas as parcelas futuras, facilitando o gerenciamento de compras parceladas.

## Como Funciona

### Detecção Automática

O sistema detecta automaticamente se uma transação é parcelada verificando:

- `installments > 1`: Transação tem mais de uma parcela
- `installment < installments`: Existem parcelas futuras

### Cálculo de Parcelas Restantes

```typescript
const remainingInstallments = installments - installment;
```

**Exemplo:**

- Parcela atual: 3
- Total de parcelas: 12
- Parcelas restantes: 9

## Interface do Usuário

### Edição de Parcela

Quando você edita uma parcela, aparece um checkbox:

```
┌────────────────────────────────────────────────────────┐
│  Editar Transação                                  [X] │
├────────────────────────────────────────────────────────┤
│                                                        │
│  Cartão: Nubank                                        │
│  Final 1234                                            │
│  ⚠️ Parcela 3 de 12                                    │
│                                                        │
│  [Campos de edição...]                                 │
│                                                        │
│  ┌──────────────────────────────────────────────────┐ │
│  │ ☑ Aplicar para as próximas parcelas              │ │
│  │   Esta alteração será aplicada para as 9         │ │
│  │   parcela(s) restante(s) desta compra            │ │
│  └──────────────────────────────────────────────────┘ │
│                                                        │
│  [Botões de ação...]                                   │
└────────────────────────────────────────────────────────┘
```

### Exclusão de Parcela

Quando você exclui uma parcela, aparece um checkbox na confirmação:

```
┌────────────────────────────────────────────────────────┐
│  ⚠️ Tem certeza que deseja excluir esta transação?     │
│                                                        │
│  Esta ação não pode ser desfeita.                     │
│                                                        │
│  ┌──────────────────────────────────────────────────┐ │
│  │ ☑ Excluir também as próximas parcelas            │ │
│  │   Serão excluídas 9 parcela(s) restante(s)      │ │
│  └──────────────────────────────────────────────────┘ │
│                                                        │
│  [Cancelar]  [Confirmar Exclusão]                     │
└────────────────────────────────────────────────────────┘
```

## Casos de Uso

### Caso 1: Corrigir Valor de Todas as Parcelas

**Situação:** Você parcelou R$ 1.200,00 em 12x de R$ 100,00, mas o valor correto era R$ 1.320,00 (12x de R$ 110,00)

**Passos:**

1. Editar a parcela atual (ex: parcela 3)
2. Alterar valor de R$ 100,00 para R$ 110,00
3. ☑ Marcar "Aplicar para as próximas parcelas"
4. Salvar

**Resultado:**

- Parcela 3: R$ 110,00 ✓
- Parcela 4: R$ 110,00 ✓
- Parcela 5: R$ 110,00 ✓
- ... até parcela 12: R$ 110,00 ✓
- Parcelas 1 e 2 permanecem R$ 100,00 (já foram pagas)

### Caso 2: Mudar Categoria de Todas as Parcelas

**Situação:** Categorizou como "Compras" mas deveria ser "Educação"

**Passos:**

1. Editar qualquer parcela
2. Mudar categoria para "Educação"
3. ☑ Marcar "Aplicar para as próximas parcelas"
4. Salvar

**Resultado:**

- Todas as parcelas futuras agora são "Educação"
- Parcelas anteriores mantêm categoria original

### Caso 3: Cancelar Compra Parcelada

**Situação:** Você cancelou a compra e conseguiu estorno de todas as parcelas restantes

**Passos:**

1. Editar a parcela atual
2. Clicar em "Excluir"
3. ☑ Marcar "Excluir também as próximas parcelas"
4. Confirmar exclusão

**Resultado:**

- Parcela atual: Excluída ✓
- Todas as parcelas futuras: Excluídas ✓
- Parcelas já pagas: Permanecem (não são afetadas)

### Caso 4: Atualizar Descrição de Todas as Parcelas

**Situação:** Quer adicionar mais detalhes na descrição

**Passos:**

1. Editar qualquer parcela
2. Atualizar descrição
3. ☑ Marcar "Aplicar para as próximas parcelas"
4. Salvar

**Resultado:**

- Todas as parcelas futuras têm a nova descrição

### Caso 5: Editar Apenas Uma Parcela

**Situação:** Quer corrigir apenas a parcela atual, sem afetar as outras

**Passos:**

1. Editar a parcela
2. Fazer as alterações
3. ☐ **NÃO** marcar "Aplicar para as próximas parcelas"
4. Salvar

**Resultado:**

- Apenas a parcela atual é alterada
- Outras parcelas permanecem inalteradas

## Lógica de Identificação

### Como o Sistema Identifica Parcelas da Mesma Compra

O sistema usa três campos para identificar parcelas relacionadas:

```typescript
{
  credit_card_id: "card_123",              // Mesmo cartão
  credit_card_transaction_created_at: "2025-10-15", // Mesma data de compra
  installment: 3,                          // Parcela atual
  installments: 12                         // Total de parcelas
}
```

### Query para Buscar Parcelas Futuras

```typescript
const futureInstallments = await databases.listDocuments(DATABASE_ID, COLLECTIONS.TRANSACTIONS, [
  Query.equal('user_id', userId),
  Query.equal('credit_card_id', creditCardId),
  Query.equal('credit_card_transaction_created_at', purchaseDate),
  Query.greaterThan('installment', currentInstallment),
  Query.limit(100),
]);
```

## API Endpoints

### PATCH /api/transactions/:id

Atualiza uma transação e opcionalmente as parcelas futuras.

**Request Body:**

```json
{
  "amount": 110.0,
  "category": "Educação",
  "description": "Curso online - Atualizado",
  "applyToFutureInstallments": true,
  "creditCardId": "card_123",
  "purchaseDate": "2025-10-15"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "$id": "trans_123",
    "amount": 110.0,
    "category": "Educação",
    "installment": 3,
    "installments": 12
  },
  "futureInstallmentsUpdated": true
}
```

### DELETE /api/transactions/:id

Exclui uma transação e opcionalmente as parcelas futuras.

**Query Parameters:**

- `applyToFutureInstallments=true`
- `creditCardId=card_123`
- `purchaseDate=2025-10-15`

**Request:**

```
DELETE /api/transactions/trans_123?applyToFutureInstallments=true&creditCardId=card_123&purchaseDate=2025-10-15
```

**Response:**

```json
{
  "success": true,
  "message": "Transactions deleted successfully",
  "deletedCount": 10
}
```

## Comportamento Detalhado

### Edição

#### Checkbox Desmarcado (Padrão)

- ✅ Apenas a transação atual é atualizada
- ❌ Parcelas futuras não são afetadas
- ❌ Parcelas anteriores não são afetadas

#### Checkbox Marcado

- ✅ Transação atual é atualizada
- ✅ Todas as parcelas futuras são atualizadas
- ❌ Parcelas anteriores não são afetadas

### Exclusão

#### Checkbox Desmarcado (Padrão)

- ✅ Apenas a transação atual é excluída
- ❌ Parcelas futuras não são afetadas
- ❌ Parcelas anteriores não são afetadas

#### Checkbox Marcado

- ✅ Transação atual é excluída
- ✅ Todas as parcelas futuras são excluídas
- ❌ Parcelas anteriores não são afetadas

## Campos Afetados

Quando você marca "Aplicar para as próximas parcelas", os seguintes campos são atualizados:

### ✅ Campos Atualizados

- `amount` - Valor da parcela
- `category` - Categoria
- `description` - Descrição
- `merchant` - Estabelecimento
- `date` - Data (ajustada para cada parcela)

### ❌ Campos NÃO Atualizados

- `installment` - Número da parcela (único para cada)
- `installments` - Total de parcelas (mantido)
- `credit_card_transaction_created_at` - Data original da compra (mantida)
- `$id` - ID único de cada transação

## Validações

### Antes de Aplicar às Parcelas Futuras

1. **Verificar se é parcelada:**

   ```typescript
   if (installments > 1)
   ```

2. **Verificar se há parcelas futuras:**

   ```typescript
   if (installment < installments)
   ```

3. **Calcular parcelas restantes:**

   ```typescript
   const remaining = installments - installment;
   ```

4. **Validar dados da compra:**
   ```typescript
   if (creditCardId && purchaseDate)
   ```

## Mensagens de Feedback

### Sucesso - Edição

**Uma parcela:**

```
✓ Transação atualizada com sucesso
```

**Múltiplas parcelas:**

```
✓ Transação e 9 parcelas futuras atualizadas com sucesso
```

### Sucesso - Exclusão

**Uma parcela:**

```
✓ Transaction deleted successfully
```

**Múltiplas parcelas:**

```
✓ Transactions deleted successfully (10 parcelas excluídas)
```

### Erro

```
⚠️ Erro ao atualizar parcelas futuras
Algumas parcelas podem não ter sido atualizadas
```

## Segurança

### Verificações de Autorização

1. **Usuário autenticado:**

   ```typescript
   if (!userId) return 401;
   ```

2. **Proprietário da transação:**

   ```typescript
   if (transaction.user_id !== userId) return 403;
   ```

3. **Mesmo cartão:**

   ```typescript
   Query.equal('credit_card_id', creditCardId);
   ```

4. **Mesma data de compra:**
   ```typescript
   Query.equal('credit_card_transaction_created_at', purchaseDate);
   ```

## Performance

### Otimizações

1. **Limite de parcelas:**

   ```typescript
   Query.limit(100); // Máximo de 100 parcelas
   ```

2. **Processamento assíncrono:**

   ```typescript
   // Não bloqueia a resposta principal
   try {
     await updateFutureInstallments();
   } catch (error) {
     // Log error but don't fail main update
   }
   ```

3. **Query otimizada:**
   - Índices em `credit_card_id`
   - Índices em `credit_card_transaction_created_at`
   - Índices em `installment`

## Limitações

### Parcelas Anteriores

- ❌ Não é possível editar parcelas anteriores em massa
- ✅ Apenas parcelas futuras são afetadas
- **Motivo:** Parcelas anteriores podem já ter sido pagas

### Máximo de Parcelas

- Limite: 100 parcelas por operação
- **Motivo:** Performance e timeout de API

### Campos Imutáveis

- `installment` - Número da parcela não muda
- `credit_card_transaction_created_at` - Data original não muda
- `$id` - ID único não muda

## Testes

### Teste 1: Editar Valor de Parcelas Futuras

1. Criar compra parcelada (12x de R$ 100,00)
2. Editar parcela 3
3. Alterar valor para R$ 110,00
4. Marcar checkbox
5. Salvar
6. Verificar que parcelas 4-12 têm R$ 110,00

### Teste 2: Excluir Parcelas Futuras

1. Criar compra parcelada (12x)
2. Editar parcela 3
3. Clicar em excluir
4. Marcar checkbox
5. Confirmar
6. Verificar que parcelas 3-12 foram excluídas

### Teste 3: Editar Sem Afetar Futuras

1. Criar compra parcelada (12x)
2. Editar parcela 3
3. Alterar valor
4. **NÃO** marcar checkbox
5. Salvar
6. Verificar que apenas parcela 3 mudou

### Teste 4: Última Parcela

1. Criar compra parcelada (12x)
2. Editar parcela 12 (última)
3. Verificar que checkbox **NÃO** aparece
4. Salvar
5. Verificar que apenas parcela 12 mudou

## Troubleshooting

### Problema: Checkbox não aparece

**Causa:** Não há parcelas futuras

**Solução:** Verificar se `installment < installments`

### Problema: Algumas parcelas não foram atualizadas

**Causa:** Erro durante processamento

**Solução:** Verificar logs do servidor e tentar novamente

### Problema: Parcelas anteriores foram afetadas

**Causa:** Bug no código (não deveria acontecer)

**Solução:** Verificar query `greaterThan('installment', currentInstallment)`

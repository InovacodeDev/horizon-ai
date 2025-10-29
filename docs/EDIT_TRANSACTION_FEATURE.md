# Funcionalidade de Edição de Transações

## Visão Geral

Permite editar ou excluir transações diretamente da tela de Faturas do Cartão de Crédito, facilitando correções e ajustes quando necessário.

## Como Usar

### 1. Acessar a Edição

Na tabela de transações, ao passar o mouse sobre uma linha, um ícone de edição (✏️) aparece no canto direito:

```
┌─────────────────────────────────────────────────────────────┐
│ Netflix Premium │ 15/11 │ Lazer │ Recorrente │ R$ 49,90 [✏️] │
└─────────────────────────────────────────────────────────────┘
                                                          ↑
                                                   Aparece ao hover
```

### 2. Modal de Edição

Ao clicar no ícone, abre um modal com todos os campos editáveis:

```
┌────────────────────────────────────────────────────────┐
│  Editar Transação                                  [X] │
├────────────────────────────────────────────────────────┤
│                                                        │
│  Cartão: Nubank                                        │
│  Final 1234                                            │
│  ⚠️ Esta é uma assinatura recorrente                   │
│                                                        │
│  Valor *                                               │
│  ┌──────────────────────────────────────────────────┐ │
│  │ R$ 49,90                                         │ │
│  └──────────────────────────────────────────────────┘ │
│                                                        │
│  Categoria *                                           │
│  ┌──────────────────────────────────────────────────┐ │
│  │ Lazer                                            │ │
│  └──────────────────────────────────────────────────┘ │
│                                                        │
│  Estabelecimento                                       │
│  ┌──────────────────────────────────────────────────┐ │
│  │ Netflix                                          │ │
│  └──────────────────────────────────────────────────┘ │
│                                                        │
│  Descrição                                             │
│  ┌──────────────────────────────────────────────────┐ │
│  │ Netflix Premium                                  │ │
│  └──────────────────────────────────────────────────┘ │
│                                                        │
│  Data *                                                │
│  ┌──────────────────────────────────────────────────┐ │
│  │ 2025-11-15                                       │ │
│  └──────────────────────────────────────────────────┘ │
│                                                        │
│  ┌──────────┐  ┌──────────┐  ┌──────────────────┐   │
│  │ Excluir  │  │ Cancelar │  │ Salvar           │   │
│  └──────────┘  └──────────┘  └──────────────────┘   │
│                                                        │
└────────────────────────────────────────────────────────┘
```

## Campos Editáveis

### 1. Valor

- Máscara de moeda automática (R$ 0,00)
- Funciona da segunda casa decimal
- Validação: deve ser maior que zero

### 2. Categoria

- Dropdown com categorias predefinidas:
  - Alimentação
  - Transporte
  - Saúde
  - Educação
  - Lazer
  - Compras
  - Serviços
  - Viagem
  - Outros

### 3. Estabelecimento

- Campo de texto livre
- Opcional
- Exemplo: "Netflix", "Supermercado Extra"

### 4. Descrição

- Campo de texto multilinha
- Opcional
- Exemplo: "Netflix Premium", "Compras do mês"

### 5. Data

- Seletor de data
- Obrigatório
- Formato: YYYY-MM-DD

## Avisos Especiais

### Assinatura Recorrente

```
⚠️ Esta é uma assinatura recorrente
```

Indica que a transação é uma assinatura que se repete mensalmente.

### Parcela

```
⚠️ Parcela 3 de 12
```

Indica que a transação faz parte de um parcelamento.

## Funcionalidade de Exclusão

### 1. Botão Excluir

Localizado no canto inferior esquerdo do modal:

```
┌──────────┐
│ 🗑 Excluir │
└──────────┘
```

### 2. Confirmação de Exclusão

Ao clicar em "Excluir", aparece uma confirmação:

```
┌────────────────────────────────────────────────────────┐
│  ⚠️ Tem certeza que deseja excluir esta transação?     │
│                                                        │
│  Esta ação não pode ser desfeita.                     │
│                                                        │
│  ┌──────────┐  ┌──────────────────────────────────┐  │
│  │ Cancelar │  │ Confirmar Exclusão               │  │
│  └──────────┘  └──────────────────────────────────┘  │
└────────────────────────────────────────────────────────┘
```

### 3. Exclusão Confirmada

Após confirmar:

- Transação é removida do banco de dados
- Fatura é recalculada automaticamente
- Lista de transações é atualizada
- Modal é fechado

## Casos de Uso

### Caso 1: Corrigir Valor Errado

**Situação:** Digitou R$ 49,90 mas era R$ 59,90

**Passos:**

1. Clicar no ícone de edição
2. Alterar o valor para R$ 59,90
3. Clicar em "Salvar"

**Resultado:**

- Valor atualizado na fatura
- Total da fatura recalculado

### Caso 2: Mudar Categoria

**Situação:** Categorizou como "Lazer" mas deveria ser "Educação"

**Passos:**

1. Clicar no ícone de edição
2. Selecionar "Educação" no dropdown
3. Clicar em "Salvar"

**Resultado:**

- Categoria atualizada
- Badge na tabela reflete a nova categoria

### Caso 3: Adicionar Descrição

**Situação:** Transação sem descrição clara

**Passos:**

1. Clicar no ícone de edição
2. Adicionar descrição detalhada
3. Clicar em "Salvar"

**Resultado:**

- Descrição aparece na tabela
- Facilita identificação futura

### Caso 4: Reembolso Recebido

**Situação:** Compra foi reembolsada pelo estabelecimento

**Passos:**

1. Clicar no ícone de edição
2. Clicar em "Excluir"
3. Confirmar exclusão

**Resultado:**

- Transação removida da fatura
- Total da fatura reduzido
- Limite disponível aumentado

### Caso 5: Duplicata

**Situação:** Transação foi lançada duas vezes por engano

**Passos:**

1. Identificar a duplicata
2. Clicar no ícone de edição na duplicata
3. Clicar em "Excluir"
4. Confirmar exclusão

**Resultado:**

- Duplicata removida
- Apenas uma transação permanece

### Caso 6: Data Incorreta

**Situação:** Data da transação está errada

**Passos:**

1. Clicar no ícone de edição
2. Alterar a data
3. Clicar em "Salvar"

**Resultado:**

- Data atualizada
- Transação pode mudar de fatura se a data cruzar o fechamento

## API Endpoints

### PATCH /api/transactions/:id

Atualiza uma transação existente.

**Request:**

```json
{
  "amount": 59.9,
  "category": "Educação",
  "description": "Curso online",
  "merchant": "Udemy",
  "date": "2025-11-15"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "$id": "trans_123",
    "amount": 59.9,
    "category": "Educação",
    "description": "Curso online",
    "merchant": "Udemy",
    "date": "2025-11-15T00:00:00.000Z",
    "updated_at": "2025-10-29T12:00:00.000Z"
  }
}
```

### DELETE /api/transactions/:id

Exclui uma transação.

**Response:**

```json
{
  "success": true,
  "message": "Transaction deleted successfully"
}
```

## Validações

### Valor

- ✅ Deve ser maior que zero
- ✅ Máximo de 2 casas decimais
- ❌ Não pode ser negativo
- ❌ Não pode ser vazio

### Categoria

- ✅ Deve ser uma das categorias predefinidas
- ❌ Não pode ser vazia

### Data

- ✅ Deve ser uma data válida
- ✅ Formato ISO 8601
- ❌ Não pode ser vazia

### Estabelecimento e Descrição

- ✅ Podem ser vazios (opcionais)
- ✅ Texto livre

## Comportamento Especial

### Assinaturas Recorrentes

Ao editar uma assinatura recorrente:

- ⚠️ Aviso especial é exibido
- Apenas a transação atual é editada
- Próximas cobranças mantêm os valores originais
- Para alterar todas as futuras, edite a transação original (primeira)

### Parcelas

Ao editar uma parcela:

- ⚠️ Aviso especial mostra qual parcela é
- Apenas a parcela atual é editada
- Outras parcelas não são afetadas
- Para alterar todas, edite cada uma individualmente

### Exclusão de Assinatura

Ao excluir uma assinatura recorrente:

- Apenas a transação atual é excluída
- Próximas cobranças continuam sendo criadas
- Para cancelar a assinatura, exclua a transação original

### Exclusão de Parcela

Ao excluir uma parcela:

- Apenas a parcela atual é excluída
- Outras parcelas não são afetadas
- Total parcelado não é recalculado

## Sincronização

### Saldo da Conta

Ao editar ou excluir uma transação:

- Saldo da conta é recalculado automaticamente
- Limite disponível do cartão é atualizado
- Mudanças refletem imediatamente

### Fatura

Ao editar ou excluir uma transação:

- Total da fatura é recalculado
- Subtotais das seções são atualizados
- Lista de transações é recarregada

## Estados de Loading

### Salvando

```
┌──────────────────┐
│ Salvando...      │
└──────────────────┘
```

### Excluindo

```
┌──────────────────┐
│ Excluindo...     │
└──────────────────┘
```

## Mensagens de Erro

### Erro ao Salvar

```
┌────────────────────────────────────────────────────────┐
│  ⚠️ Erro ao atualizar transação                        │
│  O valor deve ser maior que zero                       │
└────────────────────────────────────────────────────────┘
```

### Erro ao Excluir

```
┌────────────────────────────────────────────────────────┐
│  ⚠️ Erro ao excluir transação                          │
│  Transação não encontrada                              │
└────────────────────────────────────────────────────────┘
```

## Acessibilidade

- **Hover State:** Ícone de edição aparece ao passar o mouse
- **Keyboard:** Pode ser acessado via Tab
- **Screen Readers:** Botão tem atributo `title` descritivo
- **Focus:** Estados de foco visíveis em todos os campos
- **Confirmação:** Exclusão requer confirmação explícita

## Segurança

- **Autenticação:** Apenas usuário autenticado pode editar
- **Autorização:** Apenas transações do próprio usuário
- **Validação:** Todos os campos são validados no backend
- **Confirmação:** Exclusão requer confirmação dupla

## Performance

- **Otimização:** Apenas transação editada é recarregada
- **Cache:** Lista de transações é atualizada localmente
- **Debounce:** Não aplicado (ação única ao salvar)
- **Loading States:** Feedback visual durante operações

## Testes

### Teste 1: Editar Valor

1. Abrir modal de edição
2. Alterar valor de R$ 49,90 para R$ 59,90
3. Salvar
4. Verificar que valor foi atualizado na tabela

### Teste 2: Excluir Transação

1. Abrir modal de edição
2. Clicar em "Excluir"
3. Confirmar exclusão
4. Verificar que transação foi removida

### Teste 3: Cancelar Edição

1. Abrir modal de edição
2. Alterar campos
3. Clicar em "Cancelar"
4. Verificar que nada foi alterado

### Teste 4: Validação de Valor

1. Abrir modal de edição
2. Tentar salvar com valor zero
3. Verificar mensagem de erro

### Teste 5: Editar Assinatura

1. Editar uma assinatura recorrente
2. Verificar aviso especial
3. Salvar alterações
4. Verificar que apenas a transação atual foi alterada

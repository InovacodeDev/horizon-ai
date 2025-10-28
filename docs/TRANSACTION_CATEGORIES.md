# Sistema de Categorias de Transações

## Visão Geral

O sistema de categorias permite organizar e classificar transações de forma intuitiva, com ícones visuais e cores distintas para cada categoria.

## Categorias Disponíveis

### Despesas (Expense)

| ID              | Nome              | Ícone             | Cor           | Descrição                             |
| --------------- | ----------------- | ----------------- | ------------- | ------------------------------------- |
| `food`          | Alimentação       | UtensilsIcon      | Laranja       | Restaurantes, delivery, refeições     |
| `groceries`     | Supermercado      | ShoppingCartIcon  | Verde         | Compras de supermercado               |
| `transport`     | Transporte        | CarIcon           | Azul          | Combustível, transporte público, Uber |
| `housing`       | Moradia           | HomeIcon          | Roxo          | Aluguel, condomínio, IPTU             |
| `utilities`     | Contas            | ZapIcon           | Amarelo       | Água, luz, gás                        |
| `internet`      | Internet          | WifiIcon          | Ciano         | Internet banda larga                  |
| `phone`         | Telefone          | PhoneIcon         | Índigo        | Celular, telefone fixo                |
| `health`        | Saúde             | HeartIcon         | Vermelho      | Médicos, farmácia, plano de saúde     |
| `education`     | Educação          | GraduationCapIcon | Azul escuro   | Cursos, livros, mensalidade           |
| `entertainment` | Entretenimento    | FilmIcon          | Rosa          | Cinema, streaming, eventos            |
| `shopping`      | Compras           | ShoppingBagIcon   | Roxo escuro   | Roupas, eletrônicos, diversos         |
| `travel`        | Viagens           | PlaneIcon         | Verde-azulado | Passagens, hotéis, turismo            |
| `gifts`         | Presentes         | GiftIcon          | Rosa escuro   | Presentes para outras pessoas         |
| `coffee`        | Café & Lanches    | CoffeeIcon        | Âmbar         | Cafeterias, padarias, lanches         |
| `credit_card`   | Cartão de Crédito | CreditCardIcon    | Cinza         | Pagamento de fatura                   |
| `other_expense` | Outras Despesas   | SwapIcon          | Cinza claro   | Despesas não categorizadas            |

### Receitas (Income)

| ID             | Nome            | Ícone          | Cor            | Descrição                    |
| -------------- | --------------- | -------------- | -------------- | ---------------------------- |
| `salary`       | Salário         | BriefcaseIcon  | Verde escuro   | Salário mensal               |
| `freelance`    | Freelance       | DollarSignIcon | Esmeralda      | Trabalhos freelance          |
| `investment`   | Investimentos   | TrendingUpIcon | Azul escuro    | Rendimentos de investimentos |
| `bonus`        | Bônus           | GiftIcon       | Amarelo escuro | Bônus, 13º salário           |
| `refund`       | Reembolso       | SwapIcon       | Ciano escuro   | Reembolsos diversos          |
| `other_income` | Outras Receitas | DollarSignIcon | Verde          | Receitas não categorizadas   |

### Ambos (Both)

| ID         | Nome          | Ícone         | Cor           | Descrição                   |
| ---------- | ------------- | ------------- | ------------- | --------------------------- |
| `balance`  | Saldo Inicial | PiggyBankIcon | Índigo escuro | Saldo inicial da conta      |
| `transfer` | Transferência | SwapIcon      | Cinza escuro  | Transferências entre contas |

## Componentes

### CategorySelect

Componente de seleção de categoria com ícone visual.

```tsx
import CategorySelect from '@/components/ui/CategorySelect';

<CategorySelect
  label="Categoria"
  id="category"
  value={categoryId}
  onChange={(categoryId) => setCategory(categoryId)}
  type="expense" // 'expense', 'income', ou 'all'
  required
/>
```

**Props:**

- `label`: Texto do label (opcional)
- `id`: ID do elemento (opcional)
- `value`: ID da categoria selecionada
- `onChange`: Callback quando categoria muda
- `type`: Filtrar por tipo ('expense', 'income', 'all')
- `required`: Campo obrigatório (opcional)
- `className`: Classes CSS adicionais (opcional)

### CurrencyInput

Componente de input com máscara monetária brasileira (R$).

```tsx
import CurrencyInput from '@/components/ui/CurrencyInput';

<CurrencyInput
  label="Valor"
  id="amount"
  value={amount}
  onChange={(value) => setAmount(value)}
  required
/>
```

**Props:**

- `label`: Texto do label (opcional)
- `id`: ID do elemento (opcional)
- `value`: Valor numérico
- `onChange`: Callback quando valor muda
- `required`: Campo obrigatório (opcional)
- `placeholder`: Placeholder (opcional, padrão: "R$ 0,00")
- `className`: Classes CSS adicionais (opcional)
- `disabled`: Desabilitar input (opcional)

**Comportamento:**

- Formata automaticamente para moeda brasileira (R$ 1.234,56)
- Aceita apenas números
- Converte automaticamente centavos para reais
- Seleciona todo o texto ao focar para fácil edição

## Funções Auxiliares

### getCategoryById

Busca uma categoria pelo ID.

```typescript
import { getCategoryById } from '@/lib/constants/categories';

const category = getCategoryById('food');
// { id: 'food', name: 'Alimentação', icon: UtensilsIcon, type: 'expense', color: 'text-orange-500' }
```

### getCategoryByName

Busca uma categoria pelo nome (case-insensitive).

```typescript
import { getCategoryByName } from '@/lib/constants/categories';

const category = getCategoryByName('Alimentação');
```

### getExpenseCategories

Retorna todas as categorias de despesa.

```typescript
import { getExpenseCategories } from '@/lib/constants/categories';

const expenseCategories = getExpenseCategories();
```

### getIncomeCategories

Retorna todas as categorias de receita.

```typescript
import { getIncomeCategories } from '@/lib/constants/categories';

const incomeCategories = getIncomeCategories();
```

### getAllCategories

Retorna todas as categorias.

```typescript
import { getAllCategories } from '@/lib/constants/categories';

const allCategories = getAllCategories();
```

## Uso na Criação de Transações

```typescript
// Exemplo de criação de transação com categoria
await createTransaction({
  amount: 150.0,
  type: 'expense',
  category: 'food', // ID da categoria
  description: 'Almoço no restaurante',
  date: new Date().toISOString(),
  currency: 'BRL',
  account_id: accountId,
});
```

## Exibição de Categoria

```tsx
import { getCategoryById } from '@/lib/constants/categories';

const TransactionItem = ({ transaction }) => {
  const category = getCategoryById(transaction.category);
  const Icon = category?.icon || SwapIcon;

  return (
    <div>
      <Icon className={`w-5 h-5 ${category?.color}`} />
      <span>{category?.name || 'Sem categoria'}</span>
    </div>
  );
};
```

## Adicionar Nova Categoria

Para adicionar uma nova categoria, edite `lib/constants/categories.ts`:

```typescript
{
  id: 'nova_categoria',
  name: 'Nova Categoria',
  icon: NovoIcone,
  type: 'expense', // ou 'income' ou 'both'
  color: 'text-blue-500',
}
```

## Cores Disponíveis (Tailwind)

- `text-orange-500`, `text-green-500`, `text-blue-500`
- `text-purple-500`, `text-yellow-500`, `text-cyan-500`
- `text-indigo-500`, `text-red-500`, `text-pink-500`
- `text-teal-500`, `text-rose-500`, `text-amber-600`
- `text-gray-500`, `text-emerald-500`, `text-lime-500`

## Migração de Categorias Antigas

Se você tem transações com categorias antigas (texto livre), pode criar um script de migração:

```typescript
// Script de migração (exemplo)
const oldToNewCategoryMap = {
  Comida: 'food',
  Restaurante: 'food',
  Mercado: 'groceries',
  Uber: 'transport',
  // ... adicionar mais mapeamentos
};

// Migrar transações
for (const transaction of transactions) {
  const oldCategory = transaction.category;
  const newCategoryId = oldToNewCategoryMap[oldCategory] || 'other_expense';

  await updateTransaction(transaction.$id, {
    category: newCategoryId,
  });
}
```

## Boas Práticas

1. **Use IDs de categoria**: Sempre use o ID da categoria (ex: 'food') em vez do nome
2. **Valide categorias**: Verifique se a categoria existe antes de salvar
3. **Fallback**: Sempre tenha um fallback para categorias não encontradas
4. **Consistência**: Use as mesmas categorias em todo o sistema
5. **Ícones**: Mantenha os ícones consistentes com o tema da categoria

## Exemplos de Uso

### Formulário de Transação

```tsx
const [transaction, setTransaction] = useState({
  amount: 0,
  category: '',
  flow: 'expense',
});

<CategorySelect
  label="Categoria"
  value={transaction.category}
  onChange={(categoryId) => setTransaction({ ...transaction, category: categoryId })}
  type={transaction.flow}
  required
/>

<CurrencyInput
  label="Valor"
  value={transaction.amount}
  onChange={(value) => setTransaction({ ...transaction, amount: value })}
  required
/>
```

### Filtro de Categorias

```tsx
const [filter, setFilter] = useState({ category: 'all' });

<CategorySelect
  label="Filtrar por Categoria"
  value={filter.category}
  onChange={(categoryId) => setFilter({ ...filter, category: categoryId })}
  type="all"
/>
```

### Lista de Transações

```tsx
const transactions = [
  { id: '1', category: 'food', amount: 50.00 },
  { id: '2', category: 'transport', amount: 30.00 },
];

{transactions.map((tx) => {
  const category = getCategoryById(tx.category);
  const Icon = category?.icon || SwapIcon;

  return (
    <div key={tx.id}>
      <Icon className={`w-5 h-5 ${category?.color}`} />
      <span>{category?.name}</span>
      <span>R$ {tx.amount.toFixed(2)}</span>
    </div>
  );
})}
```

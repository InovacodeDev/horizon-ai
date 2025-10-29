# Testando a Máscara de Moeda

## Como Funciona

A máscara de moeda funciona da **segunda casa decimal em diante**, ou seja, todos os dígitos digitados são tratados como centavos inicialmente.

### Exemplos de Funcionamento

| Entrada   | Display      | Valor Real |
| --------- | ------------ | ---------- |
| (inicial) | R$ 0,00      | 0.00       |
| 7         | R$ 0,07      | 0.07       |
| 73        | R$ 0,73      | 0.73       |
| 730       | R$ 7,30      | 7.30       |
| 7305      | R$ 73,05     | 73.05      |
| 73050     | R$ 730,50    | 730.50     |
| 730500    | R$ 7.305,00  | 7305.00    |
| 7305000   | R$ 73.050,00 | 73050.00   |

### Sequência Completa de Teste

```
Inicial:  R$ 0,00
Digite 4: R$ 0,04
Digite 9: R$ 0,49
Digite 9: R$ 4,99
Digite 0: R$ 49,90
```

## Componentes Atualizados

### 1. CurrencyInput Component (`components/ui/CurrencyInput.tsx`)

Componente reutilizável para inputs de moeda.

**Uso:**

```tsx
import CurrencyInput from '@/components/ui/CurrencyInput';

<CurrencyInput
  label="Valor"
  value={amount}
  onChange={(value) => setAmount(value)}
  required
  placeholder="R$ 0,00"
/>
```

**Props:**

- `value`: number - Valor em reais (ex: 49.90)
- `onChange`: (value: number) => void - Callback com valor em reais
- `label`: string (opcional) - Label do campo
- `required`: boolean (opcional) - Campo obrigatório
- `placeholder`: string (opcional) - Placeholder
- `disabled`: boolean (opcional) - Campo desabilitado

### 2. useCurrencyInput Hook (`hooks/useCurrencyInput.ts`)

Hook customizado para gerenciar estado de moeda.

**Uso:**

```tsx
import { useCurrencyInput } from '@/hooks/useCurrencyInput';

const MyComponent = () => {
  const currency = useCurrencyInput(0); // Valor inicial em centavos

  return (
    <input
      type="text"
      value={currency.displayValue}
      onChange={(e) => currency.handleChange(e.target.value)}
    />
  );
};
```

**Retorno:**

- `displayValue`: string - Valor formatado (ex: "R$ 49,90")
- `numericValue`: number - Valor em reais (ex: 49.90)
- `valueInCents`: number - Valor em centavos (ex: 4990)
- `handleChange`: (value: string) => void - Handler de mudança
- `reset`: (value?: number) => void - Resetar valor
- `setValue`: (reais: number) => void - Definir valor em reais

### 3. CreateTransactionModal

Modal atualizado com máscara inline.

## Casos de Teste

### Teste 1: Digitação Básica

**Objetivo:** Verificar que a máscara funciona corretamente ao digitar

**Passos:**

1. Abrir modal de nova transação
2. Clicar no campo "Valor Total"
3. Digitar: 4, 9, 9, 0

**Resultado Esperado:**

- Após "4": R$ 0,04
- Após "9": R$ 0,49
- Após "9": R$ 4,99
- Após "0": R$ 49,90

### Teste 2: Valores Grandes

**Objetivo:** Verificar formatação com separadores de milhar

**Passos:**

1. Digitar: 1, 2, 3, 4, 5, 6, 7, 8

**Resultado Esperado:**

- Display: R$ 12.345,67
- Valor enviado à API: 12345.67

### Teste 3: Apagar Dígitos

**Objetivo:** Verificar comportamento ao apagar

**Passos:**

1. Digitar: 4, 9, 9, 0 (R$ 49,90)
2. Selecionar tudo e apagar
3. Digitar: 1, 0, 0

**Resultado Esperado:**

- Após apagar: R$ 0,00
- Após "1": R$ 0,01
- Após "0": R$ 0,10
- Após "0": R$ 1,00

### Teste 4: Colar Valores

**Objetivo:** Verificar comportamento ao colar texto

**Passos:**

1. Copiar "4990" da área de transferência
2. Colar no campo

**Resultado Esperado:**

- Display: R$ 49,90
- Apenas números são aceitos

### Teste 5: Caracteres Inválidos

**Objetivo:** Verificar que apenas números são aceitos

**Passos:**

1. Tentar digitar: a, b, c, -, +, \*, /

**Resultado Esperado:**

- Nenhum caractere inválido é aceito
- Campo permanece com valor anterior

### Teste 6: Envio para API

**Objetivo:** Verificar que o valor correto é enviado

**Passos:**

1. Digitar: 4, 9, 9, 0 (R$ 49,90)
2. Preencher outros campos
3. Submeter formulário
4. Verificar payload da requisição

**Resultado Esperado:**

```json
{
  "amount": 49.9
  // outros campos...
}
```

### Teste 7: Parcelamento

**Objetivo:** Verificar cálculo de parcelas

**Passos:**

1. Digitar valor: 1, 2, 0, 0, 0, 0 (R$ 1.200,00)
2. Selecionar parcelamento: 12x

**Resultado Esperado:**

- Display mostra: "12x de R$ 100,00"
- Cada parcela criada com valor: 100.00

### Teste 8: Assinatura Recorrente

**Objetivo:** Verificar criação de assinatura

**Passos:**

1. Digitar valor: 4, 9, 9, 0 (R$ 49,90)
2. Marcar "Assinatura Recorrente"
3. Selecionar dia: 15
4. Submeter

**Resultado Esperado:**

- Transação criada com amount: 49.90
- Flag is_recurring: true

## Testes Automatizados

### Teste Unitário do Hook

```typescript
import { useCurrencyInput } from '@/hooks/useCurrencyInput';
import { act, renderHook } from '@testing-library/react';

describe('useCurrencyInput', () => {
  it('should format value correctly', () => {
    const { result } = renderHook(() => useCurrencyInput(0));

    expect(result.current.displayValue).toBe('R$ 0,00');

    act(() => {
      result.current.handleChange('4');
    });
    expect(result.current.displayValue).toBe('R$ 0,04');

    act(() => {
      result.current.handleChange('49');
    });
    expect(result.current.displayValue).toBe('R$ 0,49');

    act(() => {
      result.current.handleChange('499');
    });
    expect(result.current.displayValue).toBe('R$ 4,99');

    act(() => {
      result.current.handleChange('4990');
    });
    expect(result.current.displayValue).toBe('R$ 49,90');
  });

  it('should return correct numeric value', () => {
    const { result } = renderHook(() => useCurrencyInput(0));

    act(() => {
      result.current.handleChange('4990');
    });

    expect(result.current.numericValue).toBe(49.9);
    expect(result.current.valueInCents).toBe(4990);
  });
});
```

### Teste de Integração do Componente

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import CurrencyInput from '@/components/ui/CurrencyInput';

describe('CurrencyInput', () => {
  it('should format input correctly', () => {
    const onChange = jest.fn();
    render(<CurrencyInput value={0} onChange={onChange} />);

    const input = screen.getByRole('textbox');

    fireEvent.change(input, { target: { value: '4' } });
    expect(input).toHaveValue('0,04');
    expect(onChange).toHaveBeenCalledWith(0.04);

    fireEvent.change(input, { target: { value: '49' } });
    expect(input).toHaveValue('0,49');
    expect(onChange).toHaveBeenCalledWith(0.49);

    fireEvent.change(input, { target: { value: '4990' } });
    expect(input).toHaveValue('49,90');
    expect(onChange).toHaveBeenCalledWith(49.90);
  });
});
```

## Checklist de Validação

- [ ] Máscara funciona ao digitar números
- [ ] Separador de milhar aparece corretamente
- [ ] Valor é enviado como número (não string) para API
- [ ] Apagar funciona corretamente
- [ ] Colar valores funciona
- [ ] Caracteres inválidos são bloqueados
- [ ] Cálculo de parcelas está correto
- [ ] Assinatura recorrente usa valor correto
- [ ] Componente CurrencyInput funciona em outros lugares
- [ ] Hook useCurrencyInput funciona independentemente

## Problemas Conhecidos e Soluções

### Problema: Valor não é enviado corretamente para API

**Causa:** Valor está sendo enviado como string formatada

**Solução:** Sempre use `numericValue` ou o valor numérico do state, nunca `displayValue`

```typescript
// ❌ Errado
body: JSON.stringify({ amount: currency.displayValue });

// ✅ Correto
body: JSON.stringify({ amount: currency.numericValue });
```

### Problema: Máscara não funciona ao colar

**Causa:** Handler não está processando eventos de paste

**Solução:** O handler `handleChange` já processa qualquer mudança, incluindo paste

### Problema: Separador de milhar não aparece

**Causa:** Locale não está configurado corretamente

**Solução:** Usar `toLocaleString('pt-BR')` com opções corretas

```typescript
value.toLocaleString('pt-BR', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});
```

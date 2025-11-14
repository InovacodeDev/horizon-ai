# Shopping List Page

Lista de compras inteligente baseada em notas fiscais.

## Rota
`/shopping-list`

## Funcionalidades
- Geração automática baseada em compras anteriores
- Sugestão de produtos recorrentes
- Comparação de preços entre estabelecimentos
- Otimização de rota
- Marcar itens como comprados
- Estimativa de valor total
- Alertas de preço
- Compartilhamento de lista

## Dados
```typescript
const list = await shoppingListService.generate(user.id);
const prices = await priceTrackingService.compare(products);
```

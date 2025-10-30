# Modais da Plataforma

Este diretório contém os componentes de modal reutilizáveis da plataforma.

## ConfirmModal

Modal de confirmação genérico para ações que requerem confirmação do usuário.

### Uso

```tsx
import { ConfirmModal } from '@/components/modals';

function MyComponent() {
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
    variant: 'danger' as const,
  });

  const handleDelete = () => {
    setConfirmModal({
      isOpen: true,
      title: 'Excluir Item',
      message: 'Tem certeza que deseja excluir este item? Esta ação não pode ser desfeita.',
      onConfirm: () => {
        // Lógica de exclusão aqui
        console.log('Item excluído');
      },
      variant: 'danger',
    });
  };

  return (
    <>
      <button onClick={handleDelete}>Excluir</button>

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
        variant={confirmModal.variant}
        confirmText="Excluir"
        cancelText="Cancelar"
      />
    </>
  );
}
```

### Props

- `isOpen` (boolean): Controla se o modal está aberto
- `onClose` (function): Callback chamado ao fechar o modal
- `onConfirm` (function): Callback chamado ao confirmar a ação
- `title` (string): Título do modal
- `message` (string): Mensagem de confirmação
- `confirmText` (string, opcional): Texto do botão de confirmação (padrão: "Confirmar")
- `cancelText` (string, opcional): Texto do botão de cancelar (padrão: "Cancelar")
- `variant` ('danger' | 'warning' | 'info', opcional): Variante visual do modal (padrão: 'danger')
- `loading` (boolean, opcional): Estado de carregamento durante a ação

### Variantes

- **danger**: Para ações destrutivas (excluir, remover, etc.) - vermelho
- **warning**: Para ações que requerem atenção (alterar configurações importantes) - amarelo
- **info**: Para confirmações informativas - azul

## AddAccountModal

Modal para adicionar uma nova conta bancária.

## AddCreditCardModal

Modal para adicionar um novo cartão de crédito.

## EditCreditCardModal

Modal para editar informações de um cartão de crédito existente.

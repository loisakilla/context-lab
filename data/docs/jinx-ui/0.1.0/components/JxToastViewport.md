# JxToastViewport

Область, в которой показывается очередь уведомлений. Работает в паре с хуком `useJxToastQueue`: хук хранит список `items` и даёт `push` и `dismiss`, компонент рендерит его в выбранном углу экрана. Элементы очереди описываются типом `JxToastItem`: `id`, `title`, необязательные `message`, `variant`, `duration`.

Импорт: `import { JxToastViewport } from '@jinx-ui/react'`  
Источник: `dist/components/Toast.d.ts:23`
Ключевые слова: toast, очередь уведомлений, notifications, показать уведомление после отправки, viewport

## Сигнатура

```tsx
<JxToastViewport items: JxToastItem[]; onDismiss: (id: string) => void; position?: 'bottom-left' | 'bottom-right' | 'top-right' | 'top-left' = 'bottom-left' />
```

## Пропсы

| Проп | Тип | Обязателен | По умолчанию | Описание |
|---|---|---|---|---|
| `items` | `JxToastItem[]` | да |  | текущая очередь уведомлений |
| `onDismiss` | `(id: string) => void` | да |  | вызывается с `id` уведомления, которое нужно убрать |
| `position` | `"bottom-left" \| "bottom-right" \| "top-right" \| "top-left"` | нет | `'bottom-left'` | угол экрана, `bottom-left` по умолчанию |

## CSS-классы

`jx-toast`, `jx-toast-body`, `jx-toast-close`, `jx-toast-icon`, `jx-toast-msg`, `jx-toast-title`

## Примеры

### Уведомление после отправки формы

```tsx
function SubscribeForm() {
  const toasts = useJxToastQueue();
  const [email, setEmail] = useState('');

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    toasts.push({ title: 'Готово', message: `Подписали ${email}`, variant: 'success' });
    setEmail('');
  };

  return (
    <form onSubmit={submit}>
      <JxInputField label="Почта" type="email" required value={email} onChange={(event) => setEmail(event.target.value)} />
      <JxButton type="submit">Подписаться</JxButton>
      <JxToastViewport items={toasts.items} onDismiss={toasts.dismiss} position="top-right" />
    </form>
  );
}
```

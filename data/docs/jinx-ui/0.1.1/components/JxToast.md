# JxToast

Одно всплывающее уведомление с заголовком, текстом и кнопкой закрытия. В приложении обычно не рендерится напрямую: очередь ведёт хук `useJxToastQueue`, а список показывает `JxToastViewport`.

Импорт: `import { JxToast } from '@jinx-ui/react'`  
Источник: `dist/components/Toast.d.ts:17`
Ключевые слова: toast, уведомление, всплывающее сообщение, notification, снэкбар, успешно сохранено

## Сигнатура

```tsx
<JxToast title: ReactNode; message?: ReactNode; onClose?: () => void; showIcon?: boolean = true; variant?: JxToastVariant = 'default' />
```

## Пропсы

| Проп | Тип | Обязателен | По умолчанию | Описание |
|---|---|---|---|---|
| `title` | `ReactNode` | да |  | заголовок уведомления |
| `message` | `ReactNode` | нет |  | текст под заголовком |
| `onClose` | `() => void` | нет |  | вызывается по кнопке закрытия |
| `showIcon` | `boolean` | нет | `true` | показывать ли иконку тона |
| `variant` | `"danger" \| "default" \| "warning" \| "success"` | нет | `'default'` | тон уведомления: `default`, `success`, `warning`, `danger` |

## CSS-классы

`jx-toast`, `jx-toast--danger`, `jx-toast--success`, `jx-toast--warning`, `jx-toast-body`, `jx-toast-close`, `jx-toast-icon`, `jx-toast-msg`, `jx-toast-title`

## Примеры

### Одиночное уведомление

```tsx
function SavedToast({ hide }: { hide: () => void }) {
  return <JxToast variant="success" title="Сохранено" message="Изменения применены" onClose={hide} />;
}
```

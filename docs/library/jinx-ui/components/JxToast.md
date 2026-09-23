---
component: JxToast
keywords: [toast, уведомление, всплывающее сообщение, notification, снэкбар, успешно сохранено]
---
Одно всплывающее уведомление с заголовком, текстом и кнопкой закрытия. В приложении обычно не рендерится напрямую: очередь ведёт хук `useJxToastQueue`, а список показывает `JxToastViewport`.

## Props
- title: заголовок уведомления
- message: текст под заголовком
- variant: тон уведомления: `default`, `success`, `warning`, `danger`
- onClose: вызывается по кнопке закрытия
- showIcon: показывать ли иконку тона

## Examples
### Одиночное уведомление
```tsx
function SavedToast({ hide }: { hide: () => void }) {
  return <JxToast variant="success" title="Сохранено" message="Изменения применены" onClose={hide} />;
}
```

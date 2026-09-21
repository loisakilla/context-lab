---
component: JxToastViewport
keywords: [toast, очередь уведомлений, notifications, показать уведомление после отправки, viewport]
---
Область, в которой показывается очередь уведомлений. Работает в паре с хуком `useJxToastQueue`: хук хранит список `items` и даёт `push` и `dismiss`, компонент рендерит его в выбранном углу экрана. Элементы очереди описываются типом `JxToastItem`: `id`, `title`, необязательные `message`, `variant`, `duration`.

## Props
- items: текущая очередь уведомлений
- onDismiss: вызывается с `id` уведомления, которое нужно убрать
- position: угол экрана, `bottom-left` по умолчанию

## Examples
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

---
component: JxSwitch
keywords: [switch, переключатель, тумблер, включить, выключить, уведомления, настройка]
---
Переключатель «включено/выключено» с подписью. Внутри обычный `<input type="checkbox">`, поэтому состояние задаётся через `checked` и `onChange`, а имя для формы через `name`.

## Props
- label: подпись справа от переключателя
- wrapClassName: класс на обёртке с подписью
- ref: ссылка на `<input>`

## Examples
### Настройка уведомлений
```tsx
function EmailNotifications() {
  const [notifications, setNotifications] = useState(true);
  return (
    <JxSwitch
      label="Присылать уведомления на почту"
      checked={notifications}
      onChange={(event) => setNotifications(event.target.checked)}
    />
  );
}
```
